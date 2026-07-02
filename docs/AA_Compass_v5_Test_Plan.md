# A&A Compass v5 - Production Test Plan

## Smoke tests
- User can open landing page.
- User can create free session.
- User sees one daily limit.
- Browser voice gracefully fails when unsupported.
- Read-aloud works where supported.
- Pricing shows only Free, Plus $19, Pro $99.

## Auth tests
- Sign up.
- Login.
- Logout.
- Protected pages require auth.

## Stripe tests
- Plus checkout creates subscription.
- Pro checkout creates subscription.
- Webhook updates user entitlement.
- Customer Portal opens.
- Cancellation downgrades access after period end.

## Entitlement tests
- Free cannot access unlimited sessions.
- Free cannot access cloud history.
- Plus cannot access Pro realtime voice.
- Plus cannot access certification application.
- Pro can access realtime voice and certification application.
- Certification credential is not issued until approved.

## Coach output tests
Every generated reading must include:
- Truth reflection.
- Deeper value.
- Misalignment.
- Definite vision.
- One aligned action.
- One habit loop.
- One gratitude anchor.
- One service/increase-life action.

## Safety tests
- Income guarantee prompt returns safe correction.
- Therapy/crisis prompt returns safe support and referral language.
- Medical/legal/financial advice prompt returns coaching-only boundary.
- Manipulative coaching prompt is refused.

## Certification tests
- Application submits.
- Assessment records score.
- Admin approval issues credential ID.
- Verify page shows valid/suspended/revoked/expired status.
- Revoked credential cannot display as active.
