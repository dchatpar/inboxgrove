# 🎨 InboxGrove - Visual Architecture & Flow Diagrams

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INBOXGROVE SAAS PLATFORM                           │
└─────────────────────────────────────────────────────────────────────────────┘

                              END USERS
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
            LANDING PAGE      DASHBOARD     MOBILE APP
           (Conversion)    (Management)   (Responsive)
                    │             │             │
                    └─────────────┼─────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │    FRONTEND LAYER          │
                    │  (React 18 + TypeScript)   │
                    │  ✅ Auth UI                 │
                    │  ✅ Dashboard               │
                    │  ✅ Billing UI              │
                    │  ✅ Mobile Responsive       │
                    └─────────────┬──────────────┘
                                  │
                         API CLIENT SERVICE
                    (services/apiClient.ts)
                    ├─ Auth endpoints (8)
                    ├─ Billing endpoints (14)
                    ├─ Domain endpoints (8)
                    ├─ Infrastructure (7)
                    └─ Analytics endpoints (7)
                                  │
                    ┌─────────────▼──────────────┐
                    │   BACKEND LAYER            │
                    │  (FastAPI + Python)        │
                    │                            │
                    │  ┌────────────────────┐   │
                    │  │ API Endpoints      │   │
                    │  │ (50+ endpoints)    │   │
                    │  └────────────────────┘   │
                    │  ┌────────────────────┐   │
                    │  │ Services           │   │
                    │  │ - Auth             │   │
                    │  │ - Billing          │   │
                    │  │ - Domain           │   │
                    │  │ - Provisioning     │   │
                    │  │ - Analytics        │   │
                    │  └────────────────────┘   │
                    │  ┌────────────────────┐   │
                    │  │ Integrations       │   │
                    │  │ - Stripe           │   │
                    │  │ - Namecheap        │   │
                    │  │ - Cloudflare       │   │
                    │  │ - KumoMTA          │   │
                    │  │ - SendGrid         │   │
                    │  └────────────────────┘   │
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────┼──────────────┐
                    │             │              │
          ┌─────────▼──────┐  ┌───▼────────┐  ┌─▼──────────┐
          │  PostgreSQL    │  │  Redis     │  │  Celery    │
          │  (Database)    │  │  (Cache)   │  │  (Tasks)   │
          │                │  │            │  │            │
          │  ✅ 12 Tables  │  │ ✅ Caching │  │ ✅ Warmup  │
          │  ✅ Audit Logs │  │ ✅ Queue   │  │ ✅ Emails  │
          │  ✅ Triggers   │  │            │  │ ✅ Health  │
          └────────────────┘  └────────────┘  └────────────┘
```

---

## 🔄 User Journey Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           USER JOURNEY: SIGNUP TO USAGE                     │
└────────────────────────────────────────────────────────────────────────────┘

    STEP 1: LANDING
    ┌─────────────────┐
    │ Visit Website   │ ──→ Landing Page (Hero, Features, Pricing)
    └────────┬────────┘
             │
             ▼
    STEP 2: SIGNUP
    ┌─────────────────────────────────────────┐
    │ Click "Get Started"                      │
    │ │                                        │
    │ ├─ Email: user@company.com              │
    │ ├─ Password: ••••••••                   │
    │ └─ Company: Acme Corp                   │
    └────────┬────────────────────────────────┘
             │
             ▼ POST /api/v1/auth/register
    ┌─────────────────────────────────────────┐
    │ Backend Creates:                         │
    │ ├─ User account                         │
    │ ├─ Tenant (company)                     │
    │ ├─ 7-day trial                          │
    │ └─ Stripe customer                      │
    └────────┬────────────────────────────────┘
             │
             ▼ Tokens + Trial Info
    ┌─────────────────────────────────────────┐
    │ Frontend Stores:                         │
    │ ├─ access_token (localStorage)          │
    │ ├─ refresh_token (localStorage)         │
    │ └─ user_data                            │
    └────────┬────────────────────────────────┘
             │
             ▼
    STEP 3: ONBOARDING
    ┌─────────────────────────────────────────┐
    │ Welcome Screen                           │
    │ "You have 7 days free access"           │
    │ [Button: Start Dashboard] or [Setup]    │
    └────────┬────────────────────────────────┘
             │
             ▼
    STEP 4: PURCHASE DOMAIN
    ┌──────────────────────────────────────────────────┐
    │ Domain Management Page                           │
    │ ├─ Search: "my-company.com"                     │
    │ ├─ Check Availability: ✓ Available - $8.99      │
    │ ├─ Click "Buy Domain"                           │
    │ └─ Payment Form                                 │
    │    ├─ Card: 4242 4242 4242 4242                 │
    │    ├─ [Pay Now]                                 │
    │    └─ Processing...                             │
    └────────┬─────────────────────────────────────────┘
             │
             ▼ POST /billing/domain-purchase-intent
    ┌──────────────────────────────────────────────────┐
    │ Backend:                                         │
    │ 1. Stripe PaymentIntent created                 │
    │ 2. Namecheap registration initiated             │
    │ 3. Cloudflare zone created                      │
    │ 4. DNS records configured                       │
    │ 5. KumoMTA authorized                           │
    │ Domain Status: ACTIVE ✓                         │
    └────────┬─────────────────────────────────────────┘
             │
             ▼
    STEP 5: PROVISION INBOXES
    ┌──────────────────────────────────────────────────┐
    │ Infrastructure Page                              │
    │ ├─ Domain: my-company.com ✓                     │
    │ ├─ Inbox Count: 50                              │
    │ ├─ Naming: firstname                            │
    │ └─ [Deploy Infrastructure]                      │
    └────────┬─────────────────────────────────────────┘
             │
             ▼ POST /api/v1/infrastructure/provision
    ┌──────────────────────────────────────────────────┐
    │ Backend (60 seconds):                            │
    │ 1. Generate 50 SMTP credentials                 │
    │ 2. Create in KumoMTA                            │
    │ 3. Configure IP rotation                        │
    │ 4. Start AI warmup (24/7)                       │
    │ 5. Initialize health monitoring                 │
    │ Status: ALL READY ✓                             │
    └────────┬─────────────────────────────────────────┘
             │
             ▼
    STEP 6: EXPORT & USE
    ┌──────────────────────────────────────────────────┐
    │ Dashboard                                        │
    │ ├─ Download credentials.csv                     │
    │ ├─ SMTP Server: smtp.inboxgrove.com            │
    │ ├─ Port: 587                                    │
    │ └─ 50 Inboxes Ready ✓                           │
    └────────┬─────────────────────────────────────────┘
             │
             ▼
    STEP 7: SEND COLD EMAILS
    ┌──────────────────────────────────────────────────┐
    │ User's Cold Email Tool (Clay, Apollo, etc)      │
    │ ├─ Import 50 inboxes                            │
    │ ├─ Configure campaign                           │
    │ ├─ Send 30 emails per inbox/day                 │
    │ └─ Monitor deliverability: 95%+ ✓              │
    └────────┬─────────────────────────────────────────┘
             │
             ▼
    STEP 8: DAY 8 - CONVERSION
    ┌──────────────────────────────────────────────────┐
    │ Backend Auto-Charge:                             │
    │ ├─ Trial expires ✓                              │
    │ ├─ Stripe charges card                          │
    │ │  - Plan: Professional ($79/month)             │
    │ │  - Status: SUCCESS ✓                          │
    │ └─ Subscription created                         │
    │                                                  │
    │ User sees:                                       │
    │ "Subscription Active! Next billing: Jan 16"     │
    └────────────────────────────────────────────────────┘

    ✓ COMPLETE FLOW: Signup → Trial → Domain → Inboxes → Emails → Payment
    ⏱ Total time: ~10 minutes
    📊 Conversion rate: 7-day trial converts when emails work
```

---

## 🏗️ Billing State Machine

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BILLING STATE FLOW DIAGRAM                            │
└─────────────────────────────────────────────────────────────────────────┘

                          NEW USER SIGNUP
                                │
                                ▼
                        ┌───────────────┐
                        │ TRIAL CREATED │ ← 7 days free
                        │ (Day 1)       │ ← All features
                        └───────┬───────┘   ← Inbox limit: 5
                                │           ← Domain limit: 1
                                │
                        Day 1-7: Trial Period
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                    ▼           ▼           ▼
              User Active  User Inactive  User Upgrades
              (Continue)   (Stops)        (Before Day 8)
                    │           │           │
                    └─────┬─────┘           │
                          │                 │
                    Day 8: Auto-Charge      │
                          │                 │
              ┌───────────┴────────────┬────┘
              │                        │
              ▼                        ▼
        Payment Intent Created   ┌──────────────┐
        from Stripe              │ SUBSCRIPTION │
              │                  │ ACTIVE       │
              │                  │ (Immediate)  │
              ▼                  └──────┬───────┘
        Charge Processing             │
        (Retry logic: up to 3x)        │
              │                   (Monthly or Yearly)
        ┌─────┴──────┐                │
        │            │                │
    SUCCESS      FAILED               │
        │            │                │
        ▼            ▼                │
    ┌─────────┐  ┌──────────┐         │
    │ACTIVE   │  │SUSPENDED │         │
    │(Billed) │  │(Failed)  │         │
    └────┬────┘  └──────────┘         │
         │                            │
         │  [User Action]             │
         │  ┌────────────────────┐    │
         │  │ Upgrade Plan    ────────▼────────────┐
         │  │ Downgrade Plan  ────────┐           │
         │  │ Change Cycle    ──────┐ │           │
         │  │ Cancel          ──┐   │ │           │
         │  │ Reactivate      ──┼───┼─┼───┐       │
         │  └────────────────────┘   │ │   │       │
         │                           │ │   │       │
    ┌────▼───────────────────────────▼─▼───▼───┐   │
    │        SUBSCRIPTION MANAGEMENT           │   │
    │                                          │   │
    │  • Upgrade: pro → enterprise (prorate)  │   │
    │  • Downgrade: enterprise → pro (prorate)│   │
    │  • Cancel: end at period (option)       │   │
    │  • Reactivate: restart billing           │   │
    │  • Change cycle: monthly ↔ yearly        │   │
    │                                          │   │
    │  Each action:                           │   │
    │  → New invoice generated                │   │
    │  → Proration calculated                 │   │
    │  → Stripe updated                       │   │
    │  → User notified (email)                │   │
    └──────────────┬───────────────────────────┘   │
                   │                               │
                   ▼                               │
            ┌──────────────┐                       │
            │ PAST_DUE     │ ← Payment failed      │
            │ (Suspended)  │ ← Retry: Day 9, 10   │
            └──────┬───────┘ ← Action: Reactivate │
                   │                               │
                   ├─ User pays → ACTIVE           │
                   │ User ignores → CANCELLED      │
                   │                               │
                   ▼                               │
            ┌──────────────┐                       │
            │ CANCELLED    │ ← No more charges    │
            │ (End of Arch)│ ← Can reactivate     │
            └──────────────┘ ← History kept       │
                               (Audit trail)

LEGEND:
  → = Automatic transition
  ─ = User-triggered transition
  ✓ = Success state
  ✗ = Error state
```

---

## 📱 Frontend Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND COMPONENT TREE                            │
└────────────────────────────────────────────────────────────────────────┘

App.tsx (Root)
│
├─ AuthProvider (Global State)
│  ├─ AppRouter
│  │  ├─ PUBLIC ROUTES
│  │  │  ├─ HomePage (Landing)
│  │  │  │  ├─ Navbar
│  │  │  │  ├─ Hero
│  │  │  │  ├─ SocialProof
│  │  │  │  ├─ Features
│  │  │  │  ├─ Pricing
│  │  │  │  ├─ FAQ
│  │  │  │  ├─ Testimonials
│  │  │  │  └─ Footer
│  │  │  │
│  │  │  └─ AuthPage (Login/Register)
│  │  │
│  │  ├─ PROTECTED ROUTES
│  │  │  ├─ ProtectedRoute (Auth Guard)
│  │  │  │  ├─ DashboardPage
│  │  │  │  │  ├─ DashboardEnhanced (Mobile Responsive)
│  │  │  │  │  │  ├─ MetricCard x4
│  │  │  │  │  │  ├─ HealthMatrix
│  │  │  │  │  │  └─ SystemLogs
│  │  │  │  │  │
│  │  │  │  │  ├─ DomainsPage
│  │  │  │  │  │  ├─ DomainSearch
│  │  │  │  │  │  ├─ DomainList
│  │  │  │  │  │  └─ DomainPurchase
│  │  │  │  │  │
│  │  │  │  │  ├─ InboxesPage
│  │  │  │  │  │  ├─ ProvisioningWizard
│  │  │  │  │  │  ├─ InboxTable
│  │  │  │  │  │  └─ CredentialsExport
│  │  │  │  │  │
│  │  │  │  │  ├─ AnalyticsPage
│  │  │  │  │  │  ├─ UsageChart
│  │  │  │  │  │  ├─ DeliverabilityMetrics
│  │  │  │  │  │  └─ HealthScores
│  │  │  │  │  │
│  │  │  │  │  └─ Sidebar
│  │  │  │  │
│  │  │  │  ├─ BillingPage
│  │  │  │  │  ├─ BillingDashboard
│  │  │  │  │  │  ├─ SubscriptionOverview
│  │  │  │  │  │  ├─ InvoiceHistory
│  │  │  │  │  │  ├─ PaymentMethods
│  │  │  │  │  │  └─ BillingSettings
│  │  │  │  │  │
│  │  │  │  │  └─ UpgradePage
│  │  │  │  │     ├─ PlanSelector
│  │  │  │  │     └─ PaymentForm
│  │  │  │  │
│  │  │  │  └─ OnboardingPage
│  │  │  │     ├─ PlanSelection
│  │  │  │     ├─ PaymentEntry
│  │  │  │     └─ Confirmation
│  │  │  │
│  │  │  └─ AccountPage
│  │  │     ├─ ProfileSettings
│  │  │     ├─ SecuritySettings
│  │  │     └─ Preferences
│  │  │
│  │  └─ NOT FOUND ROUTE
│  │     └─ 404Page

Shared Components:
  ├─ Navbar (All pages)
  ├─ Footer (All pages)
  ├─ ScrollProgress (All pages)
  ├─ StickyCTA (All pages, mobile)
  ├─ ErrorBoundary (Error handling)
  └─ LoadingSpinner (Loading states)

Context Providers:
  ├─ AuthContext
  ├─ SubscriptionContext (optional)
  └─ NotificationContext (optional)
```

---

## 🔌 API Integration Points

```
┌────────────────────────────────────────────────────────────────────────┐
│              FRONTEND → BACKEND API INTEGRATION POINTS                  │
└────────────────────────────────────────────────────────────────────────┘

FRONTEND                           API CLIENT                        BACKEND
(React)                      (services/apiClient.ts)            (FastAPI)
  │                                 │                                 │
  │ User Action                      │                                 │
  │────────────────┬────────────────▶│                                 │
  │                │   Method Call   │  HTTP Request                  │
  │                │                 ├────────────────────────────────▶│
  │                │                 │  POST /api/v1/auth/login       │
  │                │                 │  { email, password }           │
  │                │                 │                                 │
  │                │                 │  Backend Processing             │
  │                │                 │◀────────────────────────────────┤
  │                │  HTTP Response  │  200 OK                        │
  │                │  { access_token,│  { access_token,               │
  │                │    refresh_token│    refresh_token,              │
  │                │    user }       │    user_data }                 │
  │                │◀────────────────┤                                 │
  │ Update State   │                 │                                 │
  │◀───────────────┤                 │                                 │
  │  user =        │ Store Tokens    │                                 │
  │  subscription =│ in localStorage │                                 │
  │  isAuth = true │                 │                                 │
  │                │                 │                                 │
  │ Redirect       │                 │                                 │
  │ to Dashboard   │                 │                                 │
  │                │                 │                                 │

WORKFLOW FOR EACH API CALL:

1. Component calls method
   const response = await apiClient.login(email, password)

2. apiClient checks token
   ├─ Valid? → Add to headers
   └─ Expired? → Refresh first

3. Make HTTP request
   ├─ Timeout after 30s
   ├─ Set headers (auth, content-type)
   └─ Body as JSON

4. Handle response
   ├─ 200-299: Success
   │  └─ Transform & return data
   ├─ 401: Token expired
   │  └─ Refresh → Retry request
   ├─ 429: Rate limited
   │  └─ Retry with backoff
   └─ Other: Error
      └─ Return error message

5. Component gets response
   if (response.data) {
     // Success
   } else {
     // Error (response.error)
   }

ENDPOINT CATEGORIES:

Auth (8):
  POST   /auth/register          → Create account + trial
  POST   /auth/login             → Get tokens
  POST   /auth/refresh           → Refresh token
  POST   /auth/logout            → Blacklist token
  GET    /auth/me                → Get current user
  POST   /auth/verify-email      → Verify email
  POST   /auth/forgot-password   → Password reset request
  POST   /auth/reset-password    → Reset password

Billing (14):
  GET    /billing/subscription   → Get current subscription
  POST   /billing/subscription   → Create subscription
  PATCH  /billing/subscription/upgrade    → Upgrade plan
  PATCH  /billing/subscription/downgrade  → Downgrade plan
  POST   /billing/subscription/cancel     → Cancel subscription
  POST   /billing/subscription/reactivate → Reactivate
  POST   /billing/payment-methods         → Add card
  GET    /billing/payment-methods         → List cards
  PATCH  /billing/payment-methods/{id}    → Update card
  DELETE /billing/payment-methods/{id}    → Delete card
  GET    /billing/invoices                → List invoices
  GET    /billing/invoices/{id}           → Get invoice
  GET    /billing/invoices/{id}/pdf       → Download PDF
  POST   /billing/invoices/{id}/retry-payment → Retry

Domains (8):
  POST   /domains/search         → Search availability
  POST   /domains/purchase       → Purchase domain
  GET    /domains                → List domains
  GET    /domains/{id}           → Get domain details
  PATCH  /domains/{id}           → Update domain
  DELETE /domains/{id}           → Delete domain
  GET    /domains/{id}/dns-records → Get DNS records
  POST   /domains/{id}/verify-dns → Verify DNS

Infrastructure (7):
  POST   /infrastructure/provision       → Provision inboxes
  GET    /infrastructure/inboxes         → List inboxes
  GET    /infrastructure/inboxes/{id}    → Get inbox
  GET    /infrastructure/inboxes/{id}/credentials → Get SMTP
  PATCH  /infrastructure/inboxes/{id}    → Update inbox
  DELETE /infrastructure/inboxes/{id}    → Delete inbox
  GET    /infrastructure/inboxes/export-csv → Export

Analytics (7):
  GET    /analytics/usage        → Usage stats
  GET    /analytics/usage/domains/{id} → Domain usage
  GET    /analytics/usage/inboxes/{id} → Inbox usage
  GET    /analytics/billing-summary    → Billing metrics
  GET    /analytics/deliverability    → Deliverability metrics
  GET    /analytics/deliverability/domains/{id} → Domain metrics
  GET    /analytics/deliverability/health-scores → Health scores
```

---

## 🗄️ Database Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA (PostgreSQL)                         │
└────────────────────────────────────────────────────────────────────────┘

USERS TABLE
  ├─ id (UUID, PK)
  ├─ email (String, Unique)
  ├─ password_hash (String)
  ├─ is_verified (Boolean)
  ├─ created_at (DateTime)
  └─ updated_at (DateTime)

TENANTS TABLE (Multi-tenant)
  ├─ id (UUID, PK)
  ├─ user_id (FK → users)
  ├─ company_name (String)
  ├─ subscription_tier (Enum)
  ├─ stripe_customer_id (String)
  ├─ is_suspended (Boolean)
  ├─ created_at (DateTime)
  └─ updated_at (DateTime)

SUBSCRIPTIONS TABLE
  ├─ id (UUID, PK)
  ├─ tenant_id (FK → tenants)
  ├─ plan_id (String)
  ├─ status (Enum: active, cancelled, past_due)
  ├─ stripe_subscription_id (String)
  ├─ current_period_start (DateTime)
  ├─ current_period_end (DateTime)
  ├─ cancel_at_period_end (Boolean)
  ├─ created_at (DateTime)
  └─ updated_at (DateTime)

TRIAL_PERIODS TABLE
  ├─ id (UUID, PK)
  ├─ tenant_id (FK → tenants)
  ├─ started_at (DateTime)
  ├─ expires_at (DateTime)
  ├─ is_active (Boolean)
  ├─ plan_id (String)
  ├─ inbox_limit (Integer)
  ├─ domain_limit (Integer)
  ├─ created_at (DateTime)
  └─ updated_at (DateTime)

DOMAINS TABLE
  ├─ id (UUID, PK)
  ├─ tenant_id (FK → tenants)
  ├─ domain_name (String)
  ├─ status (Enum: pending, active, suspended)
  ├─ registrar_domain_id (String)
  ├─ cloudflare_zone_id (String)
  ├─ dns_verified_at (DateTime, Nullable)
  ├─ purchase_price (Decimal)
  ├─ kumo_authorized (Boolean)
  ├─ created_at (DateTime)
  └─ updated_at (DateTime)

INBOXES TABLE
  ├─ id (UUID, PK)
  ├─ tenant_id (FK → tenants)
  ├─ domain_id (FK → domains)
  ├─ username (String) [e.g., "sales"]
  ├─ password_hash (String)
  ├─ full_email (String) [e.g., "sales@domain.com"]
  ├─ status (Enum: active, suspended)
  ├─ health_score (Float, 0-100)
  ├─ warmup_stage (Integer, 0-10)
  ├─ emails_sent_today (Integer)
  ├─ emails_sent_this_month (Integer)
  ├─ daily_limit (Integer)
  ├─ monthly_limit (Integer)
  ├─ is_blacklisted (Boolean)
  ├─ created_at (DateTime)
  └─ updated_at (DateTime)

INVOICES TABLE
  ├─ id (UUID, PK)
  ├─ tenant_id (FK → tenants)
  ├─ invoice_number (String, Unique)
  ├─ amount (Decimal)
  ├─ currency (String, default: "USD")
  ├─ status (Enum: pending, paid, failed, overdue)
  ├─ stripe_invoice_id (String)
  ├─ issued_at (DateTime)
  ├─ due_date (DateTime)
  ├─ paid_at (DateTime, Nullable)
  ├─ created_at (DateTime)
  └─ updated_at (DateTime)

TRANSACTIONS TABLE
  ├─ id (UUID, PK)
  ├─ tenant_id (FK → tenants)
  ├─ invoice_id (FK → invoices, Nullable)
  ├─ transaction_type (Enum: charge, refund, adjustment)
  ├─ amount (Decimal)
  ├─ currency (String)
  ├─ status (Enum: pending, succeeded, failed)
  ├─ stripe_charge_id (String, Nullable)
  ├─ created_at (DateTime)
  └─ updated_at (DateTime)

PAYMENT_METHODS TABLE
  ├─ id (UUID, PK)
  ├─ tenant_id (FK → tenants)
  ├─ stripe_payment_method_id (String)
  ├─ brand (String) [e.g., "visa"]
  ├─ last4 (String)
  ├─ exp_month (Integer)
  ├─ exp_year (Integer)
  ├─ is_default (Boolean)
  ├─ created_at (DateTime)
  └─ updated_at (DateTime)

AUDIT_LOGS TABLE
  ├─ id (UUID, PK)
  ├─ tenant_id (FK → tenants, Nullable)
  ├─ user_id (FK → users, Nullable)
  ├─ action (String) [e.g., "login", "purchase", "suspend"]
  ├─ resource_type (String)
  ├─ resource_id (String)
  ├─ details (JSON)
  ├─ ip_address (String)
  ├─ created_at (DateTime)
  └─ updated_at (DateTime)

USAGE_STATS TABLE
  ├─ id (UUID, PK)
  ├─ tenant_id (FK → tenants)
  ├─ date (Date)
  ├─ inboxes_created (Integer)
  ├─ domains_added (Integer)
  ├─ emails_sent (Integer)
  ├─ api_calls (Integer)
  ├─ created_at (DateTime)
  └─ updated_at (DateTime)

RELATIONSHIPS:
  users ──── tenants ──── subscriptions
            │           └─ invoices ──── transactions
            │
            ├── trial_periods
            │
            ├── domains ──── inboxes
            │
            ├── payment_methods
            │
            └── audit_logs

INDEXES:
  ✓ user(email) - Unique, for login
  ✓ tenant(user_id) - Foreign key
  ✓ subscription(tenant_id, status) - Query active
  ✓ domain(tenant_id, status) - List user domains
  ✓ inbox(tenant_id, domain_id) - Query inboxes
  ✓ invoice(tenant_id, issued_at) - Invoice history
  ✓ transaction(tenant_id, created_at) - Transaction history
  ✓ audit_logs(tenant_id, action, created_at) - Audit trail
```

---

## ✅ Deployment Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT STACK                                   │
└────────────────────────────────────────────────────────────────────────┘

LOCAL DEVELOPMENT
  ┌──────────────────┐
  │  docker-compose  │
  ├──────────────────┤
  │ ✓ FastAPI        │ (port 8000)
  │ ✓ PostgreSQL     │ (port 5432)
  │ ✓ Redis          │ (port 6379)
  │ ✓ Celery Worker  │ (background tasks)
  │ ✓ Celery Beat    │ (scheduled tasks)
  └──────────────────┘

PRODUCTION DEPLOYMENT
  ┌──────────────────────────────────────────────────────────┐
  │                     LOAD BALANCER                         │
  │                    (Nginx/HAProxy)                        │
  └────────┬────────────────────────────────────────────────┘
           │
      ┌────┴─────────────────────────────┬─────────────────┐
      │                                  │                 │
      ▼                                  ▼                 ▼
  ┌──────────────┐              ┌──────────────┐     ┌─────────────┐
  │  API Pod 1   │              │  API Pod 2   │     │  API Pod N  │
  │ (FastAPI)    │              │ (FastAPI)    │     │ (FastAPI)   │
  └──────┬───────┘              └──────┬───────┘     └────┬────────┘
         │                             │                  │
         └─────────────────┬───────────┴──────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
      ┌─────────┐   ┌──────────────┐   ┌────────┐
      │PostgreSQL   │     Redis    │    │Celery  │
      │Database │   │(Cache/Queue) │   │Workers │
      │Cluster  │   │  Cluster     │   │Cluster │
      └─────────┘   └──────────────┘   └────────┘
          ▲
          │ (Data Persistence)
          │
      ┌─────────┐
      │ Backup  │
      │ Storage │
      └─────────┘

EXTERNAL SERVICES
  ├─ Stripe (Payment processing)
  ├─ Namecheap (Domain registration)
  ├─ Cloudflare (DNS management)
  ├─ SendGrid (Email delivery)
  ├─ KumoMTA (SMTP relay)
  ├─ Sentry (Error tracking)
  └─ CloudWatch (Logging)

FRONTEND DEPLOYMENT
  ┌────────────────────┐
  │  Static Hosting    │
  │  (Vercel/Netlify)  │
  ├────────────────────┤
  │ ✓ React SPA        │
  │ ✓ Optimized build  │
  │ ✓ CDN cached       │
  │ ✓ Auto-deployed    │
  └────────────────────┘
          │
          ▼
  ┌────────────────────┐
  │   API Gateway      │
  │  (api.inboxgrove.com)
  └────────────────────┘
          │
          ▼
  (Routes to backend pods)
```

---

**All diagrams created to visualize system architecture, data flow, and user journey.**

*Print or reference these diagrams during implementation for quick understanding.*
