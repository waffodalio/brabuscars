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
  "seller" | "favorites" | "images" | "equipment" | "warrantyCoverage" | "warrantyCustom" | "stockVehicle"
> & {
  images: ListingImageResponse[];
  equipment: NonNullable<Listing["equipment"]>;
  warrantyCoverage: NonNullable<Listing["warrantyCoverage"]>;
  warrantyCustom: string[];
};

export function toListingResponse(listing: Listing): ListingResponse {
  // `stockVehicle` (purchase price, supplier…) never leaves the back-office:
  // only its photos are used — a listing of a garage car shows the car's.
  const { seller: _seller, favorites: _favorites, images, stockVehicle, ...rest } = listing;
  // Linked to a car: the car's photos only (even none) — never a mix.
  const source = stockVehicle ? (stockVehicle.images ?? []) : (images ?? []);
  const mappedImages = source
    .map(toListingImageResponse)
    .sort(
      (a, b) =>
        Number(b.isCover) - Number(a.isCover) || a.position - b.position,
    );
  return {
    ...rest,
    // Listings older than migration 008 have no lists: always send arrays.
    equipment: rest.equipment ?? [],
    warrantyCoverage: rest.warrantyCoverage ?? [],
    warrantyCustom: rest.warrantyCustom ?? [],
    images: mappedImages,
  };
}
