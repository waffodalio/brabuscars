import type { Listing } from "../entities/Listing";
import { toPublicUser, type PublicUser } from "./publicUser";

/** A listing as returned by the API: the seller is reduced to its public shape. */
export type ListingResponse = Omit<Listing, "seller" | "favorites"> & {
  seller: PublicUser;
};

export function toListingResponse(listing: Listing): ListingResponse {
  const { seller, favorites: _favorites, ...rest } = listing;
  return { ...rest, seller: toPublicUser(seller) };
}
