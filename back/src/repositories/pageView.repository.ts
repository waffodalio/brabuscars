import { LessThan, type SelectQueryBuilder } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Brand } from "../entities/Brand";
import { CarModel } from "../entities/CarModel";
import { Category } from "../entities/Category";
import { Listing } from "../entities/Listing";
import { PageView } from "../entities/PageView";
import {
  PRICE_BANDS,
  VISIT_DURATION_BUCKETS,
  VISIT_GAP_SECONDS,
  VISIT_PAGES_BUCKETS,
} from "../utils/pageView";

export interface DailyRow {
  day: string;
  pageViews: number;
  visitors: number;
  /** Visits started that day (see `dailyVisits`). */
  visits: number;
  /** Views of a listing page (`/annonces/:id`). */
  listingViews: number;
}

export interface ListingViewsRow {
  listingId: number;
  views: number;
  visitors: number;
}

export interface TopPageRow {
  path: string;
  views: number;
}

export interface HourRow {
  /** Hours since the Unix epoch — independent of the database time zone. */
  epochHour: number;
  views: number;
}

export const SITE_SECTIONS = [
  "home",
  "listings",
  "listing",
  "contact",
  "account",
  "other",
] as const;
export type SiteSection = (typeof SITE_SECTIONS)[number];

export interface CountRow<K extends string> {
  bucket: K;
  views: number;
}

/** Groups the public paths into the site's sections (static SQL, no input). */
const SECTION_SQL = `CASE
  WHEN pv.path = '/' THEN 'home'
  WHEN pv.path = '/annonces' THEN 'listings'
  WHEN pv.path LIKE '/annonces/%' THEN 'listing'
  WHEN pv.path = '/contact' THEN 'contact'
  WHEN pv.path IN ('/connexion', '/inscription', '/favoris') THEN 'account'
  ELSE 'other' END`;

/** Visits (sessions) of a window, measured from the stored page views. */
export interface VisitStats {
  visits: number;
  /** Visits of a single page. */
  bounces: number;
  /** Sum of the visit durations (first → last page), in seconds. */
  seconds: number;
  /** Visits per number of pages, in {@link VISIT_PAGES_BUCKETS} order. */
  byPages: number[];
  /** Visits per duration, in {@link VISIT_DURATION_BUCKETS} order. */
  byDuration: number[];
}

/** Distinct visitors reaching each step of the buying path. */
export interface FunnelRow {
  visitors: number;
  /** Saw the listings page or a listing. */
  browsed: number;
  /** Opened at least one listing. */
  viewedListing: number;
  /** Opened the contact page. */
  contact: number;
}

/** Views of listing pages, grouped by a property of the listing. */
export interface InterestRow {
  bucket: string;
  views: number;
  visitors: number;
}

export interface ListingInterest {
  brands: InterestRow[];
  categories: InterestRow[];
  fuels: InterestRow[];
  /** Keys of {@link PRICE_BANDS}. */
  priceBands: InterestRow[];
}

/**
 * Splits the window's page views into visits: a new visit starts after
 * {@link VISIT_GAP_SECONDS} without any page (the usual 30-minute rule).
 * `numbered` has one row per view with its visit number and whether it
 * opened the visit. Static SQL — only the two dates are parameters.
 */
const VISITS_CTE = `
  WITH marked AS (
    SELECT pv.id, pv.visitor_id, pv.path, pv.created_at,
      CASE WHEN TIMESTAMPDIFF(SECOND,
          LAG(pv.created_at) OVER (PARTITION BY pv.visitor_id ORDER BY pv.created_at, pv.id),
          pv.created_at) < ${VISIT_GAP_SECONDS}
        THEN 0 ELSE 1 END AS starts
    FROM page_view pv
    WHERE pv.created_at >= ? AND pv.created_at < ?
  ),
  numbered AS (
    SELECT visitor_id, path, created_at, starts,
      SUM(starts) OVER (PARTITION BY visitor_id ORDER BY created_at, id
        ROWS UNBOUNDED PRECEDING) AS visit_no
    FROM marked
  ),
  visits AS (
    SELECT COUNT(*) AS pages, MIN(created_at) AS started_at,
      TIMESTAMPDIFF(SECOND, MIN(created_at), MAX(created_at)) AS seconds
    FROM numbered
    GROUP BY visitor_id, visit_no
  )`;

/** `SUM(<condition>)` columns for each bucket, from its bounds. */
function bucketColumns(
  column: string,
  prefix: string,
  buckets: readonly { min: number; max: number | null }[],
): string {
  return buckets
    .map(({ min, max }, i) => {
      const upper = max === null ? "" : ` AND ${column} < ${max}`;
      return `SUM(${column} >= ${min}${upper}) AS ${prefix}${i}`;
    })
    .join(",\n    ");
}

/** Price band of a listing (static SQL from {@link PRICE_BANDS}). */
const PRICE_BAND_SQL = `CASE ${PRICE_BANDS.map(({ key, max }) =>
  max === null ? `ELSE '${key}'` : `WHEN l.price < ${max} THEN '${key}'`,
).join(" ")} END`;

function toInterestRows(
  rows: { bucket: string | null; views: string; visitors: string }[],
): InterestRow[] {
  return rows.map((row) => ({
    bucket: row.bucket ?? "",
    views: Number(row.views),
    visitors: Number(row.visitors),
  }));
}

/** Data-access layer for {@link PageView}: aggregates over a time window. */
export const pageViewRepository = AppDataSource.getRepository(PageView).extend({
  /** Views from `since` (inclusive) to `until` (exclusive, open-ended if omitted). */
  inWindow(since: Date, until?: Date): SelectQueryBuilder<PageView> {
    const query = this.createQueryBuilder("pv").where("pv.created_at >= :since", { since });
    return until ? query.andWhere("pv.created_at < :until", { until }) : query;
  },

  async totals(
    since: Date,
    until?: Date,
  ): Promise<{ pageViews: number; visitors: number; listingViews: number }> {
    const raw = await this.inWindow(since, until)
      .select("COUNT(*)", "pageViews")
      .addSelect("COUNT(DISTINCT pv.visitor_id)", "visitors")
      .addSelect("COUNT(pv.listing_id)", "listingViews")
      .getRawOne<{ pageViews: string; visitors: string; listingViews: string }>();
    return {
      pageViews: Number(raw?.pageViews ?? 0),
      visitors: Number(raw?.visitors ?? 0),
      listingViews: Number(raw?.listingViews ?? 0),
    };
  },

  /** Visitors whose very first recorded view falls in the window. */
  async newVisitors(since: Date): Promise<number> {
    const raw = await this.manager
      .createQueryBuilder()
      .select("COUNT(*)", "count")
      .from(
        (sub) =>
          sub
            .select("first.visitor_id", "visitor_id")
            .from(PageView, "first")
            .groupBy("first.visitor_id")
            .having("MIN(first.created_at) >= :since"),
        "newcomers",
      )
      .setParameters({ since })
      .getRawOne<{ count: string }>();
    return Number(raw?.count ?? 0);
  },

  async daily(since: Date): Promise<DailyRow[]> {
    const rows = await this.inWindow(since)
      .select("DATE_FORMAT(pv.created_at, '%Y-%m-%d')", "day")
      .addSelect("COUNT(*)", "pageViews")
      .addSelect("COUNT(DISTINCT pv.visitor_id)", "visitors")
      .addSelect("COUNT(pv.listing_id)", "listingViews")
      .groupBy("day")
      .orderBy("day", "ASC")
      .getRawMany<{ day: string; pageViews: string; visitors: string; listingViews: string }>();
    return rows.map((row) => ({
      day: row.day,
      pageViews: Number(row.pageViews),
      visitors: Number(row.visitors),
      visits: 0,
      listingViews: Number(row.listingViews),
    }));
  },

  async hourly(since: Date): Promise<HourRow[]> {
    const rows = await this.inWindow(since)
      .select("FLOOR(UNIX_TIMESTAMP(pv.created_at) / 3600)", "epochHour")
      .addSelect("COUNT(*)", "views")
      .groupBy("epochHour")
      .getRawMany<{ epochHour: string; views: string }>();
    return rows.map((row) => ({ epochHour: Number(row.epochHour), views: Number(row.views) }));
  },

  async sections(since: Date): Promise<CountRow<SiteSection>[]> {
    const rows = await this.inWindow(since)
      .select(SECTION_SQL, "bucket")
      .addSelect("COUNT(*)", "views")
      .groupBy("bucket")
      .orderBy("views", "DESC")
      .getRawMany<{ bucket: SiteSection; views: string }>();
    return rows.map((row) => ({ bucket: row.bucket, views: Number(row.views) }));
  },

  /** Views per site language; `bucket` is `""` for views recorded without one. */
  async locales(since: Date): Promise<CountRow<string>[]> {
    const rows = await this.inWindow(since)
      .select("COALESCE(pv.locale, '')", "bucket")
      .addSelect("COUNT(*)", "views")
      .groupBy("bucket")
      .orderBy("views", "DESC")
      .getRawMany<{ bucket: string; views: string }>();
    return rows.map((row) => ({ bucket: row.bucket, views: Number(row.views) }));
  },

  /** Most viewed listings — ids only, the caller loads the listings. */
  async topListings(since: Date, limit: number): Promise<ListingViewsRow[]> {
    const rows = await this.inWindow(since)
      .andWhere("pv.listing_id IS NOT NULL")
      .select("pv.listing_id", "listingId")
      .addSelect("COUNT(*)", "views")
      .addSelect("COUNT(DISTINCT pv.visitor_id)", "visitors")
      .groupBy("pv.listing_id")
      .orderBy("views", "DESC")
      .limit(limit)
      .getRawMany<{ listingId: number; views: string; visitors: string }>();
    return rows.map((row) => ({
      listingId: Number(row.listingId),
      views: Number(row.views),
      visitors: Number(row.visitors),
    }));
  },

  async topPages(since: Date, limit: number): Promise<TopPageRow[]> {
    const rows = await this.inWindow(since)
      .select("pv.path", "path")
      .addSelect("COUNT(*)", "views")
      .groupBy("pv.path")
      .orderBy("views", "DESC")
      .limit(limit)
      .getRawMany<{ path: string; views: string }>();
    return rows.map((row) => ({ path: row.path, views: Number(row.views) }));
  },

  async visitStats(since: Date, until: Date): Promise<VisitStats> {
    const sql = `${VISITS_CTE}
      SELECT COUNT(*) AS visits,
        COALESCE(SUM(pages = 1), 0) AS bounces,
        COALESCE(SUM(seconds), 0) AS seconds,
        ${bucketColumns("pages", "p", VISIT_PAGES_BUCKETS)},
        ${bucketColumns("seconds", "d", VISIT_DURATION_BUCKETS)}
      FROM visits`;
    const [raw] = (await this.manager.query(sql, [since, until])) as Record<string, string | null>[];
    const read = (key: string) => Number(raw?.[key] ?? 0);
    return {
      visits: read("visits"),
      bounces: read("bounces"),
      seconds: read("seconds"),
      byPages: VISIT_PAGES_BUCKETS.map((_, i) => read(`p${i}`)),
      byDuration: VISIT_DURATION_BUCKETS.map((_, i) => read(`d${i}`)),
    };
  },

  /** Visits per day (by the day they started). Days without visits are absent. */
  async dailyVisits(since: Date, until: Date): Promise<{ day: string; visits: number }[]> {
    const sql = `${VISITS_CTE}
      SELECT DATE_FORMAT(started_at, '%Y-%m-%d') AS day, COUNT(*) AS visits
      FROM visits
      GROUP BY day
      ORDER BY day`;
    const rows = (await this.manager.query(sql, [since, until])) as { day: string; visits: string }[];
    return rows.map((row) => ({ day: row.day, visits: Number(row.visits) }));
  },

  /** Pages the visits started on (landing pages), most frequent first. */
  async entryPages(since: Date, until: Date, limit: number): Promise<TopPageRow[]> {
    const sql = `${VISITS_CTE}
      SELECT path, COUNT(*) AS views
      FROM numbered
      WHERE starts = 1
      GROUP BY path
      ORDER BY views DESC
      LIMIT ${Math.trunc(limit)}`;
    const rows = (await this.manager.query(sql, [since, until])) as { path: string; views: string }[];
    return rows.map((row) => ({ path: row.path, views: Number(row.views) }));
  },

  async funnel(since: Date): Promise<FunnelRow> {
    const raw = await this.inWindow(since)
      .select("COUNT(DISTINCT pv.visitor_id)", "visitors")
      .addSelect(
        "COUNT(DISTINCT CASE WHEN pv.path = '/annonces' OR pv.listing_id IS NOT NULL THEN pv.visitor_id END)",
        "browsed",
      )
      .addSelect("COUNT(DISTINCT CASE WHEN pv.listing_id IS NOT NULL THEN pv.visitor_id END)", "viewedListing")
      .addSelect("COUNT(DISTINCT CASE WHEN pv.path = '/contact' THEN pv.visitor_id END)", "contact")
      .getRawOne<Record<keyof FunnelRow, string>>();
    return {
      visitors: Number(raw?.visitors ?? 0),
      browsed: Number(raw?.browsed ?? 0),
      viewedListing: Number(raw?.viewedListing ?? 0),
      contact: Number(raw?.contact ?? 0),
    };
  },

  /** What the visitors look at: listing views by brand, category, fuel and price band. */
  async listingInterest(since: Date): Promise<ListingInterest> {
    const grouped = (bucket: string) =>
      this.inWindow(since)
        .innerJoin(Listing, "l", "l.id = pv.listing_id")
        .innerJoin(CarModel, "m", "m.id = l.model_id")
        .innerJoin(Brand, "b", "b.id = m.brand_id")
        .leftJoin(Category, "c", "c.id = l.category_id")
        .select(bucket, "bucket")
        .addSelect("COUNT(*)", "views")
        .addSelect("COUNT(DISTINCT pv.visitor_id)", "visitors")
        .groupBy("bucket")
        .orderBy("views", "DESC")
        .getRawMany<{ bucket: string | null; views: string; visitors: string }>()
        .then(toInterestRows);

    const [brands, categories, fuels, priceBands] = await Promise.all([
      grouped("b.name"),
      grouped("c.name"),
      grouped("l.fuel_type"),
      grouped(PRICE_BAND_SQL),
    ]);
    return { brands, categories, fuels, priceBands };
  },

  async purgeBefore(date: Date): Promise<number> {
    const result = await this.delete({ createdAt: LessThan(date) });
    return result.affected ?? 0;
  },
});
