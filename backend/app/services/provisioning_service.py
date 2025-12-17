"""
Infrastructure Provisioning Service: The "Magic Button"
Generates SMTP inboxes (users) and deploys them to KumoMTA.
"""

import logging
import secrets
import string
from typing import List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session

from app.database.models import (
    Tenant, Domain, Inbox, InboxStatus
)
from app.services.subscription_service import SubscriptionService
from app.integrations.kumo_client import KumoMTAClient
from app.utils.security import hash_password

logger = logging.getLogger(__name__)


class ProvisioningService:
    """Provision SMTP inboxes with smart naming and KumoMTA integration."""
    
    @staticmethod
    def provision_inboxes(
        tenant_id: str,
        domain_id: str,
        inbox_count: int,
        naming_convention: str = "firstname",
        db: Session = None
    ) -> Dict[str, Any]:
        """
        The "Magic Button" - Generate and deploy inboxes in seconds.
        
        Steps:
        1. Validate plan limits
        2. Generate inbox credentials (usernames + passwords)
        3. Insert into database
        4. Hot-reload KumoMTA config
        5. Return CSV with credentials
        
        Naming conventions:
        - "firstname@domain.com"
        - "firstname.lastname@domain.com"
        - "sales@domain.com", "support@domain.com", etc.
        - Custom format
        
        Args:
            tenant_id: Tenant provisioning inboxes
            domain_id: Domain for these inboxes
            inbox_count: Number of inboxes to create
            naming_convention: How to name inboxes
            db: Database session
        
        Returns:
            Dictionary with inboxes_created and CSV data
        
        Raises:
            ValueError: If validation fails
        """
        if not db:
            raise ValueError("Database session required")
        
        # Get tenant and domain
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise ValueError(f"Tenant {tenant_id} not found")
        
        domain = db.query(Domain).filter(Domain.id == domain_id).first()
        if not domain:
            raise ValueError(f"Domain {domain_id} not found")
        
        if domain.tenant_id != tenant.id:
            raise ValueError("Domain does not belong to this tenant")
        
        if domain.status != "active":
            raise ValueError(f"Domain status is {domain.status}, must be active")
        
        # Validate plan limits
        can_create, error = SubscriptionService.can_create_inbox(
            tenant, domain_id, db
        )
        if not can_create:
            raise ValueError(error)
        
        # Generate inboxes
        inboxes_data = []
        generated_inboxes = []
        
        try:
            for i in range(inbox_count):
                # Generate username based on convention
                username = ProvisioningService._generate_username(
                    i, naming_convention
                )
                
                # Generate password (32 chars, high entropy)
                password = ProvisioningService._generate_password()
                password_hash = hash_password(password)
                
                # Create Inbox object
                inbox = Inbox(
                    tenant_id=tenant.id,
                    domain_id=domain.id,
                    username=username,
                    password=password_hash,
                    full_email=f"{username}@{domain.domain_name}",
                    status=InboxStatus.PENDING,
                    smtp_host="smtp.inboxgrove.com",  # InboxGrove SMTP host
                    smtp_port=587,
                    daily_limit=40,
                    monthly_limit=1000,
                    warmup_stage=0,
                    health_score=50.0,  # Start at 50, warmup will improve
                )
                
                db.add(inbox)
                generated_inboxes.append(inbox)
                
                # Prepare CSV data
                inboxes_data.append({
                    "email": f"{username}@{domain.domain_name}",
                    "username": username,
                    "password": password,
                    "smtp_host": "smtp.inboxgrove.com",
                    "smtp_port": 587,
                    "smtp_auth": "true",
                    "smtp_tls": "true"
                })
            
            # Commit to database
            db.flush()
            
            # Authorize in KumoMTA (hot reload)
            kumo = KumoMTAClient()
            kumo.add_inboxes_to_relay(
                domain.domain_name,
                [(inbox.username, hash_password(inbox.password)) for inbox in generated_inboxes]
            )
            
            # Update inbox status to ACTIVE
            for inbox in generated_inboxes:
                inbox.status = InboxStatus.ACTIVE
                inbox.warmup_started_at = datetime.utcnow()
            
            db.commit()
            
            # Update tenant counts
            tenant.inboxes_count = db.query(Inbox).filter(
                Inbox.tenant_id == tenant.id
            ).count()
            db.add(tenant)
            db.commit()
            
            logger.info(
                f"Provisioned {inbox_count} inboxes for tenant {tenant.id} "
                f"on domain {domain.domain_name}"
            )
            
            # Generate CSV
            csv_data = ProvisioningService._generate_csv(inboxes_data)
            
            return {
                "inboxes_created": len(generated_inboxes),
                "domain": domain.domain_name,
                "csv_data": csv_data,
                "inboxes": inboxes_data
            }
        
        except Exception as e:
            db.rollback()
            logger.error(f"Provisioning failed: {str(e)}")
            raise
    
    @staticmethod
    def _generate_username(index: int, convention: str) -> str:
        """Generate username based on naming convention."""
        conventions = {
            "firstname": lambda i: f"sales{i}" if i > 0 else "sales",
            "firstnamelastname": lambda i: f"john.smith{i}" if i > 0 else "john.smith",
            "role": lambda i: f"support{i}" if i > 0 else "support",
            "custom": lambda i: f"inbox{i:04d}",
        }
        
        generator = conventions.get(convention, conventions["custom"])
        return generator(index)
    
    @staticmethod
    def _generate_password(length: int = 32) -> str:
        """Generate secure random password."""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    @staticmethod
    def _generate_csv(inboxes_data: List[Dict]) -> str:
        """Generate CSV from inboxes data."""
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            "email", "username", "password", "smtp_host", "smtp_port",
            "smtp_auth", "smtp_tls"
        ])
        
        writer.writeheader()
        writer.writerows(inboxes_data)
        
        return output.getvalue()
    
    @staticmethod
    def get_inbox_credentials(inbox_id: str, db: Session) -> Dict[str, Any]:
        """Get SMTP credentials for an inbox."""
        inbox = db.query(Inbox).filter(Inbox.id == inbox_id).first()
        if not inbox:
            raise ValueError(f"Inbox {inbox_id} not found")
        
        # Note: Don't return actual password in production
        # Use a vault/secret manager instead
        
        return {
            "email": inbox.full_email,
            "username": inbox.username,
            "smtp_host": inbox.smtp_host,
            "smtp_port": inbox.smtp_port,
            "smtp_auth": True,
            "smtp_tls": True,
            "status": inbox.status,
            "health_score": inbox.health_score,
            "warmup_stage": inbox.warmup_stage,
        }
    
    @staticmethod
    def suspend_inbox(inbox_id: str, reason: str, db: Session) -> Inbox:
        """Suspend an inbox (e.g., for abuse)."""
        inbox = db.query(Inbox).filter(Inbox.id == inbox_id).first()
        if not inbox:
            raise ValueError(f"Inbox {inbox_id} not found")
        
        inbox.status = InboxStatus.SUSPENDED
        inbox.blacklist_reason = reason
        inbox.blacklist_date = datetime.utcnow()
        inbox.is_blacklisted = True
        
        db.add(inbox)
        db.commit()
        db.refresh(inbox)
        
        logger.warning(f"Inbox {inbox.full_email} suspended: {reason}")
        
        # TODO: Remove from KumoMTA relay list
        
        return inbox
    
    @staticmethod
    def delete_inbox(inbox_id: str, db: Session) -> bool:
        """Delete an inbox."""
        inbox = db.query(Inbox).filter(Inbox.id == inbox_id).first()
        if not inbox:
            return False
        
        # TODO: Remove from KumoMTA
        
        db.delete(inbox)
        db.commit()
        
        logger.info(f"Inbox {inbox.full_email} deleted")
        return True
    
    @staticmethod
    def list_inboxes_for_domain(domain_id: str, db: Session) -> List[Inbox]:
        """List all inboxes for a domain."""
        return db.query(Inbox).filter(Inbox.domain_id == domain_id).all()
    
    @staticmethod
    def list_inboxes_for_tenant(tenant_id: str, db: Session) -> List[Inbox]:
        """List all inboxes for a tenant."""
        return db.query(Inbox).filter(Inbox.tenant_id == tenant_id).all()
    
    @staticmethod
    def update_inbox_health(
        inbox_id: str,
        health_score: float,
        warmup_stage: int = None,
        db: Session = None
    ) -> Inbox:
        """Update inbox health metrics (called by monitoring tasks)."""
        if not db:
            raise ValueError("Database session required")
        
        inbox = db.query(Inbox).filter(Inbox.id == inbox_id).first()
        if not inbox:
            raise ValueError(f"Inbox {inbox_id} not found")
        
        inbox.health_score = health_score
        inbox.last_health_check_at = datetime.utcnow()
        
        if warmup_stage is not None:
            inbox.warmup_stage = min(warmup_stage, 10)  # Max stage 10
        
        # Auto-suspend if health too low
        if health_score < 20:
            inbox.is_blacklisted = True
            inbox.blacklist_reason = "Health score too low"
            logger.warning(f"Inbox {inbox.full_email} auto-blacklisted due to low health")
        
        db.add(inbox)
        db.commit()
        db.refresh(inbox)
        
        return inbox
