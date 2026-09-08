import type { Listing } from "../entities/Listing";
import { toPublicUser, type PublicUser } from "./publicUser";
import {
  toListingImageResponse,
  type ListingImageResponse,
} from "./listingImage";

/**
 * A listing as returned by the API: the seller is reduced to its public shape
 * and images are exposed with their public URLs, cover first.
 */
export type ListingResponse = Omit<
  Listing,
  "seller" | "favorites" | "images"
> & {
  seller: PublicUser;
  images: ListingImageResponse[];
};

export function toListingResponse(listing: Listing): ListingResponse {
  const { seller, favorites: _favorites, images, ...rest } = listing;
  const mappedImages = (images ?? [])
    .map(toListingImageResponse)
    .sort(
      (a, b) =>
        Number(b.isCover) - Number(a.isCover) || a.position - b.position,
    );
  return { ...rest, seller: toPublicUser(seller), images: mappedImages };
}
