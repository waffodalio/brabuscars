import type { Listing } from "./listing";

export interface Favorite {
  id: number;
  listingId: number;
  createdAt: string;
  listing: Listing;
}
