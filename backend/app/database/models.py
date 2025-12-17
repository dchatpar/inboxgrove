"""
SQLAlchemy ORM models for InboxGrove.
Complete data schema for multi-tenant SaaS with subscriptions, domains, and infrastructure.
"""

from datetime import datetime, timedelta
from enum import Enum
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Boolean, ForeignKey, 
    Text, JSON, Enum as SQLEnum, Numeric, UniqueConstraint, Index
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
import uuid

Base = declarative_base()


class SubscriptionTier(str, Enum):
    """Available subscription tiers."""
    TRIAL = "trial"
    STARTER = "starter"
    GROWTH = "growth"
    ENTERPRISE = "enterprise"


class BillingCycle(str, Enum):
    """Billing frequency."""
    MONTHLY = "monthly"
    YEARLY = "yearly"


class SubscriptionStatus(str, Enum):
    """Subscription lifecycle status."""
    TRIAL = "trial"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    SUSPENDED = "suspended"


class DomainStatus(str, Enum):
    """Domain provisioning status."""
    PENDING_PURCHASE = "pending_purchase"
    PENDING_DNS = "pending_dns"
    DNS_VERIFIED = "dns_verified"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    EXPIRED = "expired"


class InboxStatus(str, Enum):
    """Inbox/user account status."""
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DELETED = "deleted"


class TransactionType(str, Enum):
    """Types of financial transactions."""
    SUBSCRIPTION_CHARGE = "subscription_charge"
    DOMAIN_PURCHASE = "domain_purchase"
    OVERAGE_CHARGE = "overage_charge"
    REFUND = "refund"
    CREDIT_APPLICATION = "credit_application"


class Tenant(Base):
    """
    Root organization account.
    Multi-tenant SaaS model: Everything belongs to a tenant.
    """
    __tablename__ = "tenants"
    __table_args__ = (
        Index("ix_tenants_email", "company_email"),
        Index("ix_tenants_stripe_customer_id", "stripe_customer_id"),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Organization Info
    company_name = Column(String(255), nullable=False)
    company_email = Column(String(255), unique=True, nullable=False)
    company_website = Column(String(255), nullable=True)
    
    # Subscription Info
    subscription_tier = Column(SQLEnum(SubscriptionTier), default=SubscriptionTier.TRIAL)
    subscription_status = Column(SQLEnum(SubscriptionStatus), default=SubscriptionStatus.TRIAL)
    stripe_customer_id = Column(String(255), unique=True, nullable=True)
    stripe_subscription_id = Column(String(255), unique=True, nullable=True)
    
    # Trial Tracking
    trial_started_at = Column(DateTime, nullable=True)
    trial_ends_at = Column(DateTime, nullable=True)
    trial_inbox_limit = Column(Integer, default=5)
    trial_domain_limit = Column(Integer, default=1)
    trial_converted = Column(Boolean, default=False)
    
    # Subscription Details
    billing_cycle = Column(SQLEnum(BillingCycle), default=BillingCycle.MONTHLY)
    subscription_started_at = Column(DateTime, nullable=True)
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    next_billing_date = Column(DateTime, nullable=True)
    auto_renew = Column(Boolean, default=True)
    
    # Billing Address
    billing_address = Column(Text, nullable=True)
    billing_city = Column(String(100), nullable=True)
    billing_state = Column(String(100), nullable=True)
    billing_postal_code = Column(String(20), nullable=True)
    billing_country = Column(String(2), nullable=True)
    tax_id = Column(String(50), nullable=True)
    
    # Security & Status
    is_suspended = Column(Boolean, default=False, index=True)
    suspension_reason = Column(Text, nullable=True)
    suspended_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    
    # Usage Tracking
    domains_count = Column(Integer, default=0)
    inboxes_count = Column(Integer, default=0)
    api_calls_this_month = Column(Integer, default=0)
    
    # Metadata
    metadata = Column(JSONB, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    domains = relationship("Domain", back_populates="tenant", cascade="all, delete-orphan")
    inboxes = relationship("Inbox", back_populates="tenant", cascade="all, delete-orphan")
    transactions = relationship("TransactionHistory", back_populates="tenant", cascade="all, delete-orphan")
    payment_methods = relationship("PaymentMethod", back_populates="tenant", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="tenant", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="tenant", cascade="all, delete-orphan")


class User(Base):
    """Team members within a tenant."""
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_email", "email"),
        Index("ix_users_tenant_id", "tenant_id"),
        UniqueConstraint("tenant_id", "email", name="uq_tenant_user_email"),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    # User Info
    email = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)  # Tenant admin
    
    # 2FA
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(255), nullable=True)
    
    # Last Activity
    last_login_at = Column(DateTime, nullable=True)
    last_activity_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="users")


class Domain(Base):
    """
    Custom domains owned/managed by tenants.
    Can be purchased via the platform or imported.
    """
    __tablename__ = "domains"
    __table_args__ = (
        Index("ix_domains_tenant_id", "tenant_id"),
        Index("ix_domains_status", "status"),
        UniqueConstraint("tenant_id", "domain_name", name="uq_tenant_domain"),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    # Domain Details
    domain_name = Column(String(255), nullable=False)
    status = Column(SQLEnum(DomainStatus), default=DomainStatus.PENDING_PURCHASE)
    
    # Registration Details
    is_system_purchased = Column(Boolean, default=False)  # vs imported
    registrar_provider = Column(String(50), nullable=True)  # namecheap, godaddy, etc.
    registrar_domain_id = Column(String(255), nullable=True)  # External domain ID
    registrar_auth_code = Column(String(255), nullable=True)  # For domain transfers
    
    # DNS Configuration
    cloudflare_zone_id = Column(String(255), nullable=True)
    cloudflare_name_servers = Column(ARRAY(String), nullable=True)
    dns_verified_at = Column(DateTime, nullable=True)
    
    # DNS Records (stored for reference)
    dns_records = Column(JSONB, default={})  # {a, mx, spf, dkim, dmarc}
    
    # Purchase Details
    purchase_price = Column(Numeric(10, 2), nullable=True)  # In USD
    purchase_date = Column(DateTime, nullable=True)
    renewal_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    is_auto_renew = Column(Boolean, default=True)
    
    # KumoMTA Configuration
    kumo_authorized = Column(Boolean, default=False)  # Is it in KumoMTA relay list?
    kumo_authorized_at = Column(DateTime, nullable=True)
    
    # Metadata
    metadata = Column(JSONB, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="domains")
    inboxes = relationship("Inbox", back_populates="domain", cascade="all, delete-orphan")


class Inbox(Base):
    """
    Individual email accounts (SMTP users).
    Each inbox is tied to a domain and a tenant.
    """
    __tablename__ = "inboxes"
    __table_args__ = (
        Index("ix_inboxes_tenant_id", "tenant_id"),
        Index("ix_inboxes_domain_id", "domain_id"),
        Index("ix_inboxes_status", "status"),
        UniqueConstraint("domain_id", "username", name="uq_domain_username"),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    domain_id = Column(UUID(as_uuid=True), ForeignKey("domains.id"), nullable=False)
    
    # Inbox Details
    username = Column(String(100), nullable=False)
    password = Column(String(255), nullable=False)  # hashed
    full_email = Column(String(255), nullable=False)  # username@domain
    status = Column(SQLEnum(InboxStatus), default=InboxStatus.ACTIVE)
    
    # SMTP Configuration
    smtp_host = Column(String(255), nullable=True)
    smtp_port = Column(Integer, nullable=True)
    
    # Warmup Tracking
    warmup_stage = Column(Integer, default=0)  # 0-10 stages
    warmup_started_at = Column(DateTime, nullable=True)
    warmup_completed_at = Column(DateTime, nullable=True)
    
    # Usage Tracking
    emails_sent_today = Column(Integer, default=0)
    emails_sent_this_month = Column(Integer, default=0)
    daily_limit = Column(Integer, default=40)
    monthly_limit = Column(Integer, default=1000)
    
    # Health Monitoring
    health_score = Column(Float, default=50.0)  # 0-100
    last_health_check_at = Column(DateTime, nullable=True)
    is_blacklisted = Column(Boolean, default=False)
    blacklist_reason = Column(Text, nullable=True)
    blacklist_date = Column(DateTime, nullable=True)
    
    # Metadata
    metadata = Column(JSONB, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="inboxes")
    domain = relationship("Domain", back_populates="inboxes")


class PaymentMethod(Base):
    """Stored payment methods for one-click domain purchasing."""
    __tablename__ = "payment_methods"
    __table_args__ = (
        Index("ix_payment_methods_tenant_id", "tenant_id"),
        UniqueConstraint("tenant_id", "stripe_payment_method_id", name="uq_tenant_payment_method"),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    # Stripe Integration
    stripe_payment_method_id = Column(String(255), nullable=False)
    
    # Card Details (masked)
    card_brand = Column(String(50), nullable=False)  # visa, mastercard, etc.
    card_last_four = Column(String(4), nullable=False)
    card_exp_month = Column(Integer, nullable=False)
    card_exp_year = Column(Integer, nullable=False)
    
    # Usage
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="payment_methods")


class TransactionHistory(Base):
    """
    Complete ledger of all financial transactions.
    Reconciliation source of truth.
    """
    __tablename__ = "transaction_history"
    __table_args__ = (
        Index("ix_transaction_tenant_id", "tenant_id"),
        Index("ix_transaction_type", "transaction_type"),
        Index("ix_transaction_date", "created_at"),
        Index("ix_transaction_stripe_id", "stripe_transaction_id"),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    # Transaction Info
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    description = Column(Text, nullable=False)
    
    # Amount (in cents)
    amount = Column(Integer, nullable=False)  # e.g., 9700 = $97.00
    currency = Column(String(3), default="USD")
    
    # Status
    status = Column(String(50), default="pending")  # pending, succeeded, failed, refunded
    
    # Stripe Integration
    stripe_transaction_id = Column(String(255), nullable=True, index=True)
    stripe_invoice_id = Column(String(255), nullable=True)
    
    # Related Resources
    domain_id = Column(UUID(as_uuid=True), ForeignKey("domains.id"), nullable=True)
    related_data = Column(JSONB, default={})  # Extra context
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="transactions")


class APIKey(Base):
    """API keys for programmatic access."""
    __tablename__ = "api_keys"
    __table_args__ = (
        Index("ix_api_keys_tenant_id", "tenant_id"),
        UniqueConstraint("key_hash", name="uq_api_key_hash"),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    # Key Info
    name = Column(String(255), nullable=False)
    key_hash = Column(String(255), nullable=False, index=True)
    
    # Permissions
    scopes = Column(ARRAY(String), default=["read"])
    
    # Usage Tracking
    last_used_at = Column(DateTime, nullable=True)
    usage_count = Column(Integer, default=0)
    
    # Status
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="api_keys")


class AuditLog(Base):
    """Compliance audit log for all important actions."""
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_tenant_id", "tenant_id"),
        Index("ix_audit_logs_action", "action"),
        Index("ix_audit_logs_date", "created_at"),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    # Action Details
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(255), nullable=True)
    
    # Changes
    changes = Column(JSONB, default={})
    
    # Context
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="audit_logs")


# Create all tables on startup
def init_db(engine):
    """Initialize database with all models."""
    Base.metadata.create_all(bind=engine)
