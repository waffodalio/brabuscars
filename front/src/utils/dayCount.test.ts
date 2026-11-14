import { describe, expect, it } from "vitest";
import { daysWord, durationDays, sinceDays } from "./dayCount";

describe("day counts", () => {
  it("never shows « 0 j » for a date", () => {
    expect(sinceDays(0)).toBe("aujourd'hui");
    expect(sinceDays(1)).toBe("hier");
    expect(sinceDays(1200)).toBe("1 200 j");
  });

  it("shows « < 1 j » for a short average", () => {
    expect(durationDays(0)).toBe("< 1 j");
    expect(durationDays(0.4)).toBe("< 1 j");
    expect(durationDays(3.6)).toBe("4 j");
  });

  it("agrees « jour » with the count", () => {
    expect([daysWord(1), daysWord(2)]).toEqual(["jour", "jours"]);
  });
});
