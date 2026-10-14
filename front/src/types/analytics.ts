export const ANALYTICS_PERIODS = [7, 30, 90] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export interface DailyViews {
  /** `YYYY-MM-DD` (UTC). */
  day: string;
  pageViews: number;
  visitors: number;
}

export interface AnalyticsSummary {
  days: number;
  pageViews: number;
  visitors: number;
  /** One entry per day of the period, zeros included. */
  daily: DailyViews[];
  topListings: { listingId: number; title: string; views: number }[];
  /** Paths without their locale prefix, e.g. `/annonces/12`. */
  topPages: { path: string; views: number }[];
}
