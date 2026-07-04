import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { rateLimit, clientIpFrom, tooManyRequests } from "@/lib/rate-limit";
import { prismaRateLimitStore } from "@/lib/rate-limit-store";

const registerSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
  name: z.string().min(1).max(120).optional(),
});

export async function POST(req: Request) {
  const ipLimit = await rateLimit(prismaRateLimitStore, {
    key: `register:ip:${clientIpFrom(req)}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.ok) return tooManyRequests(ipLimit);

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: parsed.data.name ?? null },
  });
  await audit({ userId: user.id, action: "auth.registered", targetType: "user", targetId: user.id });

  return Response.json({ ok: true }, { status: 201 });
}
