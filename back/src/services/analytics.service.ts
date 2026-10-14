import type { PageViewDto } from "../dto/analytics.dto";
import { listingRepository } from "../repositories/listing.repository";
import {
  pageViewRepository,
  type DailyRow,
  type TopListingRow,
  type TopPageRow,
} from "../repositories/pageView.repository";
import { fillDays, parsePagePath } from "../utils/pageView";

/** CNIL guidance: audience-measurement data is kept at most 13 months. */
const RETENTION_MONTHS = 13;
const TOP_LIMIT = 10;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface AnalyticsSummary {
  days: number;
  pageViews: number;
  visitors: number;
  daily: DailyRow[];
  topListings: TopListingRow[];
  topPages: TopPageRow[];
}

/**
 * Internal audience measurement. A view is only recorded when the request
 * carries the `chcars_visitor_id` cookie — which the front end sets solely
 * after the visitor consented — so consent is enforced here too, not just in
 * the browser.
 */
export const analyticsService = {
  async recordPageView(
    visitorId: string | undefined,
    dto: PageViewDto,
  ): Promise<void> {
    if (!visitorId || !UUID.test(visitorId)) return; // no consent: nothing kept
    const parsed = parsePagePath(dto.path);
    if (!parsed) return; // back-office page

    // A deleted / unknown listing id is stored as a plain page view.
    const listingId =
      parsed.listingId !== null &&
      (await listingRepository.existsBy({ id: parsed.listingId }))
        ? parsed.listingId
        : null;

    await pageViewRepository.insert({
      visitorId: visitorId.toLowerCase(),
      path: parsed.path,
      locale: parsed.locale,
      listingId,
    });
  },

  async summary(days: number): Promise<AnalyticsSummary> {
    const now = new Date();
    const since = new Date(now);
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (days - 1)); // today included

    const [totals, daily, topListings, topPages] = await Promise.all([
      pageViewRepository.totals(since),
      pageViewRepository.daily(since),
      pageViewRepository.topListings(since, TOP_LIMIT),
      pageViewRepository.topPages(since, TOP_LIMIT),
    ]);

    return {
      days,
      ...totals,
      daily: fillDays(daily, since, now, (day) => ({ day, pageViews: 0, visitors: 0 })),
      topListings,
      topPages,
    };
  },

  /** Deletes views older than the retention period; returns how many. */
  purgeExpired(): Promise<number> {
    const limit = new Date();
    limit.setUTCMonth(limit.getUTCMonth() - RETENTION_MONTHS);
    return pageViewRepository.purgeBefore(limit);
  },
};
