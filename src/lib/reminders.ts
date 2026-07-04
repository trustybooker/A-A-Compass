// Daily habit reminder emails — a Plus/Pro feature from the tier matrix
// ("streaks, habit loops, reminders"). Opt-in only, one per day via cron,
// and only when there is actually something to do (active habits, none
// logged yet today). Copy follows the skill prompt: warm, practical, no
// pressure, no dependency language.

import type { EmailMessage } from "@/lib/email";

export interface ReminderCandidate {
  email: string;
  name: string | null;
  habitNames: string[];
  loggedToday: boolean;
}

export function shouldSendReminder(candidate: ReminderCandidate): boolean {
  return candidate.habitNames.length > 0 && !candidate.loggedToday;
}

export function buildReminderEmail(candidate: ReminderCandidate): EmailMessage {
  const first = candidate.habitNames[0];
  const greeting = candidate.name ? `Hi ${candidate.name},` : "Hi,";
  return {
    to: candidate.email,
    subject: "Your habit loop is waiting — one small promise today",
    text: [
      greeting,
      "",
      candidate.habitNames.length === 1
        ? `Your habit loop "${first}" hasn't been logged today.`
        : `You have ${candidate.habitNames.length} habit loops, and none are logged yet today (starting with "${first}").`,
      "",
      "Small, kept promises compound. Ten minutes of alignment, one focused action, three minutes of gratitude — then log it and let today count.",
      "",
      `Log it here: ${(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}/habits`,
      "",
      "You can turn these reminders off anytime on your Habits page.",
    ].join("\n"),
  };
}
