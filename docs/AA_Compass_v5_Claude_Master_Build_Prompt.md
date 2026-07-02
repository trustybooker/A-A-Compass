# Claude Master Build Prompt - A&A Compass v5

You are building A&A Compass v5 as a production-ready web app.

## Hard requirements
- Public pricing must be exactly: Free, Plus $19/month, Pro $99/month.
- Do not add annual plans, extra tiers, lifetime deals, trials, Creator tier, or separate certification tier at MVP launch.
- Certification must be a Pro-only gated pathway, not automatic.
- Free browser voice must be clearly labeled as browser/device voice, not premium aligned voice.
- Pro gets premium realtime A&A Aligned Voice Coach.
- Every session must output truth, deeper value, misalignment, definite vision, action, habit loop, gratitude anchor, and service action.

## Stack recommendation
- Next.js App Router + TypeScript.
- Postgres + Prisma or Drizzle.
- Stripe Billing + Checkout + Customer Portal.
- OpenAI Realtime API for Pro voice.
- Browser Web Speech API only for free/basic voice utility.
- Tailwind or CSS modules.
- Auth.js, Clerk, Supabase Auth, or equivalent secure auth.

## Product pages
Build:
- Landing page.
- Pricing page.
- Auth pages.
- Dashboard.
- New Compass session.
- History.
- Habits/streaks.
- Plus export/listen mode.
- Pro voice coach page.
- Pro weekly report page.
- Pro certification application and progress page.
- Public credential verification page.
- Billing/customer portal page.
- Legal pages.

## Tests
Implement tests for:
- Tier entitlement access.
- Session generation logic.
- Stripe webhook update.
- Browser voice fallback.
- Pro voice locked for non-Pro.
- Certification locked until approval.
- Safety claims filters.
- Data export/delete.

## Safety
Never let AI outputs promise income, guaranteed manifestation, healing, or professional advice. Add guardrails and disclaimers across the app.

## Definition of done
The app is done when a user can sign up, run a free session, upgrade to Plus, save history, upgrade to Pro, access the voice coach, see weekly reports, and apply for certification while all server-side entitlements are enforced.
