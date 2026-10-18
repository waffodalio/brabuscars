import { describe, expect, it } from "vitest";
import { fillDays, parsePagePath, periodBounds, weekHourGrid } from "./pageView";

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

describe("periodBounds", () => {
  it("includes today and compares with the same elapsed time before", () => {
    const now = new Date("2026-10-15T14:30:00Z");
    expect(periodBounds(7, now)).toEqual({
      since: new Date("2026-10-09T00:00:00Z"),
      previousSince: new Date("2026-10-02T00:00:00Z"),
      previousUntil: new Date("2026-10-08T14:30:00Z"),
    });
  });
});

describe("weekHourGrid", () => {
  const hour = (iso: string) => Date.parse(iso) / 3_600_000;

  it("shifts UTC buckets to local time, winter and summer", () => {
    const grid = weekHourGrid(
      [
        { epochHour: hour("2026-01-05T09:00:00Z"), views: 3 }, // Monday 10:00 in Paris (UTC+1)
        { epochHour: hour("2026-07-06T22:00:00Z"), views: 2 }, // Tuesday 00:00 in Paris (UTC+2)
        { epochHour: hour("2026-07-13T22:00:00Z"), views: 1 }, // the next Tuesday, same slot
      ],
      "Europe/Paris",
    );
    expect(grid).toHaveLength(7);
    expect(grid[0][10]).toBe(3);
    expect(grid[1][0]).toBe(3);
    expect(grid.flat().reduce((a, b) => a + b, 0)).toBe(6);
  });
});
