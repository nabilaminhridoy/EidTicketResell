# ETR Marketplace (Eid Ticket Resell)

A production-grade, highly scalable marketplace for secondary ticket reselling. Designed with strong financial atomicity, strict escrow management, fraud fingerprinting, and hybrid event notifications.

## 🚀 Core Features

- **Secure Ticket Escrow (Phase 1-3)**: Automatic allocation of Seller and Buyer wallets routing into explicitly tracked `pendingBalance` and `lockedBalance`. 
- **Admin Configuration Center (Phase 4)**: A Next.js SaaS-styled command center. Update generic Payment Gateways (`bKash`, `SSLCommerz`) and perform moderation without touching code via dynamic Prisma JSON configs.
- **Fraud & Security Hardening (Phase 5)**: Automated Upstash Edge Rate Limiting guarding against scraper attacks. Strict IP/User-Agent telemetry logs flagged anomaly logins into a dedicated Security Operations Center.
- **Disputes & Hybrid Refunds (Phase 6)**: Absolute `$transaction` atomicity. Resolving disputes pushes direct ledger decrements with 1-to-1 matching to `Refund` receipts without race conditions.
- **Notifications & Storefront (Phase 7)**: Hybrid Event messaging engine (Resend + Nodemailer fallback). SSR optimized Public Ticket storefront filtering instantly by Route, Date, and Class via `force-dynamic`.

## 🛠 Tech Stack

- **Framework**: Next.js (App Router, Server Components)
- **Database Modeler**: Prisma ORM (MySQL / PostgreSQL capable)
- **Security**: `@upstash/ratelimit`, `jose` (Edge-compatible JWTs), `bcryptjs`
- **Cache & Throttling**: Upstash (Redis)
- **Email Abstraction**: `resend` & `nodemailer`
- **Styling**: Tailwind CSS & Lucide Icons

## ⚙️ Environment Configuration

You must supply these variables internally to hook up Escrow and Edge protections correctly:

```env
# Database Initialization
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/etr"

# JWT Secret for jose-based Auth
JWT_SECRET="YOUR_SUPER_SECURE_SECRET"

# Next.js Public
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Redis Edge Throttling (Required for Security Hardening)
UPSTASH_REDIS_REST_URL="https://your-upstash-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# Email Configuration (Resend is Primary; SMTP is fallback)
RESEND_API_KEY="re_123456789"
# Or
SMTP_HOST="smpt.mail.com"
SMTP_PORT="587"
SMTP_USER="user"
SMTP_PASS="pass"

# Escrow Ledger CRON
CRON_SECRET="RANDOM_LONG_STRING"
```

## 🏗 Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Sync the Native Schema:**
   *(Ensure your DB server is running)*
   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. **Run the Initialization Flow:**
   ```bash
   npm run dev
   ```
   Navigate to `localhost:3000/install` to instantiate the `SUPER_ADMIN` account natively.

## 📊 Vercel Deployment

ETR is highly optimized for serverless edge scaling:
1. Ensure `prisma.config.ts` matches Vercel data integrations.
2. Hook up CRON schedulers mapping to `/api/cron/reconcile-escrow` referencing your `CRON_SECRET` safely.
3. Use the exact Vercel Deployment panel to attach your production URL.
