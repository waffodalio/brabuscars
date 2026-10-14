import { describe, expect, it } from "vitest";
import { formatMileage, formatPrice } from "./listingLabels";

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

describe("formatPrice per site language", () => {
  // Normalise the various (narrow) no-break spaces Intl uses.
  const plain = (value: string) => value.replace(/\s/g, " ");

  it("uses English conventions", () => {
    expect(formatPrice(12999, "en")).toBe("€12,999");
  });

  it("uses Dutch conventions", () => {
    expect(plain(formatPrice(12999, "nl"))).toBe("€ 12.999");
  });
});

describe("formatMileage", () => {
  const plain = (value: string) => value.replace(/\s/g, " ");

  it("groups digits per site language", () => {
    expect(plain(formatMileage(125000))).toBe("125 000 km");
    expect(formatMileage(125000, "en")).toBe("125,000 km");
    expect(formatMileage(125000, "nl")).toBe("125.000 km");
  });
});
