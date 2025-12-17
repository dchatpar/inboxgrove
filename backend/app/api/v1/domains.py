"""
Domain Management API Endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.background import BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from app.database.session import get_db
from app.database.models import Tenant
from app.services.domain_service import DomainService
from app.services.provisioning_service import ProvisioningService
from app.utils.auth import get_current_tenant

router = APIRouter(prefix="/domains", tags=["Domains"])


class DomainSearchRequest(BaseModel):
    """Search for domain availability."""
    domain_name: str


class DomainSearchResponse(BaseModel):
    """Domain search result."""
    domain: str
    available: bool
    price: float
    currency: str


class DomainPurchaseRequest(BaseModel):
    """Purchase a domain."""
    domain_name: str
    payment_intent_id: str  # From Stripe (already charged)


@router.post("/search", response_model=DomainSearchResponse)
async def search_domain(
    request: DomainSearchRequest,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Search for domain availability.
    
    Uses Namecheap API to check if domain is available.
    
    Request:
    ```json
    {
        "domain_name": "acme-corp.com"
    }
    ```
    
    Response:
    ```json
    {
        "domain": "acme-corp.com",
        "available": true,
        "price": 8.99,
        "currency": "USD"
    }
    ```
    """
    try:
        result = DomainService.search_domain_availability(request.domain_name)
        return DomainSearchResponse(**result)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/purchase", status_code=status.HTTP_201_CREATED)
async def purchase_domain(
    request: DomainPurchaseRequest,
    background_tasks: BackgroundTasks,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Purchase a domain for the tenant.
    
    Steps:
    1. Verify payment succeeded (PaymentIntent status)
    2. Register domain via Namecheap
    3. Configure DNS (Cloudflare)
    4. Authorize in KumoMTA
    5. Return domain details
    
    After successful purchase:
    - DNS records are queued for verification (backend task)
    - Tenant can immediately start creating inboxes on this domain
    
    Request:
    ```json
    {
        "domain_name": "acme-corp.com",
        "payment_intent_id": "pi_..."
    }
    ```
    
    Response:
    ```json
    {
        "domain_id": "uuid...",
        "domain_name": "acme-corp.com",
        "status": "pending_dns",
        "cloudflare_nameservers": ["ns1.cloudflare.com", ...]
    }
    ```
    """
    try:
        # Check plan limits
        can_create, error = SubscriptionService.can_create_domain(current_tenant, db)
        if not can_create:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error
            )
        
        # Purchase domain
        domain = DomainService.purchase_domain(
            tenant=current_tenant,
            domain_name=request.domain_name,
            db=db
        )
        
        # Queue DNS configuration as background task
        background_tasks.add_task(
            DomainService.configure_dns,
            domain=domain,
            db=db
        )
        
        return {
            "domain_id": str(domain.id),
            "domain_name": domain.domain_name,
            "status": domain.status,
            "cloudflare_zone_id": domain.cloudflare_zone_id,
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/")
async def list_domains(
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """List all domains for tenant."""
    try:
        domains = DomainService.list_domains_for_tenant(str(current_tenant.id), db)
        
        return [
            {
                "id": str(d.id),
                "domain_name": d.domain_name,
                "status": d.status,
                "dns_verified": d.dns_verified_at is not None,
                "inboxes_count": len(d.inboxes),
                "purchase_date": d.purchase_date,
                "expiry_date": d.expiry_date,
            }
            for d in domains
        ]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{domain_id}")
async def get_domain(
    domain_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Get domain details."""
    try:
        domain = DomainService.get_domain_by_id(domain_id, db)
        if not domain or domain.tenant_id != current_tenant.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Domain not found"
            )
        
        health = DomainService.get_domain_health(domain)
        return health
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/{domain_id}/suspend")
async def suspend_domain(
    domain_id: str,
    reason: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Suspend a domain (anti-abuse)."""
    try:
        domain = DomainService.get_domain_by_id(domain_id, db)
        if not domain or domain.tenant_id != current_tenant.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Domain not found"
            )
        
        DomainService.suspend_domain(domain, reason, db)
        
        return {"status": "suspended"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/{domain_id}")
async def delete_domain(
    domain_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Delete a domain."""
    try:
        domain = DomainService.get_domain_by_id(domain_id, db)
        if not domain or domain.tenant_id != current_tenant.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Domain not found"
            )
        
        success = DomainService.delete_domain(domain_id, db)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete domain"
            )
        
        return {"status": "deleted"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Import SubscriptionService for limit checking
from app.services.subscription_service import SubscriptionService
