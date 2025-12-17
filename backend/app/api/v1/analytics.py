"""
Analytics & Monitoring API Endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database.session import get_db
from app.database.models import Tenant, Inbox, TransactionHistory, TransactionType
from app.utils.auth import get_current_tenant

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/usage")
async def get_usage_analytics(
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Get comprehensive usage analytics."""
    try:
        inboxes = db.query(Inbox).filter(Inbox.tenant_id == current_tenant.id).all()
        
        # Calculate totals
        total_inboxes = len(inboxes)
        total_emails_sent = sum(inbox.emails_sent_this_month for inbox in inboxes)
        avg_health = sum(inbox.health_score for inbox in inboxes) / total_inboxes if total_inboxes > 0 else 0
        
        # Categorize by status
        active_inboxes = sum(1 for i in inboxes if i.status == "active")
        pending_inboxes = sum(1 for i in inboxes if i.status == "pending")
        suspended_inboxes = sum(1 for i in inboxes if i.status == "suspended")
        
        return {
            "total_inboxes": total_inboxes,
            "active_inboxes": active_inboxes,
            "pending_inboxes": pending_inboxes,
            "suspended_inboxes": suspended_inboxes,
            "total_emails_sent_month": total_emails_sent,
            "average_health_score": round(avg_health, 2),
            "domains_count": current_tenant.domains_count,
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/billing-summary")
async def get_billing_summary(
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Get billing summary and transaction history."""
    try:
        # Get last 10 transactions
        transactions = db.query(TransactionHistory).filter(
            TransactionHistory.tenant_id == current_tenant.id
        ).order_by(TransactionHistory.created_at.desc()).limit(10).all()
        
        # Calculate totals
        total_spent = sum(t.amount for t in transactions if t.status == "succeeded") / 100  # Convert to USD
        
        return {
            "current_tier": current_tenant.subscription_tier,
            "status": current_tenant.subscription_status,
            "next_billing_date": current_tenant.next_billing_date,
            "total_spent_month": round(total_spent, 2),
            "recent_transactions": [
                {
                    "id": str(t.id),
                    "type": t.transaction_type,
                    "description": t.description,
                    "amount": t.amount / 100,  # Convert to USD
                    "status": t.status,
                    "date": t.created_at,
                }
                for t in transactions
            ]
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/deliverability")
async def get_deliverability_metrics(
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Get email deliverability metrics."""
    try:
        inboxes = db.query(Inbox).filter(Inbox.tenant_id == current_tenant.id).all()
        
        # Calculate averages
        avg_health = sum(inbox.health_score for inbox in inboxes) / len(inboxes) if inboxes else 0
        
        # Warmup distribution
        warmup_stages = {}
        for i in range(11):
            warmup_stages[f"stage_{i}"] = sum(1 for inbox in inboxes if inbox.warmup_stage == i)
        
        return {
            "average_health_score": round(avg_health, 2),
            "inbox_count": len(inboxes),
            "blacklisted_count": sum(1 for i in inboxes if i.is_blacklisted),
            "estimated_deliverability": min(100, round(avg_health * 1.2, 2)),
            "warmup_distribution": warmup_stages,
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
