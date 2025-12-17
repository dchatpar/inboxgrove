# Quick Access Guide - Admin Trial User Management

## Live Application
🌐 **URL**: https://a24fca13.inboxgrove.pages.dev/admin

## Features Available

### Admin Dashboard Tabs
1. **Analytics** - System-wide metrics and performance
2. **User Management** - All users (mixed statuses)
3. **Trial Users** ⭐ NEW - Trial and pending users only
4. **Activity Logs** - All system actions
5. **Credits** - Credit transactions and ledger
6. **API Keys** - API key management
7. **Onboarding** - Onboarding steps tracker
8. **Domain Health** - Domain status monitoring

## How to Use Trial User Management

### Access Trial Users Tab
1. Go to https://a24fca13.inboxgrove.pages.dev/admin
2. Click the **"Trial Users"** tab (shows Group icon)
3. See list of all trial and pending users

### Manage a Trial User
1. **Right-click** any user row
2. Choose from context menu:

#### ⚙️ Manage Infrastructure (NEW)
Opens dialog to:
- **Add Domain** - Configure domain for user
- **Connect Cloudflare** - Provide CF API token for DNS automation
- **Provision Infrastructure** - Complete KumoMTA setup with SMTP user

#### ✅ Activate Trial
Converts user status from "trial" or "pending" to "active"

#### ⏱️ Extend Trial
Adds 7 days to user's trial period

#### Edit
Modify user properties (name, company, plan, status)

#### 🚀 Impersonate
View app as the trial user (for testing/debugging)

#### 🗑️ Delete
Remove user account

### Filter Trial Users
- **Status Filter**: trial, pending, active
- **Plan Filter**: starter, professional, enterprise
- **Quick Search**: Use DataGrid search to find by email, name, company

## Infrastructure Provisioning Workflow

When you select "Manage Infrastructure":

### Step 1: Add Domain
```
Domain: example.com
Selector 1: s1
Selector 2: s2
→ Stores domain for user
```

### Step 2: Connect Cloudflare
```
API Token: <paste Cloudflare token>
Zone ID: <optional, auto-detects if blank>
→ Validates Cloudflare connectivity
```

### Step 3: Provision Infrastructure
```
Automatically:
1. Creates domain in KumoMTA
2. Generates DKIM RSA keys (2048-bit)
3. Fetches DNS records
4. Creates SMTP user account
5. Reloads KumoMTA config
6. (Optionally) applies DNS to Cloudflare
→ Returns: username and password for user's SMTP access
```

## Admin Actions Feedback

All actions show **snackbar notifications**:
- ✅ **Success** (green) - Action completed
- ℹ️ **Info** (blue) - Status updates
- ⚠️ **Warning** (yellow) - Cautions
- ❌ **Error** (red) - Failed operations

## Technical Details

### API Endpoints Used
- **Cloudflare**: https://api.cloudflare.com/client/v4
  - Find zones by domain
  - Create DNS records
- **KumoMTA**: http://46.21.157.216:8001
  - Create domain
  - Generate DKIM keys
  - Get DNS records
  - Create SMTP user
  - Reload configuration

### Data Stored
Trial users data comes from `AppContext`:
- User email, name, company
- Subscription plan (starter/professional/enterprise)
- Status (trial/pending/active)
- Inbox count
- Join date

### Admin Actions Dialog
Interactive modal with three tabs:
1. Domain Configuration
2. Cloudflare Connection
3. Infrastructure Provisioning

Each section provides real-time validation and status feedback.

## Troubleshooting

### DataGrid Not Loading
- Refresh page (F5)
- Check browser console for errors
- Verify AppContext is initialized

### Manage Infrastructure Dialog Not Opening
- Ensure "Manage Infrastructure" is clicked (not another option)
- Check browser console for errors
- Verify onSelectUser callback is working

### DNS Provisioning Failed
- Verify Cloudflare API token has DNS edit permissions
- Ensure domain is added to Cloudflare account
- Check KumoMTA service is running (http://46.21.157.216:8001)

### SMTP User Not Created
- Verify KumoMTA API key is correct
- Check network connectivity to KumoMTA
- Verify domain was created successfully first

## GitHub Repository
📦 **Repo**: https://github.com/dchatpar/inboxgrove
- Main branch has all latest features
- Auto-deploys to Cloudflare Pages on push

## Next Features (Planned)
- [ ] Bulk trial user activation
- [ ] Email notifications for provisioning
- [ ] Mailbox generator delegation
- [ ] Audit logging for all admin actions
- [ ] Admin backup/recovery workflows
- [ ] Role-based access control

---

**Questions or Issues?** 
Check the implementation files:
- `components/admin/TrialUsersManagement.tsx` (359 lines)
- `components/admin/AdminUserActions.tsx` (187 lines)
- `components/AdminDashboardNew.tsx` (main dashboard)
