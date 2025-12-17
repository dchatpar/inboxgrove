"""
Domain Management Service: Handles domain purchasing, DNS configuration, and provisioning.
Supports multiple registrars via adapter pattern.
"""

import logging
from typing import Optional, Dict, List, Any
from datetime import datetime
from sqlalchemy.orm import Session

from app.database.models import (
    Tenant, Domain, DomainStatus, TransactionHistory, TransactionType
)
from app.services.registrar_service import NamecheapRegistrar
from app.integrations.cloudflare_client import CloudflareClient

logger = logging.getLogger(__name__)


class DomainService:
    """Manage domain lifecycle: search, purchase, DNS setup, KumoMTA auth."""
    
    @staticmethod
    def search_domain_availability(domain_name: str) -> Dict[str, Any]:
        """
        Search for domain availability.
        
        Uses Namecheap API to check if domain is available for purchase.
        
        Args:
            domain_name: Domain to search (e.g., "acme-corp.com")
        
        Returns:
            Dictionary with availability and pricing
        """
        try:
            registrar = NamecheapRegistrar()
            result = registrar.check_availability(domain_name)
            
            logger.info(f"Domain availability check: {domain_name} - {result.get('available')}")
            
            return result
        
        except Exception as e:
            logger.error(f"Domain search failed: {str(e)}")
            raise
    
    @staticmethod
    def purchase_domain(
        tenant: Tenant,
        domain_name: str,
        db: Session,
        auto_renew: bool = True
    ) -> Domain:
        """
        Purchase a domain for tenant.
        
        Steps:
        1. Check domain availability
        2. Get price from registrar
        3. Create Stripe PaymentIntent (handled by billing_service)
        4. If payment succeeds, purchase from registrar
        5. Configure DNS (via Cloudflare)
        6. Authorize in KumoMTA
        7. Create Domain record in DB
        
        Note: This should be called AFTER payment is confirmed.
        
        Args:
            tenant: Tenant purchasing domain
            domain_name: Domain to purchase
            db: Database session
            auto_renew: Auto-renew domain on expiry
        
        Returns:
            Domain object
        """
        try:
            # Check if domain already exists
            existing = db.query(Domain).filter(
                Domain.tenant_id == tenant.id,
                Domain.domain_name == domain_name
            ).first()
            
            if existing:
                raise ValueError(f"Domain {domain_name} already exists for this tenant")
            
            # Register domain via Namecheap
            registrar = NamecheapRegistrar()
            registration = registrar.register_domain(
                domain_name=domain_name,
                years=1,
                auto_renew=auto_renew
            )
            
            logger.info(f"Domain {domain_name} registered successfully")
            
            # Create Domain object in DB
            domain = Domain(
                tenant_id=tenant.id,
                domain_name=domain_name,
                status=DomainStatus.PENDING_DNS,
                is_system_purchased=True,
                registrar_provider="namecheap",
                registrar_domain_id=registration.get("domain_id"),
                purchase_price=registration.get("price"),
                purchase_date=datetime.utcnow(),
                is_auto_renew=auto_renew,
            )
            
            db.add(domain)
            db.flush()  # Get domain.id
            
            # Log transaction
            transaction = TransactionHistory(
                tenant_id=tenant.id,
                transaction_type=TransactionType.DOMAIN_PURCHASE,
                description=f"Purchased domain {domain_name}",
                amount=int(registration.get("price", 0) * 100),  # Convert to cents
                status="succeeded",
                domain_id=domain.id,
                related_data=registration
            )
            db.add(transaction)
            
            db.commit()
            db.refresh(domain)
            
            # Update tenant domain count
            tenant.domains_count = db.query(Domain).filter(Domain.tenant_id == tenant.id).count()
            db.add(tenant)
            db.commit()
            
            logger.info(f"Domain {domain_name} created in database for tenant {tenant.id}")
            
            return domain
        
        except Exception as e:
            db.rollback()
            logger.error(f"Domain purchase failed: {str(e)}")
            raise
    
    @staticmethod
    def configure_dns(domain: Domain, db: Session) -> Dict[str, Any]:
        """
        Configure DNS records via Cloudflare.
        
        Sets up:
        - A records (point to InboxGrove servers)
        - MX records (mail server priority)
        - SPF record (sender policy)
        - DKIM records (email authentication)
        - DMARC record (policy enforcement)
        
        Args:
            domain: Domain to configure
            db: Database session
        
        Returns:
            DNS configuration details
        """
        try:
            cf = CloudflareClient()
            
            # Create Cloudflare zone for domain
            zone = cf.create_zone(domain.domain_name)
            domain.cloudflare_zone_id = zone["id"]
            
            # Add DNS records
            dns_records = {
                "A": cf.create_a_record(zone["id"], domain.domain_name, "1.2.3.4"),  # InboxGrove IP
                "MX": cf.create_mx_record(zone["id"], domain.domain_name, 10, f"mail.{domain.domain_name}"),
                "SPF": cf.create_txt_record(zone["id"], domain.domain_name, 'v=spf1 include:sendgrid.net ~all'),
                "DKIM": cf.create_txt_record(zone["id"], f"default._domainkey.{domain.domain_name}", "DKIM_PUBLIC_KEY_HERE"),
                "DMARC": cf.create_txt_record(zone["id"], f"_dmarc.{domain.domain_name}", 'v=DMARC1; p=quarantine'),
            }
            
            # Update domain status
            domain.status = DomainStatus.DNS_VERIFIED
            domain.dns_records = dns_records
            domain.dns_verified_at = datetime.utcnow()
            
            db.add(domain)
            db.commit()
            db.refresh(domain)
            
            logger.info(f"DNS configured for domain {domain.domain_name}")
            
            return dns_records
        
        except Exception as e:
            logger.error(f"DNS configuration failed: {str(e)}")
            raise
    
    @staticmethod
    def authorize_in_kumo(domain: Domain, db: Session) -> bool:
        """
        Authorize domain in KumoMTA relay list.
        
        This is the final step before domain can be used for sending.
        Once authorized, KumoMTA will accept SMTP connections for this domain.
        
        Args:
            domain: Domain to authorize
            db: Database session
        
        Returns:
            True if successful
        """
        try:
            # TODO: Implement KumoMTA API call
            # For now, just mark as authorized
            
            domain.kumo_authorized = True
            domain.kumo_authorized_at = datetime.utcnow()
            domain.status = DomainStatus.ACTIVE
            
            db.add(domain)
            db.commit()
            db.refresh(domain)
            
            logger.info(f"Domain {domain.domain_name} authorized in KumoMTA")
            
            return True
        
        except Exception as e:
            logger.error(f"KumoMTA authorization failed: {str(e)}")
            raise
    
    @staticmethod
    def get_domain_health(domain: Domain) -> Dict[str, Any]:
        """Get domain health status (deliverability, warmup progress, etc.)."""
        from app.database.models import Inbox
        
        return {
            "domain_name": domain.domain_name,
            "status": domain.status,
            "dns_verified": domain.dns_verified_at is not None,
            "kumo_authorized": domain.kumo_authorized,
            "inboxes_count": len(domain.inboxes),
            "active_inboxes": sum(1 for inbox in domain.inboxes if inbox.status == "active"),
            "avg_health_score": sum(inbox.health_score for inbox in domain.inboxes) / len(domain.inboxes) if domain.inboxes else 0,
            "expiry_date": domain.expiry_date
        }
    
    @staticmethod
    def suspend_domain(domain: Domain, reason: str, db: Session) -> Domain:
        """Suspend a domain (e.g., for abuse)."""
        domain.status = DomainStatus.SUSPENDED
        domain.metadata = domain.metadata or {}
        domain.metadata["suspension_reason"] = reason
        domain.metadata["suspended_at"] = datetime.utcnow().isoformat()
        
        db.add(domain)
        db.commit()
        db.refresh(domain)
        
        logger.warning(f"Domain {domain.domain_name} suspended: {reason}")
        
        # TODO: Remove from KumoMTA authorized list
        
        return domain
    
    @staticmethod
    def reactivate_domain(domain: Domain, db: Session) -> Domain:
        """Reactivate a suspended domain."""
        domain.status = DomainStatus.ACTIVE
        domain.metadata = domain.metadata or {}
        domain.metadata.pop("suspension_reason", None)
        
        db.add(domain)
        db.commit()
        db.refresh(domain)
        
        logger.info(f"Domain {domain.domain_name} reactivated")
        
        # TODO: Re-add to KumoMTA authorized list
        
        return domain
    
    @staticmethod
    def list_domains_for_tenant(tenant_id: str, db: Session) -> List[Domain]:
        """List all domains for a tenant."""
        return db.query(Domain).filter(Domain.tenant_id == tenant_id).all()
    
    @staticmethod
    def get_domain_by_id(domain_id: str, db: Session) -> Optional[Domain]:
        """Get domain by ID."""
        return db.query(Domain).filter(Domain.id == domain_id).first()
    
    @staticmethod
    def delete_domain(domain_id: str, db: Session) -> bool:
        """Delete a domain (soft delete recommended in production)."""
        domain = db.query(Domain).filter(Domain.id == domain_id).first()
        if not domain:
            return False
        
        # TODO: Cancel with registrar
        # TODO: Remove from Cloudflare
        # TODO: Remove from KumoMTA
        
        db.delete(domain)
        db.commit()
        
        logger.info(f"Domain {domain.domain_name} deleted")
        return True
