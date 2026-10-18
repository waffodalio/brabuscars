import type { ListingStatus } from "./listing";

export const ANALYTICS_PERIODS = [7, 30, 90] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export interface DailyViews {
  /** `YYYY-MM-DD` (UTC). */
  day: string;
  pageViews: number;
  visitors: number;
  /** Views of a listing page. */
  listingViews: number;
}

export const SITE_SECTIONS = ["home", "listings", "listing", "contact", "account", "other"] as const;
export type SiteSection = (typeof SITE_SECTIONS)[number];

/** A figure for the period and for the period before it (same elapsed time). */
export interface Compared {
  current: number;
  previous: number;
}

export interface TopListing {
  listingId: number;
  title: string;
  brand: string;
  model: string;
  price: number;
  status: ListingStatus;
  thumbnailUrl: string | null;
  views: number;
  visitors: number;
  /** All-time number of users who bookmarked it. */
  favorites: number;
}

export interface AnalyticsSummary {
  days: number;
  pageViews: number;
  visitors: number;
  listingViews: number;
  /** Visitors seen for the first time during the period. */
  newVisitors: number;
  previous: { pageViews: number; visitors: number; listingViews: number };
  /** One entry per day of the period, zeros included. */
  daily: DailyViews[];
  /** 7 × 24 page views, Monday first, in `timeZone`. */
  heatmap: number[][];
  timeZone: string;
  sections: { bucket: SiteSection; views: number }[];
  /** `bucket` is a site language, or `""` when unknown. */
  locales: { bucket: string; views: number }[];
  topListings: TopListing[];
  /** Paths without their locale prefix, e.g. `/annonces/12`. */
  topPages: { path: string; views: number }[];
  engagement: { favorites: Compared; messages: Compared; registrations: Compared };
  catalog: {
    byStatus: Partial<Record<ListingStatus, number>>;
    unhandledMessages: number;
    /** Published listings with no view during the period. */
    unseenCount: number;
    unseen: { listingId: number; title: string; brand: string; model: string }[];
  };
}
