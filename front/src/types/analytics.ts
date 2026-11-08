import type { ListingStatus } from "./listing";

export const ANALYTICS_PERIODS = [7, 30, 90] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export interface DailyViews {
  /** `YYYY-MM-DD` (UTC). */
  day: string;
  pageViews: number;
  visitors: number;
  /** Visits started that day. */
  visits: number;
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
  /** ISO date it went online, `null` if never published. */
  publishedAt: string | null;
}

/**
 * Visits of a period. A visit ends after 30 minutes without a page; its
 * duration runs from the first to the last page (0 s for a single page).
 */
export interface VisitSummary {
  visits: number;
  /** Single-page visits. */
  bounces: number;
  averageSeconds: number;
  /** Buckets `1`, `2`, `3-5`, `6+` (pages per visit). */
  byPages: { bucket: string; visits: number }[];
  /** Buckets `<10s`, `10s-1m`, `1-3m`, `3-10m`, `10m+`. */
  byDuration: { bucket: string; visits: number }[];
}

/** Distinct visitors reaching each step of the buying path. */
export interface Funnel {
  visitors: number;
  browsed: number;
  viewedListing: number;
  contact: number;
}

/** Listing views grouped by one property of the listing. */
export interface InterestRow {
  /** Brand / category name, fuel type or price band; `""` = none. */
  bucket: string;
  views: number;
  visitors: number;
}

export interface ListingInterest {
  brands: InterestRow[];
  categories: InterestRow[];
  fuels: InterestRow[];
  /** Buckets `<15k`, `15-30k`, `30-50k`, `50-100k`, `100k+`. */
  priceBands: InterestRow[];
}

export interface DailyActivity {
  day: string;
  favorites: number;
  messages: number;
  registrations: number;
}

/** Published stock right now. */
export interface PublishedStock {
  count: number;
  averagePrice: number;
  totalValue: number;
  averageDaysOnline: number;
  maxDaysOnline: number;
  withoutPhoto: number;
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
  visits: VisitSummary;
  /** Same figures for the previous period (same elapsed time). */
  previousVisits: VisitSummary;
  /** Pages the visits started on (paths without locale). */
  entryPages: { path: string; views: number }[];
  funnel: Funnel;
  interest: ListingInterest;
  sections: { bucket: SiteSection; views: number }[];
  /** `bucket` is a site language, or `""` when unknown. */
  locales: { bucket: string; views: number }[];
  topListings: TopListing[];
  /** Paths without their locale prefix, e.g. `/annonces/12`. */
  topPages: { path: string; views: number }[];
  engagement: { favorites: Compared; messages: Compared; registrations: Compared };
  /** One entry per day of the period, zeros included. */
  activity: DailyActivity[];
  catalog: {
    stock: PublishedStock;
    byStatus: Partial<Record<ListingStatus, number>>;
    unhandledMessages: number;
    /** Published listings with no view during the period. */
    unseenCount: number;
    unseen: { listingId: number; title: string; brand: string; model: string }[];
  };
}
