"""
Billing API Endpoints - Subscriptions, Checkouts, and Payment Management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database.session import get_db
from app.database.models import Tenant, SubscriptionStatus, SubscriptionTier, BillingCycle
from app.services.subscription_service import SubscriptionService
from app.services.billing_service import BillingService
from app.utils.auth import get_current_tenant

router = APIRouter(prefix="/billing", tags=["Billing"])


class CheckoutSessionRequest(BaseModel):
    """Request to create checkout session."""
    tier: str  # starter, growth, enterprise
    billing_cycle: str = "monthly"  # monthly or yearly


class CheckoutSessionResponse(BaseModel):
    """Checkout session response."""
    checkout_url: str
    session_id: str
    trial_days: int


class UsageStatsResponse(BaseModel):
    """Usage stats for dashboard."""
    domains: dict
    inboxes: dict
    emails_sent_this_month: int
    api_calls: dict
    trial_days_remaining: int


@router.post(
    "/checkout-session",
    response_model=CheckoutSessionResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_checkout_session(
    request: CheckoutSessionRequest,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Create a Stripe checkout session for subscription signup.
    
    This is the "magic button" for the frontend:
    1. User selects plan
    2. Clicks "Start 7-Day Trial"
    3. Redirected to Stripe checkout
    4. Enters card (SetupIntent)
    5. Returns to dashboard
    
    Note: Trial begins immediately, card is charged on day 8.
    
    Request:
    ```json
    {
        "tier": "growth",
        "billing_cycle": "monthly"
    }
    ```
    
    Response:
    ```json
    {
        "checkout_url": "https://checkout.stripe.com/...",
        "session_id": "cs_live_...",
        "trial_days": 7
    }
    ```
    """
    try:
        # Create Stripe customer if needed
        if not current_tenant.stripe_customer_id:
            stripe_customer_id = BillingService.create_customer(current_tenant)
            current_tenant.stripe_customer_id = stripe_customer_id
            db.add(current_tenant)
            db.commit()
        
        # Create checkout session
        result = BillingService.create_checkout_session(
            tenant=current_tenant,
            tier=request.tier,
            billing_cycle=request.billing_cycle
        )
        
        return CheckoutSessionResponse(**result)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/domain-purchase-intent", status_code=status.HTTP_201_CREATED)
async def create_domain_purchase_intent(
    domain_name: str,
    domain_price: float,  # in USD
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Create PaymentIntent for domain purchase.
    
    The "hybrid billing" in action:
    - User clicks "Buy domain"
    - Frontend calls this endpoint
    - PaymentIntent created
    - Frontend uses Stripe.js to confirm payment
    - On success, domain provisioning triggered
    
    Args:
        domain_name: Domain to purchase (e.g., "acme-corp.com")
        domain_price: Price in USD (e.g., 12.00)
    
    Returns:
        client_secret for Stripe.js confirmation
    """
    try:
        # Convert USD to cents
        amount_cents = int(domain_price * 100)
        
        result = BillingService.charge_for_domain(
            tenant=current_tenant,
            domain_name=domain_name,
            amount_cents=amount_cents,
            db=db
        )
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/usage")
async def get_usage_stats(
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
) -> UsageStatsResponse:
    """
    Get current usage statistics for dashboard.
    
    Returns:
    ```json
    {
        "domains": {
            "used": 2,
            "limit": 10,
            "percentage": 20.0
        },
        "inboxes": {
            "used": 45,
            "limit": 50,
            "percentage": 90.0
        },
        "emails_sent_this_month": 15234,
        "api_calls": {
            "used": 2500,
            "limit": 10000,
            "percentage": 25.0
        },
        "trial_days_remaining": 3
    }
    ```
    """
    usage = SubscriptionService.get_usage_stats(current_tenant, db)
    return UsageStatsResponse(**usage)


@router.get("/subscription")
async def get_subscription(
    current_tenant: Tenant = Depends(get_current_tenant)
):
    """Get current subscription details."""
    return {
        "tier": current_tenant.subscription_tier,
        "status": current_tenant.subscription_status,
        "billing_cycle": current_tenant.billing_cycle,
        "next_billing_date": current_tenant.next_billing_date,
        "trial_ends_at": current_tenant.trial_ends_at,
        "stripe_subscription_id": current_tenant.stripe_subscription_id,
    }


@router.post("/subscription/upgrade")
async def upgrade_subscription(
    new_tier: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Upgrade subscription to higher tier.
    
    Proration handled automatically by Stripe.
    """
    try:
        # Validate tier
        tier_map = {
            "starter": SubscriptionTier.STARTER,
            "growth": SubscriptionTier.GROWTH,
            "enterprise": SubscriptionTier.ENTERPRISE,
        }
        new_tier_enum = tier_map.get(new_tier.lower())
        if not new_tier_enum:
            raise ValueError("Invalid tier")
        
        # Upgrade
        updated = SubscriptionService.upgrade_subscription(
            tenant=current_tenant,
            new_tier=new_tier_enum,
            billing_cycle=BillingCycle.MONTHLY,
            stripe_subscription_id="sub_new",  # TODO: Use real subscription ID
            db=db
        )
        
        return {"status": "upgraded", "tier": updated.subscription_tier}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/subscription/cancel")
async def cancel_subscription(
    at_period_end: bool = True,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Cancel subscription.
    
    Args:
        at_period_end: If true, cancel at next billing date; if false, immediate
    """
    try:
        SubscriptionService.cancel_subscription(
            tenant=current_tenant,
            cancel_at_period_end=at_period_end,
            db=db
        )
        
        return {"status": "cancelled"}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
