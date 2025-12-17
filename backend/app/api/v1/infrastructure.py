"""
Infrastructure Provisioning API - The "Magic Button"
Generate and deploy SMTP inboxes in seconds.
"""

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import io

from app.database.session import get_db
from app.database.models import Tenant, Inbox
from app.services.provisioning_service import ProvisioningService
from app.services.subscription_service import SubscriptionService
from app.services.domain_service import DomainService
from app.utils.auth import get_current_tenant

router = APIRouter(prefix="/infrastructure", tags=["Infrastructure"])


class ProvisionInboxesRequest(BaseModel):
    """Request to provision inboxes."""
    domain_id: str
    inbox_count: int  # How many inboxes to create
    naming_convention: str = "firstname"  # firstname, role, custom, etc.


class InboxCredentials(BaseModel):
    """SMTP credentials for an inbox."""
    email: str
    username: str
    smtp_host: str
    smtp_port: int
    smtp_auth: bool
    smtp_tls: bool


@router.post("/provision", status_code=status.HTTP_201_CREATED)
async def provision_inboxes(
    request: ProvisionInboxesRequest,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    The "Magic Button" - Provision SMTP inboxes in 60 seconds.
    
    Steps:
    1. Validate plan limits (can't exceed limit)
    2. Generate inbox credentials (username + 32-char password)
    3. Insert into database
    4. Hot-reload KumoMTA config
    5. Start warmup process
    6. Return CSV with credentials
    
    Request:
    ```json
    {
        "domain_id": "uuid...",
        "inbox_count": 50,
        "naming_convention": "firstname"
    }
    ```
    
    Response:
    ```json
    {
        "inboxes_created": 50,
        "domain": "acme-corp.com",
        "csv_data": "email,username,password,..."
    }
    ```
    
    Raises:
        400: Plan limit exceeded
        404: Domain not found
        422: Invalid request
    """
    try:
        result = ProvisioningService.provision_inboxes(
            tenant_id=str(current_tenant.id),
            domain_id=request.domain_id,
            inbox_count=request.inbox_count,
            naming_convention=request.naming_convention,
            db=db
        )
        
        return result
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Provisioning failed"
        )


@router.get("/provision/csv")
async def download_inboxes_csv(
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Download CSV with all inboxes and credentials for a tenant.
    
    Response CSV format:
    ```
    email,username,password,smtp_host,smtp_port,smtp_auth,smtp_tls
    sales@acme-corp.com,sales,PASSWORD,smtp.inboxgrove.com,587,true,true
    ```
    """
    try:
        inboxes = ProvisioningService.list_inboxes_for_tenant(
            str(current_tenant.id), db
        )
        
        # Build CSV
        import csv
        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=["email", "username", "password", "smtp_host", "smtp_port", "smtp_auth", "smtp_tls"]
        )
        
        writer.writeheader()
        # Note: In production, never return passwords!
        # Use a vault/secret manager
        
        for inbox in inboxes:
            writer.writerow({
                "email": inbox.full_email,
                "username": inbox.username,
                "password": "***HIDDEN***",  # Don't return passwords!
                "smtp_host": inbox.smtp_host,
                "smtp_port": inbox.smtp_port,
                "smtp_auth": "true",
                "smtp_tls": "true"
            })
        
        # Return CSV file
        csv_bytes = output.getvalue().encode('utf-8')
        return FileResponse(
            io.BytesIO(csv_bytes),
            media_type="text/csv",
            filename=f"{current_tenant.company_name}_inboxes.csv"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/inboxes")
async def list_inboxes(
    domain_id: Optional[str] = None,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """List all inboxes for tenant (optionally filtered by domain)."""
    try:
        if domain_id:
            inboxes = ProvisioningService.list_inboxes_for_domain(domain_id, db)
        else:
            inboxes = ProvisioningService.list_inboxes_for_tenant(
                str(current_tenant.id), db
            )
        
        return [
            {
                "id": str(inbox.id),
                "email": inbox.full_email,
                "status": inbox.status,
                "health_score": inbox.health_score,
                "warmup_stage": inbox.warmup_stage,
                "emails_sent_today": inbox.emails_sent_today,
                "emails_sent_this_month": inbox.emails_sent_this_month,
            }
            for inbox in inboxes
        ]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/inboxes/{inbox_id}/credentials")
async def get_inbox_credentials(
    inbox_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
) -> InboxCredentials:
    """Get SMTP credentials for a specific inbox."""
    try:
        creds = ProvisioningService.get_inbox_credentials(inbox_id, db)
        return InboxCredentials(**creds)
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/inboxes/{inbox_id}/suspend")
async def suspend_inbox(
    inbox_id: str,
    reason: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Suspend an inbox (anti-abuse feature).
    
    Once suspended, KumoMTA will reject SMTP attempts.
    """
    try:
        ProvisioningService.suspend_inbox(inbox_id, reason, db)
        return {"status": "suspended"}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/inboxes/{inbox_id}")
async def delete_inbox(
    inbox_id: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Delete an inbox."""
    try:
        success = ProvisioningService.delete_inbox(inbox_id, db)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inbox not found"
            )
        return {"status": "deleted"}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
