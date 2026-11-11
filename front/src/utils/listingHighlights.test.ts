import { describe, expect, it } from "vitest";
import { listingHighlights } from "./listingHighlights";

const NOW = new Date("2026-11-10T12:00:00Z");
const base = { publishedAt: "2025-01-01T00:00:00Z", mileage: 120_000, year: 2015 };

describe("listingHighlights", () => {
  it("gives nothing to an ordinary car", () => {
    expect(listingHighlights(base, NOW)).toEqual([]);
  });

  it("flags a listing published less than a week ago", () => {
    expect(listingHighlights({ ...base, publishedAt: "2026-11-05T12:00:00Z" }, NOW)).toEqual(["new"]);
    expect(listingHighlights({ ...base, publishedAt: "2026-11-02T12:00:00Z" }, NOW)).toEqual([]);
    expect(listingHighlights({ ...base, publishedAt: null }, NOW)).toEqual([]);
  });

  it("flags a low mileage for the car's age", () => {
    expect(listingHighlights({ ...base, year: 2022, mileage: 30_000 }, NOW)).toEqual(["lowMileage"]);
    // Low in absolute terms but high for a one-year-old car.
    expect(listingHighlights({ ...base, year: 2026, mileage: 40_000 }, NOW)).toEqual(["recent"]);
  });

  it("flags a recent model year", () => {
    expect(listingHighlights({ ...base, year: 2024, mileage: 60_000 }, NOW)).toEqual(["recent"]);
  });

  it("keeps the two most striking badges", () => {
    expect(
      listingHighlights({ publishedAt: "2026-11-09T00:00:00Z", year: 2025, mileage: 8_000 }, NOW),
    ).toEqual(["new", "lowMileage"]);
  });
});
