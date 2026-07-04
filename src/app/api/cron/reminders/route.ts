import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { sendEmail, emailConfigured } from "@/lib/email";
import { shouldSendReminder, buildReminderEmail } from "@/lib/reminders";
import { startOfUtcDay } from "@/lib/sessions";

/**
 * Daily habit reminders. Invoked by Vercel Cron (vercel.json), which sends
 * `Authorization: Bearer ${CRON_SECRET}` automatically when the env var is set.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!emailConfigured()) {
    return Response.json({ ok: true, skipped: "email not configured", sent: 0 });
  }

  const today = startOfUtcDay();
  const users = await prisma.user.findMany({
    where: {
      reminderOptIn: true,
      tier: { in: ["PLUS", "PRO"] }, // reminders are a paid-tier feature
    },
    select: {
      id: true,
      email: true,
      name: true,
      habits: {
        where: { archived: false },
        select: { name: true, logs: { where: { logDate: today }, select: { id: true } } },
      },
    },
  });

  let sent = 0;
  for (const user of users) {
    const candidate = {
      email: user.email,
      name: user.name,
      habitNames: user.habits.map((h) => h.name),
      loggedToday: user.habits.some((h) => h.logs.length > 0),
    };
    if (!shouldSendReminder(candidate)) continue;
    if (await sendEmail(buildReminderEmail(candidate))) sent += 1;
  }

  await audit({
    actorId: "cron",
    action: "cron.reminders_run",
    metadata: { candidates: users.length, sent },
  });
  return Response.json({ ok: true, candidates: users.length, sent });
}
