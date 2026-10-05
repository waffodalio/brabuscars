import { describe, expect, it } from "vitest";
import { decimalTransformer } from "./decimalTransformer";

describe("decimalTransformer", () => {
  it("converts the string MariaDB returns for DECIMAL columns to a number", () => {
    expect(decimalTransformer.from("12999.99")).toBe(12999.99);
  });

  it("passes null/undefined through unchanged on the way out of the DB", () => {
    expect(decimalTransformer.from(null)).toBeNull();
    expect(decimalTransformer.from(undefined)).toBeUndefined();
  });

  it("leaves the value untouched on the way into the DB", () => {
    expect(decimalTransformer.to(12999.99)).toBe(12999.99);
  });
});
