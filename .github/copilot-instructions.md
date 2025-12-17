## InboxGrove / ScaleMail Prime - AI Coding Instructions

### What this app is
- Single-page marketing + ops console for cold email infrastructure. React 18 + TypeScript + Vite. Dark, gradient-heavy aesthetic.
- Two faces: marketing site (sections in [App.tsx](../App.tsx)) and ops/admin consoles (DomainSetup, Dashboard/Provisioning, AdminDashboardMUI).

### Core flows & boundaries
- Routing in [RouterApp.tsx](../RouterApp.tsx): `/` marketing, `/onboarding` TrialStart, `/dashboard` TrialDashboard, `/admin` AdminDashboardMUI.
- Domain automation: [components/DomainSetup.tsx](../components/DomainSetup.tsx) drives Cloudflare DNS + DKIM + KumoMTA provisioning + verification.
- KumoMTA integration: [services/kumoMtaService.ts](../services/kumoMtaService.ts) wraps real endpoints (http://46.21.157.216:8001) for domain, DKIM, DNS fetch, user creation, reload, health.
- Cloudflare automation: [services/cloudflareService.ts](../services/cloudflareService.ts) finds zones, creates SPF/DKIM/DMARC records, generates BIND files.
- DNS helpers: [services/dnsRecordGenerator.ts](../services/dnsRecordGenerator.ts) builds records + instructions; [services/dnsVerifyService.ts](../services/dnsVerifyService.ts) verifies via DoH; [services/dkimService.ts](../services/dkimService.ts) generates RSA keys; [services/providerGuides.ts](../services/providerGuides.ts) shows provider steps.
- Admin console UI: [components/AdminDashboardMUI.tsx](../components/AdminDashboardMUI.tsx) uses MUI DataGrid (community), tabs, stats cards; currently wired with sample data. Extend here for real user/credit/subscription controls.
- Mock data domain models: [types.ts](../types.ts) defines Inbox, Domain/DNS, User, ActivityLog, CreditTransaction, SystemMetrics. Mock generators in [services/mockDataService.ts](../services/mockDataService.ts) with CRUD helpers.

### Styling & theming
- Global MUI theme in [theme/muiTheme.ts](../theme/muiTheme.ts): dark, indigo/purple primary, emerald success. Apply via ThemeProvider/CssBaseline in [index.tsx](../index.tsx).
- Tailwind CDN remains for legacy marketing sections (see [index.html](../index.html)); new admin UX should prefer MUI components. Keep dark background and gradient accents consistent.

### Animation
- Framer Motion common patterns: section reveal `opacity/y`, hover lift `y: -8` or `scale`, staggered variants (see [components/Dashboard.tsx](../components/Dashboard.tsx)).

### Data & backend patterns
- No global state manager; components manage local state. Mock data for admin via mockDataService; real calls for Cloudflare/KumoMTA.
- Env injection: vite.config exposes `process.env.GEMINI_API_KEY` but unused.

### Build/run
- Install: `npm install`
- Dev: `npm run dev` (Vite 6.4.x)
- Prod build: `npm run build` (works; large bundle warning only). Preview: `npm run preview`.

### Conventions
- Functional components with TypeScript. Prefer types from [types.ts](../types.ts); add new UI props there.
- Exports: default at file end. Keep section components self-contained; minimal prop drilling (only view switches in Dashboard/Provisioning).
- Icons: Lucide for legacy sections; MUI icons acceptable in MUI surfaces.

### What to avoid
- Do not add paid MUI Pro/Premium packages; stay on community editions.
- Avoid new global state (Redux/Context) unless justified; keep flows local.
- Do not introduce new CSS systems (CSS modules/styled-components); use MUI styling or existing Tailwind utilities.

### If you extend admin/user features
- Use AdminDashboardMUI for DataGrid, dialogs, charts, pickers (MUI X community). Wire to mockDataService or real APIs.
- Preserve domain/Kumo flows in DomainSetup; surface status, retries, and toasts when adding UX polish.
