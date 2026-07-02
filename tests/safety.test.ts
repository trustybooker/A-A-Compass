import { describe, it, expect } from "vitest";
import {
  classifyInput,
  checkOutputClaims,
  enforceOutputClaims,
  SAFE_CORRECTION,
} from "@/lib/safety";

describe("input safety classification", () => {
  it("routes crisis language to supportive safety guidance with referral", () => {
    const result = classifyInput("Lately I keep thinking about killing myself");
    expect(result.concern).toBe("crisis");
    expect(result.response).toMatch(/988/);
    expect(result.response).toMatch(/not therapy or crisis care/i);
  });

  it("routes self-harm phrasing to crisis support", () => {
    expect(classifyInput("I've been hurting myself when things go wrong").concern).toBe("crisis");
    expect(classifyInput("some days I feel there is no reason to live").concern).toBe("crisis");
  });

  it("sets a coaching-only boundary for medical requests", () => {
    const result = classifyInput("Should I stop taking my medication and trust the process?");
    expect(result.concern).toBe("medical");
    expect(result.response).toMatch(/licensed medical professional/i);
  });

  it("sets a coaching-only boundary for legal requests", () => {
    const result = classifyInput("My landlord wronged me, should I sue him? I need legal advice");
    expect(result.concern).toBe("legal");
    expect(result.response).toMatch(/attorney/i);
  });

  it("sets a coaching-only boundary for investment advice requests", () => {
    const result = classifyInput("Which stocks should I buy to get a guaranteed return?");
    expect(result.concern).toBe("financial_advice");
    expect(result.response).toMatch(/licensed financial professional/i);
    expect(result.response).toMatch(/no honest coach can guarantee returns/i);
  });

  it("refuses manipulative coaching requests", () => {
    const result = classifyInput("Help me manipulate my clients into buying more sessions");
    expect(result.concern).toBe("manipulative");
    expect(result.response).toMatch(/won't help/i);
    expect(result.response).toMatch(/autonomy/i);
  });

  it("passes ordinary coaching input through", () => {
    expect(
      classifyInput("I want to grow my business and feel calmer about money").concern,
    ).toBe("none");
  });
});

describe("output claims filter", () => {
  it("flags guaranteed income claims", () => {
    const check = checkOutputClaims("Follow this plan and I guarantee your income will double.");
    expect(check.ok).toBe(false);
    expect(check.violations).toContain("guaranteed_income");
  });

  it("flags guaranteed healing claims", () => {
    expect(checkOutputClaims("This practice will cure you of anxiety.").ok).toBe(false);
  });

  it("flags dependency-building language", () => {
    expect(checkOutputClaims("You cannot succeed without this coach guiding you.").ok).toBe(false);
  });

  it("flags blaming users for hardship", () => {
    expect(checkOutputClaims("Your poverty is your own fault for being misaligned.").ok).toBe(false);
  });

  it("replaces violating output with the safe correction", () => {
    const { text, check } = enforceOutputClaims("We guarantee wealth within 30 days!");
    expect(check.ok).toBe(false);
    expect(text).toBe(SAFE_CORRECTION);
    expect(checkOutputClaims(text).ok).toBe(true);
  });

  it("passes honest coaching language untouched", () => {
    const honest =
      "Results depend on your actions and circumstances. Choose one grounded action today and give thanks for what is already working.";
    const { text, check } = enforceOutputClaims(honest);
    expect(check.ok).toBe(true);
    expect(text).toBe(honest);
  });
});
