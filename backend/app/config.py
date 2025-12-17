"""
Configuration management for InboxGrove backend.
Supports multiple environments: development, staging, production.
"""

import os
from typing import Optional
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field, validator


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "InboxGrove"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=False, env="DEBUG")
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    API_TITLE: str = "InboxGrove API"
    API_DESCRIPTION: str = "Cold Email Infrastructure as a Service"
    ALLOWED_HOSTS: list[str] = Field(default=["*"], env="ALLOWED_HOSTS")
    
    # Security
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    JWT_SECRET: str = Field(..., env="JWT_SECRET")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 1440  # 24 hours
    JWT_REFRESH_EXPIRY_DAYS: int = 7
    CORS_ORIGINS: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        env="CORS_ORIGINS"
    )
    
    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    DATABASE_POOL_SIZE: int = Field(default=20, env="DATABASE_POOL_SIZE")
    DATABASE_MAX_OVERFLOW: int = Field(default=10, env="DATABASE_MAX_OVERFLOW")
    DATABASE_ECHO: bool = Field(default=False, env="DATABASE_ECHO")
    
    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    REDIS_CACHE_TTL: int = Field(default=3600, env="REDIS_CACHE_TTL")  # 1 hour
    
    # Stripe Configuration
    STRIPE_API_KEY: str = Field(..., env="STRIPE_API_KEY")
    STRIPE_WEBHOOK_SECRET: str = Field(..., env="STRIPE_WEBHOOK_SECRET")
    STRIPE_TAX_RATE_ID: Optional[str] = Field(default=None, env="STRIPE_TAX_RATE_ID")
    
    # Trial Configuration
    TRIAL_DAYS: int = Field(default=7, env="TRIAL_DAYS")
    TRIAL_INBOX_LIMIT: int = Field(default=5, env="TRIAL_INBOX_LIMIT")
    TRIAL_DOMAIN_LIMIT: int = Field(default=1, env="TRIAL_DOMAIN_LIMIT")
    
    # Subscription Tiers (in cents)
    STARTER_PRICE: int = Field(default=9700, env="STARTER_PRICE")  # $97.00
    GROWTH_PRICE: int = Field(default=29700, env="GROWTH_PRICE")    # $297.00
    ENTERPRISE_PRICE: int = Field(default=99700, env="ENTERPRISE_PRICE")  # $997.00
    
    # Plan Limits
    STARTER_DOMAINS: int = Field(default=10, env="STARTER_DOMAINS")
    STARTER_INBOXES: int = Field(default=50, env="STARTER_INBOXES")
    GROWTH_DOMAINS: int = Field(default=50, env="GROWTH_DOMAINS")
    GROWTH_INBOXES: int = Field(default=500, env="GROWTH_INBOXES")
    ENTERPRISE_DOMAINS: int = Field(default=10000, env="ENTERPRISE_DOMAINS")
    ENTERPRISE_INBOXES: int = Field(default=100000, env="ENTERPRISE_INBOXES")
    
    # Namecheap API
    NAMECHEAP_API_KEY: str = Field(..., env="NAMECHEAP_API_KEY")
    NAMECHEAP_API_USER: str = Field(..., env="NAMECHEAP_API_USER")
    NAMECHEAP_SANDBOX: bool = Field(default=False, env="NAMECHEAP_SANDBOX")
    
    # Cloudflare API
    CLOUDFLARE_API_TOKEN: str = Field(..., env="CLOUDFLARE_API_TOKEN")
    CLOUDFLARE_ZONE_ID: str = Field(..., env="CLOUDFLARE_ZONE_ID")
    
    # KumoMTA Configuration
    KUMO_HTTPS_PORT: int = Field(default=8008, env="KUMO_HTTPS_PORT")
    KUMO_HOST: str = Field(default="localhost", env="KUMO_HOST")
    KUMO_USERNAME: str = Field(..., env="KUMO_USERNAME")
    KUMO_PASSWORD: str = Field(..., env="KUMO_PASSWORD")
    
    # Email Configuration
    MAIL_FROM: str = Field(default="noreply@inboxgrove.com", env="MAIL_FROM")
    MAIL_SMTP_HOST: str = Field(..., env="MAIL_SMTP_HOST")
    MAIL_SMTP_PORT: int = Field(default=587, env="MAIL_SMTP_PORT")
    MAIL_SMTP_USER: str = Field(..., env="MAIL_SMTP_USER")
    MAIL_SMTP_PASSWORD: str = Field(..., env="MAIL_SMTP_PASSWORD")
    MAIL_TLS: bool = Field(default=True, env="MAIL_TLS")
    
    # Celery Configuration
    CELERY_BROKER_URL: str = Field(..., env="CELERY_BROKER_URL")
    CELERY_RESULT_BACKEND: str = Field(..., env="CELERY_RESULT_BACKEND")
    CELERY_TASK_TIME_LIMIT: int = Field(default=3600, env="CELERY_TASK_TIME_LIMIT")
    CELERY_TASK_SOFT_TIME_LIMIT: int = Field(default=3300, env="CELERY_TASK_SOFT_TIME_LIMIT")
    
    # Monitoring & Logging
    SENTRY_DSN: Optional[str] = Field(default=None, env="SENTRY_DSN")
    PROMETHEUS_METRICS_ENABLED: bool = Field(default=True, env="PROMETHEUS_METRICS_ENABLED")
    REQUEST_LOGGING_ENABLED: bool = Field(default=True, env="REQUEST_LOGGING_ENABLED")
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = Field(default=True, env="RATE_LIMIT_ENABLED")
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = Field(default=60, env="RATE_LIMIT_REQUESTS_PER_MINUTE")
    RATE_LIMIT_REQUESTS_PER_HOUR: int = Field(default=1000, env="RATE_LIMIT_REQUESTS_PER_HOUR")
    
    # Feature Flags
    DOMAIN_PURCHASING_ENABLED: bool = Field(default=True, env="DOMAIN_PURCHASING_ENABLED")
    AUTO_PROVISIONING_ENABLED: bool = Field(default=True, env="AUTO_PROVISIONING_ENABLED")
    TRIAL_CONVERSION_AUTO: bool = Field(default=False, env="TRIAL_CONVERSION_AUTO")
    
    # Frontend URL (for redirects)
    FRONTEND_URL: str = Field(default="http://localhost:3000", env="FRONTEND_URL")
    
    class Config:
        """Pydantic config."""
        env_file = ".env"
        case_sensitive = True
    
    @validator("ALLOWED_HOSTS", pre=True)
    def parse_hosts(cls, v):
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v
    
    @validator("CORS_ORIGINS", pre=True)
    def parse_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Convenience imports
settings = get_settings()
