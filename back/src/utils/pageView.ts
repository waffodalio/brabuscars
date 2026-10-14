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
