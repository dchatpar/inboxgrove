"""
SQLAlchemy Models for InboxGrove
Database schema with production-grade security and validation
"""

from typing import Optional
from datetime import datetime, timedelta
from uuid import uuid4
import json

from sqlalchemy import (
    Column, String, DateTime, Boolean, Integer, Float, ForeignKey,
    Text, LargeBinary, JSONB, Enum as SQLEnum, UniqueConstraint,
    CheckConstraint, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

# Base declarative for all models
Base = declarative_base()

# ============================================================================
# USER MODEL
# ============================================================================
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)  # bcrypt hash
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    
    # Subscription & Account Status
    subscription_tier = Column(
        SQLEnum('free', 'pro', 'enterprise', name='subscription_tier'),
        default='free',
        nullable=False
    )
    max_domains = Column(Integer, default=3)
    max_inboxes = Column(Integer, default=50)
    is_active = Column(Boolean, default=True)
    
    # 2FA
    two_fa_enabled = Column(Boolean, default=False)
    two_fa_secret = Column(String(32), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    domains = relationship("Domain", back_populates="user", cascade="all, delete-orphan")
    mailboxes = relationship("Mailbox", back_populates="user", cascade="all, delete-orphan")
    oauth_accounts = relationship("OAuthAccount", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="user", uselist=False)
    
    __table_args__ = (
        CheckConstraint('email ~* \'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\'', name='valid_email'),
    )


# ============================================================================
# DOMAIN MODEL
# ============================================================================
class Domain(Base):
    __tablename__ = "domains"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # Domain Details
    domain_name = Column(String(255), unique=True, nullable=False, index=True)
    status = Column(
        SQLEnum('pending', 'active', 'failed', 'suspended', name='domain_status'),
        default='pending',
        nullable=False,
        index=True
    )
    
    # Cloudflare Integration
    cloudflare_zone_id = Column(String(100), nullable=True, unique=True)
    cloudflare_account_id = Column(String(100), nullable=True)
    
    # DNS Records
    spf_record = Column(Text, nullable=True)
    dmarc_policy = Column(
        SQLEnum('none', 'quarantine', 'reject', name='dmarc_policy'),
        default='none',
        nullable=True
    )
    
    # DKIM Keys (Encrypted)
    dkim_private_key = Column(LargeBinary, nullable=True)  # AES-256 encrypted
    dkim_public_key = Column(Text, nullable=True)
    dkim_selector = Column(String(50), default='mail2025', nullable=True)
    
    # DNS Validation
    dns_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    propagation_checked_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="domains")
    mailboxes = relationship("Mailbox", back_populates="domain", cascade="all, delete-orphan")
    dkim_keys = relationship("DKIMKey", back_populates="domain", cascade="all, delete-orphan")
    warmup_campaigns = relationship("WarmupCampaign", back_populates="domain")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'domain_name', name='uq_user_domain'),
        Index('idx_domain_status', 'status'),
        Index('idx_domain_cloudflare_zone', 'cloudflare_zone_id'),
    )


# ============================================================================
# MAILBOX MODEL
# ============================================================================
class Mailbox(Base):
    __tablename__ = "mailboxes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    domain_id = Column(UUID(as_uuid=True), ForeignKey('domains.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # Credentials
    username = Column(String(150), nullable=False)
    password_hash = Column(String(255), nullable=False)  # bcrypt hash
    email = Column(String(255), unique=True, nullable=False, index=True)
    
    # Rate Limiting
    daily_limit = Column(Integer, default=40, nullable=False)
    emails_sent_today = Column(Integer, default=0, nullable=False)
    last_reset_date = Column(datetime.date, default=func.current_date(), nullable=False)
    
    # Status & Health
    status = Column(
        SQLEnum('active', 'warming', 'paused', 'blacklisted', name='mailbox_status'),
        default='active',
        nullable=False,
        index=True
    )
    health_score = Column(Float, default=100.0, nullable=False)
    last_health_check = Column(DateTime(timezone=True), nullable=True)
    
    # Metrics (denormalized for performance)
    total_sent = Column(Integer, default=0, nullable=False)
    total_delivered = Column(Integer, default=0, nullable=False)
    total_bounced = Column(Integer, default=0, nullable=False)
    total_opens = Column(Integer, default=0, nullable=False)
    total_replies = Column(Integer, default=0, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_used = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    domain = relationship("Domain", back_populates="mailboxes")
    user = relationship("User", back_populates="mailboxes")
    warmup_campaigns = relationship("WarmupCampaign", back_populates="mailbox", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('domain_id', 'username', name='uq_domain_username'),
        Index('idx_mailbox_status', 'status'),
        Index('idx_mailbox_user', 'user_id'),
        CheckConstraint('daily_limit > 0', name='check_daily_limit'),
        CheckConstraint('health_score >= 0 AND health_score <= 100', name='check_health_score'),
    )


# ============================================================================
# DKIM KEY MODEL
# ============================================================================
class DKIMKey(Base):
    __tablename__ = "dkim_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    domain_id = Column(UUID(as_uuid=True), ForeignKey('domains.id', ondelete='CASCADE'), nullable=False)
    
    # Key Material (Encrypted)
    private_key = Column(LargeBinary, nullable=False)  # AES-256-GCM encrypted
    public_key = Column(Text, nullable=False)
    
    # Metadata
    selector = Column(String(50), default='mail2025', nullable=False)
    algorithm = Column(String(10), default='rsa', nullable=False)
    key_size = Column(Integer, default=2048, nullable=False)
    
    # Rotation
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    rotated_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Optional: 2-year rotation
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    domain = relationship("Domain", back_populates="dkim_keys")
    
    __table_args__ = (
        UniqueConstraint('domain_id', 'selector', name='uq_domain_selector'),
    )


# ============================================================================
# OAUTH ACCOUNT MODEL
# ============================================================================
class OAuthAccount(Base):
    __tablename__ = "oauth_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # Provider Info
    provider = Column(
        SQLEnum('google', 'microsoft', 'custom', name='oauth_provider'),
        nullable=False
    )
    account_email = Column(String(255), nullable=False)
    provider_account_id = Column(String(500), nullable=False)
    
    # Tokens (Encrypted)
    refresh_token = Column(String(500), nullable=False)  # AES-256 encrypted
    access_token = Column(String(500), nullable=False)   # AES-256 encrypted
    token_type = Column(String(50), default='Bearer', nullable=False)
    
    # Token Expiry
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    token_refresh_attempts = Column(Integer, default=0, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True)
    last_used = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="oauth_accounts")
    
    __table_args__ = (
        UniqueConstraint('provider', 'provider_account_id', name='uq_provider_account'),
        Index('idx_oauth_user', 'user_id'),
    )


# ============================================================================
# WARMUP CAMPAIGN MODEL
# ============================================================================
class WarmupCampaign(Base):
    __tablename__ = "warmup_campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    mailbox_id = Column(UUID(as_uuid=True), ForeignKey('mailboxes.id', ondelete='CASCADE'), nullable=False)
    domain_id = Column(UUID(as_uuid=True), ForeignKey('domains.id', ondelete='CASCADE'), nullable=False)
    
    # Campaign Details
    campaign_day = Column(Integer, nullable=False)  # Day 1-14
    status = Column(
        SQLEnum('pending', 'running', 'completed', 'paused', 'failed', name='warmup_status'),
        default='pending',
        nullable=False
    )
    
    # Scheduling
    scheduled_send_time = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metrics
    scheduled_sends = Column(Integer, default=0, nullable=False)
    actual_sends = Column(Integer, default=0, nullable=False)
    opens = Column(Integer, default=0, nullable=False)
    replies = Column(Integer, default=0, nullable=False)
    bounces = Column(Integer, default=0, nullable=False)
    complaints = Column(Integer, default=0, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    mailbox = relationship("Mailbox", back_populates="warmup_campaigns")
    domain = relationship("Domain", back_populates="warmup_campaigns")
    
    __table_args__ = (
        Index('idx_warmup_mailbox_day', 'mailbox_id', 'campaign_day'),
        Index('idx_warmup_status', 'status'),
    )


# ============================================================================
# AUDIT LOG MODEL
# ============================================================================
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # Action Details
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Result
    status = Column(
        SQLEnum('success', 'failure', name='audit_status'),
        default='success',
        nullable=False
    )
    error_message = Column(Text, nullable=True)
    
    # Request Context
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Metadata
    metadata = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    __table_args__ = (
        Index('idx_audit_user', 'user_id'),
        Index('idx_audit_action', 'action'),
        Index('idx_audit_created', 'created_at'),
    )


# ============================================================================
# SUBSCRIPTION MODEL
# ============================================================================
class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    
    # Plan Details
    plan = Column(
        SQLEnum('free', 'pro', 'enterprise', name='plan_name'),
        default='free',
        nullable=False
    )
    
    # Billing
    stripe_customer_id = Column(String(100), nullable=True, unique=True)
    stripe_subscription_id = Column(String(100), nullable=True)
    billing_email = Column(String(255), nullable=False)
    
    # Limits
    max_domains = Column(Integer, default=3)
    max_inboxes_per_domain = Column(Integer, default=50)
    max_users = Column(Integer, default=1)
    
    # Period
    current_period_start = Column(DateTime(timezone=True), nullable=False, default=func.now)
    current_period_end = Column(DateTime(timezone=True), nullable=False)
    
    # Status
    status = Column(
        SQLEnum('active', 'past_due', 'canceled', name='subscription_status'),
        default='active',
        nullable=False
    )
    cancel_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="subscription")
    
    __table_args__ = (
        Index('idx_subscription_status', 'status'),
    )
