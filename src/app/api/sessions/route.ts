import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, requireFeature, errorResponse } from "@/lib/current-user";
import { AREAS, STATES, ADVANCED_MODES } from "@/lib/compass/engine";
import { createSessionOutcome, startOfUtcDay, type SessionRepo } from "@/lib/sessions";
import { dailySessionLimit, hasFeature } from "@/lib/tiers";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { prismaRateLimitStore } from "@/lib/rate-limit-store";

const createSchema = z.object({
  area: z.enum(AREAS),
  state: z.enum(STATES),
  desire: z.string().max(4000).default(""),
  fear: z.string().max(4000).default(""),
  gratitude: z.string().max(4000).default(""),
  coachingMode: z.enum(ADVANCED_MODES).optional(),
});

const sessionRepo: SessionRepo = {
  countSessionsSince(userId, since) {
    return prisma.compassSession.count({ where: { userId, createdAt: { gte: since } } });
  },
};

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    // Abuse guard for paid tiers ("unlimited" means unmetered human use, not
    // scripted bulk generation). Free tier is separately capped at 1/day.
    const usage = await rateLimit(prismaRateLimitStore, {
      key: `sessions:user:${user.id}`,
      limit: 100,
      windowMs: 24 * 60 * 60 * 1000,
    });
    if (!usage.ok) return tooManyRequests(usage);

    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid session input." }, { status: 400 });
    }
    const input = parsed.data;

    // Advanced guided modes are a Pro feature; ignore the flag for other tiers
    // rather than failing the whole session.
    const coachingMode = hasFeature(user.tier, "advanced_modes") ? input.coachingMode : undefined;

    const outcome = await createSessionOutcome(sessionRepo, {
      userId: user.id,
      tier: user.tier,
      input: {
        area: input.area,
        state: input.state,
        desire: input.desire,
        fear: input.fear,
        gratitude: input.gratitude,
        coachingMode,
      },
    });

    if (outcome.kind === "safety") {
      // Safety responses are never stored as readings and never rate-limited.
      return Response.json({
        kind: "safety",
        concern: outcome.safety.concern,
        message: outcome.safety.response,
      });
    }

    if (outcome.kind === "limit") {
      return Response.json({ kind: "limit", error: outcome.message }, { status: 429 });
    }

    const reading = outcome.reading;
    // Persist for every tier: the record enforces the free daily limit and the
    // History FEATURE (cloud history) stays gated to Plus/Pro at read time.
    // freeDayKey + unique(userId, freeDayKey) is the race-proof backstop for
    // the 1/day free limit — concurrent requests cannot both insert.
    const isLimited = Number.isFinite(dailySessionLimit(user.tier));
    const freeDayKey = isLimited ? startOfUtcDay().toISOString().slice(0, 10) : null;
    let session: { id: string };
    try {
      session = await prisma.compassSession.create({
        data: {
          userId: user.id,
          area: input.area,
          currentState: input.state,
          desireText: input.desire,
          fearText: input.fear,
          gratitudeText: input.gratitude,
          coachingMode: coachingMode ?? null,
          source: "TYPED",
          freeDayKey,
          result: {
            create: {
              score: reading.score,
              alignmentMode: reading.alignmentMode,
              truthReflection: reading.truthReflection,
              deeperValue: reading.deeperValue,
              misalignmentToRelease: reading.misalignmentToRelease,
              definiteVision: reading.definiteVision,
              alignedAction: reading.alignedAction,
              habitLoop: reading.habitLoop,
              gratitudeAnchor: reading.gratitudeAnchor,
              serviceAction: reading.serviceAction,
              plan7Day: reading.plan7Day ?? null,
              plan30Day: reading.plan30Day ?? null,
              fullText: reading.fullText,
            },
          },
        },
        select: { id: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        // Concurrent free-tier request lost the race — same message as the count check.
        return Response.json(
          {
            kind: "limit",
            error:
              "You've used today's free Compass Reading. Come back tomorrow — or upgrade to Plus for unlimited sessions, saved history, and deeper plans.",
          },
          { status: 429 },
        );
      }
      throw error;
    }

    return Response.json({ kind: "reading", sessionId: session.id, reading });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET() {
  try {
    // Cloud history is a Plus/Pro feature (Free keeps local-only history).
    const user = await requireFeature("cloud_history");
    const sessions = await prisma.compassSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { result: true },
    });
    return Response.json({ sessions });
  } catch (error) {
    return errorResponse(error);
  }
}
