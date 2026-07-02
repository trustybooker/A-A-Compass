import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireFeature, errorResponse } from "@/lib/current-user";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  cadence: z.enum(["daily", "weekly"]).default("daily"),
});

export async function GET() {
  try {
    // Cloud habit tracking is Plus/Pro; Free tracks locally in the browser.
    const user = await requireFeature("habit_tracking");
    const habits = await prisma.habit.findMany({
      where: { userId: user.id, archived: false },
      orderBy: { createdAt: "asc" },
      include: { logs: { orderBy: { logDate: "desc" }, take: 60 } },
    });
    return Response.json({ habits });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireFeature("habit_tracking");
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid habit." }, { status: 400 });
    }
    const habit = await prisma.habit.create({
      data: { userId: user.id, name: parsed.data.name, cadence: parsed.data.cadence },
    });
    return Response.json({ habit }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
