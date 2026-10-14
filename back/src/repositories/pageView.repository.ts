import { LessThan } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { PageView } from "../entities/PageView";

export interface DailyRow {
  day: string;
  pageViews: number;
  visitors: number;
}

export interface TopListingRow {
  listingId: number;
  title: string;
  views: number;
}

export interface TopPageRow {
  path: string;
  views: number;
}

/** Data-access layer for {@link PageView}: aggregates over a time window. */
export const pageViewRepository = AppDataSource.getRepository(PageView).extend({
  async totals(since: Date): Promise<{ pageViews: number; visitors: number }> {
    const raw = await this.createQueryBuilder("pv")
      .select("COUNT(*)", "pageViews")
      .addSelect("COUNT(DISTINCT pv.visitor_id)", "visitors")
      .where("pv.created_at >= :since", { since })
      .getRawOne<{ pageViews: string; visitors: string }>();
    return {
      pageViews: Number(raw?.pageViews ?? 0),
      visitors: Number(raw?.visitors ?? 0),
    };
  },

  async daily(since: Date): Promise<DailyRow[]> {
    const rows = await this.createQueryBuilder("pv")
      .select("DATE_FORMAT(pv.created_at, '%Y-%m-%d')", "day")
      .addSelect("COUNT(*)", "pageViews")
      .addSelect("COUNT(DISTINCT pv.visitor_id)", "visitors")
      .where("pv.created_at >= :since", { since })
      .groupBy("day")
      .orderBy("day", "ASC")
      .getRawMany<{ day: string; pageViews: string; visitors: string }>();
    return rows.map((row) => ({
      day: row.day,
      pageViews: Number(row.pageViews),
      visitors: Number(row.visitors),
    }));
  },

  async topListings(since: Date, limit: number): Promise<TopListingRow[]> {
    const rows = await this.createQueryBuilder("pv")
      .innerJoin("pv.listing", "listing")
      .select("listing.id", "listingId")
      .addSelect("listing.title", "title")
      .addSelect("COUNT(*)", "views")
      .where("pv.created_at >= :since", { since })
      .groupBy("listing.id")
      .addGroupBy("listing.title")
      .orderBy("views", "DESC")
      .limit(limit)
      .getRawMany<{ listingId: number; title: string; views: string }>();
    return rows.map((row) => ({
      listingId: Number(row.listingId),
      title: row.title,
      views: Number(row.views),
    }));
  },

  async topPages(since: Date, limit: number): Promise<TopPageRow[]> {
    const rows = await this.createQueryBuilder("pv")
      .select("pv.path", "path")
      .addSelect("COUNT(*)", "views")
      .where("pv.created_at >= :since", { since })
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
