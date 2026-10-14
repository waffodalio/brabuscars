import type { Listing } from "../entities/Listing";
import {
  toListingImageResponse,
  type ListingImageResponse,
} from "./listingImage";

/**
 * A listing as returned by the API: images are exposed with their public URLs,
 * cover first. The seller relation is never sent — only `sellerId` — so the
 * admin who created the advert (e-mail, role) is not disclosed to visitors.
 */
export type ListingResponse = Omit<
  Listing,
  "seller" | "favorites" | "images"
> & {
  images: ListingImageResponse[];
};

export function toListingResponse(listing: Listing): ListingResponse {
  const { seller: _seller, favorites: _favorites, images, ...rest } = listing;
  const mappedImages = (images ?? [])
    .map(toListingImageResponse)
    .sort(
      (a, b) =>
        Number(b.isCover) - Number(a.isCover) || a.position - b.position,
    );
  return { ...rest, images: mappedImages };
}
