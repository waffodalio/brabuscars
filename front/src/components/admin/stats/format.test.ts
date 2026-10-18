import { describe, expect, it } from "vitest";
import { relativeChange } from "./format";

describe("relativeChange", () => {
  it("compares with the previous period", () => {
    expect(relativeChange(15, 10)).toBe(0.5);
    expect(relativeChange(5, 10)).toBe(-0.5);
  });

  it("has nothing to compare with when the previous period is empty", () => {
    expect(relativeChange(3, 0)).toBeNull();
  });
});
