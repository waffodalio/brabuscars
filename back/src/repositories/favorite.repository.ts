import { And, In, LessThan, MoreThanOrEqual } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Favorite } from "../entities/Favorite";

const LISTING_RELATIONS = {
  listing: {
    model: { brand: true },
    category: true,
    images: true,
  },
} as const;

/**
 * Data-access layer for {@link Favorite}. Every query is scoped to a single
 * user; the favourited listing is loaded with the relations the API returns.
 */
export const favoriteRepository = AppDataSource.getRepository(Favorite).extend({
  /**
   * Only favourites whose listing is still `published`: an advert taken
   * offline (draft, sold, archived) is hidden but the row is kept, so it
   * reappears if the advert is published again.
   */
  findByUser(userId: number): Promise<Favorite[]> {
    return this.find({
      where: { userId, listing: { status: "published" } },
      relations: LISTING_RELATIONS,
      order: { createdAt: "DESC" },
    });
  },

  findByUserAndListing(
    userId: number,
    listingId: number,
  ): Promise<Favorite | null> {
    return this.findOne({
      where: { userId, listingId },
      relations: LISTING_RELATIONS,
    });
  },

  existsForUserAndListing(
    userId: number,
    listingId: number,
  ): Promise<boolean> {
    return this.existsBy({ userId, listingId });
  },

  countCreatedBetween(since: Date, until: Date): Promise<number> {
    return this.countBy({ createdAt: And(MoreThanOrEqual(since), LessThan(until)) });
  },

  /** Number of users who bookmarked each listing, keyed by listing id. */
  async countByListings(listingIds: number[]): Promise<Map<number, number>> {
    if (listingIds.length === 0) return new Map();
    const rows = await this.createQueryBuilder("favorite")
      .select("favorite.listing_id", "listingId")
      .addSelect("COUNT(*)", "count")
      .where({ listingId: In(listingIds) })
      .groupBy("favorite.listing_id")
      .getRawMany<{ listingId: number; count: string }>();
    return new Map(rows.map((row) => [Number(row.listingId), Number(row.count)]));
  },
});
