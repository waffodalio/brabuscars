import type { PageViewDto } from "../dto/analytics.dto";
import type { ListingStatus } from "../entities/Listing";
import { contactMessageRepository } from "../repositories/contactMessage.repository";
import { favoriteRepository } from "../repositories/favorite.repository";
import { listingRepository } from "../repositories/listing.repository";
import type { DayCount } from "../repositories/countPerDay";
import {
  pageViewRepository,
  type CountRow,
  type DailyRow,
  type FunnelRow,
  type ListingInterest,
  type SiteSection,
  type TopPageRow,
  type VisitStats,
} from "../repositories/pageView.repository";
import type { PublishedStock } from "../repositories/listing.repository";
import { userRepository } from "../repositories/user.repository";
import { toListingResponse } from "../utils/listingResponse";
import {
  VISIT_DURATION_BUCKETS,
  VISIT_PAGES_BUCKETS,
  fillDays,
  parsePagePath,
  periodBounds,
  weekHourGrid,
  type Bucket,
} from "../utils/pageView";

/** CNIL guidance: audience-measurement data is kept at most 13 months. */
const RETENTION_MONTHS = 13;
const TOP_LIMIT = 10;
const UNSEEN_LIMIT = 5;
const ENTRY_PAGES_LIMIT = 8;
/** The dealership's time zone (single site, in Lyon) for the hour grid. */
const REPORT_TIME_ZONE = "Europe/Paris";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A figure for the period and for the period before it. */
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
  /** When it went online (`null` if never published). */
  publishedAt: string | null;
}

/** Visits of a period, with their distributions labelled by bucket key. */
export interface VisitSummary {
  visits: number;
  bounces: number;
  /** Average visit duration, in seconds. */
  averageSeconds: number;
  byPages: { bucket: string; visits: number }[];
  byDuration: { bucket: string; visits: number }[];
}

/** Bookmarks, messages and sign-ups of one day. */
export interface DailyActivity {
  day: string;
  favorites: number;
  messages: number;
  registrations: number;
}

export interface AnalyticsSummary {
  days: number;
  pageViews: number;
  visitors: number;
  listingViews: number;
  /** Visitors seen for the first time during the period. */
  newVisitors: number;
  previous: { pageViews: number; visitors: number; listingViews: number };
  daily: DailyRow[];
  /** 7 × 24 page views, Monday first, in {@link REPORT_TIME_ZONE}. */
  heatmap: number[][];
  timeZone: string;
  visits: VisitSummary;
  previousVisits: VisitSummary;
  /** Pages the visits started on. */
  entryPages: TopPageRow[];
  funnel: FunnelRow;
  /** Listing views by brand, category, fuel type and price band. */
  interest: ListingInterest;
  sections: CountRow<SiteSection>[];
  locales: CountRow<string>[];
  topListings: TopListing[];
  topPages: TopPageRow[];
  engagement: {
    favorites: Compared;
    messages: Compared;
    registrations: Compared;
  };
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

function toVisitSummary(stats: VisitStats): VisitSummary {
  const label = (buckets: readonly Bucket[], counts: number[]) =>
    buckets.map((bucket, i) => ({ bucket: bucket.key, visits: counts[i] ?? 0 }));
  return {
    visits: stats.visits,
    bounces: stats.bounces,
    averageSeconds: stats.visits > 0 ? Math.round(stats.seconds / stats.visits) : 0,
    byPages: label(VISIT_PAGES_BUCKETS, stats.byPages),
    byDuration: label(VISIT_DURATION_BUCKETS, stats.byDuration),
  };
}

/** Merges three per-day counts into one series covering the whole period. */
function dailyActivity(
  favorites: DayCount[],
  messages: DayCount[],
  registrations: DayCount[],
  since: Date,
  now: Date,
): DailyActivity[] {
  const byDay = new Map<string, DailyActivity>();
  const row = (day: string) => {
    let entry = byDay.get(day);
    if (!entry) {
      entry = { day, favorites: 0, messages: 0, registrations: 0 };
      byDay.set(day, entry);
    }
    return entry;
  };
  for (const { day, count } of favorites) row(day).favorites = count;
  for (const { day, count } of messages) row(day).messages = count;
  for (const { day, count } of registrations) row(day).registrations = count;
  return fillDays([...byDay.values()], since, now, (day) => ({
    day,
    favorites: 0,
    messages: 0,
    registrations: 0,
  }));
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
    const { since, previousSince, previousUntil } = periodBounds(days, now);
    const compared = async (count: (from: Date, to: Date) => Promise<number>) => {
      const [current, previous] = await Promise.all([
        count(since, now),
        count(previousSince, previousUntil),
      ]);
      return { current, previous };
    };

    const [
      totals,
      previous,
      newVisitors,
      daily,
      hourly,
      sections,
      locales,
      topViews,
      topPages,
      favorites,
      messages,
      registrations,
      byStatus,
      unhandledMessages,
      [unseen, unseenCount],
      visits,
      previousVisits,
      entryPages,
      funnel,
      interest,
      dailyFavorites,
      dailyMessages,
      dailyRegistrations,
      stock,
      dailyVisits,
    ] = await Promise.all([
      pageViewRepository.totals(since),
      pageViewRepository.totals(previousSince, previousUntil),
      pageViewRepository.newVisitors(since),
      pageViewRepository.daily(since),
      pageViewRepository.hourly(since),
      pageViewRepository.sections(since),
      pageViewRepository.locales(since),
      pageViewRepository.topListings(since, TOP_LIMIT),
      pageViewRepository.topPages(since, TOP_LIMIT),
      compared((from, to) => favoriteRepository.countCreatedBetween(from, to)),
      compared((from, to) => contactMessageRepository.countCreatedBetween(from, to)),
      compared((from, to) => userRepository.countRegisteredBetween(from, to)),
      listingRepository.countByStatus(),
      contactMessageRepository.countUnhandled(),
      listingRepository.findPublishedWithoutViews(since, UNSEEN_LIMIT),
      pageViewRepository.visitStats(since, now),
      pageViewRepository.visitStats(previousSince, previousUntil),
      pageViewRepository.entryPages(since, now, ENTRY_PAGES_LIMIT),
      pageViewRepository.funnel(since),
      pageViewRepository.listingInterest(since),
      favoriteRepository.dailyCreated(since),
      contactMessageRepository.dailyCreated(since),
      userRepository.dailyRegistered(since),
      listingRepository.publishedStock(),
      pageViewRepository.dailyVisits(since, now),
    ]);
    const visitsByDay = new Map(dailyVisits.map((row) => [row.day, row.visits]));

    const ids = topViews.map((row) => row.listingId);
    const [listings, favoriteCounts] = await Promise.all([
      listingRepository.findByIds(ids),
      favoriteRepository.countByListings(ids),
    ]);
    const listingsById = new Map(listings.map((listing) => [listing.id, listing]));

    return {
      days,
      ...totals,
      newVisitors,
      previous,
      daily: fillDays(daily, since, now, (day) => ({
        day,
        pageViews: 0,
        visitors: 0,
        visits: 0,
        listingViews: 0,
      })).map((row) => ({ ...row, visits: visitsByDay.get(row.day) ?? 0 })),
      heatmap: weekHourGrid(hourly, REPORT_TIME_ZONE),
      timeZone: REPORT_TIME_ZONE,
      visits: toVisitSummary(visits),
      previousVisits: toVisitSummary(previousVisits),
      entryPages,
      funnel,
      interest,
      sections,
      locales,
      topListings: topViews.flatMap((row) => {
        const listing = listingsById.get(row.listingId);
        if (!listing) return []; // deleted in between
        return [
          {
            ...row,
            title: listing.title,
            brand: listing.model.brand.name,
            model: listing.model.name,
            price: listing.price,
            status: listing.status,
            thumbnailUrl: toListingResponse(listing).images[0]?.thumbnailUrl ?? null,
            favorites: favoriteCounts.get(row.listingId) ?? 0,
            publishedAt: listing.publishedAt?.toISOString() ?? null,
          },
        ];
      }),
      topPages,
      engagement: { favorites, messages, registrations },
      activity: dailyActivity(dailyFavorites, dailyMessages, dailyRegistrations, since, now),
      catalog: {
        stock,
        byStatus,
        unhandledMessages,
        unseenCount,
        unseen: unseen.map((listing) => ({
          listingId: listing.id,
          title: listing.title,
          brand: listing.model.brand.name,
          model: listing.model.name,
        })),
      },
    };
  },

  /** Deletes views older than the retention period; returns how many. */
  purgeExpired(): Promise<number> {
    const limit = new Date();
    limit.setUTCMonth(limit.getUTCMonth() - RETENTION_MONTHS);
    return pageViewRepository.purgeBefore(limit);
  },
};
