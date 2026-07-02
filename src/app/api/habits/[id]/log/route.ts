import { prisma } from "@/lib/prisma";
import { requireFeature, errorResponse } from "@/lib/current-user";
import { startOfUtcDay } from "@/lib/sessions";

/** Log today's completion for a habit (idempotent per day). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireFeature("habit_tracking");
    const { id } = await params;
    const habit = await prisma.habit.findFirst({ where: { id, userId: user.id } });
    if (!habit) {
      return Response.json({ error: "Habit not found." }, { status: 404 });
    }
    const today = startOfUtcDay();
    const log = await prisma.habitLog.upsert({
      where: { habitId_logDate: { habitId: habit.id, logDate: today } },
      update: { completed: true },
      create: { habitId: habit.id, userId: user.id, logDate: today, completed: true },
    });
    return Response.json({ log });
  } catch (error) {
    return errorResponse(error);
  }
}
