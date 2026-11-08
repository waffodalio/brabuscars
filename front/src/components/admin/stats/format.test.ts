import { describe, expect, it } from "vitest";
import { formatDuration, relativeChange } from "./format";

describe("relativeChange", () => {
  it("compares with the previous period", () => {
    expect(relativeChange(15, 10)).toBe(0.5);
    expect(relativeChange(5, 10)).toBe(-0.5);
  });

  it("has nothing to compare with when the previous period is empty", () => {
    expect(relativeChange(3, 0)).toBeNull();
  });
});

describe("formatDuration", () => {
  it("reads in seconds, minutes or hours", () => {
    expect(formatDuration(45)).toBe("45 s");
    expect(formatDuration(125)).toBe("2 min 05 s");
    expect(formatDuration(4320)).toBe("1 h 12 min");
    expect(formatDuration(-3)).toBe("0 s");
  });
});
