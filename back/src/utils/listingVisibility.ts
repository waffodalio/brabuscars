import type { ListingStatus } from "../entities/Listing";

/**
 * Whether a listing may be shown outside the administration (visitors and
 * `user` accounts): only `published` adverts are.
 */
export function isPublished(listing: { status: ListingStatus }): boolean {
  return listing.status === "published";
}
