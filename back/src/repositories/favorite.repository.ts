import { AppDataSource } from "../config/data-source";
import { Favorite } from "../entities/Favorite";

const LISTING_RELATIONS = {
  listing: {
    seller: true,
    vehicle: { model: { brand: true }, category: true },
  },
} as const;

/**
 * Data-access layer for {@link Favorite}. Every query is scoped to a single
 * user; the favourited listing is loaded with the relations the API returns.
 */
export const favoriteRepository = AppDataSource.getRepository(Favorite).extend({
  findByUser(userId: number): Promise<Favorite[]> {
    return this.find({
      where: { userId },
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
