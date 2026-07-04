import { describe, it, expect } from "vitest";
import { shouldSendReminder, buildReminderEmail } from "@/lib/reminders";
import { checkOutputClaims } from "@/lib/safety";

const base = {
  email: "user@example.com",
  name: "Ada",
  habitNames: ["10-20-3 alignment loop"],
  loggedToday: false,
};

describe("reminder eligibility", () => {
  it("reminds when a habit exists and nothing is logged today", () => {
    expect(shouldSendReminder(base)).toBe(true);
  });

  it("does not remind when today's loop is already logged", () => {
    expect(shouldSendReminder({ ...base, loggedToday: true })).toBe(false);
  });

  it("does not remind users with no habits", () => {
    expect(shouldSendReminder({ ...base, habitNames: [] })).toBe(false);
  });
});

describe("reminder email copy", () => {
  it("names the habit, links to the habits page, and mentions how to opt out", () => {
    const message = buildReminderEmail(base);
    expect(message.to).toBe("user@example.com");
    expect(message.text).toContain("10-20-3 alignment loop");
    expect(message.text).toContain("/habits");
    expect(message.text).toMatch(/turn these reminders off/i);
  });

  it("handles multiple habits and missing names", () => {
    const message = buildReminderEmail({
      ...base,
      name: null,
      habitNames: ["loop one", "loop two", "loop three"],
    });
    expect(message.text).toContain("3 habit loops");
    expect(message.text).toContain("Hi,");
  });

  it("never contains prohibited claims or dependency language", () => {
    const message = buildReminderEmail(base);
    expect(checkOutputClaims(`${message.subject}\n${message.text}`).ok).toBe(true);
    expect(message.text).not.toMatch(/you (must|need to|cannot succeed)/i);
  });
});
