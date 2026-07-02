import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tierFromDb, type TierId, type Feature, hasFeature } from "@/lib/tiers";

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  tier: TierId;
  role: "USER" | "ADMIN";
}

/**
 * Resolve the signed-in user with a FRESH tier from the database.
 * This is the single entry point for server-side entitlement checks —
 * client-side locks are UX only (docs/AA_Compass_v5_Production_Build_Spec.md).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, tier: true, role: true },
  });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    tier: tierFromDb(user.tier),
    role: user.role,
  };
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "You must be signed in.");
  return user;
}

export async function requireFeature(feature: Feature): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasFeature(user.tier, feature)) {
    throw new HttpError(403, `Your plan does not include this feature (${feature}).`);
  }
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new HttpError(403, "Admin access required.");
  return user;
}

/** Uniform JSON error responses for API routes. */
export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("[api] unexpected error", error);
  return Response.json({ error: "Something went wrong." }, { status: 500 });
}
