import { describe, expect, it } from "vitest";
import { fillDays, parsePagePath } from "./pageView";

describe("parsePagePath", () => {
  it("splits the locale off and spots listing pages", () => {
    expect(parsePagePath("/fr/annonces/12")).toEqual({
      path: "/annonces/12",
      locale: "fr",
      listingId: 12,
    });
  });

  it("maps the locale root to /", () => {
    expect(parsePagePath("/en")).toEqual({ path: "/", locale: "en", listingId: null });
    expect(parsePagePath("/nl/")).toEqual({ path: "/", locale: "nl", listingId: null });
  });

  it("keeps non-listing pages without a listing id", () => {
    expect(parsePagePath("/fr/annonces")).toEqual({
      path: "/annonces",
      locale: "fr",
      listingId: null,
    });
  });

  it("never measures the back-office", () => {
    expect(parsePagePath("/fr/admin")).toBeNull();
    expect(parsePagePath("/fr/admin/annonces")).toBeNull();
  });

  it("does not mistake a lookalike path for the back-office", () => {
    expect(parsePagePath("/fr/administration-info")?.path).toBe("/administration-info");
  });
});

describe("fillDays", () => {
  it("fills missing days with the empty row, inclusive of both ends", () => {
    const rows = [{ day: "2026-10-02", views: 5 }];
    const days = fillDays(
      rows,
      new Date("2026-10-01T15:00:00Z"),
      new Date("2026-10-03T08:00:00Z"),
      (day) => ({ day, views: 0 }),
    );
    expect(days).toEqual([
      { day: "2026-10-01", views: 0 },
      { day: "2026-10-02", views: 5 },
      { day: "2026-10-03", views: 0 },
    ]);
  });
});
