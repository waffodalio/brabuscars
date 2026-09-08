import { favoriteRepository } from "../repositories/favorite.repository";
import { listingRepository } from "../repositories/listing.repository";
import { ApiError } from "../utils/ApiError";
import {
  toFavoriteResponse,
  type FavoriteResponse,
} from "../utils/favoriteResponse";

/**
 * Business logic for a user's favourites. Every operation is implicitly
 * scoped to the calling user, so there are no ownership checks beyond that.
 */
export const favoriteService = {
  async list(userId: number): Promise<FavoriteResponse[]> {
    const favorites = await favoriteRepository.findByUser(userId);
    return favorites.map(toFavoriteResponse);
  },

  async add(userId: number, listingId: number): Promise<FavoriteResponse> {
    if (!(await listingRepository.findById(listingId))) {
      throw ApiError.notFound(`Listing ${listingId} not found`);
    }
    if (await favoriteRepository.existsForUserAndListing(userId, listingId)) {
      throw ApiError.conflict("This listing is already in your favourites");
    }

    await favoriteRepository.save(
      favoriteRepository.create({ userId, listingId }),
    );

    const created = await favoriteRepository.findByUserAndListing(
      userId,
      listingId,
    );
    if (!created) {
      throw new Error("Favorite could not be reloaded after creation");
    }
    return toFavoriteResponse(created);
  },

  async remove(userId: number, listingId: number): Promise<void> {
    const result = await favoriteRepository.delete({ userId, listingId });
    if (!result.affected) {
      throw ApiError.notFound("This listing is not in your favourites");
    }
  },
};
