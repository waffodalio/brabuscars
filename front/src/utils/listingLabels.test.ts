import { describe, expect, it } from "vitest";
import { formatPrice } from "./listingLabels";

describe("formatPrice", () => {
  it("formats a whole euro amount, French-style, with no decimals", () => {
    // Non-breaking space between the number and the currency symbol.
    expect(formatPrice(12999)).toBe("12 999 €");
  });

  it("rounds to the nearest euro", () => {
    expect(formatPrice(999.6)).toBe("1 000 €");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("0 €");
  });
});
