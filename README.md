# A&A Compass v5

A voice-first prosperity alignment coach. It helps people turn desire into clarity, clarity into action, action into habit, and habit into a life that increases value for themselves and others.

Behavioral source of truth: **[docs/AA_Compass_v5_Skill_System_Prompt.md](docs/AA_Compass_v5_Skill_System_Prompt.md)** — it governs how the coach reasons, how sessions are structured, what every outcome must include, and what the app must never claim. The full production direction lives in [docs/](docs/).

## What it is — and is not

Every session runs the **6A Engine** (Awareness → Alignment → Aim → Action → Accumulation → Abundance) and always produces eight outputs: a truth reflection, the deeper value, one misalignment to release, a definite vision, one aligned action, one habit loop, one gratitude anchor, and one service/increase-life action.

It is **not** therapy, not financial/medical/legal advice, not a guaranteed manifestation system, and not an income promise. Safety filters enforce this in code (`src/lib/safety.ts`): crisis language gets supportive referral guidance (988 / findahelpline.com), out-of-scope requests get honest boundaries, manipulative coaching requests are refused, and no generated output may ship a prohibited claim.

## Public pricing (final for launch)

| Tier | Price | Purpose |
|---|---|---|
| Free | $0 | 1 daily typed Compass Reading, browser/device voice utility (honestly labeled), local-only history |
| Plus | $19/month | Unlimited sessions, cloud history, streaks & habits, saved listen mode, exports, 7/30-day plans, basic weekly summary |
| Pro | $99/month | Premium realtime **A&A Aligned Voice Coach**, pattern memory, advanced weekly coach reports, advanced guided modes, 30-day transformation plans, certification pathway *eligibility* |

Exactly three public tiers. No annual plans, trials, lifetime deals, or extra tiers. Entitlements are enforced **server-side** on every API route and page (`src/lib/current-user.ts`, `src/lib/tiers.ts`); client locks are UX only.

## Certification (Pro-only, never automatic)

The **A&A Compass Certified Alignment Coach** pathway (`src/lib/certification/`) requires, in order: application & purpose statement → ethics agreement → identity verification (staff) → 6 training modules → written assessment (≥80%, auto-scored server-side) → practical coaching simulation (staff-scored, ≥80) → supervised practice review (staff) → admin approval. Only then is a credential issued, with:

- a server-generated credential ID (`AAC-XXXXX-XXXXX`) and QR code,
- a public live verification page at `/certification/verify/[credentialId]` that always reflects active / suspended / revoked / expired status,
- annual renewal, and revocation rules — every credential event is audit-logged.

It is a proprietary coaching-method certification — not a therapy license, financial advisor license, medical/legal credential, or ICF credential.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Prisma + PostgreSQL · Auth.js (credentials, JWT sessions; tier/role always re-read from the DB per request) · Stripe Billing (Checkout + Customer Portal + signed webhooks) · OpenAI Realtime API for Pro voice (server-minted ephemeral tokens only) · Web Speech API for free browser voice · Vitest.

## Getting started

```bash
npm install
cp .env.example .env       # fill in values (see below)
npx prisma migrate deploy   # apply committed migrations to your Postgres
npm run db:seed             # optional: seed admin from SEED_ADMIN_* env vars
npm run dev
```

Schema changes go through migrations: edit `prisma/schema.prisma`, then `npx prisma migrate dev --name <change>` locally and commit the generated folder. (`npx prisma db push` remains available for throwaway dev databases.)

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | Auth.js JWT secret (`openssl rand -base64 32`) |
| `AUTH_TRUST_HOST` | Set to `true` behind a trusted proxy/host (Vercel, most PaaS) |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL (used in Stripe redirects and QR verification links) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe API + webhook signature verification |
| `STRIPE_PRICE_PLUS`, `STRIPE_PRICE_PRO` | The two recurring monthly prices ($19 / $99) |
| `OPENAI_API_KEY`, `OPENAI_REALTIME_MODEL` | Pro realtime voice (optional — the app degrades gracefully without it) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Password-reset emails via Resend (optional — resets degrade gracefully without it) |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Admin account for `npm run db:seed` |

### Stripe setup

Create two recurring monthly prices (Plus $19, Pro $99), put their IDs in the env, and point a webhook at `/api/stripe/webhook` with events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. The webhook verifies signatures and syncs the user's tier; cancellation keeps access until the period ends, then downgrades to Free.

## Deploying to Vercel

1. Create a Postgres database (Vercel Postgres, Neon, Supabase, or RDS) and copy its connection string.
2. Import the repository in Vercel (framework preset: Next.js — defaults work; `postinstall` runs `prisma generate` automatically).
3. In Vercel → Project → Settings → Environment Variables, set every variable from the table above for the Production environment (at minimum: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, `NEXT_PUBLIC_APP_URL=https://your-domain`, the four `STRIPE_*` vars; add `OPENAI_API_KEY` to enable the Pro voice coach).
4. Create the database schema from your machine: `DATABASE_URL="<prod-url>" npx prisma migrate deploy` (migrations are committed in `prisma/migrations/`).
5. Seed the admin: `DATABASE_URL="<prod-url>" SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run db:seed`, then change the password after first login.
6. Deploy, then point the Stripe webhook (below) at `https://your-domain/api/stripe/webhook` and set `STRIPE_WEBHOOK_SECRET` from the endpoint's signing secret. Redeploy so the new env takes effect.
7. Smoke-test live: sign up, run a free session, hit the daily limit, upgrade with Stripe test card `4242 4242 4242 4242` (test mode), confirm the tier badge flips, then switch Stripe to live keys.

## Tests

```bash
npm test        # 9 suites: entitlements, engine, safety, billing, certification, limits, reports, rate limiting, password reset
npm run build   # production build with type checking
```

Point your uptime monitor at `GET /api/health` (checks database connectivity).

The suite covers the launch test plan (docs/AA_Compass_v5_Test_Plan.md): tier entitlements and pricing, the free daily limit, required 6A outputs for every tier/area, plans by tier, Stripe webhook entitlement sync (incl. cancellation and unknown-price rejection), safety classification (crisis / medical / legal / financial / manipulative) and the output claims filter, certification gating (every missing requirement blocks approval; revoked/expired credentials can never display as active), pattern memory, and weekly reports by tier.

## Repository layout

```
docs/        Product source-of-truth documents (v5 production package)
prisma/      Schema (13 tables incl. audit_logs, credential_events) + seed
prototype/   Original static no-backend prototype, kept for reference
public/      Optimized visual assets (WebP)
src/lib/     Core logic: 6A engine, tiers/entitlements, safety, billing sync,
             certification pathway + credential, patterns, reports, coach prompt
src/app/     Pages + API routes (all entitlements enforced server-side)
tests/       Vitest suite mirroring the production test plan
```
