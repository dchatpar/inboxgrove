## InboxGrove / ScaleMail Prime - Build Summary (as of 2025-12-16)

### Tech Stack
- React 18 + TypeScript (Vite 6) with strict TS.
- Tailwind CDN for legacy styling; Framer Motion for animations; Lucide icons.
- MUI (community/free): @mui/material, @mui/icons-material, @mui/x-data-grid, @mui/x-date-pickers, @mui/x-charts; Emotion for styling; date-fns for pickers.
- No paid MUI Pro/Premium packages.

### Navigation and Shell
- SPA routing via BrowserRouter in RouterApp with routes: / (marketing page), /onboarding (TrialStart), /dashboard (TrialDashboard), /admin (AdminDashboardMUI).
- Global ThemeProvider + CssBaseline using custom dark theme (theme/muiTheme.ts) with InboxGrove branding (indigo/purple primary, emerald success).
- Navbar updated with Admin link; ScrollProgress and StickyCTA remain.

### Marketing/Conversion Experience
- App.tsx composes all hero/feature/credibility sections plus DomainSetup.
- Dark aesthetic with gradient accents; sections animated with Framer Motion.

### Domain & DNS Automation (DomainSetup component)
- Workflow: create/select domain → generate DKIM (WebCrypto RSA) → export/import keys → auto-create DNS in Cloudflare → verify DNS via DoH → show expected vs. actual.
- Cloudflare automation (services/cloudflareService.ts): find zone, create SPF/DKIM/DMARC records, generate BIND zone file.
- DNS record generation (services/dnsRecordGenerator.ts): SPF, DMARC with rua, DKIM TXT, human-readable instructions, CSV export.
- DKIM keypair generation and PEM/base64 helpers (services/dkimService.ts).
- Provider guides (services/providerGuides.ts) for Cloudflare/GoDaddy/Namecheap/Route53/Google Domains.
- Verification (services/dnsVerifyService.ts) via Cloudflare DoH.
- Export/import: DKIM JSON, CSV, BIND zone; manual instructions panel.

### KumoMTA Integration (services/kumoMtaService.ts)
- Endpoints wired to http://46.21.157.216:8001 with X-API-Key.
- Operations: createDomain, generateDkim, getDnsRecords, createUser, reloadConfig, checkHealth, listDomains, listUsers.
- Mail IP pool included; auto-reload endpoint invoked post-changes.
- One-click “Complete Setup” flow in DomainSetup that chains domain → DKIM → DNS → user → reload.

### Admin Dashboard (MUI)
- AdminDashboardMUI uses MUI DataGrid (community) with toolbar, filtering, pagination, checkbox selection.
- Tabs: Overview, Inboxes, Domains, Integrations, Settings.
- Stats cards for total inboxes, active domains, health, emails sent.
- Sample datasets (50 inbox rows, 10 domain rows) to demonstrate interactions.

### Mock Data and System Metrics
- services/mockDataService.ts generates mock Users, Activity Logs, Credit Transactions, System Metrics with helpers to add/update/delete users, and append logs/transactions.
- types.ts defines all domain models: User (role/status/subscription/billing), ActivityLog, CreditTransaction, SystemMetrics, Inbox, Domain/DNS types, UI props.

### User/Credit/Subscription Management (current state)
- Data models and mock generators exist; CRUD helpers for users, logs, credit transactions.
- UI for full user management not yet complete; to be built atop AdminDashboardMUI with MUI components (DataGrid forms, dialogs, toggles, credit adjustments, subscription status controls).

### Build/Test Status
- npm run build (Vite) succeeds; large bundle warning only.
- npm run dev verified (Vite 6.4.1) and routes reachable locally.

### Pending / Next Steps
1) Expand AdminDashboardMUI: user management CRUD, credit adjustments, subscription state toggles, login-as-customer action, suspension/reactivation, activity timeline, per-user quotas.
2) Add charts (MUI X Charts) for revenue, inbox health, send volume; add date pickers for range filtering.
3) Replace remaining Tailwind sections with MUI components for consistent look and feel (keep brand theme).
4) Wire mockDataService into dashboard state; add search/filter/sort/export; add CSV/PDF exports using free libs if needed.
5) Add notifications/snackbars and confirmation dialogs for destructive actions.
6) Validate KumoMTA and Cloudflare flows against live endpoints; add error toasts and retries.

### Files (key)
- App.tsx, RouterApp.tsx, index.tsx (ThemeProvider), theme/muiTheme.ts.
- components/: DomainSetup, AdminDashboardMUI, Dashboard, Provisioning, Navbar, etc.
- services/: cloudflareService, dnsRecordGenerator, dnsVerifyService, dkimService, providerGuides, kumoMtaService, mockDataService.
- types.ts, metadata.json, public/robots.txt, public/sitemap.xml.
