# Zidwell - All-in-One Fintech Platform for Nigerian SMEs

## 🚀 Overview

**Zidwell** is a comprehensive Next.js-based SaaS platform designed for Nigerian small businesses, accountants, and freelancers. It provides professional tools for:

- **Invoicing & Billing**: Create, send, sign, and track invoices with payments
- **Receipts & Contracts**: Digital receipts/contracts with e-signatures & PDF export
- **Bill Payments**: Airtime, data, electricity, cable TV (DSTV, GOtv, etc.)
- **Wallet & Transfers**: P2P transfers, funding, virtual accounts
- **Admin Dashboard**: Full CRUD for users/transactions/audits/KYC/disputes
- **Tax/Journaling**: Tax filings, journal entries, statements
- **Notifications**: Multi-channel (email/push/in-app) alerts
- **Subscriptions**: Usage tracking, tiers, trials

Built with **Supabase** backend, **PWA support**, SEO-optimized, Nigeria-focused (banks, discos, networks).

Live: [zidwell.com](https://zidwell.com)

## 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| **Framework** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4, shadcn/ui, framer-motion |
| **State/Data** | Supabase, SWR, React Context, React Hook Form |
| **UI/Charts** | Radix UI, Lucide React, Recharts, Sonner (toasts) |
| **PDF/Sign** | jsPDF, html2canvas, Puppeteer, SignaturePad |
| **Notifications** | Nodemailer, Resend, Web-push |
| **Other** | Next-PWA, Next-Themes, Quill (RTE), UUID |
| **Backend** | Supabase Auth/DB, Nomba/Paystack? (inferred) |

## 📁 Full Project Structure

```
zidwell/
├── .gitignore
├── components.json          # shadcn/ui config
├── middleware.ts           # Auth/middleware logic
├── netlify.toml            # Netlify deploy
├── next.config.ts          # Next.js + PWA config
├── package.json            # Dependencies/scripts
├── postcss.config.mjs      # Tailwind/PostCSS
├── tailwind.config.js      # Tailwind themes
├── tsconfig.json           # TypeScript config
├── TODO.md                 # Task progress
├── constants/              # App constants
│   └── dashboard.ts
├── lib/                    # Core utils/services
│   ├── admin-auth.ts       # Supabase admin token verify
│   ├── audit-log.ts        # Action auditing
│   ├── emailNotification.ts, notification-service.ts # Multi-channel notifs
│   ├── node-mailer.ts      # Email transport
│   ├── fee.ts, banks.ts    # Business logic
│   └── utils.ts, fetcher.ts
│   └── email/
│       └── pin-reset.ts
├── public/                 # Static assets (PWA icons, images)
│   ├── logo.png, zidwell-logo.svg
│   ├── hero-*.jpg          # Marketing images
│   ├── cable-img/, disco-img/ # Bill providers
│   ├── manifest.json, sw.js
│   └── networks-img/       # Telcos (MTN, Airtel)
├── types/                  # TypeScript types
│   └── admin-dashboard.ts
├── app/                    # Next.js App Router
│   ├── globals.css         # Tailwind base
│   ├── layout.tsx          # Root layout + SEO schemas/providers
│   ├── page.tsx            # Landing page
│   ├── accountants/page.tsx
│   ├── admin/*             # Admin dashboards (invoices, users, wallets...)
│   ├── auth/*              # login/signup (confirm-email, reset)
│   ├── blog/*              # Blog pages
│   ├── dashboard/*         # User dashboard
│   ├── pricing/, privacy/  # Static pages
│   ├── support/, tax-filing/
│   ├── reset-pin/, sign-contract/
│   └── components/         # ~100 UI components
│       ├── AuthChecker.tsx, NotificationToast.tsx
│       ├── SignaturePad.tsx # E-sign
│       ├── Airtime.tsx, Electricity.tsx # Bill components
│       ├── admin-components/
│       ├── invoice/, Receipt-component/
│       └── profile-operations/
└── app/api/                # 100+ API routes
    ├── auth/login|register/
    ├── profile/ (KYC, pin-reset)
    ├── invoice|receipt|contract/ (CRUD, sign, PDF, email)
    ├── buy-airtime|data-bundle|electricity|cable-tv/
    ├── p2p-transfer/, wallet-balance/
    ├── admin-apis/* (users, transactions, audits)
    └── notifications/, cron/
```

*(Tree compiled from recursive list_files; truncated dirs contain route.tsx files/pages.)*

## 🔍 Key Modules Explained

### 1. **Frontend (app/)**
- **layout.tsx**: Rich metadata (SEO/OG/Twitter/PWA), Providers (User/Auth/Session/Verification), Google Analytics
- **Pages**: App router with dynamic segments e.g. `admin/transactions/[userId]/page.tsx`
- **Components**: shadcn-based (modals, tables, forms), bill pay UIs, previews (InvoicePreview.tsx), admin tables/charts

### 2. **API Routes (app/api/)**
Serverless handlers for:
- **Core Business**: Invoices/receipts/contracts (drafts/sign/send/PDF/callbacks)
- **Bills**: Nigeria-specific (providers, validate meter/smartcard, buy/pay)
- **Finance**: Wallet ops, P2P, funding (debit card/virtual), journals/tax
- **Admin**: Secure CRUD (admin-apis/ subroutes)
- **Auth/Notifs**: Login/register, multi-channel notifs (Supabase tables)

### 3. **Lib/Services**
- **Auth**: `admin-auth.ts` - Bearer/cookie token verify w/ Supabase admin client
- **Notifications**: `notification-service.ts` - Create/log notifs (in_app/email/push/SMS), user prefs from DB
- **Email**: Nodemailer templates (PIN reset, invoice confirm, login alerts)
- **Audit**: Log user actions/emails
- **Utils**: Fees, banks list, fetcher (SWR?), dashboard metrics

### 4. **Database (Supabase inferred)**
Tables: `users` (prefs), `notifications|notification_logs`, `invoices|receipts|contracts`, `transactions`, `wallets`, `audit_logs`

### 5. **Admin Features**
- Dashboards for reconciliation, KYC, disputes, funding logs
- Usage/trials/subscriptions tracking

## 🚀 Quick Start

```bash
# Install
npm install

# Dev server
npm run dev  # http://localhost:3000

# Build/Start
npm run build && npm start

# Lint
npm run lint
```

**Env Vars**: NEXT_PUBLIC_GA_*, Supabase keys, SITE_URL=zidwell.com, EMAIL_USER, NOMBA_URL

## 🌐 Deployment
- **Netlify**: `netlify.toml` (build: next build)
- **PWA**: next-pwa enabled (sw.js, manifest)
- **SEO**: Sitemap/robot.txt, schemas in layout

## 🏗️ Architecture Flow
1. User auth → Supabase + middleware
2. Dashboard → API calls → Supabase CRUD
3. Bills/Payments → Provider APIs (Nomba?)
4. Sign/Send → SignaturePad → PDF gen → Email/DB
5. Admin → Token verify → Full access

## 📈 Features Map
| Feature | API Routes | Components |
|---------|------------|------------|
| Invoices | invoice/* | InvoiceGen, previews |
| Bills | buy-*/* | Airtime, CableBills |
| Wallet | p2p-transfer, wallet-balance | Balance-card |

## 🤝 Contributing
- Add components: `app/components/`
- New API: `app/api/[feature]/route.ts`
- See TODO.md for progress.

Built with ❤️ for Nigerian businesses!

