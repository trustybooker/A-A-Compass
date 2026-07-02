# A&A Compass v5 - Production Build Spec

## Product
A&A Compass is a voice-first prosperity alignment coach. It helps people turn desire into clarity, clarity into action, action into habit, and habit into a life that increases value for themselves and others.

## What it is not
- Not therapy.
- Not financial, medical, or legal advice.
- Not a guaranteed manifestation system.
- Not an income promise.
- Not a spiritual authority or dependency system.

## Source-derived engine
The two source documents converge into one practical system:
- Thought creates direction.
- Imagination gives form.
- Faith creates calm certainty.
- Action expresses inner decision.
- Habit shapes destiny.
- Gratitude expands awareness.
- Creative action and service turn prosperity into increase.

## 6A Engine
1. Awareness - what is true now?
2. Alignment - what fear/contradiction must release?
3. Aim - what definite vision guides the user?
4. Action - what grounded step happens today?
5. Accumulation - what habit loop compounds it?
6. Abundance/Increase - how does this create value for self and others?

## Public tiers
### Free
Purpose: prove the first outcome.
- 1 daily Compass Reading.
- Basic score and mode.
- One action, one habit loop, one gratitude anchor, one service action.
- Browser-native speech-to-text if supported.
- Browser-native read-aloud if supported.
- Local-only history in MVP.
- Clear label: browser voice is device/browser voice, not premium aligned voice.

### Plus - $19/month
Purpose: consistency and saved progress.
- Unlimited typed Compass sessions.
- Cloud session history.
- Streaks, habit loops, reminders.
- Saved listen mode/read-aloud.
- 7-day and 30-day plans.
- Export readings as PDF/TXT.
- Pattern summaries based on saved sessions.
- No premium realtime voice coach.
- No certification pathway.

### Pro - $99/month
Purpose: transformation and coaching depth.
- Everything in Plus.
- Premium A&A Aligned Voice Coach.
- Realtime guided sessions with smart follow-up questions.
- Pattern memory.
- Weekly reports.
- Advanced modes: Money, Business, Purpose, Discipline, Peace, Fear Release, Gratitude, Night Review.
- 30-day transformation plans.
- Pro-only certification pathway eligibility.

## Certification
Certification is not automatically granted by subscribing to Pro.
Requirements:
- Pro subscription active.
- Application approved.
- Identity verification.
- Ethics agreement.
- Training completion.
- Written assessment.
- Practical coaching simulation.
- Supervised practice review.
- Credential ID and QR verification.
- Annual renewal.
- Revocation rules.

## Pages
- / landing
- /pricing
- /auth/sign-up
- /auth/login
- /dashboard
- /session/new
- /session/listen
- /session/voice-pro
- /history
- /habits
- /weekly-report
- /certification
- /certification/verify/[credentialId]
- /billing
- /settings/data
- /legal/terms
- /legal/privacy
- /legal/disclaimer

## Server-side enforcement
Entitlements must be checked server-side. Client locks are UX only.

## Database tables
- users
- subscriptions
- compass_sessions
- compass_results
- actions
- habits
- habit_logs
- voice_sessions
- weekly_reports
- certification_applications
- certifications
- credential_events
- audit_logs

## Stripe setup
Use Stripe Billing for Plus and Pro monthly recurring prices. Use Checkout for upgrade and Customer Portal for subscription management. Webhooks must verify signature and update subscription status.

## Voice setup
Free: browser-native Web Speech API where supported.
Plus: saved listen mode and optional higher-quality TTS narration later.
Pro: realtime voice agent with server-issued ephemeral token/session, tool calling, memory retrieval, guardrails, and strict action-confirmation rules.

## Production tests
- Free session generation.
- Daily limit enforcement.
- Plus upgrade unlocks unlimited/saved/history/export.
- Pro unlocks voice coach and weekly report.
- Certification remains locked until approved.
- Stripe webhook updates entitlement.
- User can export/delete data.
- Safety refusal and crisis escalation.
- Voice unsupported fallback.
