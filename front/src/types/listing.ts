import type { AuthUser } from "./auth";
import type { Vehicle } from "./vehicle";

export const LISTING_STATUSES = [
  "draft",
  "published",
  "sold",
  "archived",
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export interface Listing {
  id: number;
  sellerId: number;
  /** Present when the API loads the relation (public user shape). */
  seller?: AuthUser;
  vehicleId: number;
  vehicle?: Vehicle;
  title: string;
  description: string | null;
  price: number;
  city: string;
  postalCode: string | null;
  status: ListingStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingInput {
  vehicleId: number;
  title: string;
  description?: string | null;
  price: number;
  city: string;
  postalCode?: string | null;
}

export type UpdateListingInput = Partial<Omit<CreateListingInput, "vehicleId">>;
