# Zidwell ![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue) ![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&amp;logoColor=white) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-3B82F6?logo=tailwindcss)

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Zidwell - All-in-One Fintech Platform for Nigerian SMEs**  
🚀 **Overview**  
Zidwell is a comprehensive Next.js-based SaaS platform designed for Nigerian small businesses, accountants, and freelancers. It provides professional tools for:

**Invoicing & Billing**: Create, send, sign, and track invoices with payments  

**Receipts & Contracts**: Digital receipts/contracts with e-signatures & PDF export  

**Bill Payments**: Airtime, data, electricity, cable TV (DSTV, GOtv, etc.)  

**Wallet & Transfers**: P2P transfers, funding, virtual accounts  

**Admin Dashboard**: Full CRUD for users/transactions/audits/KYC/disputes  

**Tax/Journaling**: Tax filings, journal entries, statements  

**Notifications**: Multi-channel (email/push/in-app) alerts  

**Subscriptions**: Usage tracking, tiers, trials  

Built with Supabase backend, PWA support, SEO-optimized, Nigeria-focused (banks, discos, networks).

**Live**: [zidwell.com](http://zidwell.com)

## 🛠️ Tech Stack  
| Category | Technologies |  
|----------|--------------|  
| Framework | Next.js 15 (App Router), React 19, TypeScript |  
| Styling | Tailwind CSS 4, shadcn/ui, framer-motion |  
| State/Data | Supabase, SWR, React Context, React Hook Form |  
| UI/Charts | Radix UI, Lucide React, Recharts, Sonner (toasts) |  
| PDF/Sign | jsPDF, html2canvas, Puppeteer, SignaturePad |  
| Notifications | Nodemailer, Resend, Web-push |  
| Other | Next-PWA, Next-Themes, Quill (RTE), UUID |  
| Backend | Supabase Auth/DB, Nomba/Paystack (inferred) |  

## 📁 Full Project Structure  
```
zidwell/  
├── .gitignore  
├── components.json # shadcn/ui config  
├── middleware.ts # Auth/middleware logic  
├── netlify.toml # Netlify deploy  
├── next.config.ts # Next.js + PWA config  
├── package.json # Dependencies/scripts  
├── postcss.config.mjs # Tailwind/PostCSS  
├── tailwind.config.js # Tailwind themes  
├── tsconfig.json # TypeScript config  
├── [TODO.md](TODO.md) # Task progress  
├── constants/ # App constants  
│   └── dashboard.ts  
├── lib/ # Core utils/services  
│   ├── admin-auth.ts # Supabase admin token verify  
│   ├── audit-log.ts # Action auditing  
│   ├── emailNotification.ts, notification-service.ts # Multi-channel notifs  
│   ├── node-mailer.ts # Email transport  
│   ├── fee.ts, banks.ts # Business logic  
│   └── utils.ts, fetcher.ts  
│   └── email/  
│   └── pin-reset.ts  
├── public/ # Static assets (PWA icons, images)  
│   ├── logo.png, zidwell-logo.svg  
│   ├── hero-*.jpg # Marketing images  
│   ├── cable-img/, disco-img/ # Bill providers  
│   ├── manifest.json, sw.js  
│   └── networks-img/ # Telcos (MTN, Airtel)  
├── types/ # TypeScript types  
│   └── admin-dashboard.ts  
├── app/ # Next.js App Router  
│   ├── globals.css # Tailwind base  
│   ├── layout.tsx # Root layout + SEO schemas/providers  
│   ├── page.tsx # Landing page  
│   ├── accountants/page.tsx  
│   ├── admin/ # Admin dashboards (invoices, users, wallets…)  
│   ├── auth/* # login/signup (confirm-email, reset)  
│   ├── blog/* # Blog pages  
│   ├── dashboard/* # User dashboard  
│   ├── pricing/, privacy/ # Static pages  
│   ├── support/, tax-filing/  
│   ├── reset-pin/, sign-contract/  
│   └── components/ # ~100 UI components  
│       ├── AuthChecker.tsx, NotificationToast.tsx  
│       ├── SignaturePad.tsx # E-sign  
│       ├── Airtime.tsx, Electricity.tsx # Bill components  
│       ├── admin-components/  
│       ├── invoice/, Receipt-component/  
│       └── profile-operations/  
└── app/api/ # 100+ API routes  
    ├── auth/login|register/  
    ├── profile/ (KYC, pin-reset)  
    ├── invoice|receipt|contract/ (CRUD, sign, PDF, email)  
    ├── buy-airtime|data-bundle|electricity|cable-tv/  
    ├── p2p-transfer/, wallet-balance/  
    ├── admin-apis/* (users, transactions, audits)  
    └── notifications/, cron/  
```

## 🔍 Key Modules Explained

### 1. Frontend (app/)  
**layout.tsx**: Rich metadata (SEO/OG/Twitter/PWA), Providers (User/Auth/Session/Verification), Google Analytics

Pages: App router with dynamic segments e.g., `admin/transactions/[userId]/page.tsx`

Components: shadcn-based (modals, tables, forms), bill pay UIs, previews (`InvoicePreview.tsx`), admin tables/charts

### 2. API Routes (app/api/)  
Serverless handlers for:

**Core Business**: Invoices/receipts/contracts (drafts/sign/send/PDF/callbacks)

**Bills**: Nigeria-specific (providers, validate meter/smartcard, buy/pay)

**Finance**: Wallet ops, P2P, funding (debit card/virtual), journals/tax

**Admin**: Secure CRUD (`admin-apis/` subroutes)

**Auth/Notifs**: Login/register, multi-channel notifs (Supabase tables)

### 3. Lib/Services  
**Auth**: `admin-auth.ts` - Bearer/cookie token verify w/ Supabase admin client

**Notifications**: `notification-service.ts` - Create/log notifs (in_app/email/push/SMS), user prefs from DB

**Email**: Nodemailer templates (PIN reset, invoice confirm, login alerts)

**Audit**: Log user actions/emails

**Utils**: Fees, banks list, fetcher (SWR?), dashboard metrics

### 4. Database (Supabase inferred)  
Tables: `users` (prefs), `notifications|notification_logs`, `invoices|receipts|contracts`, `transactions`, `wallets`, `audit_logs`

### 5. Admin Features  
Dashboards for reconciliation, KYC, disputes, funding logs

Usage/trials/subscriptions tracking

## 🚀 Quick Start  
```bash
### Install
npm install

### Dev server
npm run dev # http://localhost:3000

### Build/Start
npm run build && npm start

### Lint
npm run lint  
```

**Environment Variables Required**:

```
NEXT_PUBLIC_GA*

Supabase keys

SITE_URL=zidwell.com

EMAIL_USER

NOMBA_URL
```

## 🌐 Deployment  
**Netlify**: `netlify.toml` (build: next build)

**PWA**: next-pwa enabled (sw.js, manifest)

**SEO**: Sitemap/robot.txt, schemas in layout

## 🏗️ Architecture Flow  
User auth → Supabase + middleware

Dashboard → API calls → Supabase CRUD

Bills/Payments → Provider APIs (Nomba?)

Sign/Send → SignaturePad → PDF gen → Email/DB

Admin → Token verify → Full access

## 📈 Features Map  
| Feature | API Routes | Components |  
|---------|------------|------------|  
| Invoices | invoice/* | InvoiceGen, previews |  
| Bills | buy-_/* | Airtime, CableBills |  
| Wallet | p2p-transfer, wallet-balance | Balance-card |  

## 🔐 Zidwell Authentication System  
A complete authentication solution for Next.js applications with Supabase, featuring HTTP-only cookies, session management, subscription tiers, and comprehensive user profiles.

### 🚀 Features  
**Secure Authentication**: Email/password authentication with HTTP-only cookies

**Session Management**: Auto-logout on inactivity, token refresh

**User Profiles**: Complete user profile management with BVN verification

**Subscription System**: Multi-tier subscription plans (Free, ZidLite, Growth, Premium, Elite)

**Email Verification**: Welcome emails and email confirmation

**Password Reset**: Complete password reset flow

**Admin Routes**: Protected admin areas with role-based access

**API Protection**: All API routes are publicly accessible (for client-side auth)

**Route Protection**: Middleware-based route protection for dashboard and admin areas

**BVN Verification**: Optional BVN verification for enhanced features

### 📋 Prerequisites  
Node.js 18+

Supabase account

Email service (Gmail or SMTP) for sending emails

Nomba API account (for virtual accounts)

### 🛠️ Installation  
```bash
# Clone the repository
git clone <your-repo-url>

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local  
```

### 🔧 Environment Variables  
Create a .env.local file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url  
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key  
SUPABASE_URL=your_supabase_url  
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000  
NEXT_PUBLIC_DEV_URL=http://localhost:3000

# Email Configuration
EMAIL_USER=your_email@gmail.com  
EMAIL_PASS=your_app_password

# Nomba API
NOMBA_URL=https://api.nomba.com  
NOMBA_ACCOUNT_ID=your_account_id  
NOMBA_SECRET_KEY=your_secret_key  
```

### 📁 Authentication Project Structure  
```
app/  
├── api/  
│   ├── login/  
│   │   └── route.ts # Login API endpoint  
│   ├── logout/  
│   │   └── route.ts # Logout API endpoint  
│   ├── register/  
│   │   └── route.ts # Registration API endpoint  
│   └── subscription/ # Subscription API endpoints  
├── auth/  
│   ├── login/  
│   │   └── page.tsx # Login page  
│   ├── register/  
│   │   └── page.tsx # Registration page  
│   ├── password-reset/  
│   │   ├── page.tsx # Request password reset  
│   │   └── update-password/  
│   │       └── page.tsx # Update password page  
│   └── verify-email/  
│       └── page.tsx # Email verification page  
├── context/  
│   └── userData.tsx # User context provider  
├── hooks/  
│   └── useAuth.ts # Authentication hooks  
└── lib/  
    ├── check-auth.ts # Auth utilities  
    └── middleware.ts # Route protection middleware  
```

### 🔐 Authentication Flow

#### 1. User Registration (/api/register)  
**Endpoint**: POST /api/register

**Request Body**:
```json  
{  
 "name": "John Doe",  
 "email": "john@example.com",  
 "phone": "08012345678",  
 "password": "securePassword123",  
 "bvn": "12345678901", // Optional  
 "transactionPin": "1234" // Optional  
}  
```

**Process**:
- Validates all input fields
- Hashes password and PIN
- Creates user in Supabase Auth
- Creates user profile in users table
- Generates unique referral code
- Creates virtual account via Nomba (if BVN provided)
- Sends welcome email
- Returns user data with 20 Zidcoin bonus

#### 2. User Login (/api/login)  
**Endpoint**: POST /api/login

**Request Body**:
```json  
{  
 "email": "john@example.com",  
 "password": "securePassword123"  
}  
```

**Process**:
- Authenticates with Supabase
- Sets HTTP-only cookies with tokens
- Fetches user profile from database
- Returns profile and verification status

**Response**:
```json  
{  
 "profile": {  
   "id": "uuid",  
   "fullName": "John Doe",  
   "email": "john@example.com",  
   "phone": "08012345678",  
   "zidcoinBalance": 20,  
   "bvnVerification": "pending",  
   "role": null,  
   "referralCode": "john-abc123",  
   "subscription_tier": "free"  
  },  
  "isVerified": false,  
  "isPending": false  
}  
```

#### 3. Session Management  
**Auto-logout**: Sessions expire after 15 minutes of inactivity (configurable)

Tracks mouse movements, clicks, keyboard activity

Monitors tab visibility

**Auto-logout on session expiration**

**Token Refresh**: Automatic token refresh when expired

Uses refresh token to get new access token

Updates HTTP-only cookies seamlessly

### 🛡️ Route Protection  
**Public Routes** (No Authentication Required)  
/ , /pricing, /blog/*

/auth/login, /auth/register

/auth/password-reset

/verify-email/*

All API routes (/api/*)

**Protected Routes** (Authentication Required)  
/dashboard/* - All dashboard routes

/admin/* - Admin dashboard

/blog/admin/* - Blog admin panel

**BVN Required Routes**  
These routes require BVN verification:

/dashboard/fund-account

/dashboard/services/buy-airtime

/dashboard/services/buy-data

/dashboard/services/buy-power

/dashboard/services/buy-cable-tv

**Premium Routes** (Subscription Required)  
| Route | Required Tier |  
|-------|---------------|  
| /dashboard/bookkeeping | Growth |  
| /dashboard/tax-calculator | Growth |  
| /dashboard/financial-statements | Premium |  
| /dashboard/tax-filing | Premium |  
| /dashboard/vat-filing | Elite |  
| /dashboard/paye-filing | Elite |  
| /dashboard/cfo-guidance | Elite |  

### 💾 Database Schema  
**Users Table**  
```sql  
CREATE TABLE users (  
  id UUID PRIMARY KEY,  
  full_name VARCHAR(255),  
  email VARCHAR(255) UNIQUE,  
  phone VARCHAR(20),  
  wallet_balance DECIMAL DEFAULT 0,  
  zidcoin_balance DECIMAL DEFAULT 20,  
  referral_code VARCHAR(100),  
  bvn_verification VARCHAR(50) DEFAULT 'not_submitted',  
  admin_role VARCHAR(50),  
  subscription_tier VARCHAR(50) DEFAULT 'free',  
  subscription_expires_at TIMESTAMP,  
  -- Additional fields…  
);  
```

**Pending Users Table**  
```sql  
CREATE TABLE pending_users (  
  id UUID PRIMARY KEY,  
  auth_id UUID,  
  first_name VARCHAR(255),  
  last_name VARCHAR(255),  
  email VARCHAR(255),  
  phone VARCHAR(20),  
  bvn_verification VARCHAR(50),  
  referred_by VARCHAR(100),  
  verified BOOLEAN DEFAULT false,  
  created_at TIMESTAMP  
);  
```

**Subscriptions Table**  
```sql  
CREATE TABLE subscriptions (  
  id UUID PRIMARY KEY,  
  user_id UUID REFERENCES users(id),  
  tier VARCHAR(50),  
  status VARCHAR(20),  
  amount DECIMAL,  
  payment_method VARCHAR(50),  
  payment_reference VARCHAR(255),  
  expires_at TIMESTAMP,  
  is_yearly BOOLEAN DEFAULT false  
);  
```

### 🧩 Components  
**Login Page** (/auth/login)  
- Email/password authentication
- Remember me functionality  
- Password visibility toggle
- Redirect after login
- Back navigation

**Registration Form**  
- Multi-step form with validation
- Step 1: Basic info (name, email, phone)
- Step 2: Security (password setup)
- Step 3: Wallet setup (BVN, PIN - optional)
- Real-time validation
- Success dialog with confetti animation

**Email Confirmation Page**  
- Auto-confirms email verification
- Redirects to login on success

**Password Reset Flow**  
- User requests reset via email
- Receives reset link
- Updates password
- Redirects to login

### 🔄 Context API  
**User Context** (`useUserContextData`)  
Provides global user state and functions:

```typescript  
const {  
  userData, // Current user data  
  balance, // Wallet balance  
  subscription, // Subscription details  
  subscriptionLoading, // Loading state  
  refreshSubscription, // Refresh subscription data  
  checkFeatureAccess, // Check if user can access a feature  
  canAccessFeature, // Synchronous feature check  
  subscribe, // Upgrade subscription  
  cancelSubscription, // Cancel subscription  
  getUpgradeBenefits // Get benefits for upgrading  
} = useUserContextData();  
```

### 🎯 Feature Access Control  
**Check Feature Access**  
```typescript  
// Check if user can access a feature  
const { hasAccess, limit, message } = await checkFeatureAccess(  
  'financial_statements',  
  currentCount // Current usage count  
);  
```

**Subscription Tiers**  
| Tier | Features |  
|------|----------|  
| Free | Basic invoicing (5 invoices, 5 receipts, 1 contract) |  
| ZidLite | 10 invoices, 10 receipts, 2 contracts, WhatsApp community |  
| Growth | Unlimited invoices/receipts, bookkeeping, tax calculator |  
| Premium | Everything in Growth + financial statements, tax support, priority support |  
| Elite | Everything in Premium + full tax filing, CFO guidance, audit coordination |  

### 🔒 Security Features  
- **HTTP-only Cookies**: Tokens stored in HTTP-only cookies (not accessible via JavaScript)
- **Token Refresh**: Automatic refresh of expired tokens
- **Session Expiry**: Auto-logout after inactivity
- **Password Hashing**: Passwords hashed with bcrypt (10 rounds)
- **PIN Encryption**: Transaction PINs encrypted
- **CORS Protection**: Same-site strict cookies
- **Route Protection**: Middleware-based route guarding

### 🚀 Deployment  
**Build the application**:
```bash  
npm run build  
```

**Start the production server**:
```bash  
npm start  
```

**For Vercel deployment**:
1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy

### 📝 API Routes Summary  
| Endpoint | Method | Description |  
|----------|--------|-------------|  
| /api/login | POST | Authenticate user and set session |  
| /api/logout | POST | Clear session and cookies |  
| /api/register | POST | Create new user account |  
| /api/subscription | GET | Get user subscription details |  
| /api/subscription | POST | Create or cancel subscription |  
| /api/wallet-balance | POST | Get wallet balance |  
| /api/total-inflow | POST | Get transaction statistics |  
| /api/notifications | GET | Get user notifications |  

### 🐛 Troubleshooting  
**Common Issues**  
**Login fails with "Invalid email or password"**
- Check email format
- Verify password strength (min 8 characters)
- Check if email is confirmed

**Session expires too quickly**
- Adjust `INACTIVITY_LIMIT` in SessionWatcher
- Check browser cookie settings

**API routes returning 401**
- API routes are now public, check if you're making requests correctly
- Verify authentication on client-side

**Subscription features not accessible**
- Check subscription tier in database
- Verify subscription expiration date
- Clear subscription cache

## 🤝 Contributing  
- Add components: `app/components/`
- New API: `app/api/[feature]/route.ts`
- See [TODO.md](TODO.md) for progress

## 📄 License  
This project is proprietary and confidential. Unauthorized copying or distribution is prohibited.

⭐ **Star on GitHub** | 💬 [Issues](https://github.com/user/repo/issues) | 🐛 [Bug Report](https://github.com/user/repo/issues/new)
