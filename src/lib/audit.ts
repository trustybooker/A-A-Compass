import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface AuditEntry {
  userId?: string | null;
  actorId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Append-only audit trail. Best-effort: an audit failure must never take down
 * the user-facing operation, but it is logged loudly.
 */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        actorId: entry.actorId ?? null,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        metadata: (entry.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write audit log", entry.action, error);
  }
}
