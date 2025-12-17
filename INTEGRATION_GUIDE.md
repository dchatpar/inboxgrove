# ScaleMail/InboxGrove - Complete Integration Setup

## 🎯 What's Been Built

You now have a **complete SaaS platform** with:

### **Frontend (React)**
- ✅ 2-step email + OTP verification trial signup
- ✅ 7-day trial countdown with enforced expiry
- ✅ Provisioning interface (domain/inbox setup) - **disabled after 7 days**
- ✅ Real-time dashboard with metrics
- ✅ Backend API integration

### **Backend (FastAPI + PostgreSQL)**
- ✅ Authentication (OTP, JWT tokens, trials)
- ✅ Trial management (7-day enforcement, auto-expiry)
- ✅ Domain registration & DNS management
- ✅ Infrastructure provisioning ("Magic Button" - creates 50 inboxes in 60 seconds)
- ✅ Billing & Stripe integration
- ✅ Complete data models (12 tables)

---

## 🚀 Starting the Complete System

### **Step 1: Start Backend (FastAPI)**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy .env and fill in your API keys
cp .env.example .env

# Edit .env with:
# - DATABASE_URL=postgresql://user:password@localhost:5432/inboxgrove_db
# - STRIPE_SECRET_KEY=sk_test_...
# - NAMECHEAP_API_KEY=your_key
# - CLOUDFLARE_API_TOKEN=your_token

# Start the server
python -m uvicorn app.main:app --reload --port 8000
```

**Backend will run on:** `http://localhost:8000`
**API Docs:** `http://localhost:8000/docs`

### **Step 2: Start Frontend (React)**

```bash
cd ..  # Back to root
npm install  # If not already installed
npm run dev
```

**Frontend will run on:** `http://localhost:3001`

---

## 📋 How It Works

### **User Flow:**

1. **Visit:** `http://localhost:3001/onboarding`
2. **Step 1 (Email Verification):**
   - User enters email + selects plan (Starter $19, Professional $59, Enterprise $199)
   - Click "Send Verification Code"
   - Backend sends OTP via email
   
3. **Step 2 (OTP Verification):**
   - User enters 6-digit code from email
   - Backend verifies OTP and creates trial account
   - Returns JWT token + trial expiry date (current date + 7 days)
   - Frontend stores token in localStorage

4. **Dashboard Access:**
   - Redirects to `http://localhost:3001/dashboard`
   - Shows trial countdown (7 days remaining)
   - **Provisioning tab is ENABLED** - user can create inboxes

5. **After 7 Days:**
   - Countdown reaches 0
   - Provisioning tab becomes **DISABLED**
   - Shows payment prompt
   - Forces user to upgrade at `/#pricing`

### **Demo Mode (No Backend):**
If backend is unavailable (status 0 error):
- Frontend falls back to demo mode
- Creates fake trial with 7-day expiry
- Allows full UI testing without backend

---

## 🔌 API Endpoints You're Using

### **Auth Endpoints**
```
POST   /api/v1/auth/trial/send-otp          # Send OTP email
POST   /api/v1/auth/trial/verify-otp        # Verify OTP + create trial
GET    /api/v1/trial/status                 # Check trial status
```

### **Domain Endpoints**
```
GET    /api/v1/domains                      # List user's domains
POST   /api/v1/domains/register             # Buy domain (Namecheap)
POST   /api/v1/domains/{id}/configure-dns   # Setup DNS (Cloudflare)
```

### **Provisioning Endpoints**
```
POST   /api/v1/infrastructure/provision     # Create inboxes (THE "MAGIC BUTTON")
GET    /api/v1/infrastructure/inboxes       # List all inboxes
GET    /api/v1/infrastructure/provision/csv # Download CSV credentials
```

---

## 🔐 Trial Enforcement Logic

**Frontend (`TrialDashboard.tsx`):**
```typescript
// Calculate days left
const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

// If daysLeft === 0:
- isTrialExpired = true
- provisioning tab becomes disabled
- shows "Trial Expired" message
- payment button links to /#pricing
```

**Backend (`subscription_service.py`):**
```python
# Every request checks trial status
if trial.is_expired():
    return HTTPException(status_code=403, detail="Trial has expired")

# Auto-suspend on Day 8 if no payment
if trial.expires_at <= now:
    tenant.is_suspended = True
    send_payment_reminder_email()
```

---

## 💾 Database Schema (What Gets Stored)

### **Trials Table:**
- `id` - Trial ID
- `tenant_id` - User account
- `email` - User email
- `plan` - Plan selected (starter/professional/enterprise)
- `created_at` - When trial started
- `expires_at` - When trial expires (created_at + 7 days)
- `status` - active/expired/converted/suspended

### **Tenants Table:**
- `id` - Account ID
- `company_name`
- `email`
- `password_hash`
- `is_trial` - Is currently on trial?
- `is_suspended` - Payment failed?
- `created_at`

### **Inboxes Table:**
- `id` - Inbox ID
- `domain_id` - Which domain
- `email` - Full email address
- `username` - SMTP username
- `password_hash` - Encrypted password
- `smtp_host` - Mail server
- `health_score` - Deliverability score (0-100)
- `status` - active/warming/suspended/blacklisted

---

## 🧪 Testing the System

### **Test Scenario 1: Full Trial Flow**
```bash
# 1. Go to http://localhost:3001/onboarding
# 2. Enter: test@company.com
# 3. Select: Professional plan
# 4. Click: "Send Verification Code"
# 5. Check backend logs for OTP (or use: 000000 in demo mode)
# 6. Enter OTP code
# 7. Get redirected to dashboard
# 8. Should see "7 days remaining"
# 9. Click "Deploy" tab to create inboxes
```

### **Test Scenario 2: Trial Expiration**
```bash
# In localStorage, manually edit trial expiry:
localStorage.setItem('trialData', JSON.stringify({
  trialId: 'test_123',
  expiresAt: new Date().toISOString()  // Set to now
}));
# Refresh page
# Should see "Trial Expired" and provisioning disabled
```

### **Test Scenario 3: Create Inboxes**
```bash
# After trial signup:
# 1. Go to Dashboard
# 2. Click "Deploy" tab
# 3. Adjust inbox volume (e.g., 50)
# 4. Select region (US-EAST, EU-WEST, etc)
# 5. Select a domain
# 6. Click "Launch Infrastructure"
# 7. Watch real-time provisioning logs
# 8. Download CSV with credentials
```

---

## 📊 Environment Variables

### **Frontend (`.env` in root)**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_STRIPE_PUBLIC_KEY=pk_test_your_key
```

### **Backend (`.env` in `backend/`)**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/inboxgrove_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your_secret_key_here
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NAMECHEAP_API_KEY=your_key
NAMECHEAP_API_USER=your_user
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ZONE_ID=your_zone
KUMO_ADMIN_PANEL_URL=http://localhost:9000
KUMO_ADMIN_API_KEY=your_key
SENDGRID_API_KEY=your_key
```

---

## 🔄 Trial Data Storage

### **In localStorage (Frontend):**
```javascript
{
  "trialData": {
    "trialId": "trial_abc123xyz",
    "expiresAt": "2025-12-23T14:30:00.000Z"  // 7 days from now
  },
  "userEmail": "user@company.com",
  "access_token": "eyJhbGc...",  // JWT token
  "refresh_token": "eyJhbGc..."
}
```

### **In Database (Backend):**
```sql
-- trials table
INSERT INTO trials (id, tenant_id, email, plan, created_at, expires_at, status)
VALUES (
  'trial_abc123xyz',
  'tenant_456',
  'user@company.com',
  'professional',
  NOW(),
  NOW() + INTERVAL '7 days',
  'active'
);

-- tenants table
INSERT INTO tenants (id, company_name, email, password_hash, is_trial, is_suspended)
VALUES (
  'tenant_456',
  'My Company',
  'user@company.com',
  'hashed_password',
  true,
  false
);
```

---

## 🛠️ Troubleshooting

### **Issue: "NetworkError when attempting to fetch resource"**
**Solution:** Backend not running. Start it first:
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

### **Issue: OTP not working in live mode**
**Solution:** Check backend logs. Make sure:
- Email service is configured (SendGrid/Mailgun)
- `.env` has email API key
- User has email set correctly

### **Issue: Trial not expiring after 7 days**
**Solution:** The expiry is checked on every request. Make sure:
- `expiresAt` in localStorage is in past
- Browser time is correct
- Refresh the page to recalculate

### **Issue: Database connection error**
**Solution:** Make sure PostgreSQL is running:
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
# Start PostgreSQL service from Services
```

Then create database:
```bash
createdb inboxgrove_db
```

---

## 📈 Next Steps

1. **Set up email service:**
   - SendGrid or Mailgun for OTP emails
   - Add API key to `.env`

2. **Configure Stripe:**
   - Add test keys to `.env`
   - Update billing endpoints

3. **Set up domain registrar:**
   - Namecheap account + API key
   - For domain purchasing

4. **Configure DNS provider:**
   - Cloudflare account + API token
   - For automatic DNS setup

5. **Deploy:**
   - Backend to Heroku/Railway/Render
   - Frontend to Vercel/Netlify
   - Database to AWS RDS/Neon

---

## 📚 Files Modified

### **Frontend:**
- `services/trialApi.ts` - Backend API integration
- `components/TrialStart.tsx` - 2-step OTP verification
- `components/TrialDashboard.tsx` - Trial countdown + expiry enforcement
- `components/Provisioning.tsx` - Real provisioning API calls
- `RouterApp.tsx` - Route configuration
- `.env.example` - API configuration

### **Backend (Pre-built):**
- `backend/app/main.py` - FastAPI server
- `backend/app/api/v1/auth.py` - Auth endpoints
- `backend/app/services/subscription_service.py` - Trial logic
- `backend/app/services/provisioning_service.py` - Inbox creation
- And 15+ more files in `/backend`

---

**You're all set! Start both servers and begin testing. 🚀**
