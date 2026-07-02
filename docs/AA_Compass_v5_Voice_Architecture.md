# A&A Compass v5 - Voice Architecture

## Voice policy
Voice must serve outcomes. It should not be a gimmick or only read text.

## Free voice
Free includes browser-native voice input/read-aloud where supported.
Label it clearly:
"Free voice uses your browser/device voice features. Quality and availability may vary. Premium A&A Aligned Voice Coach is available in Pro."

Why this makes sense:
- Low friction.
- Users experience the idea immediately.
- No high AI cost on free users.
- Honest expectations.

## Plus voice
Plus includes saved listen mode:
- Unlimited readings.
- Saved audio/read-aloud sessions.
- 7-day/30-day plans.
- Browser voice can still be used, but the value is consistency and saving.

## Pro voice
Pro includes premium A&A Aligned Voice Coach:
- Realtime conversation.
- Interruptions and follow-up questions.
- Pattern memory from prior sessions.
- Weekly reports.
- Advanced guided modules.
- Higher-quality aligned voice/personality.

## Pro voice session flow
1. Ask what the user seeks alignment around.
2. Listen to answer.
3. Reflect truth.
4. Ask 2-5 smart follow-up questions.
5. Identify desire, fear, deeper value, and pattern.
6. Produce outcome: vision, action, habit, gratitude, service.
7. Save session summary.
8. Offer next check-in.

## Guardrails
- Voice coach cannot claim guaranteed outcomes.
- Voice coach cannot replace therapy or professional advice.
- Voice coach cannot encourage dependency.
- Voice coach must preserve user autonomy.
- Voice coach must handle crisis language with supportive safety guidance.
- Voice coach cannot take external actions without explicit confirmation.

## Implementation
MVP:
- Browser Web Speech API for speech recognition and synthesis.

Production:
- Server creates realtime voice session for Pro users only.
- Server checks entitlement before session token.
- Realtime agent receives system prompt and session context.
- Session summaries save to database.
- Weekly report aggregates sessions.
