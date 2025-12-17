"""
InboxGrove Backend - Project Structure Reference
This file documents the complete directory layout for the backend system.
"""

# ============================================================================
# BACKEND PROJECT STRUCTURE
# ============================================================================

backend/
├── docker-compose.yml              # Orchestration: FastAPI, PostgreSQL, Redis, KumoMTA
├── Dockerfile                      # FastAPI container
├── Dockerfile.kumo                 # KumoMTA container
├── .env.example                    # Environment variables template
├── requirements.txt                # Python dependencies
│
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI app initialization
│   ├── config.py                   # Settings (Pydantic BaseSettings)
│   ├── security.py                 # JWT, encryption, RBAC
│   ├── dependencies.py             # FastAPI dependency injection
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── domains.py          # Domain orchestration endpoints
│   │   │   ├── inboxes.py          # Inbox generation & management
│   │   │   ├── mailboxes.py        # Mailbox CRUD operations
│   │   │   ├── oauth.py            # OAuth2 (Gmail/Outlook)
│   │   │   ├── health.py           # Health checks & metrics
│   │   │   ├── exports.py          # CSV export endpoints
│   │   │   ├── warmup.py           # Warmup campaign endpoints
│   │   │   └── auth.py             # Authentication endpoints
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                 # User model (SQLAlchemy)
│   │   ├── domain.py               # Domain model + methods
│   │   ├── mailbox.py              # Mailbox model + methods
│   │   ├── oauth_account.py        # OAuth accounts
│   │   ├── warmup_campaign.py      # Warmup campaigns
│   │   ├── audit_log.py            # Audit logging
│   │   └── subscription.py         # Subscription tiers
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── domain.py               # Pydantic request/response schemas
│   │   ├── inbox.py
│   │   ├── mailbox.py
│   │   ├── oauth.py
│   │   ├── warmup.py
│   │   └── export.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── domain_service.py       # Domain orchestration logic
│   │   ├── inbox_generator.py      # Bulk inbox creation
│   │   ├── cloudflare_manager.py   # Cloudflare API wrapper
│   │   ├── kumo_controller.py      # KumoMTA integration
│   │   ├── oauth_service.py        # Gmail/Outlook OAuth
│   │   ├── warmup_engine.py        # Warmup logic
│   │   ├── health_monitor.py       # Health scoring
│   │   ├── dns_validator.py        # DNS propagation checks
│   │   └── export_service.py       # CSV export generation
│   │
│   ├── workers/
│   │   ├── __init__.py
│   │   ├── celery_app.py           # Celery configuration
│   │   ├── dns_tasks.py            # DNS verification tasks
│   │   ├── warmup_tasks.py         # Warmup scheduling
│   │   ├── health_tasks.py         # Health monitoring
│   │   └── repair_tasks.py         # Auto-repair logic
│   │
│   ├── integrations/
│   │   ├── __init__.py
│   │   ├── namecheap.py            # Domain registration API
│   │   ├── cloudflare.py           # Cloudflare API client
│   │   ├── google_oauth.py         # Google OAuth2
│   │   ├── microsoft_oauth.py      # Microsoft OAuth2
│   │   └── redis_client.py         # Redis connection pool
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── crypto.py               # AES-256 encryption utilities
│   │   ├── validators.py           # Email, domain validation
│   │   ├── generators.py           # Username/password generation
│   │   ├── csv_builder.py          # CSV export builders
│   │   ├── logger.py               # Structured logging
│   │   └── metrics.py              # Prometheus metrics
│   │
│   └── database/
│       ├── __init__.py
│       ├── base.py                 # SQLAlchemy declarative base
│       ├── session.py              # DB session factory
│       └── migrations/             # Alembic migrations
│           ├── alembic.ini
│           ├── env.py
│           ├── versions/
│           │   └── 001_initial.py  # Initial schema
│           └── script.py.mako
│
├── kumo/
│   ├── kumo.conf                   # KumoMTA configuration
│   ├── redis_datasource.lua        # Lua script for Redis auth
│   ├── tls/
│   │   ├── cert.pem               # TLS certificates
│   │   └── key.pem
│   └── init.sh                     # KumoMTA startup script
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py                 # Pytest configuration
│   ├── test_domains.py
│   ├── test_inboxes.py
│   ├── test_cloudflare.py
│   ├── test_kumo.py
│   ├── test_oauth.py
│   └── fixtures/
│       ├── __init__.py
│       └── mock_data.py            # Test fixtures
│
├── scripts/
│   ├── init_db.py                  # Database initialization
│   ├── seed_data.py                # Dev data seeding
│   ├── migrate.sh                  # Run migrations
│   └── deploy.sh                   # Deployment script
│
└── logs/
    └── .gitkeep

# ============================================================================
# KEY FILES EXPLAINED
# ============================================================================

docker-compose.yml
    ├─ FastAPI service (port 8000)
    ├─ PostgreSQL service (port 5432)
    ├─ Redis service (port 6379)
    ├─ KumoMTA service (port 25, 587, 993)
    ├─ Celery worker service
    └─ Celery beat service (scheduler)

kumo.conf
    ├─ SMTP listener configuration
    ├─ TLS/SSL settings
    ├─ Redis datasource for dynamic auth
    ├─ Traffic shaping and rate limiting
    └─ Bounce handling and feedback loops

cloudflare_manager.py
    ├─ add_spf_record()              # Create SPF TXT record
    ├─ add_dkim_record()             # Create DKIM TXT record
    ├─ add_dmarc_record()            # Create DMARC TXT record
    ├─ add_mx_record()               # Set MX record
    ├─ verify_propagation()          # Check DNS propagation
    └─ error_handling()              # Retry logic

inbox_generator.py
    ├─ generate_usernames()          # Create realistic names
    ├─ generate_passwords()          # Secure random passwords
    ├─ bulk_create_inboxes()         # Create 50+ simultaneously
    └─ hot_load_to_redis()           # Update KumoMTA datasource

celery_app.py (workers)
    ├─ dns_check_task               # Verify DNS propagation
    ├─ warmup_send_task             # Send warmup emails
    ├─ health_score_task            # Calculate health scores
    └─ repair_task                  # Auto-repair blacklisted

# ============================================================================
# ENVIRONMENT CONFIGURATION (.env)
# ============================================================================

# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/inboxgrove
SQLALCHEMY_ECHO=False

# Redis
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# Cloudflare
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ZONE_ID=your_zone_id_here
CLOUDFLARE_ACCOUNT_EMAIL=admin@example.com

# KumoMTA
KUMOMTA_API_URL=http://kumo:8008
KUMOMTA_AUTH_ENDPOINT=http://api:8000/api/v1/kumo/auth

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_secret

# Security
SECRET_KEY=your-super-secret-key-change-in-production
ENCRYPTION_KEY=your-aes-256-key-32-bytes
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15

# Logging
LOG_LEVEL=INFO
SENTRY_DSN=https://...

# API Settings
API_HOST=0.0.0.0
API_PORT=8000
WORKERS=4
