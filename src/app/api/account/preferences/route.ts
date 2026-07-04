import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireFeature, errorResponse } from "@/lib/current-user";
import { audit } from "@/lib/audit";

const preferencesSchema = z.object({
  reminderOptIn: z.boolean(),
});

/** Update notification preferences. Reminders are a Plus/Pro feature. */
export async function PATCH(req: Request) {
  try {
    const user = await requireFeature("reminders");
    const body = await req.json().catch(() => null);
    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid preferences." }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { reminderOptIn: parsed.data.reminderOptIn },
    });
    await audit({
      userId: user.id,
      action: "account.preferences_updated",
      metadata: { reminderOptIn: parsed.data.reminderOptIn },
    });
    return Response.json({ ok: true, reminderOptIn: parsed.data.reminderOptIn });
  } catch (error) {
    return errorResponse(error);
  }
}
