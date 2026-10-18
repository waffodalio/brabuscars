import { LessThan, type SelectQueryBuilder } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { PageView } from "../entities/PageView";

export interface DailyRow {
  day: string;
  pageViews: number;
  visitors: number;
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

  async purgeBefore(date: Date): Promise<number> {
    const result = await this.delete({ createdAt: LessThan(date) });
    return result.affected ?? 0;
  },
});
