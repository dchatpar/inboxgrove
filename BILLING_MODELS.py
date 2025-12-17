"""
InboxGrove Subscription & Billing Models
Complete implementation for trial management, subscriptions, invoicing, and payment processing
"""

from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Enum, ForeignKey, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import enum

Base = declarative_base()

# ============================================================================
# ENUMS
# ============================================================================

class SubscriptionTier(enum.Enum):
    """Available subscription tiers"""
    FREE = "free"           # $0/month (limited features, 10 inboxes max)
    STARTER = "starter"     # $29/month (50 inboxes, basic warmup)
    PROFESSIONAL = "pro"    # $79/month (250 inboxes, advanced warmup)
    ENTERPRISE = "enterprise"  # $299/month (unlimited inboxes, priority support)


class BillingCycle(enum.Enum):
    """Billing cycle options"""
    MONTHLY = "monthly"
    YEARLY = "yearly"


class TrialStatus(enum.Enum):
    """Trial status states"""
    ACTIVE = "active"
    EXPIRED = "expired"
    CONVERTED = "converted"
    CANCELLED = "cancelled"


class InvoiceStatus(enum.Enum):
    """Invoice status"""
    DRAFT = "draft"
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentMethod(enum.Enum):
    """Payment method types"""
    CREDIT_CARD = "credit_card"
    BANK_TRANSFER = "bank_transfer"
    PAYPAL = "paypal"


# ============================================================================
# SUBSCRIPTION & TRIAL MODELS
# ============================================================================

class SubscriptionPlan(Base):
    """Subscription plan templates - predefined plans"""
    __tablename__ = "subscription_plans"
    
    id = Column(String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    name = Column(String(50), nullable=False)  # "Free", "Starter", "Pro", "Enterprise"
    tier = Column(Enum(SubscriptionTier), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    
    # Pricing
    monthly_price = Column(Float, nullable=False, default=0)  # USD
    yearly_price = Column(Float, nullable=False, default=0)    # USD (20% discount typically)
    
    # Feature limits
    max_domains = Column(Integer, nullable=False, default=1)
    max_inboxes = Column(Integer, nullable=False, default=10)
    max_sending_limit = Column(Integer, nullable=False, default=40)  # per inbox per day
    
    # Features (boolean flags)
    has_ai_warmup = Column(Boolean, default=False)
    has_deliverability_api = Column(Boolean, default=False)
    has_oauth_integration = Column(Boolean, default=False)
    has_csv_export = Column(Boolean, default=False)
    has_priority_support = Column(Boolean, default=False)
    has_custom_domain = Column(Boolean, default=False)
    has_health_monitoring = Column(Boolean, default=True)
    
    # Warmup settings
    warmup_days = Column(Integer, default=14)  # Days to complete warmup
    
    # Support tier
    support_tier = Column(String(20), default="community")  # community | email | priority | phone
    
    # API limits
    api_calls_per_month = Column(Integer, default=10000)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan")


class TrialPeriod(Base):
    """User trial period tracking"""
    __tablename__ = "trial_periods"
    
    id = Column(String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False, unique=True)
    
    # Trial settings
    trial_tier = Column(Enum(SubscriptionTier), default=SubscriptionTier.PROFESSIONAL)  # Default tier during trial
    status = Column(Enum(TrialStatus), default=TrialStatus.ACTIVE)
    
    # Timing
    started_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)  # started_at + 7 days
    
    # Trial features (can be customized)
    trial_inboxes_limit = Column(Integer, default=50)
    trial_domains_limit = Column(Integer, default=3)
    
    # Tracking
    inboxes_created = Column(Integer, default=0)
    domains_added = Column(Integer, default=0)
    emails_sent = Column(Integer, default=0)
    
    # Conversion tracking
    converted_to_plan = Column(Enum(SubscriptionTier), nullable=True)
    converted_at = Column(DateTime, nullable=True)
    conversion_email_sent = Column(Boolean, default=False)
    expiry_reminder_sent = Column(Boolean, default=False)
    
    # Additional fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Subscription(Base):
    """Active subscription for users"""
    __tablename__ = "subscriptions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False, unique=True)
    plan_id = Column(String(36), ForeignKey('subscription_plans.id'), nullable=False)
    
    # Billing information
    stripe_customer_id = Column(String(100), nullable=False, unique=True)
    stripe_subscription_id = Column(String(100), nullable=True, unique=True)
    
    # Current status
    status = Column(String(20), default="active")  # active | paused | cancelled | past_due
    current_tier = Column(Enum(SubscriptionTier), nullable=False)
    billing_cycle = Column(Enum(BillingCycle), default=BillingCycle.MONTHLY)
    
    # Pricing
    current_price = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    
    # Dates
    started_at = Column(DateTime, default=datetime.utcnow)
    current_period_start = Column(DateTime, nullable=False)
    current_period_end = Column(DateTime, nullable=False)
    renewed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    
    # Auto-renewal settings
    auto_renew = Column(Boolean, default=True)
    cancel_at_period_end = Column(Boolean, default=False)
    
    # Feature usage
    current_inbox_count = Column(Integer, default=0)
    current_domain_count = Column(Integer, default=0)
    api_calls_this_month = Column(Integer, default=0)
    
    # Relationships
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================================================
# PAYMENT & BILLING MODELS
# ============================================================================

class PaymentMethod(Base):
    """Stored payment methods"""
    __tablename__ = "payment_methods"
    
    id = Column(String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    
    # Stripe integration
    stripe_payment_method_id = Column(String(100), nullable=False, unique=True)
    
    # Card details (last 4 digits only, never store full card)
    card_brand = Column(String(20), nullable=False)  # visa, mastercard, amex, etc
    card_last_four = Column(String(4), nullable=False)
    card_exp_month = Column(Integer, nullable=False)
    card_exp_year = Column(Integer, nullable=False)
    
    # Billing address
    billing_name = Column(String(100), nullable=False)
    billing_email = Column(String(100), nullable=False)
    billing_address = Column(String(255), nullable=False)
    billing_city = Column(String(50), nullable=False)
    billing_state = Column(String(50), nullable=False)
    billing_postal_code = Column(String(20), nullable=False)
    billing_country = Column(String(100), nullable=False)
    
    # Status
    is_default = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Invoice(Base):
    """Invoices and billing records"""
    __tablename__ = "invoices"
    
    id = Column(String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    subscription_id = Column(String(36), ForeignKey('subscriptions.id'), nullable=True)
    
    # Invoice details
    invoice_number = Column(String(50), nullable=False, unique=True)  # INV-2025-001234
    stripe_invoice_id = Column(String(100), nullable=True, unique=True)
    
    # Description and items
    description = Column(String(255), nullable=False)  # e.g., "Professional Plan - Monthly"
    items = Column(JSON, nullable=False)  # Array of line items with description, qty, unit_price
    
    # Amounts (all in cents)
    subtotal = Column(Integer, nullable=False)  # Before tax
    tax_amount = Column(Integer, default=0)
    discount_amount = Column(Integer, default=0)
    total_amount = Column(Integer, nullable=False)  # After tax
    
    # Tax information
    tax_rate = Column(Float, default=0.0)
    tax_id = Column(String(50), nullable=True)
    
    # Status
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.DRAFT)
    
    # Dates
    issue_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=False)
    paid_date = Column(DateTime, nullable=True)
    
    # Payment tracking
    payment_method = Column(Enum(PaymentMethod), nullable=True)
    payment_id = Column(String(100), nullable=True)  # Stripe charge ID
    
    # Notes and memo
    memo = Column(Text, nullable=True)
    
    # PDF storage
    pdf_url = Column(String(500), nullable=True)
    pdf_generated_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Transaction(Base):
    """All payment transactions"""
    __tablename__ = "transactions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    invoice_id = Column(String(36), ForeignKey('invoices.id'), nullable=True)
    
    # Transaction details
    stripe_charge_id = Column(String(100), nullable=False, unique=True)
    amount = Column(Integer, nullable=False)  # In cents
    currency = Column(String(3), default="USD")
    
    # Transaction type
    transaction_type = Column(String(20), nullable=False)  # charge | refund | adjustment
    status = Column(String(20), nullable=False)  # succeeded | failed | pending
    
    # Payment method
    payment_method_id = Column(String(36), ForeignKey('payment_methods.id'), nullable=True)
    card_brand = Column(String(20), nullable=True)
    card_last_four = Column(String(4), nullable=True)
    
    # Description
    description = Column(String(255), nullable=False)
    failure_reason = Column(String(255), nullable=True)  # If failed
    
    # Retry information
    retry_count = Column(Integer, default=0)
    retry_after = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Usage(Base):
    """Track customer feature usage"""
    __tablename__ = "usage"
    
    id = Column(String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    billing_period_start = Column(DateTime, nullable=False)
    billing_period_end = Column(DateTime, nullable=False)
    
    # Usage metrics
    inboxes_created = Column(Integer, default=0)
    domains_added = Column(Integer, default=0)
    emails_sent = Column(Integer, default=0)
    api_calls = Column(Integer, default=0)
    storage_gb = Column(Float, default=0)
    
    # Overage charges
    inbox_overage = Column(Integer, default=0)  # Beyond plan limit
    overage_charge = Column(Integer, default=0)  # In cents
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PromoCode(Base):
    """Promotional codes and discounts"""
    __tablename__ = "promo_codes"
    
    id = Column(String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    code = Column(String(50), nullable=False, unique=True)
    
    # Discount details
    discount_type = Column(String(20), nullable=False)  # percentage | fixed
    discount_value = Column(Float, nullable=False)  # 20 for 20% or 50 for $50
    
    # Usage limits
    max_uses = Column(Integer, default=-1)  # -1 = unlimited
    uses_count = Column(Integer, default=0)
    
    # Validity
    is_active = Column(Boolean, default=True)
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    
    # Eligibility
    min_purchase = Column(Float, default=0)  # Minimum purchase amount
    applicable_tiers = Column(JSON, default=[])  # Empty = all tiers
    
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(36), nullable=True)  # Admin user ID


class PromoCodeUsage(Base):
    """Track promo code usage"""
    __tablename__ = "promo_code_usage"
    
    id = Column(String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    promo_code_id = Column(String(36), ForeignKey('promo_codes.id'), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    
    # Usage tracking
    invoice_id = Column(String(36), ForeignKey('invoices.id'), nullable=True)
    discount_amount = Column(Integer, nullable=False)  # Actual discount applied in cents
    
    used_at = Column(DateTime, default=datetime.utcnow)


class Refund(Base):
    """Refund records"""
    __tablename__ = "refunds"
    
    id = Column(String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    transaction_id = Column(String(36), ForeignKey('transactions.id'), nullable=False)
    invoice_id = Column(String(36), ForeignKey('invoices.id'), nullable=True)
    
    # Refund details
    stripe_refund_id = Column(String(100), nullable=False, unique=True)
    amount = Column(Integer, nullable=False)  # In cents
    reason = Column(String(255), nullable=False)  # customer_request, duplicate, etc
    
    # Status
    status = Column(String(20), default="pending")  # pending | succeeded | failed
    
    # Timing
    requested_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
