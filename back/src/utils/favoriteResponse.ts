import type { Favorite } from "../entities/Favorite";
import { toListingResponse, type ListingResponse } from "./listingResponse";

/** A favourite as returned by the API: the embedded listing is sanitised. */
export interface FavoriteResponse {
  id: number;
  listingId: number;
  createdAt: Date;
  listing: ListingResponse;
}

export function toFavoriteResponse(favorite: Favorite): FavoriteResponse {
  return {
    id: favorite.id,
    listingId: favorite.listingId,
    createdAt: favorite.createdAt,
    listing: toListingResponse(favorite.listing),
  };
}
