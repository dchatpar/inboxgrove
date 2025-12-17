# Backend APIs Required for Provisioning Wizard to Work

The frontend provisioning wizard needs these backend endpoints to be fully functional. Here's what's needed:

---

## 🔐 **Authentication Headers (All Requests)**

Every API call must include:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

The `access_token` is returned from `/api/v1/auth/trial/verify-otp` and stored in localStorage.

---

## ✅ **Required API Endpoints**

### **1. Trial Status Check**
**GET** `/api/v1/trial/status`

Returns current trial information to verify user is still in trial period.

**Response:**
```json
{
  "active": true,
  "daysLeft": 6,
  "plan": "professional",
  "expiresAt": "2025-12-23T14:30:00Z",
  "plan_limits": {
    "max_inboxes": 500,
    "max_domains": 50
  }
}
```

**Status Codes:**
- `200` - Trial is active
- `403` - Trial expired (user cannot provision)
- `401` - Unauthorized (no valid token)

---

### **2. List User's Domains**
**GET** `/api/v1/domains`

Get all domains owned by the user (for domain dropdown).

**Response:**
```json
{
  "domains": [
    {
      "id": "domain_abc123",
      "name": "acme-corp.com",
      "status": "active",
      "dns_configured": true,
      "created_at": "2025-12-16T08:00:00Z"
    },
    {
      "id": "domain_xyz789",
      "name": "sales-team.io",
      "status": "active",
      "dns_configured": true,
      "created_at": "2025-12-15T10:30:00Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized

---

### **3. Register New Domain**
**POST** `/api/v1/domains/register`

Register a new domain with the registrar (Namecheap).

**Request:**
```json
{
  "domain": "acme-corp.com"
}
```

**Response:**
```json
{
  "domain_id": "domain_abc123",
  "domain": "acme-corp.com",
  "status": "registered",
  "cost": 9.99,
  "auto_renews": true
}
```

**Status Codes:**
- `201` - Domain registered successfully
- `400` - Domain unavailable or invalid format
- `402` - Payment failed (Stripe)
- `401` - Unauthorized

**Notes:**
- Should automatically charge user's card (Stripe)
- Should auto-configure DNS (Cloudflare)
- Takes 1-2 minutes for DNS to propagate

---

### **4. Provision Inboxes (The "Magic Button")**
**POST** `/api/v1/infrastructure/provision`

Create SMTP inboxes on a domain.

**Request:**
```json
{
  "domain_id": "domain_abc123",
  "inbox_count": 50,
  "naming_convention": "firstname"
}
```

**Response:**
```json
{
  "inboxes_created": 50,
  "domain": "acme-corp.com",
  "csv_data": "email,username,password,smtp_host,smtp_port\nsales@acme-corp.com,sales,PASSWORD123,smtp.inboxgrove.com,587\n...",
  "deployment_id": "deploy_xyz789",
  "status": "provisioned",
  "next_steps": [
    "Download credentials CSV",
    "Add credentials to email client",
    "Start sending emails"
  ]
}
```

**Status Codes:**
- `201` - Inboxes created
- `400` - Inbox count exceeds plan limit
- `404` - Domain not found
- `402` - Plan limit exceeded
- `401` - Unauthorized / Trial expired

**Notes:**
- **CRITICAL:** Must verify trial is still active (daysLeft > 0)
- Must verify inbox count doesn't exceed plan limits:
  - Starter: max 50 inboxes
  - Professional: max 500 inboxes
  - Enterprise: unlimited
- Should trigger async Celery tasks:
  - DNS verification
  - SMTP container creation
  - Warmup initialization
  - Email notification to user

---

### **5. List Inboxes**
**GET** `/api/v1/infrastructure/inboxes`

Get all inboxes created by user.

**Query Parameters:**
- `?domain_id=xyz` - Filter by domain (optional)
- `?status=active` - Filter by status (optional)

**Response:**
```json
{
  "inboxes": [
    {
      "id": "inbox_123",
      "email": "sales@acme-corp.com",
      "domain": "acme-corp.com",
      "status": "active",
      "health_score": 98,
      "daily_sent": 25,
      "daily_limit": 40,
      "created_at": "2025-12-16T10:00:00Z"
    }
  ],
  "total": 50,
  "status_breakdown": {
    "active": 48,
    "warming": 2,
    "suspended": 0
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized

---

### **6. Download Inboxes CSV**
**GET** `/api/v1/infrastructure/provision/csv`

Download all inboxes with SMTP credentials as CSV.

**Response:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="inboxes.csv"

email,username,password,smtp_host,smtp_port,smtp_auth,smtp_tls
sales@acme-corp.com,sales,***HIDDEN***,smtp.inboxgrove.com,587,true,true
support@acme-corp.com,support,***HIDDEN***,smtp.inboxgrove.com,587,true,true
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized

**IMPORTANT:** Never return actual passwords! Use vault/secrets manager.

---

### **7. Get Deployment Status (Optional but Recommended)**
**GET** `/api/v1/infrastructure/deployment/{deployment_id}`

Check provisioning progress in real-time.

**Response:**
```json
{
  "deployment_id": "deploy_xyz789",
  "status": "in_progress",
  "progress": 75,
  "logs": [
    "[10:00] Verified domain ownership",
    "[10:01] Configured SPF record",
    "[10:02] Configured DKIM record",
    "[10:03] Configured DMARC record",
    "[10:04] Created 50 SMTP users",
    "[10:05] Initialized warmup sequence",
    "Currently: Setting up IP rotation..."
  ]
}
```

**Status Codes:**
- `200` - Success
- `404` - Deployment not found
- `401` - Unauthorized

---

## 🚨 **Error Responses**

All errors follow this format:

```json
{
  "detail": "Trial has expired. Upgrade to continue.",
  "error_code": "TRIAL_EXPIRED",
  "status": 403
}
```

**Common Error Codes:**
- `TRIAL_EXPIRED` (403) - Trial period ended
- `PLAN_LIMIT_EXCEEDED` (402) - Too many inboxes/domains
- `DOMAIN_NOT_FOUND` (404) - Domain doesn't exist
- `DOMAIN_UNAVAILABLE` (400) - Domain is taken
- `INVALID_TOKEN` (401) - Auth token invalid/expired
- `UNAUTHORIZED` (401) - Not authenticated
- `PROVISIONING_FAILED` (500) - Server error during provisioning

---

## 📊 **Plan Limits (Validate on Frontend & Backend)**

```
STARTER:
  - Max inboxes: 50
  - Max domains: 10
  - Cost: $19/month

PROFESSIONAL:
  - Max inboxes: 500
  - Max domains: 50
  - Cost: $59/month

ENTERPRISE:
  - Max inboxes: Unlimited
  - Max domains: Unlimited
  - Cost: $199/month

TRIAL:
  - Max inboxes: 50 (same as Starter)
  - Max domains: 5
  - Duration: 7 days
```

---

## 🔄 **Expected Frontend Wizard Flow**

```
1. Step 1: Select Configuration
   - Inbox volume slider
   - Server region selection
   - ✅ No API calls needed

2. Step 2: Select/Register Domain
   - GET /api/v1/domains (load user's domains)
   - POST /api/v1/domains/register (if registering new)
   - Select domain from list

3. Step 3: Launch Infrastructure
   - GET /api/v1/trial/status (verify still in trial)
   - POST /api/v1/infrastructure/provision (create inboxes)
   - GET /api/v1/infrastructure/deployment/{id} (poll progress)
   - Display real-time logs
   - Download CSV when complete

4. Success
   - Show "50 inboxes created"
   - Redirect to dashboard
```

---

## 🏗️ **How to Implement These in Backend**

Example using FastAPI:

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.utils.auth import get_current_tenant

router = APIRouter(prefix="/api/v1", tags=["Infrastructure"])

@router.get("/trial/status")
async def get_trial_status(
    current_tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Check if trial is still active"""
    trial = SubscriptionService.get_active_trial(current_tenant.id, db)
    if not trial or trial.is_expired():
        raise HTTPException(status_code=403, detail="Trial expired")
    
    days_left = trial.days_remaining()
    return {
        "active": True,
        "daysLeft": days_left,
        "plan": trial.plan,
        "expiresAt": trial.expires_at.isoformat(),
        "plan_limits": {
            "max_inboxes": trial.get_inbox_limit(),
            "max_domains": trial.get_domain_limit()
        }
    }

@router.get("/domains")
async def list_domains(
    current_tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """List all domains for tenant"""
    domains = DomainService.list_domains(current_tenant.id, db)
    return {
        "domains": [
            {
                "id": d.id,
                "name": d.name,
                "status": d.status,
                "dns_configured": d.dns_configured,
                "created_at": d.created_at.isoformat()
            }
            for d in domains
        ]
    }

@router.post("/domains/register")
async def register_domain(
    request: RegisterDomainRequest,
    current_tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Register a new domain"""
    # Check plan limits
    domain_count = DomainService.count_domains(current_tenant.id, db)
    max_domains = current_tenant.subscription.get_domain_limit()
    if domain_count >= max_domains:
        raise HTTPException(status_code=402, detail="Plan limit exceeded")
    
    # Register with Namecheap
    result = NamecheapService.register(request.domain)
    
    # Configure DNS with Cloudflare
    CloudflareService.setup_dns(request.domain)
    
    # Save to database
    domain = DomainService.create(current_tenant.id, request.domain, db)
    
    return {
        "domain_id": domain.id,
        "domain": domain.name,
        "status": "registered",
        "cost": 9.99,
        "auto_renews": True
    }

@router.post("/infrastructure/provision")
async def provision_inboxes(
    request: ProvisionInboxesRequest,
    current_tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Create SMTP inboxes - THE MAGIC BUTTON"""
    # Verify trial is active
    trial = SubscriptionService.get_active_trial(current_tenant.id, db)
    if not trial or trial.is_expired():
        raise HTTPException(status_code=403, detail="Trial expired")
    
    # Check plan limits
    current_inbox_count = len(current_tenant.inboxes)
    max_inboxes = trial.get_inbox_limit()
    if current_inbox_count + request.inbox_count > max_inboxes:
        raise HTTPException(status_code=402, detail="Inbox limit exceeded")
    
    # Trigger async provisioning
    deployment_id = ProvisioningService.provision_async(
        tenant_id=current_tenant.id,
        domain_id=request.domain_id,
        inbox_count=request.inbox_count,
        naming_convention=request.naming_convention,
        db=db
    )
    
    # Return immediate response (async processing continues)
    return {
        "inboxes_created": request.inbox_count,
        "domain": "acme-corp.com",
        "deployment_id": deployment_id,
        "status": "provisioning"
    }
```

---

## ✅ **Checklist for Making Wizard Fully Functional**

- [ ] `/api/v1/trial/status` - Check trial is active
- [ ] `/api/v1/domains` - List user's domains
- [ ] `/api/v1/domains/register` - Register new domain
- [ ] `/api/v1/infrastructure/provision` - Create inboxes
- [ ] `/api/v1/infrastructure/inboxes` - List inboxes
- [ ] `/api/v1/infrastructure/provision/csv` - Download credentials
- [ ] Trial expiry check on every provisioning request
- [ ] Plan limit validation (inbox count vs max)
- [ ] Real-time progress logging during provisioning
- [ ] Email notification when provisioning complete
- [ ] Auto-charging card on domain registration (Stripe)
- [ ] DNS auto-configuration (Cloudflare)
- [ ] SMTP server hot-reload on inbox creation (KumoMTA)

---

**The wizard is now ready for backend integration. Implement these endpoints and the provisioning will be fully functional!**
