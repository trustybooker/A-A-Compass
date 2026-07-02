import { describe, it, expect } from "vitest";
import {
  TIERS,
  hasFeature,
  dailySessionLimit,
  tierAtLeast,
  tierFromDb,
  BROWSER_VOICE_LABEL,
} from "@/lib/tiers";

describe("public pricing", () => {
  it("has exactly three public tiers: Free $0, Plus $19, Pro $99", () => {
    expect(Object.keys(TIERS)).toEqual(["free", "plus", "pro"]);
    expect(TIERS.free.priceMonthly).toBe(0);
    expect(TIERS.plus.priceMonthly).toBe(19);
    expect(TIERS.pro.priceMonthly).toBe(99);
  });

  it("does not present certification as automatic anywhere in tier copy", () => {
    const proCopy = [...TIERS.pro.access, ...TIERS.pro.locked].join(" ").toLowerCase();
    expect(proCopy).toContain("not automatic");
    expect(TIERS.pro.locked.join(" ").toLowerCase()).toContain("automatic certification");
  });
});

describe("tier entitlement access", () => {
  it("free cannot access unlimited sessions, cloud history, pro voice, or certification", () => {
    expect(hasFeature("free", "unlimited_sessions")).toBe(false);
    expect(hasFeature("free", "cloud_history")).toBe(false);
    expect(hasFeature("free", "pro_voice")).toBe(false);
    expect(hasFeature("free", "certification_pathway")).toBe(false);
    expect(hasFeature("free", "weekly_report_basic")).toBe(false);
    expect(hasFeature("free", "exports")).toBe(false);
  });

  it("free can run a daily session with a 7-day plan", () => {
    expect(hasFeature("free", "session_daily")).toBe(true);
    expect(hasFeature("free", "plan_7day")).toBe(true);
  });

  it("plus unlocks unlimited/saved/history/export but NOT pro voice or certification", () => {
    expect(hasFeature("plus", "unlimited_sessions")).toBe(true);
    expect(hasFeature("plus", "cloud_history")).toBe(true);
    expect(hasFeature("plus", "exports")).toBe(true);
    expect(hasFeature("plus", "saved_listen_mode")).toBe(true);
    expect(hasFeature("plus", "weekly_report_basic")).toBe(true);
    expect(hasFeature("plus", "pro_voice")).toBe(false);
    expect(hasFeature("plus", "certification_pathway")).toBe(false);
    expect(hasFeature("plus", "weekly_report_advanced")).toBe(false);
    expect(hasFeature("plus", "advanced_modes")).toBe(false);
  });

  it("pro unlocks realtime voice, pattern memory, advanced reports, and certification eligibility", () => {
    expect(hasFeature("pro", "pro_voice")).toBe(true);
    expect(hasFeature("pro", "pattern_memory")).toBe(true);
    expect(hasFeature("pro", "weekly_report_advanced")).toBe(true);
    expect(hasFeature("pro", "advanced_modes")).toBe(true);
    expect(hasFeature("pro", "certification_pathway")).toBe(true);
  });

  it("enforces the free daily limit of exactly 1", () => {
    expect(dailySessionLimit("free")).toBe(1);
    expect(dailySessionLimit("plus")).toBe(Number.POSITIVE_INFINITY);
    expect(dailySessionLimit("pro")).toBe(Number.POSITIVE_INFINITY);
  });

  it("orders tiers free < plus < pro", () => {
    expect(tierAtLeast("pro", "plus")).toBe(true);
    expect(tierAtLeast("plus", "pro")).toBe(false);
    expect(tierAtLeast("free", "free")).toBe(true);
  });

  it("maps database enum values to tier ids", () => {
    expect(tierFromDb("FREE")).toBe("free");
    expect(tierFromDb("PLUS")).toBe("plus");
    expect(tierFromDb("PRO")).toBe("pro");
  });
});

describe("browser voice labeling", () => {
  it("honestly labels free voice as browser/device voice", () => {
    expect(BROWSER_VOICE_LABEL).toMatch(/browser\/device voice/i);
    expect(BROWSER_VOICE_LABEL).toMatch(/Pro/);
  });
});
