# InboxGrove Backend Architecture & Implementation Guide

## 🏗️ Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── config.py                 # Environment configuration
│   ├── main.py                   # FastAPI app entry point
│   │
│   ├── database/
│   │   ├── models.py             # SQLAlchemy ORM models (12 tables)
│   │   ├── session.py            # Database connection pooling
│   │   └── migrations/           # Alembic migration scripts
│   │
│   ├── services/                 # Business logic layer
│   │   ├── subscription_service.py    # Trial, plans, limits, suspension
│   │   ├── billing_service.py         # Stripe integration
│   │   ├── domain_service.py          # Domain purchasing & DNS
│   │   ├── provisioning_service.py    # SMTP inbox generation ("Magic Button")
│   │   └── registrar_service.py       # Namecheap adapter
│   │
│   ├── integrations/             # Third-party API clients
│   │   ├── cloudflare_client.py       # DNS management
│   │   ├── kumo_client.py             # SMTP relay control
│   │   └── stripe_client.py           # Payment processing
│   │
│   ├── api/v1/
│   │   ├── auth.py               # Authentication endpoints
│   │   ├── billing.py            # Subscription & checkout
│   │   ├── domains.py            # Domain management
│   │   ├── infrastructure.py     # Provisioning ("Magic Button")
│   │   └── analytics.py          # Usage & metrics
│   │
│   ├── tasks/                    # Celery background jobs
│   │   ├── provisioning_tasks.py # Async domain setup
│   │   ├── billing_tasks.py      # Invoice generation, renewal
│   │   └── monitoring_tasks.py   # Health checks, deliverability
│   │
│   ├── utils/
│   │   ├── security.py           # Rate limiting, "Kill Switch", JWT
│   │   ├── email_service.py      # Transactional emails
│   │   └── monitoring.py         # Metrics export
│   │
│   └── middleware/
│       ├── auth.py               # JWT validation
│       └── error_handler.py      # Global error handling
│
├── tests/
│   ├── test_auth.py
│   ├── test_billing.py
│   ├── test_provisioning.py
│   └── test_integration.py
│
├── migrations/                   # Database migration scripts
├── .env.example                  # Configuration template
├── requirements.txt              # Python dependencies
├── docker-compose.yml            # Local development setup
└── README.md

```

---

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Clone and navigate
cd backend

# Copy environment
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 2. Install Dependencies

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install packages
pip install -r requirements.txt
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb inboxgrove_db

# Run migrations (or create tables directly)
alembic upgrade head

# Or use SQLAlchemy to create all tables:
python -c "from app.database.models import init_db; from app.database.session import engine; init_db(engine)"
```

### 4. Run Development Server

```bash
# Start FastAPI server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# API will be available at: http://localhost:8000
# Docs at: http://localhost:8000/docs (Swagger UI)
# OpenAPI at: http://localhost:8000/openapi.json
```

---

## 🔑 Core Features Implementation

### Feature 1: Smart Trial System

**How it works:**
1. User signs up → `POST /auth/register`
2. Tenant account created with 7-day trial
3. SetupIntent created (collects card without charge)
4. Day 8: Automatic charge attempted
5. On success: Trial converted to subscription

**Key Methods:**
```python
SubscriptionService.create_trial(tenant, db)          # Auto-create on signup
SubscriptionService.check_trial_expired(tenant, db)   # Check if expired
SubscriptionService.get_trial_days_remaining(tenant)  # For dashboard
SubscriptionService.upgrade_subscription(...)         # Convert to paid
```

**Database:**
- `Tenant.trial_started_at` - Start date
- `Tenant.trial_ends_at` - End date (started_at + 7 days)
- `Tenant.trial_inbox_limit` - Max 5 inboxes during trial
- `Tenant.trial_domain_limit` - Max 1 domain during trial
- `Tenant.trial_converted` - Flag when upgraded to paid

---

### Feature 2: Hybrid Billing (Subscription + One-Time)

**Recurring Charges:**
- Monthly subscription fee (Starter $97, Growth $297, Enterprise $997)
- Handled via Stripe Subscription API

**One-Time Charges (Domain Purchasing):**
- User searches domain → `POST /domains/search`
- User buys domain → `POST /billing/domain-purchase-intent`
- Stripe PaymentIntent created for domain cost
- Frontend uses Stripe.js to confirm payment
- On success: Domain registered via Namecheap API
- Domain provisioning triggered (async task)

**Key Methods:**
```python
BillingService.create_checkout_session(...)   # Subscription signup
BillingService.charge_for_domain(...)         # One-time domain purchase
BillingService.handle_webhook(...)            # Stripe webhooks
```

---

### Feature 3: Domain Purchasing & Provisioning

**User Flow:**
1. Search domain → `POST /domains/search` → Namecheap API
2. Buy domain → `POST /domains/purchase` (payment already processed)
3. Register with registrar → `Namecheap.register_domain()`
4. Configure DNS → `Cloudflare.create_zone()` + add records
5. Authorize in KumoMTA → `KumoMTA.add_relay()`
6. Ready to create inboxes

**Key Methods:**
```python
DomainService.search_domain_availability(...)  # Namecheap API
DomainService.purchase_domain(...)             # Register + configure
DomainService.configure_dns(...)               # Cloudflare setup
DomainService.authorize_in_kumo(...)           # SMTP relay auth
```

---

### Feature 4: The "Magic Button" - Provisioning

**Endpoint:** `POST /infrastructure/provision`

**What happens in 60 seconds:**
1. Validate plan limits (can't exceed inboxes/domains)
2. Generate 50 inbox credentials (username + 32-char password)
3. Insert all into database in single transaction
4. Hot-reload KumoMTA via HTTP API
5. Start warmup process (Celery task)
6. Return CSV with credentials

**Implementation:**
```python
ProvisioningService.provision_inboxes(
    tenant_id="uuid",
    domain_id="uuid",
    inbox_count=50,
    naming_convention="firstname"  # sales, support, etc.
)
```

**Response:**
```json
{
  "inboxes_created": 50,
  "domain": "acme-corp.com",
  "csv_data": "email,username,password,..."
}
```

**Database:**
- Inserts 50 Inbox records
- Updates `Tenant.inboxes_count`
- Creates audit log entries
- Transaction safety ensures atomicity

---

## 🔒 Security & Anti-Abuse

### Rate Limiting
```python
# Per tenant, enforced at request level
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_REQUESTS_PER_HOUR=1000

# Enforced by RateLimiter middleware
# Checks in get_current_tenant() dependency
```

### The "Kill Switch" - Suspension System

When a tenant is suspended (abuse detected):

1. **Flag Set:** `Tenant.is_suspended = True`
2. **API Blocked:** All requests return 403 Forbidden
3. **KumoMTA Updated:** Config reloaded to exclude domains
4. **Background Jobs:** Paused via Celery
5. **Webhooks:** Stopped processing

**Suspension Reasons:**
- `spam_complaint`: 10+ complaints from ISPs
- `blacklisted`: Domain/IP blacklisted
- `payment_failed`: 3 failed charge attempts
- `terms_violation`: Manual flag by admin

**Implementation:**
```python
SubscriptionService.suspend_tenant(tenant, reason, db)
# Sets is_suspended=True, triggers KumoMTA reload
```

---

## 📊 Monitoring & Observability

### Prometheus Metrics
- `request_duration_seconds` - API latency
- `requests_total` - Total requests (labeled by endpoint)
- `stripe_payment_success_total` - Payment tracking
- `provisioning_inboxes_total` - Provisioning volume

### Sentry Error Tracking
- Exceptions logged automatically
- Releases tracked
- Performance monitoring

### Audit Logging
```python
# Every important action logged to audit_logs table
# Users, domains, inboxes, billing events
AuditLog(
    tenant_id=tenant.id,
    action="inbox_provisioned",
    resource_type="inbox",
    resource_id=inbox.id,
    changes={"status": "pending" -> "active"}
)
```

---

## 🧪 Testing

### Unit Tests
```bash
pytest tests/test_subscription_service.py -v
pytest tests/test_billing_service.py -v
pytest tests/test_provisioning_service.py -v
```

### Integration Tests
```bash
# Test full signup → trial → payment → provisioning flow
pytest tests/test_integration.py -v
```

### Load Testing
```bash
# Test provisioning performance
locust -f tests/locustfile.py
```

---

## 📝 Database Schema Overview

### Core Tables

**Tenants** (root accounts)
- id, company_name, company_email
- subscription_tier, subscription_status
- stripe_customer_id, stripe_subscription_id
- trial_starts_at, trial_ends_at
- is_suspended, suspension_reason
- domains_count, inboxes_count

**Users** (team members)
- id, tenant_id, email, password_hash
- is_admin, is_verified, 2fa_enabled

**Domains**
- id, tenant_id, domain_name, status
- registrar_provider, registrar_domain_id
- cloudflare_zone_id, dns_records (JSONB)
- purchase_price, purchase_date, expiry_date
- kumo_authorized

**Inboxes** (SMTP users)
- id, tenant_id, domain_id
- username, password, full_email
- status, health_score, warmup_stage
- emails_sent_today, emails_sent_this_month
- daily_limit, monthly_limit

**TransactionHistory** (ledger)
- id, tenant_id, transaction_type
- amount, currency, status
- stripe_transaction_id
- created_at

**PaymentMethods**
- id, tenant_id
- stripe_payment_method_id
- card_brand, card_last_four, card_exp
- is_default, is_active

---

## 🐳 Docker Deployment

### Local Development

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- Redis cache
- FastAPI server (port 8000)
- Celery worker
- Nginx reverse proxy

### Production Deployment

```bash
# Build production image
docker build -t inboxgrove-api:latest .

# Push to registry
docker tag inboxgrove-api:latest registry/inboxgrove-api:latest
docker push registry/inboxgrove-api:latest

# Deploy to Kubernetes or Docker Swarm
kubectl apply -f k8s/deployment.yaml
```

---

## 🔌 Webhook Integration

### Stripe Webhooks to Handle

```python
@app.post("/webhooks/stripe")
async def stripe_webhook(request: Request, db: Session):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")
    
    event = BillingService.handle_webhook(payload, sig_header)
    
    if event["type"] == "charge.succeeded":
        # Update invoice status, send receipt
        pass
    
    elif event["type"] == "charge.failed":
        # Notify user, trigger retry
        pass
    
    elif event["type"] == "customer.subscription.deleted":
        # Suspend tenant, pause domains
        pass
```

---

## 📈 Scaling Considerations

### Horizontal Scaling
- Stateless API design (JWT tokens)
- Redis for session sharing
- Database connection pooling (20 connections)

### Performance Optimization
- Database indexes on tenant_id, domain_id, status, created_at
- Query optimization (eager loading)
- Caching with Redis (1-hour TTL)

### Background Job Queue
- Celery for long-running tasks:
  - Domain registration
  - DNS verification
  - Warmup campaigns
  - Invoice generation
  - Health monitoring

---

## 🚨 Error Handling

### Standard Response Format

**Success:**
```json
{
  "status": "success",
  "data": {...}
}
```

**Error:**
```json
{
  "status": "error",
  "error_code": "DOMAIN_LIMIT_EXCEEDED",
  "message": "Domain limit (10) reached. Upgrade to add more domains.",
  "details": {...}
}
```

### HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request (validation)
- 401: Unauthorized
- 403: Forbidden (suspended)
- 404: Not Found
- 409: Conflict (duplicate email)
- 429: Too Many Requests (rate limited)
- 500: Server Error

---

## 🎯 Next Steps

1. **Setup:** Follow Quick Start section
2. **Database:** Run migrations
3. **Testing:** Run test suite
4. **Development:** Start local server
5. **Integration:** Connect frontend
6. **Deployment:** Follow Docker deployment

---

## 📞 Support

For issues or questions:
- Check GitHub Issues
- Review documentation
- Contact team@inboxgrove.com
