"""
InboxGrove API Specification v1.0
Production-grade REST API for cold email infrastructure management

Base URL: https://api.inboxgrove.com/api/v1
Authentication: Bearer <JWT_TOKEN>
Rate Limit: 1000 req/min, burst 2000
"""

# ============================================================================
# 1. AUTHENTICATION ENDPOINTS
# ============================================================================

"""
POST /auth/register
Register new user account

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}

Response (201 Created):
{
  "user_id": "uuid-xxx",
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_expires_in": 900,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "subscription": {
    "tier": "free",
    "max_domains": 3,
    "max_inboxes": 50
  }
}

Errors:
- 400: Invalid email format
- 409: Email already registered
"""

"""
POST /auth/login
Authenticate user and get access token

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_expires_in": 900,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "uuid-xxx",
    "email": "user@example.com",
    "subscription_tier": "pro",
    "created_at": "2025-01-15T10:30:00Z"
  }
}

Errors:
- 401: Invalid credentials
- 429: Too many login attempts
"""

"""
POST /auth/refresh
Refresh access token using refresh token

Request:
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_expires_in": 900
}

Errors:
- 401: Refresh token invalid or expired
"""

# ============================================================================
# 2. DOMAIN MANAGEMENT ENDPOINTS
# ============================================================================

"""
POST /domains/add
Add domain to account (existing or new)

Request:
{
  "domain_name": "sales-outreach.com",
  "source": "existing",  # existing | registration
  "cloudflare_api_token": "abc123...",
  "cloudflare_zone_id": "zone-id-xyz",
  "tracking_domain": "track.sales-outreach.com",
  "dmarc_policy": "none"  # none | quarantine | reject
}

Response (202 Accepted):
{
  "domain_id": "uuid-xxx",
  "domain_name": "sales-outreach.com",
  "status": "pending",
  "cloudflare_zone_id": "zone-id-xyz",
  "dns_records": {
    "spf": "v=spf1 ip4:123.45.67.89 -all",
    "dkim_selector": "mail2025",
    "dkim_public_key": "v=DKIM1; k=rsa; p=MIGfMA0BgQDx...",
    "dmarc": "v=DMARC1; p=none; rua=mailto:admin@..."
  },
  "propagation_status": "checking",
  "estimated_ready_time": "2025-12-16T15:30:00Z",
  "webhook_url": "https://api.inboxgrove.com/webhooks/domain-ready/uuid-xxx"
}

Errors:
- 400: Invalid domain format
- 409: Domain already exists
- 422: Cloudflare API token invalid
- 429: Domain limit exceeded
"""

"""
GET /domains/{domain_id}
Get domain details and status

Response (200 OK):
{
  "domain_id": "uuid-xxx",
  "domain_name": "sales-outreach.com",
  "status": "active",
  "dns_verified": true,
  "dns_verified_at": "2025-12-16T15:00:00Z",
  "cloudflare_zone_id": "zone-id-xyz",
  "dkim_selector": "mail2025",
  "dmarc_policy": "none",
  "inboxes_count": 50,
  "health": {
    "avg_health_score": 98.5,
    "avg_delivery_rate": 98.2,
    "total_emails_sent": 4250,
    "total_bounces": 75,
    "bounce_rate": 1.8
  },
  "created_at": "2025-12-10T09:00:00Z",
  "updated_at": "2025-12-16T15:00:00Z"
}

Errors:
- 404: Domain not found
"""

"""
GET /domains
List all user domains with pagination

Query Parameters:
- page: int = 1
- per_page: int = 20 (max 100)
- status: string = all | active | pending | failed
- sort_by: string = created_at | name | status

Response (200 OK):
{
  "domains": [
    {
      "domain_id": "uuid-xxx",
      "domain_name": "sales-outreach.com",
      "status": "active",
      "inboxes_count": 50,
      "health_score": 98.5,
      "created_at": "2025-12-10T09:00:00Z"
    },
    {
      "domain_id": "uuid-yyy",
      "domain_name": "outreach2.com",
      "status": "pending",
      "inboxes_count": 0,
      "health_score": null,
      "created_at": "2025-12-16T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 2,
    "total_pages": 1
  }
}
"""

"""
DELETE /domains/{domain_id}
Delete domain and all associated inboxes (irreversible)

Request:
{
  "confirm": true,
  "reason": "optional reason for deletion"
}

Response (200 OK):
{
  "domain_id": "uuid-xxx",
  "deleted_at": "2025-12-16T16:00:00Z",
  "inboxes_deleted": 50,
  "data_retention": "30 days"
}

Errors:
- 404: Domain not found
- 409: Domain has active campaigns
"""

# ============================================================================
# 3. INBOX MANAGEMENT ENDPOINTS (CRITICAL)
# ============================================================================

"""
POST /inboxes/bulk
Create multiple inboxes at once (THE CORE FEATURE)

Request:
{
  "domain_id": "uuid-xxx",
  "quantity": 50,
  "naming_scheme": "random",  # random | firstname_lastname | numbered
  "daily_limit": 40,
  "enable_warmup": true,
  "warmup_start_date": "2025-12-17T18:00:00Z"
}

Response (200 OK):
{
  "created_count": 50,
  "inboxes": [
    {
      "inbox_id": "uuid-aaa",
      "email": "john.smith@sales-outreach.com",
      "password": "SecureRandom123!aBcDeFg",
      "smtp_host": "mail.sales-outreach.com",
      "smtp_port": 587,
      "smtp_username": "john.smith@sales-outreach.com",
      "imap_host": "mail.sales-outreach.com",
      "imap_port": 993,
      "imap_username": "john.smith@sales-outreach.com",
      "daily_limit": 40,
      "health_score": 100,
      "status": "active",
      "created_at": "2025-12-16T16:05:00Z"
    },
    ... (49 more)
  ],
  "export_csv_url": "https://api.inboxgrove.com/exports/bulk-50-abc123.csv",
  "warmup_schedule": {
    "starts_at": "2025-12-17T18:00:00Z",
    "ready_date": "2025-12-31T00:00:00Z",
    "expected_daily_sends": [2, 5, 12, 25, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40],
    "total_warmup_emails": 427
  }
}

Errors:
- 400: Invalid quantity (min 1, max 1000 per request)
- 404: Domain not found
- 409: Domain not verified
- 429: Daily limit exceeded
- 422: Insufficient subscription quota
"""

"""
GET /inboxes/{inbox_id}/health
Get detailed health and reputation metrics

Response (200 OK):
{
  "inbox_id": "uuid-xxx",
  "email": "john.smith@sales-outreach.com",
  "status": "active",
  "health_score": 94.2,
  "health_grade": "A",  # A (95-100) | B (85-94) | C (75-84) | F (<75)
  "last_health_check": "2025-12-16T15:30:00Z",
  "metrics": {
    "total_sent": 120,
    "total_delivered": 118,
    "delivery_rate": 98.3,
    "opens": 28,
    "open_rate": 23.7,
    "replies": 6,
    "reply_rate": 5.1,
    "bounces": 2,
    "bounce_rate": 1.7,
    "complaints": 0,
    "complaint_rate": 0.0,
    "spam_rate": 0.0,
    "last_send": "2025-12-16T14:22:00Z"
  },
  "alerts": [
    {
      "type": "low_reply_rate",
      "severity": "warning",  # info | warning | critical
      "message": "Reply rate (5.1%) is below 7% target",
      "action": "Consider increasing personalization or testing new subjects"
    }
  ],
  "recommendations": [
    "Increase subject line personalization (+15% expected reply rate)",
    "Add 2-hour delay between sends (+5% deliverability)",
    "Test different send times (early morning performs best)"
  ]
}

Errors:
- 404: Inbox not found
"""

"""
POST /inboxes/export
Generate credential export for Instantly.ai or Smartlead

Request:
{
  "mailbox_ids": ["uuid-xxx", "uuid-yyy", "uuid-zzz"],
  "format": "instantly_csv",  # instantly_csv | smartlead_csv | reply_csv
  "include_passwords": true,
  "expiry_hours": 24
}

Response (200 OK):
{
  "export_id": "uuid-export-xxx",
  "format": "instantly_csv",
  "file_url": "https://api.inboxgrove.com/exports/inboxgrove-instantly-20251216.csv",
  "expires_at": "2025-12-17T16:30:00Z",
  "rows": 3,
  "columns": [
    "Email", "Password", "SMTP_Host", "SMTP_Port", "SMTP_Username",
    "IMAP_Host", "IMAP_Port", "IMAP_Username", "Daily_Limit"
  ],
  "preview": [
    {
      "Email": "john.smith@sales-outreach.com",
      "Password": "SecureRandom123!aBcDeFg",
      "SMTP_Host": "mail.sales-outreach.com",
      "SMTP_Port": 587,
      "SMTP_Username": "john.smith@sales-outreach.com",
      "IMAP_Host": "mail.sales-outreach.com",
      "IMAP_Port": 993,
      "IMAP_Username": "john.smith@sales-outreach.com",
      "Daily_Limit": 40
    }
  ]
}

Errors:
- 404: One or more inboxes not found
- 410: Export expired
"""

# ============================================================================
# 4. OAUTH & ACCOUNT INTEGRATION ENDPOINTS
# ============================================================================

"""
POST /oauth/connect
Connect Gmail or Outlook account as additional sender

Request:
{
  "provider": "google",  # google | microsoft
  "auth_code": "4/0AX4XfWh1DknRwZ...",
  "scopes": ["https://www.googleapis.com/auth/gmail.send"],
  "label": "Primary Gmail Account"
}

Response (200 OK):
{
  "oauth_account_id": "uuid-oauth-xxx",
  "provider": "google",
  "email": "user@gmail.com",
  "status": "connected",
  "token_expires_at": "2025-12-23T16:30:00Z",
  "ready_to_send": true,
  "usage": {
    "daily_quota": 10000,
    "used_today": 245,
    "remaining": 9755
  }
}

Errors:
- 400: Invalid auth code
- 403: Missing required scopes
"""

"""
GET /oauth/accounts
List all connected OAuth accounts

Response (200 OK):
{
  "accounts": [
    {
      "oauth_account_id": "uuid-oauth-xxx",
      "provider": "google",
      "email": "user@gmail.com",
      "status": "connected",
      "connected_at": "2025-12-10T09:00:00Z",
      "token_expires_at": "2025-12-23T16:30:00Z",
      "last_used": "2025-12-16T14:22:00Z",
      "usage": {
        "daily_quota": 10000,
        "used_today": 245
      }
    }
  ]
}
"""

# ============================================================================
# 5. HEALTH & MONITORING ENDPOINTS
# ============================================================================

"""
GET /health
System health check

Response (200 OK):
{
  "status": "healthy",
  "timestamp": "2025-12-16T16:30:00Z",
  "components": {
    "api": "operational",
    "database": "operational",
    "redis": "operational",
    "kumomta": "operational",
    "cloudflare_api": "operational"
  },
  "metrics": {
    "api_response_time_ms": 45,
    "database_connections": 8,
    "active_warmup_campaigns": 127,
    "pending_dns_checks": 3
  }
}
"""

"""
GET /inboxes
List user inboxes with advanced filtering

Query Parameters:
- page: int = 1
- per_page: int = 20 (max 100)
- domain_id: string (filter by domain)
- status: string = all | active | warming | paused | blacklisted
- health_score_min: float = 0-100
- health_score_max: float = 0-100
- sort_by: string = created_at | health_score | email

Response (200 OK):
{
  "inboxes": [
    {
      "inbox_id": "uuid-aaa",
      "email": "john.smith@sales-outreach.com",
      "domain_id": "uuid-xxx",
      "status": "active",
      "health_score": 94.2,
      "daily_limit": 40,
      "emails_sent_today": 38,
      "total_sent": 120,
      "delivery_rate": 98.3,
      "reply_rate": 5.1,
      "created_at": "2025-12-16T10:00:00Z",
      "last_used": "2025-12-16T14:22:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 250,
    "total_pages": 13
  },
  "aggregates": {
    "total_inboxes": 250,
    "active": 248,
    "warming": 2,
    "paused": 0,
    "blacklisted": 0,
    "avg_health_score": 96.8,
    "total_sent_24h": 9847,
    "total_delivered_24h": 9652,
    "avg_delivery_rate": 98.0
  }
}
"""

# ============================================================================
# 6. WARMUP CAMPAIGN ENDPOINTS
# ============================================================================

"""
POST /warmup/start
Start warmup campaign for specific inboxes

Request:
{
  "mailbox_ids": ["uuid-xxx", "uuid-yyy"],
  "schedule": "aggressive",  # conservative | standard | aggressive
  "strategy": "default",  # default | ai_replies | custom
  "ai_replies_enabled": true
}

Response (200 OK):
{
  "warmup_id": "uuid-warmup-xxx",
  "mailbox_count": 2,
  "schedule": "aggressive",
  "strategy": "default",
  "estimated_ready_date": "2025-12-30T00:00:00Z",
  "campaigns": [
    {
      "mailbox_id": "uuid-xxx",
      "campaign_day": 1,
      "scheduled_sends": 2,
      "schedule": [
        "2025-12-17T09:00:00Z",
        "2025-12-17T14:00:00Z"
      ]
    }
  ]
}
"""

# ============================================================================
# ERROR RESPONSES (Standard Format)
# ============================================================================

"""
All errors follow this format:

{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "field_name",
      "issue": "specific issue description"
    },
    "request_id": "uuid-xxx",
    "timestamp": "2025-12-16T16:30:00Z"
  }
}

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 202: Accepted (async operation)
- 400: Bad Request (validation error)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict (e.g., duplicate domain)
- 422: Unprocessable Entity
- 429: Too Many Requests (rate limit)
- 500: Internal Server Error
"""

# ============================================================================
# RATE LIMITING
# ============================================================================

"""
Rate limits are applied per API token:
- Standard: 1000 requests/minute
- Burst: 2000 requests (10 seconds)

Response Headers:
- X-RateLimit-Limit: 1000
- X-RateLimit-Remaining: 987
- X-RateLimit-Reset: 1702816200

If rate limited (429):
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retry_after": 30
  }
}
"""

# ============================================================================
# PAGINATION
# ============================================================================

"""
All list endpoints support pagination:

Query Parameters:
- page: int (default 1)
- per_page: int (default 20, max 100)

Response:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 250,
    "total_pages": 13,
    "has_next": true,
    "has_prev": false
  }
}
"""
