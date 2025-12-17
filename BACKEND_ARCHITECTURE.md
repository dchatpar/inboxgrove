# InboxGrove Backend Architecture
## Technical Design Document (TDD)

**Version:** 1.0  
**Date:** December 2025  
**Status:** Production-Ready Specification

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Core Modules](#core-modules)
4. [Database Schema](#database-schema)
5. [API Specification](#api-specification)
6. [Security & Compliance](#security--compliance)
7. [Deployment & Scaling](#deployment--scaling)

---

## Executive Summary

**InboxGrove** is a high-performance, self-hosted cold email infrastructure platform that enables users to deploy 50+ authenticated inboxes in under 60 seconds.

### Key Differentiators vs. Mailscale
- **Built-in Warmup Engine**: No external tool dependency
- **Hybrid Account Support**: Gmail/Outlook + Generated Inboxes
- **Self-Hosted Option**: Full control over data and compliance
- **Dynamic SMTP**: KumoMTA reads credentials from Redis in real-time
- **Open Integrations**: One-click export to Instantly, Smartlead, Reply.io

### Core Value Prop
- **60-Second Deployment**: From domain → 50 inboxes with full DNS authentication
- **98%+ Deliverability**: AI-powered warmup, reputation monitoring
- **Enterprise Security**: SOC 2 ready, encrypted credentials, audit logs
- **Cost Efficiency**: $2.50/inbox/month vs. $6-12/inbox (Google Workspace)

---

## System Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        InboxGrove SaaS                          │
│  Frontend (React) | Auth Service | Dashboard                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
        ┌───────────────┐ ┌──────────┐ ┌──────────────┐
        │   FastAPI     │ │ Celery   │ │ KumoMTA      │
        │ API Gateway   │ │ Workers  │ │ SMTP Engine  │
        └───────────────┘ └──────────┘ └──────────────┘
                │              │              │
        ┌───────┴──────────────┼──────────────┴──────┐
        │                      │                      │
        ▼                      ▼                      ▼
    ┌─────────────┐    ┌─────────────┐    ┌──────────────────┐
    │ PostgreSQL  │    │ Redis       │    │ Cloudflare API   │
    │ (Relational)│    │ (Cache+PQ)  │    │ (DNS Manager)    │
    └─────────────┘    └─────────────┘    └──────────────────┘
```

### Microservices Topology

1. **API Service** (FastAPI)
   - REST endpoints for domain, inbox, subscription management
   - Authentication & authorization
   - Real-time health monitoring

2. **Worker Service** (Celery + Redis)
   - Background tasks: DNS propagation checks, warmup scheduling
   - Email sending (warmup program)
   - Reputation scoring and auto-repair

3. **SMTP Service** (KumoMTA)
   - Handles SMTP auth via Redis lookup
   - TLS enforcement
   - Bounce handling and feedback loops

4. **DNS Service** (Cloudflare Integration)
   - Automated SPF/DKIM/DMARC injection
   - Health monitoring and propagation tracking

---

## Core Modules

### Module 1: Domain Orchestrator

**Responsibility**: Automate domain registration and DNS configuration

#### Workflow
```
User Input: Domain (existing or new)
    ↓
[DomainManager]
    ├─ Check if domain exists (Namecheap API if new)
    ├─ Add to Cloudflare (via API)
    ├─ Generate DKIM Keypair (RSA-2048)
    ├─ Inject DNS Records:
    │  ├─ A Record (Tracking Server)
    │  ├─ MX Record (KumoMTA Load Balancer)
    │  ├─ SPF (v=spf1 ip4:X.X.X.X -all)
    │  ├─ DKIM (Public Key in TXT)
    │  └─ DMARC (p=none → p=quarantine)
    ├─ Wait for DNS Propagation
    └─ Store credentials in encrypted DB
```

#### Key Classes
- **DomainManager**: Orchestrator
- **CloudflareManager**: DNS API wrapper
- **DNSValidator**: Health checks

### Module 2: Inbox Generator & KumoMTA Control Plane

**Responsibility**: Create and authenticate unlimited inboxes dynamically

#### Workflow
```
POST /api/v1/inboxes/bulk
├─ Quantity: 50
└─ Domain: "example-cold.com"
    ↓
[InboxGenerator]
    ├─ Generate 50 random usernames (from dictionary)
    ├─ Generate secure passwords (bcrypt hash)
    ├─ Create DB records (Mailbox table)
    ├─ Push to Redis (KumoMTA datasource)
    │  └─ Key: "kumo:mailbox:{domain}:{username}"
    │  └─ Value: {"password_hash": "...", "daily_limit": 40}
    ├─ KumoMTA hot-loads Redis key
    └─ Return credentials CSV
```

#### KumoMTA Integration Strategy

Instead of static `kumo.conf`, KumoMTA queries Redis:

```lua
-- kumo.conf (simplified)
local redis = require "redis"

function auth_check(domain, username, password)
    local r = redis.connect("redis:6379")
    local key = "kumo:mailbox:" .. domain .. ":" .. username
    local stored = r:get(key)
    
    if stored then
        return bcrypt.verify(password, stored.password_hash)
    end
    return false
end
```

### Module 3: Integrator (Export to Instantly/Smartlead)

**Responsibility**: Generate standardized credential exports

#### CSV Format (Instantly.ai compatible)
```
Email,Password,SMTP_Host,SMTP_Port,SMTP_Username,IMAP_Host,IMAP_Port,IMAP_Username,Daily_Limit
john.smith@example-cold.com,SecurePass123!,mail.example-cold.com,587,john.smith@example-cold.com,mail.example-cold.com,993,john.smith@example-cold.com,40
```

### Module 4: Hybrid OAuth & Legacy Connectors

**Responsibility**: Support Gmail/Outlook accounts alongside generated inboxes

#### OAuth2 Flow
```
User clicks "Connect Gmail"
    ↓
[Google OAuth2 Provider]
    ├─ Request auth code
    ├─ Exchange for refresh token
    ├─ Store encrypted in DB
    └─ Add to sender pool (unified)
    
[Sending Layer]
    ├─ Route based on domain/preference
    └─ Use Gmail API or OAuth SMTP
```

### Module 5: Automated Warmup Engine

**Responsibility**: Build sender reputation without external tools

#### Warmup Strategy
```
Day 1: 2 emails/inbox
Day 2: 5 emails/inbox
Day 3: 12 emails/inbox
...
Day 14: 40 emails/inbox (ready for campaigns)

[Warmup Tasks]
├─ Schedule send times (9am, 2pm, 5pm EST)
├─ Generate realistic subjects (via LLM or templates)
├─ Send between tenant domains
├─ Track opens/clicks
├─ Monitor inbox placement
└─ Auto-repair on issues
```

#### Reputation Scoring
```
Health Score = (Delivery Rate * 0.40) + 
               (Open Rate * 0.30) + 
               (Reply Rate * 0.20) +
               (Complaint Rate * -0.10)

Thresholds:
├─ > 95% = "Excellent"
├─ 85-95% = "Good"
├─ 75-85% = "Fair" (pause campaigns)
└─ < 75% = "Poor" (auto-repair triggered)
```

---

## Database Schema

### Core Tables

#### users
```sql
id (UUID, PK)
email (VARCHAR, UNIQUE)
password_hash (VARCHAR, bcrypt)
subscription_tier (ENUM: free, pro, enterprise)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### domains
```sql
id (UUID, PK)
user_id (UUID, FK → users)
domain_name (VARCHAR, UNIQUE)
status (ENUM: pending, active, failed)
cloudflare_zone_id (VARCHAR)
cloudflare_account_id (VARCHAR)
dkim_private_key (BYTEA, encrypted)
dkim_public_key (TEXT)
spf_record (TEXT)
dmarc_policy (ENUM: none, quarantine, reject)
verified_at (TIMESTAMP)
created_at (TIMESTAMP)
```

#### mailboxes
```sql
id (UUID, PK)
domain_id (UUID, FK → domains)
user_id (UUID, FK → users)
username (VARCHAR)
password_hash (VARCHAR, bcrypt)
daily_limit (INT, default 40)
emails_sent_today (INT, default 0)
last_reset_date (DATE)
health_score (FLOAT, 0-100)
status (ENUM: active, warming, paused, blacklisted)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### dkim_keys
```sql
id (UUID, PK)
domain_id (UUID, FK → domains)
private_key (BYTEA, encrypted with AES-256)
public_key (TEXT)
selector (VARCHAR, e.g., "mail2025")
created_at (TIMESTAMP)
rotated_at (TIMESTAMP)
```

#### oauth_accounts
```sql
id (UUID, PK)
user_id (UUID, FK → users)
provider (ENUM: google, microsoft, custom)
account_email (VARCHAR)
refresh_token (VARCHAR, encrypted)
access_token (VARCHAR, encrypted)
token_expires_at (TIMESTAMP)
created_at (TIMESTAMP)
```

#### warmup_campaigns
```sql
id (UUID, PK)
mailbox_id (UUID, FK → mailboxes)
campaign_day (INT, 1-14)
scheduled_sends (INT)
actual_sends (INT)
opens (INT)
replies (INT)
bounces (INT)
status (ENUM: pending, running, completed)
created_at (TIMESTAMP)
```

#### audit_logs
```sql
id (UUID, PK)
user_id (UUID, FK → users)
action (VARCHAR)
resource_type (VARCHAR)
resource_id (UUID)
status (ENUM: success, failure)
metadata (JSONB)
created_at (TIMESTAMP)
```

---

## API Specification

### Top 5 Critical Endpoints

#### 1. POST /api/v1/domains/add
**Create or add a domain to the system**

```json
Request:
{
  "domain_name": "sales-outreach.com",
  "cloudflare_api_token": "...",
  "cloudflare_zone_id": "...",
  "tracking_domain": "track.sales-outreach.com",
  "dmarc_policy": "none"
}

Response (202 Accepted):
{
  "domain_id": "uuid-xxx",
  "status": "pending",
  "dns_records": {
    "spf": "v=spf1 ip4:123.45.67.89 -all",
    "dkim_selector": "mail2025",
    "dkim_public_key": "v=DKIM1; k=rsa; p=MIGfMA0BgQDx...",
    "dmarc": "v=DMARC1; p=none; rua=mailto:..."
  },
  "propagation_status": "checking",
  "estimated_ready_time": "2025-12-16T15:30:00Z"
}
```

#### 2. POST /api/v1/inboxes/bulk
**Generate multiple inboxes in one call**

```json
Request:
{
  "domain_id": "uuid-xxx",
  "quantity": 50,
  "naming_scheme": "random",
  "daily_limit": 40,
  "enable_warmup": true
}

Response (200 OK):
{
  "created_count": 50,
  "inboxes": [
    {
      "inbox_id": "uuid-aaa",
      "email": "john.smith@sales-outreach.com",
      "password": "SecureRandom123!",
      "smtp_host": "mail.sales-outreach.com",
      "smtp_port": 587,
      "imap_host": "mail.sales-outreach.com",
      "imap_port": 993,
      "daily_limit": 40,
      "health_score": 100,
      "status": "active"
    },
    ...
  ],
  "export_csv_url": "https://api.inboxgrove.com/exports/bulk-50-abc.csv",
  "warmup_schedule": {
    "starts_at": "2025-12-16T18:00:00Z",
    "ready_date": "2025-12-30T00:00:00Z"
  }
}
```

#### 3. GET /api/v1/inboxes/{inbox_id}/health
**Check reputation and health score**

```json
Response (200 OK):
{
  "inbox_id": "uuid-xxx",
  "email": "john.smith@sales-outreach.com",
  "health_score": 94.2,
  "status": "active",
  "metrics": {
    "total_sent": 120,
    "total_delivered": 118,
    "delivery_rate": 98.3,
    "open_rate": 23.7,
    "reply_rate": 5.1,
    "bounce_rate": 1.7,
    "complaint_rate": 0.0,
    "last_send": "2025-12-16T14:22:00Z"
  },
  "alerts": [
    {
      "type": "low_reply_rate",
      "severity": "warning",
      "message": "Reply rate below 5% - consider pausing"
    }
  ],
  "recommendations": [
    "Increase subject line personalization",
    "Add 2-hour delay between sends"
  ]
}
```

#### 4. POST /api/v1/inboxes/export
**Generate credential export for Instantly/Smartlead**

```json
Request:
{
  "mailbox_ids": ["uuid-xxx", "uuid-yyy", ...],
  "format": "instantly_csv",
  "include_passwords": true
}

Response (200 OK):
{
  "export_id": "uuid-export-xxx",
  "format": "instantly_csv",
  "file_url": "https://api.inboxgrove.com/exports/inboxgrove-instant-export-abc.csv",
  "expires_at": "2025-12-17T16:30:00Z",
  "rows": 50,
  "columns": ["Email", "Password", "SMTP_Host", "SMTP_Port", "SMTP_Username", "IMAP_Host", "IMAP_Port", "IMAP_Username", "Daily_Limit"]
}
```

#### 5. POST /api/v1/oauth/connect
**Connect Gmail or Outlook account**

```json
Request:
{
  "provider": "google",
  "auth_code": "4/0AX4XfWh...",
  "scope": "https://www.googleapis.com/auth/gmail.send"
}

Response (200 OK):
{
  "oauth_account_id": "uuid-oauth-xxx",
  "provider": "google",
  "email": "user@gmail.com",
  "status": "connected",
  "token_expires_at": "2025-12-17T16:30:00Z",
  "ready_to_send": true
}
```

---

## Security & Compliance

### Encryption Strategy

- **At-Rest**: AES-256-GCM for sensitive fields (DKIM private keys, OAuth tokens, passwords)
- **In-Transit**: TLS 1.3 for all API/SMTP connections
- **Key Management**: Hashicorp Vault or AWS KMS for key rotation

### Authentication & Authorization

- **API Tokens**: JWT with 15-minute expiry + refresh tokens (7 days)
- **RBAC**: User → Domain → Mailbox permissions model
- **Rate Limiting**: 1000 req/min per API token (burst: 2000)

### Compliance

- **SOC 2 Type II**: Audit logs, activity tracking
- **GDPR**: Data retention policies, right-to-deletion
- **CAN-SPAM**: Unsubscribe header injection
- **DKIM/SPF/DMARC**: Industry-standard email authentication

### Error Handling & Fault Tolerance

```python
# Example: Cloudflare API failure retry
@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=2, max=60),
    reraise=True
)
async def update_cloudflare_dns_records(domain_id):
    """Retry with exponential backoff"""
    pass

# Fallback: If Cloudflare API is down, queue task for retry
try:
    await cloudflare_manager.add_spf_record(domain)
except CloudflareAPIError as e:
    logger.error(f"Cloudflare API failed: {e}")
    await redis_queue.enqueue(
        "retry_cloudflare_dns",
        domain_id=domain.id,
        retry_count=3,
        eta=datetime.now() + timedelta(minutes=5)
    )
```

---

## Deployment & Scaling

### Deployment Architecture

```
┌─────────────────┐
│  Docker Swarm   │
│  or Kubernetes  │
└─────────────────┘
        │
    ┌───┴───┬───────┬──────────┐
    ▼       ▼       ▼          ▼
 [API]  [Worker] [KumoMTA]  [Nginx]
 x3     x2       x2         x1
```

### Horizontal Scaling Considerations

- **API Service**: Stateless, scales horizontally (load balancer)
- **Celery Workers**: Scale based on queue depth
- **KumoMTA**: Multiple instances behind TCP load balancer
- **PostgreSQL**: Read replicas for dashboards, primary for writes
- **Redis**: Redis Cluster for high availability

### Performance Targets

- **API Response Time**: < 200ms (p99)
- **Inbox Generation**: 50 inboxes in < 5 seconds
- **DNS Propagation Check**: < 30 seconds average
- **Warmup Email Send**: 1000+ emails/minute per KumoMTA instance

---

## Development Roadmap

### Phase 1 (MVP - 4 weeks)
- [x] Domain Orchestrator (Cloudflare integration)
- [x] Inbox Generator (bulk creation)
- [x] Basic API endpoints
- [x] KumoMTA integration

### Phase 2 (4 weeks)
- [ ] Built-in warmup engine
- [ ] Health scoring & monitoring
- [ ] OAuth2 (Gmail/Outlook)
- [ ] Reputation auto-repair

### Phase 3 (4 weeks)
- [ ] Advanced analytics dashboard
- [ ] AI-powered reply generation
- [ ] Custom integrations API
- [ ] Enterprise features (SSO, audit logs)

---

## References

- **KumoMTA Docs**: https://docs.kumomta.com
- **Cloudflare API**: https://developers.cloudflare.com/api
- **FastAPI**: https://fastapi.tiangolo.com
- **Celery**: https://docs.celeryproject.io
- **SQLAlchemy**: https://docs.sqlalchemy.org
