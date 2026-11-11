import type { Listing } from "@/types/listing";

/** Selling points worth a badge on a card, most striking first. */
export type Highlight = "new" | "lowMileage" | "recent";

const DAY_MS = 86_400_000;
/** Published this recently: "New". */
const NEW_FOR_DAYS = 7;
/** Below this, and below the yearly average, the mileage is "low". */
const LOW_MILEAGE_MAX_KM = 50_000;
const LOW_MILEAGE_PER_YEAR_KM = 12_000;
/** At most this old (model year): "Recent". */
const RECENT_MAX_AGE_YEARS = 2;
/** A card shows two badges at most, so they stay readable. */
const MAX_BADGES = 2;

/**
 * Badges derived from the listing itself (no extra data): just published,
 * low mileage for its age, recent model year.
 */
export function listingHighlights(
  listing: Pick<Listing, "publishedAt" | "mileage" | "year">,
  now: Date = new Date(),
): Highlight[] {
  const highlights: Highlight[] = [];
  const age = Math.max(1, now.getFullYear() - listing.year + 1);

  if (listing.publishedAt) {
    const days = (now.getTime() - new Date(listing.publishedAt).getTime()) / DAY_MS;
    if (days >= 0 && days < NEW_FOR_DAYS) highlights.push("new");
  }
  if (listing.mileage < LOW_MILEAGE_MAX_KM && listing.mileage / age <= LOW_MILEAGE_PER_YEAR_KM) {
    highlights.push("lowMileage");
  }
  if (now.getFullYear() - listing.year <= RECENT_MAX_AGE_YEARS) highlights.push("recent");

  return highlights.slice(0, MAX_BADGES);
}
