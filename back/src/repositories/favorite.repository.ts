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
});
