# InboxGrove - Complete SaaS Platform Specification

## 🎯 Project Overview

**InboxGrove** (formerly MailScale) is a **high-growth SaaS platform** that sells cold email infrastructure. The platform is a direct competitor to Mailscale.ai with a focus on automation, deliverability, and ease of use.

**Core Value Proposition:**
- Generate SMTP inboxes in 60 seconds (vs. 10+ hours manual setup)
- 95-100% inbox placement guarantee
- 5x cheaper than Google Workspace
- 50x faster than manual DNS configuration

---

## 🏗️ Complete Architecture

### Frontend (React 18 + Vite)
Located in: `c:\Users\dchat\Documents\inboxgrove`

**Components:**
- Marketing landing page (Hero, Features, Pricing, Testimonials, FAQ)
- Interactive dashboard (real-time metrics, inbox management)
- Provisioning wizard (step-by-step infrastructure deployment)
- Billing dashboard (invoices, payment methods, usage)
- Authentication flows (signup, login, trial, payment)

**Built with:**
- React 18.2.0
- TypeScript 5.8.2
- Framer Motion (animations)
- Lucide React (icons)
- Tailwind CSS (styling)
- Stripe.js (payments)

---

### Backend (FastAPI + PostgreSQL)
Located in: `c:\Users\dchat\Documents\inboxgrove\backend`

**Architecture:**
```
├── API Layer (25+ endpoints)
│   ├── Authentication
│   ├── Billing & Subscriptions
│   ├── Domain Management
│   ├── Infrastructure Provisioning
│   └── Analytics & Monitoring
│
├── Service Layer (4 core services)
│   ├── SubscriptionService (trial, plans, limits)
│   ├── BillingService (Stripe integration)
│   ├── DomainService (Namecheap + Cloudflare)
│   └── ProvisioningService (SMTP inbox generation)
│
├── Data Layer (12 tables)
│   ├── Tenants (SaaS accounts)
│   ├── Users (team members)
│   ├── Domains (owned domains)
│   ├── Inboxes (SMTP users)
│   ├── Transactions (billing ledger)
│   └── 7 more supporting tables
│
├── Integration Layer
│   ├── Stripe (payments)
│   ├── Namecheap (domain registrar)
│   ├── Cloudflare (DNS)
│   ├── KumoMTA (SMTP relay)
│   └── SendGrid/Mailgun (transactional email)
│
└── Infrastructure
    ├── PostgreSQL (database)
    ├── Redis (cache + Celery broker)
    ├── Celery (background jobs)
    └── Docker Compose (local development)
```

**Built with:**
- FastAPI 0.104.1
- SQLAlchemy 2.0.23
- PostgreSQL 16
- Redis 7
- Celery 5.3.4
- Stripe SDK
- JWT authentication
- Pydantic (validation)

---

## 💰 Billing Model (Hybrid)

### Recurring (Subscriptions)

| Tier | Monthly | Annual | Domains | Inboxes | Support |
|------|---------|--------|---------|---------|---------|
| Trial | Free (7 days) | - | 1 | 5 | Limited |
| Starter | $97 | $970 | 10 | 50 | Email |
| Growth | $297 | $2,970 | 50 | 500 | Priority |
| Enterprise | $997 | $9,970 | Unlimited | Unlimited | Dedicated |

### One-Time (Domain Purchases)

- Domain registration: $8.99 - $12.99 (variable)
- Automatic DNS setup: Included
- Renewal: Automatic year 2+

**Billing Logic:**
```
Day 1-7:  Trial access (limited to 5 inboxes)
Day 8:    Auto-charge card for selected plan
Success:  Trial converted to subscription
Failed:   Retry day 9, 10; suspend if all fail
Upgrade:  Proration handled by Stripe
```

---

## 🔄 Core Workflows

### Workflow 1: New Account Signup

```
User fills form (company, email, password)
    ↓
POST /api/v1/auth/register
    ↓
Tenant created in database
    ↓
7-day trial auto-activated
    ↓
Stripe customer created (for future charges)
    ↓
JWT tokens returned (15-min access, 7-day refresh)
    ↓
Frontend redirects to dashboard
    ↓
User sees: "7 days free, then $97/month"
    ↓
Day 8: Automatic charge attempted
    ↓
Success: Trial converted, access continues
Failed:  Account suspended, payment email sent
```

**Key Methods:**
```python
SubscriptionService.create_trial(tenant, db)
BillingService.create_customer(tenant)
```

---

### Workflow 2: Domain Purchasing

```
User searches domain (GET /domains/search?domain=acme-corp.com)
    ↓
Namecheap API → Check availability + pricing
    ↓
Result: "acme-corp.com - Available - $8.99"
    ↓
User clicks "Buy Domain"
    ↓
POST /billing/domain-purchase-intent
    ↓
Stripe PaymentIntent created (client_secret returned)
    ↓
Frontend: Stripe.js confirmation (card details)
    ↓
On success:
    POST /domains/purchase (payment_intent_id)
        ↓
        Register with Namecheap API
        ↓
        Create Cloudflare zone
        ↓
        Add DNS records (A, MX, SPF, DKIM, DMARC)
        ↓
        Authorize in KumoMTA relay
        ↓
        Domain status: "Active"
    ↓
User can now create inboxes on this domain
```

**Key Methods:**
```python
DomainService.search_domain_availability(domain_name)
DomainService.purchase_domain(tenant, domain_name, db)
DomainService.configure_dns(domain, db)
DomainService.authorize_in_kumo(domain, db)
```

---

### Workflow 3: Provisioning Inboxes (The "Magic Button")

```
User enters provisioning wizard:
    - Domain: Select which domain
    - Count: How many inboxes (1-100)
    - Naming: Convention (sales, support, firstname, etc.)
    ↓
POST /api/v1/infrastructure/provision
{
    "domain_id": "uuid...",
    "inbox_count": 50,
    "naming_convention": "firstname"
}
    ↓
Backend validates:
    ✓ Plan allows 50 inboxes? (Growth plan: max 500)
    ✓ Tenant already has < 450? (500 - 50 = 450)
    ✓ Domain is active?
    ↓
Generate 50 credentials:
    sales@acme-corp.com: random 32-char password
    support@acme-corp.com: random 32-char password
    ...
    ↓
Bulk insert into database (atomic transaction)
    ↓
Hot-reload KumoMTA via HTTP API
    ↓
Update: Tenant.inboxes_count = 50
    ↓
Start Celery warmup tasks (AI conversation simulation)
    ↓
Return CSV with credentials:
    email, username, password, smtp_host, smtp_port, smtp_auth, smtp_tls
    sales@acme-corp.com, sales, PASSWORD123..., smtp.inboxgrove.com, 587, true, true
    ...
    ↓
User downloads CSV
    ↓
User imports into cold email tool (Clay, Apollo, etc.)
    ↓
Start sending with 95%+ deliverability
```

**Key Methods:**
```python
ProvisioningService.provision_inboxes(
    tenant_id, domain_id, inbox_count, naming_convention, db
)
```

---

## 🔒 Security Features

### 1. Rate Limiting (Anti-Spam)

```
Global limits per tenant:
- 60 requests per minute
- 1000 requests per hour

Enforced at middleware level:
- Tracked in Redis
- Returns 429 Too Many Requests if exceeded
```

### 2. The "Kill Switch" (Suspension System)

**When triggered:**
1. `Tenant.is_suspended = True`
2. All API requests return 403 Forbidden
3. KumoMTA config reloaded (removes domain relay)
4. Celery tasks skip this tenant
5. Audit logged with reason

**Suspension triggers:**
- 10+ spam complaints
- IP/domain blacklisted
- 3 failed payment attempts
- Manual flag by admin
- Terms violation

**Implementation:**
```python
# In get_current_tenant() dependency:
if tenant.is_suspended:
    raise HTTPException(status_code=403, detail="Account suspended")

# When suspending:
SubscriptionService.suspend_tenant(tenant, reason, db)
# Updates is_suspended flag, triggers KumoMTA reload
```

### 3. Authentication & JWT

```
Signup → Tokens returned:
- access_token: 15 minutes (for API calls)
- refresh_token: 7 days (to get new access token)

Each request includes:
Authorization: Bearer <access_token>

JWT payload:
{
    "tenant_id": "uuid...",
    "type": "access",
    "iat": 1703348912,  # Issued at
    "exp": 1703349812   # Expiration (iat + 15 min)
}

Verified on every API call by get_current_tenant() dependency
```

### 4. Rate Limiting Implementation

```python
class RateLimiter:
    @classmethod
    def check_rate_limit(cls, tenant_id: str) -> Tuple[bool, Optional[str]]:
        # Per-minute limit: 60
        recent_minute = count requests in last 60 seconds
        if recent_minute >= 60:
            return False, "Rate limit exceeded (per minute)"
        
        # Per-hour limit: 1000
        requests_hour = count requests in last 3600 seconds
        if requests_hour >= 1000:
            return False, "Rate limit exceeded (per hour)"
        
        return True, None

# Called in every request via get_current_tenant() dependency
allowed, error = RateLimiter.check_rate_limit(tenant.id)
if not allowed:
    raise HTTPException(status_code=429, detail=error)
```

---

## 📊 Database Schema

### Tenants
Root organization accounts
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    company_name VARCHAR(255),
    company_email VARCHAR(255) UNIQUE,
    subscription_tier ENUM('trial', 'starter', 'growth', 'enterprise'),
    subscription_status ENUM('trial', 'active', 'past_due', 'cancelled'),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    trial_started_at DATETIME,
    trial_ends_at DATETIME,
    trial_inbox_limit INTEGER,
    trial_domain_limit INTEGER,
    billing_cycle ENUM('monthly', 'yearly'),
    current_period_start DATETIME,
    current_period_end DATETIME,
    next_billing_date DATETIME,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT,
    domains_count INTEGER DEFAULT 0,
    inboxes_count INTEGER DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME
);
```

### Domains
Purchased domains
```sql
CREATE TABLE domains (
    id UUID PRIMARY KEY,
    tenant_id UUID FOREIGN KEY,
    domain_name VARCHAR(255),
    status ENUM('pending_purchase', 'pending_dns', 'dns_verified', 'active', 'suspended'),
    is_system_purchased BOOLEAN,
    registrar_provider VARCHAR(50),  -- 'namecheap'
    registrar_domain_id VARCHAR(255),
    cloudflare_zone_id VARCHAR(255),
    dns_verified_at DATETIME,
    purchase_price DECIMAL(10,2),
    purchase_date DATETIME,
    expiry_date DATETIME,
    kumo_authorized BOOLEAN,
    created_at DATETIME,
    updated_at DATETIME
);
```

### Inboxes
Individual SMTP email accounts
```sql
CREATE TABLE inboxes (
    id UUID PRIMARY KEY,
    tenant_id UUID FOREIGN KEY,
    domain_id UUID FOREIGN KEY,
    username VARCHAR(100),  -- 'sales', 'support', etc.
    password VARCHAR(255),  -- hashed
    full_email VARCHAR(255),  -- sales@domain.com
    status ENUM('pending', 'active', 'suspended'),
    smtp_host VARCHAR(255),
    smtp_port INTEGER,
    health_score FLOAT DEFAULT 50.0,  -- 0-100
    warmup_stage INTEGER DEFAULT 0,  -- 0-10
    warmup_started_at DATETIME,
    emails_sent_today INTEGER DEFAULT 0,
    emails_sent_this_month INTEGER DEFAULT 0,
    daily_limit INTEGER DEFAULT 40,
    monthly_limit INTEGER DEFAULT 1000,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    created_at DATETIME,
    updated_at DATETIME
);
```

### TransactionHistory
Complete financial ledger
```sql
CREATE TABLE transaction_history (
    id UUID PRIMARY KEY,
    tenant_id UUID FOREIGN KEY,
    transaction_type ENUM('subscription_charge', 'domain_purchase', 'refund'),
    description TEXT,
    amount INTEGER,  -- in cents
    currency VARCHAR(3),  -- 'USD'
    status VARCHAR(50),  -- 'pending', 'succeeded', 'failed'
    stripe_transaction_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    created_at DATETIME
);
```

---

## 🌐 API Endpoints Summary

### Authentication (3)
- `POST /api/v1/auth/register` - Create account + trial
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token

### Billing (6)
- `POST /api/v1/billing/checkout-session` - Create Stripe checkout
- `POST /api/v1/billing/domain-purchase-intent` - Start domain purchase
- `GET /api/v1/billing/usage` - Get usage stats
- `GET /api/v1/billing/subscription` - Get current subscription
- `POST /api/v1/billing/subscription/upgrade` - Upgrade plan
- `POST /api/v1/billing/subscription/cancel` - Cancel subscription

### Domains (6)
- `POST /api/v1/domains/search` - Search availability
- `POST /api/v1/domains/purchase` - Purchase domain
- `GET /api/v1/domains` - List domains
- `GET /api/v1/domains/{id}` - Get domain details
- `POST /api/v1/domains/{id}/suspend` - Suspend domain
- `DELETE /api/v1/domains/{id}` - Delete domain

### Infrastructure (6)
- `POST /api/v1/infrastructure/provision` - Provision inboxes ⭐
- `GET /api/v1/infrastructure/provision/csv` - Download inbox CSV
- `GET /api/v1/infrastructure/inboxes` - List inboxes
- `GET /api/v1/infrastructure/inboxes/{id}/credentials` - Get SMTP credentials
- `POST /api/v1/infrastructure/inboxes/{id}/suspend` - Suspend inbox
- `DELETE /api/v1/infrastructure/inboxes/{id}` - Delete inbox

### Analytics (3)
- `GET /api/v1/analytics/usage` - Usage dashboard data
- `GET /api/v1/analytics/billing-summary` - Billing summary
- `GET /api/v1/analytics/deliverability` - Deliverability metrics

---

## 🚀 Deployment

### Local Development

```bash
cd backend
docker-compose up -d

# Services:
# - API: http://localhost:8000
# - Docs: http://localhost:8000/docs
# - DB UI: http://localhost:8080
# - Redis UI: http://localhost:8081
```

### Production

```bash
# Build
docker build -t inboxgrove-api:v1.0.0 .

# Push to registry
docker push registry.company.com/inboxgrove-api:v1.0.0

# Deploy (Kubernetes, Docker Swarm, AWS ECS, etc.)
```

---

## 📈 Scalability

- **Stateless API:** Load balance across multiple instances
- **Database pooling:** 20 connections per instance
- **Redis caching:** Shared across instances
- **Async jobs:** Celery workers scale independently
- **CDN:** Frontend static assets

**Estimated capacity:**
- 1 API instance: ~500 req/sec
- 1 Celery worker: 100 tasks/min
- 1 PostgreSQL: 1000+ concurrent connections
- 1 Redis: 50,000 req/sec

---

## ✅ Checklist for Completion

### Backend
- ✅ FastAPI application setup
- ✅ SQLAlchemy models (12 tables)
- ✅ Database session management
- ✅ 4 core services (Subscription, Billing, Domain, Provisioning)
- ✅ 25+ API endpoints
- ✅ Stripe integration (checkout, payments, webhooks)
- ✅ Namecheap adapter (domain search/purchase)
- ✅ Cloudflare integration (DNS management)
- ✅ KumoMTA integration (SMTP relay)
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ Suspension system
- ✅ Error handling
- ✅ Docker Compose
- ✅ Documentation

### Frontend
- ✅ Landing page components
- ✅ Dashboard UI
- ✅ Provisioning wizard
- ✅ Billing dashboard
- ✅ Authentication flows
- ✅ Stripe.js integration
- ✅ Real-time metrics
- ✅ Responsive design
- ✅ Dark theme

### Infrastructure
- ✅ PostgreSQL schema
- ✅ Redis setup
- ✅ Celery configuration
- ✅ Docker Compose
- ✅ Environment configuration
- ✅ Requirements.txt

### Documentation
- ✅ Backend guide
- ✅ API reference
- ✅ Architecture overview
- ✅ Deployment guide
- ✅ Security documentation

---

## 📞 Key Contacts

- **Backend Team:** Handles FastAPI, databases, integrations
- **Frontend Team:** Handles React UI, real-time updates
- **DevOps Team:** Handles deployment, monitoring, scaling

---

## 🎓 Learning Resources

- FastAPI Docs: https://fastapi.tiangolo.com
- SQLAlchemy Docs: https://docs.sqlalchemy.org
- Stripe Docs: https://stripe.com/docs/api
- Celery Docs: https://docs.celeryproject.io
- React Docs: https://react.dev

---

**Status:** ✅ **PRODUCTION READY**

**Last Updated:** December 16, 2025

**Version:** 1.0.0

---

This completes the **InboxGrove SaaS Platform** - a fully-specified, production-grade backend with complete business logic, API endpoints, security features, and deployment infrastructure. The system is ready for integration with the frontend and deployment to production.
