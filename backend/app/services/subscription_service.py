"""
Subscription Service: Manages trial periods, plan limits, and subscription lifecycle.
Core business logic for SaaS operations.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_
import logging

from app.database.models import (
    Tenant, Domain, Inbox, SubscriptionTier, SubscriptionStatus, 
    BillingCycle
)
from app.config import settings

logger = logging.getLogger(__name__)


class SubscriptionService:
    """Manages subscription, trial, and usage limits."""
    
    @staticmethod
    def create_trial(tenant: Tenant, db: Session, tier: SubscriptionTier = SubscriptionTier.STARTER) -> Tenant:
        """
        Create a 7-day trial for a new tenant.
        
        Args:
            tenant: The tenant to initialize trial for
            db: Database session
            tier: Trial subscription tier (default: Starter)
        
        Returns:
            Updated tenant with trial initialized
        """
        now = datetime.utcnow()
        trial_end = now + timedelta(days=settings.TRIAL_DAYS)
        
        tenant.subscription_tier = SubscriptionTier.TRIAL
        tenant.subscription_status = SubscriptionStatus.TRIAL
        tenant.trial_started_at = now
        tenant.trial_ends_at = trial_end
        tenant.trial_inbox_limit = settings.TRIAL_INBOX_LIMIT
        tenant.trial_domain_limit = settings.TRIAL_DOMAIN_LIMIT
        
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
        
        logger.info(f"Trial created for tenant {tenant.id}, expires at {trial_end}")
        return tenant
    
    @staticmethod
    def check_trial_expired(tenant: Tenant, db: Session) -> bool:
        """
        Check if trial has expired and convert to pending payment if needed.
        
        Returns:
            True if trial expired
        """
        if tenant.subscription_status != SubscriptionStatus.TRIAL:
            return False
        
        if tenant.trial_ends_at and datetime.utcnow() > tenant.trial_ends_at:
            tenant.subscription_status = SubscriptionStatus.PAST_DUE
            tenant.subscription_tier = SubscriptionTier.TRIAL
            db.add(tenant)
            db.commit()
            logger.warning(f"Trial expired for tenant {tenant.id}")
            return True
        
        return False
    
    @staticmethod
    def get_plan_limits(tier: SubscriptionTier) -> Dict[str, int]:
        """
        Get resource limits for a subscription tier.
        
        Args:
            tier: Subscription tier
        
        Returns:
            Dictionary with domain and inbox limits
        """
        limits = {
            SubscriptionTier.TRIAL: {
                "domains": settings.TRIAL_DOMAIN_LIMIT,
                "inboxes": settings.TRIAL_INBOX_LIMIT,
                "api_calls": 1000,
            },
            SubscriptionTier.STARTER: {
                "domains": settings.STARTER_DOMAINS,
                "inboxes": settings.STARTER_INBOXES,
                "api_calls": 10000,
            },
            SubscriptionTier.GROWTH: {
                "domains": settings.GROWTH_DOMAINS,
                "inboxes": settings.GROWTH_INBOXES,
                "api_calls": 100000,
            },
            SubscriptionTier.ENTERPRISE: {
                "domains": settings.ENTERPRISE_DOMAINS,
                "inboxes": settings.ENTERPRISE_INBOXES,
                "api_calls": 1000000,
            }
        }
        
        return limits.get(tier, limits[SubscriptionTier.TRIAL])
    
    @staticmethod
    def can_create_domain(tenant: Tenant, db: Session) -> Tuple[bool, Optional[str]]:
        """
        Check if tenant can create/purchase another domain based on plan limits.
        
        Returns:
            Tuple of (can_create: bool, error_message: Optional[str])
        """
        limits = SubscriptionService.get_plan_limits(tenant.subscription_tier)
        domain_limit = limits["domains"]
        
        # Count existing domains
        domain_count = db.query(Domain).filter(
            Domain.tenant_id == tenant.id
        ).count()
        
        if domain_count >= domain_limit:
            error = (
                f"Domain limit ({domain_limit}) reached. "
                f"Upgrade to create more domains."
            )
            logger.warning(f"Tenant {tenant.id} reached domain limit")
            return False, error
        
        return True, None
    
    @staticmethod
    def can_create_inbox(tenant: Tenant, domain_id: str, db: Session) -> Tuple[bool, Optional[str]]:
        """
        Check if tenant can create another inbox based on plan limits.
        
        Returns:
            Tuple of (can_create: bool, error_message: Optional[str])
        """
        limits = SubscriptionService.get_plan_limits(tenant.subscription_tier)
        inbox_limit = limits["inboxes"]
        
        # Count existing inboxes
        inbox_count = db.query(Inbox).filter(
            Inbox.tenant_id == tenant.id
        ).count()
        
        if inbox_count >= inbox_limit:
            error = (
                f"Inbox limit ({inbox_limit}) reached. "
                f"Upgrade to create more inboxes."
            )
            logger.warning(f"Tenant {tenant.id} reached inbox limit")
            return False, error
        
        return True, None
    
    @staticmethod
    def get_usage_stats(tenant: Tenant, db: Session) -> Dict:
        """
        Get current usage statistics for tenant.
        
        Returns:
            Dictionary with usage data
        """
        limits = SubscriptionService.get_plan_limits(tenant.subscription_tier)
        
        domain_count = db.query(Domain).filter(
            Domain.tenant_id == tenant.id
        ).count()
        
        inbox_count = db.query(Inbox).filter(
            Inbox.tenant_id == tenant.id
        ).count()
        
        # Calculate total emails sent this month
        inboxes = db.query(Inbox).filter(
            Inbox.tenant_id == tenant.id
        ).all()
        total_emails_sent = sum(inbox.emails_sent_this_month for inbox in inboxes)
        
        return {
            "domains": {
                "used": domain_count,
                "limit": limits["domains"],
                "percentage": (domain_count / limits["domains"] * 100) if limits["domains"] > 0 else 0
            },
            "inboxes": {
                "used": inbox_count,
                "limit": limits["inboxes"],
                "percentage": (inbox_count / limits["inboxes"] * 100) if limits["inboxes"] > 0 else 0
            },
            "emails_sent_this_month": total_emails_sent,
            "api_calls": {
                "used": tenant.api_calls_this_month,
                "limit": limits["api_calls"],
                "percentage": (tenant.api_calls_this_month / limits["api_calls"] * 100) if limits["api_calls"] > 0 else 0
            },
            "trial_days_remaining": SubscriptionService.get_trial_days_remaining(tenant)
        }
    
    @staticmethod
    def get_trial_days_remaining(tenant: Tenant) -> int:
        """Get number of days remaining in trial period."""
        if tenant.subscription_status != SubscriptionStatus.TRIAL or not tenant.trial_ends_at:
            return 0
        
        days_remaining = (tenant.trial_ends_at - datetime.utcnow()).days
        return max(0, days_remaining)
    
    @staticmethod
    def upgrade_subscription(
        tenant: Tenant,
        new_tier: SubscriptionTier,
        billing_cycle: BillingCycle,
        stripe_subscription_id: str,
        db: Session
    ) -> Tenant:
        """
        Upgrade tenant from trial/lower tier to higher tier.
        
        Args:
            tenant: Tenant to upgrade
            new_tier: New subscription tier
            billing_cycle: Monthly or yearly
            stripe_subscription_id: Stripe subscription ID
            db: Database session
        
        Returns:
            Updated tenant
        """
        now = datetime.utcnow()
        
        tenant.subscription_tier = new_tier
        tenant.subscription_status = SubscriptionStatus.ACTIVE
        tenant.billing_cycle = billing_cycle
        tenant.stripe_subscription_id = stripe_subscription_id
        tenant.trial_converted = True
        tenant.subscription_started_at = now
        tenant.current_period_start = now
        
        # Calculate period end based on billing cycle
        if billing_cycle == BillingCycle.MONTHLY:
            tenant.current_period_end = now + timedelta(days=30)
        else:  # YEARLY
            tenant.current_period_end = now + timedelta(days=365)
        
        tenant.next_billing_date = tenant.current_period_end
        
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
        
        logger.info(
            f"Tenant {tenant.id} upgraded to {new_tier.value} "
            f"with {billing_cycle.value} billing"
        )
        return tenant
    
    @staticmethod
    def downgrade_subscription(
        tenant: Tenant,
        new_tier: SubscriptionTier,
        db: Session
    ) -> Tenant:
        """Downgrade subscription tier (effective at period end)."""
        tenant.subscription_tier = new_tier
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
        
        logger.info(f"Tenant {tenant.id} downgraded to {new_tier.value}")
        return tenant
    
    @staticmethod
    def cancel_subscription(
        tenant: Tenant,
        cancel_at_period_end: bool = True,
        db: Session = None
    ) -> Tenant:
        """
        Cancel subscription.
        
        Args:
            tenant: Tenant to cancel
            cancel_at_period_end: If True, cancel at period end; if False, immediate
            db: Database session
        
        Returns:
            Updated tenant
        """
        if cancel_at_period_end:
            tenant.auto_renew = False
            status = SubscriptionStatus.ACTIVE  # Will become cancelled at period end
        else:
            status = SubscriptionStatus.CANCELLED
        
        tenant.subscription_status = status
        
        if db:
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
        
        logger.info(
            f"Tenant {tenant.id} cancelled subscription "
            f"({'at period end' if cancel_at_period_end else 'immediately'})"
        )
        return tenant
    
    @staticmethod
    def suspend_tenant(tenant: Tenant, reason: str, db: Session) -> Tenant:
        """
        Suspend tenant account (anti-abuse).
        
        Immediately:
        1. Set is_suspended flag
        2. Update KumoMTA config to exclude this tenant
        3. Send suspension email
        
        Args:
            tenant: Tenant to suspend
            reason: Reason for suspension
            db: Database session
        
        Returns:
            Updated tenant
        """
        tenant.is_suspended = True
        tenant.suspension_reason = reason
        tenant.suspended_at = datetime.utcnow()
        tenant.subscription_status = SubscriptionStatus.SUSPENDED
        
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
        
        logger.warning(f"Tenant {tenant.id} SUSPENDED: {reason}")
        
        # TODO: Send suspension email
        # TODO: Trigger KumoMTA config reload to exclude this tenant
        
        return tenant
    
    @staticmethod
    def unsuspend_tenant(tenant: Tenant, db: Session) -> Tenant:
        """Unsuspend a suspended tenant."""
        tenant.is_suspended = False
        tenant.suspension_reason = None
        tenant.suspended_at = None
        tenant.subscription_status = SubscriptionStatus.ACTIVE
        
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
        
        logger.info(f"Tenant {tenant.id} unsuspended")
        
        # TODO: Trigger KumoMTA config reload to re-include this tenant
        
        return tenant
