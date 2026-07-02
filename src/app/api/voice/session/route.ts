import { prisma } from "@/lib/prisma";
import { requireFeature, errorResponse } from "@/lib/current-user";
import { audit } from "@/lib/audit";
import { buildPatternSummary } from "@/lib/patterns";
import { buildVoiceSessionInstructions } from "@/lib/coach-prompt";

/**
 * Mint an ephemeral realtime voice session for the premium A&A Aligned Voice
 * Coach. Pro only — the entitlement check happens HERE, server-side, before
 * any token is issued (docs/AA_Compass_v5_Voice_Architecture.md).
 */
export async function POST() {
  try {
    const user = await requireFeature("pro_voice");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json(
        {
          error:
            "The premium voice coach is not configured on this deployment yet. Your Pro access is active — please try again later or use a typed session meanwhile.",
        },
        { status: 503 },
      );
    }

    // Pattern memory: the Pro coach knows the user's recent history.
    const recent = await prisma.compassSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        area: true,
        currentState: true,
        fearText: true,
        createdAt: true,
        result: { select: { score: true } },
      },
    });
    const patterns = buildPatternSummary(
      recent
        .filter((s) => s.result)
        .map((s) => ({
          area: s.area,
          currentState: s.currentState,
          score: s.result!.score,
          fearText: s.fearText,
          createdAt: s.createdAt,
        })),
    );

    const model = process.env.OPENAI_REALTIME_MODEL ?? "gpt-4o-realtime-preview";
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        voice: "sage",
        instructions: buildVoiceSessionInstructions({ userName: user.name, patterns }),
      }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[voice] realtime session creation failed", response.status, detail);
      return Response.json(
        { error: "Could not start a voice session right now. Please try again." },
        { status: 502 },
      );
    }
    const realtime = (await response.json()) as { client_secret?: { value?: string } };

    const voiceSession = await prisma.voiceSession.create({
      data: { userId: user.id, kind: "REALTIME_PRO", model },
      select: { id: true },
    });
    await audit({
      userId: user.id,
      action: "voice.pro_session_started",
      targetType: "voice_session",
      targetId: voiceSession.id,
      metadata: { model },
    });

    return Response.json({
      voiceSessionId: voiceSession.id,
      model,
      clientSecret: realtime.client_secret?.value ?? null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
