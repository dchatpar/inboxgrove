"""
Stripe Billing Service: Handles all payment processing, subscriptions, and webhooks.
Production-grade integration with comprehensive error handling.
"""

import logging
from typing import Optional, Dict, Any
from decimal import Decimal
import stripe
from stripe.error import StripeError, CardError, RateLimitError

from app.config import settings
from app.database.models import Tenant, TransactionType, TransactionHistory

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = settings.STRIPE_API_KEY


class BillingService:
    """Stripe payment processing and subscription management."""
    
    # Mapping of tiers to Stripe price IDs (set these in Stripe dashboard first)
    STRIPE_PRICE_IDS = {
        "starter": "price_1starter",
        "growth": "price_1growth",
        "enterprise": "price_1enterprise",
    }
    
    @staticmethod
    def create_customer(tenant: Tenant) -> str:
        """
        Create a Stripe customer for a new tenant.
        
        Args:
            tenant: The tenant to create customer for
        
        Returns:
            Stripe customer ID
        
        Raises:
            StripeError: If Stripe API call fails
        """
        try:
            customer = stripe.Customer.create(
                email=tenant.company_email,
                name=tenant.company_name,
                metadata={
                    "tenant_id": str(tenant.id),
                    "company_website": tenant.company_website or ""
                }
            )
            logger.info(f"Created Stripe customer {customer.id} for tenant {tenant.id}")
            return customer.id
        
        except StripeError as e:
            logger.error(f"Failed to create Stripe customer: {str(e)}")
            raise
    
    @staticmethod
    def create_checkout_session(
        tenant: Tenant,
        tier: str,
        billing_cycle: str = "monthly",
        trial_days: int = settings.TRIAL_DAYS
    ) -> Dict[str, Any]:
        """
        Create a checkout session for subscription signup.
        
        This is the "magic button" that starts the trial:
        1. User selects plan (Starter/Growth/Enterprise)
        2. Redirected to Stripe checkout
        3. Enters card (creates SetupIntent to prevent abuse)
        4. Returns to dashboard with trial active
        5. On day 8, automatic charge is attempted
        
        Args:
            tenant: Tenant starting trial
            tier: Subscription tier (starter, growth, enterprise)
            billing_cycle: "monthly" or "yearly"
            trial_days: Number of trial days
        
        Returns:
            Dictionary with checkout_url and session_id
        
        Raises:
            StripeError: If checkout creation fails
        """
        try:
            # Determine price ID
            price_id = BillingService.STRIPE_PRICE_IDS.get(tier.lower())
            if not price_id:
                raise ValueError(f"Invalid subscription tier: {tier}")
            
            # Create checkout session with trial
            session = stripe.checkout.Session.create(
                customer=tenant.stripe_customer_id,
                payment_method_types=["card"],
                line_items=[
                    {
                        "price": price_id,
                        "quantity": 1,
                    }
                ],
                mode="subscription",
                success_url=f"{settings.FRONTEND_URL}/dashboard?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.FRONTEND_URL}/onboarding",
                subscription_data={
                    "trial_period_days": trial_days,
                    "metadata": {
                        "tenant_id": str(tenant.id),
                        "tier": tier,
                    }
                }
            )
            
            logger.info(
                f"Created checkout session {session.id} for tenant {tenant.id} "
                f"(tier={tier}, trial_days={trial_days})"
            )
            
            return {
                "checkout_url": session.url,
                "session_id": session.id,
                "trial_days": trial_days
            }
        
        except StripeError as e:
            logger.error(f"Failed to create checkout session: {str(e)}")
            raise
    
    @staticmethod
    def create_setup_intent(tenant: Tenant) -> Dict[str, Any]:
        """
        Create a SetupIntent for card collection without immediate charge.
        Used during trial to collect card details for later billing.
        
        Returns:
            Dictionary with client_secret for Stripe.js
        """
        try:
            intent = stripe.SetupIntent.create(
                customer=tenant.stripe_customer_id,
                payment_method_types=["card"],
                metadata={
                    "tenant_id": str(tenant.id)
                }
            )
            
            logger.info(f"Created SetupIntent for tenant {tenant.id}")
            
            return {
                "client_secret": intent.client_secret,
                "setup_intent_id": intent.id
            }
        
        except StripeError as e:
            logger.error(f"Failed to create SetupIntent: {str(e)}")
            raise
    
    @staticmethod
    def charge_for_domain(
        tenant: Tenant,
        domain_name: str,
        amount_cents: int,
        db = None
    ) -> Dict[str, Any]:
        """
        Charge customer immediately for domain purchase.
        
        This is the "hybrid billing" in action:
        - User clicks "Buy domain"
        - Stripe PaymentIntent created for domain cost
        - Card charged immediately
        - Domain provisioning triggered on success
        
        Args:
            tenant: Tenant purchasing domain
            domain_name: Domain being purchased
            amount_cents: Amount to charge in cents (e.g., 1200 = $12.00)
            db: Database session for logging
        
        Returns:
            Dictionary with payment_intent details
        
        Raises:
            CardError: If card declined
            StripeError: Other errors
        """
        try:
            intent = stripe.PaymentIntent.create(
                customer=tenant.stripe_customer_id,
                amount=amount_cents,
                currency="usd",
                payment_method_types=["card"],
                description=f"Domain purchase: {domain_name}",
                metadata={
                    "tenant_id": str(tenant.id),
                    "domain_name": domain_name,
                    "transaction_type": "domain_purchase"
                }
            )
            
            logger.info(
                f"Created PaymentIntent {intent.id} for domain {domain_name} "
                f"(amount=${amount_cents/100:.2f})"
            )
            
            # Log transaction
            if db:
                transaction = TransactionHistory(
                    tenant_id=tenant.id,
                    transaction_type=TransactionType.DOMAIN_PURCHASE,
                    description=f"Purchased domain {domain_name}",
                    amount=amount_cents,
                    stripe_transaction_id=intent.id,
                    status="pending"
                )
                db.add(transaction)
                db.commit()
            
            return {
                "payment_intent_id": intent.id,
                "client_secret": intent.client_secret,
                "status": intent.status,
                "amount": intent.amount
            }
        
        except CardError as e:
            logger.warning(f"Card declined for tenant {tenant.id}: {str(e)}")
            raise
        
        except StripeError as e:
            logger.error(f"Payment intent creation failed: {str(e)}")
            raise
    
    @staticmethod
    def confirm_payment_intent(payment_intent_id: str) -> Dict[str, Any]:
        """Retrieve and confirm a PaymentIntent."""
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            return {
                "status": intent.status,
                "amount": intent.amount,
                "client_secret": intent.client_secret
            }
        
        except StripeError as e:
            logger.error(f"Failed to retrieve PaymentIntent: {str(e)}")
            raise
    
    @staticmethod
    def refund_charge(
        charge_id: str,
        amount_cents: Optional[int] = None,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Refund a payment (full or partial).
        
        Args:
            charge_id: Stripe charge ID or PaymentIntent ID
            amount_cents: Amount to refund (None = full refund)
            reason: Reason for refund
        
        Returns:
            Refund details
        """
        try:
            refund = stripe.Refund.create(
                payment_intent=charge_id,
                amount=amount_cents,
                reason=reason,
                metadata={
                    "reason": reason or "customer_request"
                }
            )
            
            logger.info(f"Refund created: {refund.id} (amount=${refund.amount/100:.2f})")
            
            return {
                "refund_id": refund.id,
                "amount": refund.amount,
                "status": refund.status
            }
        
        except StripeError as e:
            logger.error(f"Refund failed: {str(e)}")
            raise
    
    @staticmethod
    def handle_webhook(payload: bytes, signature: str) -> Dict[str, Any]:
        """
        Verify and handle Stripe webhook.
        
        Webhook events to handle:
        - payment_intent.succeeded (domain purchased)
        - payment_intent.payment_failed (card declined)
        - customer.subscription.created
        - customer.subscription.updated
        - customer.subscription.deleted
        - invoice.payment_succeeded (renewal successful)
        - invoice.payment_failed (renewal failed)
        - charge.refunded
        
        Args:
            payload: Raw webhook payload
            signature: Webhook signature header
        
        Returns:
            Event data
        
        Raises:
            ValueError: If signature verification fails
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, settings.STRIPE_WEBHOOK_SECRET
            )
            logger.info(f"Webhook event verified: {event['type']}")
            
            return {
                "type": event["type"],
                "data": event.get("data", {})
            }
        
        except ValueError as e:
            logger.error(f"Webhook signature verification failed: {str(e)}")
            raise
        
        except StripeError as e:
            logger.error(f"Webhook processing error: {str(e)}")
            raise
    
    @staticmethod
    def retry_charge(payment_intent_id: str) -> Dict[str, Any]:
        """Retry a failed payment (for trial-to-paid conversion)."""
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            if intent.status == "requires_payment_method":
                # Payment failed, try again
                intent = stripe.PaymentIntent.confirm(payment_intent_id)
            
            logger.info(f"Retried PaymentIntent {payment_intent_id}, status: {intent.status}")
            
            return {
                "status": intent.status,
                "amount": intent.amount
            }
        
        except StripeError as e:
            logger.error(f"Retry charge failed: {str(e)}")
            raise
    
    @staticmethod
    def get_subscription(subscription_id: str) -> Dict[str, Any]:
        """Get subscription details from Stripe."""
        try:
            sub = stripe.Subscription.retrieve(subscription_id)
            return {
                "id": sub.id,
                "customer": sub.customer,
                "status": sub.status,
                "current_period_start": sub.current_period_start,
                "current_period_end": sub.current_period_end,
                "trial_start": sub.trial_start,
                "trial_end": sub.trial_end,
            }
        except StripeError as e:
            logger.error(f"Failed to retrieve subscription: {str(e)}")
            raise
    
    @staticmethod
    def cancel_subscription(subscription_id: str, at_period_end: bool = False) -> Dict[str, Any]:
        """Cancel a subscription."""
        try:
            if at_period_end:
                sub = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            else:
                sub = stripe.Subscription.delete(subscription_id)
            
            logger.info(f"Cancelled subscription {subscription_id}")
            
            return {"status": sub.status}
        
        except StripeError as e:
            logger.error(f"Failed to cancel subscription: {str(e)}")
            raise
