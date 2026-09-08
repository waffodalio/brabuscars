import { Not } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { ListingImage } from "../entities/ListingImage";

/**
 * Data-access layer for {@link ListingImage}. Item lookups check both ids so
 * one listing's image cannot be reached through another listing's URL.
 */
export const listingImageRepository = AppDataSource.getRepository(
  ListingImage,
).extend({
  findByListing(listingId: number): Promise<ListingImage[]> {
    return this.find({
      where: { listingId },
      order: { position: "ASC", id: "ASC" },
    });
  },

  findInListing(
    listingId: number,
    imageId: number,
  ): Promise<ListingImage | null> {
    return this.findOneBy({ id: imageId, listingId });
  },

  countForListing(listingId: number): Promise<number> {
    return this.countBy({ listingId });
  },

  /** Clears the cover flag on a listing's images (optionally except one). */
  clearCover(listingId: number, exceptId?: number): Promise<unknown> {
    return this.update(
      exceptId ? { listingId, id: Not(exceptId) } : { listingId },
      { isCover: false },
    );
  },
});
