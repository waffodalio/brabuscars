/** A front-end pathname split into what `page_view` stores. */
export interface ParsedPagePath {
  path: string;
  locale: string | null;
  listingId: number | null;
}

const LOCALE_PREFIX = /^\/([a-z]{2})(?=\/|$)/;
const LISTING_PATH = /^\/annonces\/(\d+)$/;

/**
 * Splits `/fr/annonces/12` into `{ path: "/annonces/12", locale: "fr",
 * listingId: 12 }`. Returns `null` for back-office pages, which are never
 * measured (admins browsing their own back-office would skew the figures).
 */
export function parsePagePath(pathname: string): ParsedPagePath | null {
  const localeMatch = LOCALE_PREFIX.exec(pathname);
  const locale = localeMatch ? localeMatch[1] : null;
  const rest = localeMatch ? pathname.slice(localeMatch[0].length) : pathname;
  const path = rest.replace(/\/+$/, "") || "/";

  if (path === "/admin" || path.startsWith("/admin/")) return null;

  const listingMatch = LISTING_PATH.exec(path);
  return {
    path,
    locale,
    listingId: listingMatch ? Number(listingMatch[1]) : null,
  };
}

/** `YYYY-MM-DD` of a date, in UTC. */
export function toDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Every day from `since` to `until` (inclusive, UTC), so days without any
 * view still appear — as zeros — in the series.
 */
export function fillDays<T extends { day: string }>(
  rows: T[],
  since: Date,
  until: Date,
  empty: (day: string) => T,
): T[] {
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const days: T[] = [];
  const cursor = new Date(`${toDay(since)}T00:00:00Z`);
  const last = toDay(until);
  while (toDay(cursor) <= last) {
    const day = toDay(cursor);
    days.push(byDay.get(day) ?? empty(day));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/** Bounds of a report period and of the one it is compared with. */
export interface PeriodBounds {
  /** UTC midnight, `days - 1` days ago: the period includes today. */
  since: Date;
  /** Same length, just before `since`. */
  previousSince: Date;
  /**
   * `now` minus the period length, so the comparison covers the same elapsed
   * time (today is only partly over).
   */
  previousUntil: Date;
}

export function periodBounds(days: number, now: Date): PeriodBounds {
  const since = new Date(now);
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));
  const previousSince = new Date(since);
  previousSince.setUTCDate(previousSince.getUTCDate() - days);
  const previousUntil = new Date(now);
  previousUntil.setUTCDate(previousUntil.getUTCDate() - days);
  return { since, previousSince, previousUntil };
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Folds hourly buckets (hours since the Unix epoch) into a 7 × 24 grid —
 * Monday first, hours 0–23 — in `timeZone`, daylight-saving time included.
 */
export function weekHourGrid(
  rows: { epochHour: number; views: number }[],
  timeZone: string,
): number[][] {
  const format = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  });
  const grid = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  for (const row of rows) {
    const parts = format.formatToParts(new Date(row.epochHour * 3_600_000));
    const weekday = WEEKDAYS.indexOf(parts.find((p) => p.type === "weekday")?.value ?? "");
    const hour = Number(parts.find((p) => p.type === "hour")?.value);
    if (weekday >= 0 && hour >= 0 && hour < 24) grid[weekday][hour] += row.views;
  }
  return grid;
}

/**
 * A visit ends after 30 minutes without any page view (the usual rule of
 * audience tools); the next view opens a new visit.
 */
export const VISIT_GAP_SECONDS = 30 * 60;

/** Bucket bounds: `min` inclusive, `max` exclusive (`null` = open-ended). */
export interface Bucket {
  key: string;
  min: number;
  max: number | null;
}

/** Visits by number of pages seen. */
export const VISIT_PAGES_BUCKETS: readonly Bucket[] = [
  { key: "1", min: 1, max: 2 },
  { key: "2", min: 2, max: 3 },
  { key: "3-5", min: 3, max: 6 },
  { key: "6+", min: 6, max: null },
];

/**
 * Visits by duration (first → last page, in seconds). A single-page visit
 * lasts 0 s: without a later page there is nothing to time it with.
 */
export const VISIT_DURATION_BUCKETS: readonly Bucket[] = [
  { key: "<10s", min: 0, max: 10 },
  { key: "10s-1m", min: 10, max: 60 },
  { key: "1-3m", min: 60, max: 180 },
  { key: "3-10m", min: 180, max: 600 },
  { key: "10m+", min: 600, max: null },
];

/** Price bands (euros) used to group listing views; last one open-ended. */
export const PRICE_BANDS: readonly { key: string; max: number | null }[] = [
  { key: "<15k", max: 15_000 },
  { key: "15-30k", max: 30_000 },
  { key: "30-50k", max: 50_000 },
  { key: "50-100k", max: 100_000 },
  { key: "100k+", max: null },
];
