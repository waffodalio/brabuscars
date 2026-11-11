import type { CarModel } from "./carModel";
import type { Category } from "./category";
import type { Equipment, EuroNorm, WarrantyCoverage, WarrantyKind } from "./listingDetails";
import type { FuelType, Transmission } from "./vehicle";

export const LISTING_STATUSES = [
  "draft",
  "published",
  "sold",
  "archived",
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const LISTING_SORTS = [
  "recent",
  "price_asc",
  "price_desc",
  "year_desc",
  "mileage_asc",
] as const;
export type ListingSort = (typeof LISTING_SORTS)[number];

export interface ListingImage {
  id: number;
  url: string;
  thumbnailUrl: string;
  width: number | null;
  height: number | null;
  position: number;
  isCover: boolean;
}

/**
 * An advert. It carries the car's technical fields directly (model, year,
 * mileage, …) — the admin fills everything in one form.
 */
export interface Listing {
  id: number;
  sellerId: number;
  modelId: number;
  /** Present when the API loads the relation (with its brand). */
  model?: CarModel;
  categoryId: number | null;
  category?: Category | null;
  title: string;
  description: string | null;
  price: number;
  year: number;
  mileage: number;
  fuelType: FuelType;
  transmission: Transmission;
  power: number | null;
  doors: number | null;
  color: string | null;
  equipment: Equipment[];
  euroNorm: EuroNorm | null;
  /** g/km */
  co2: number | null;
  hasCarPass: boolean;
  /** Null = no warranty. */
  warrantyMonths: number | null;
  warrantyKind: WarrantyKind | null;
  warrantyCoverage: WarrantyCoverage[];
  /** Covered parts typed by the admin (shown as written). */
  warrantyCustom: string[];
  warrantyNotes: string | null;
  status: ListingStatus;
  publishedAt: string | null;
  /** Cover first, then by position. Empty until images are uploaded. */
  images: ListingImage[];
  /** Put aside for a customer right now (confirmed hold). Sent by the list and detail endpoints. */
  reserved?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingInput {
  modelId: number;
  categoryId?: number | null;
  title: string;
  description?: string | null;
  price: number;
  year: number;
  mileage: number;
  fuelType: FuelType;
  transmission: Transmission;
  power?: number | null;
  doors?: number | null;
  color?: string | null;
  equipment?: Equipment[];
  euroNorm?: EuroNorm | null;
  co2?: number | null;
  hasCarPass?: boolean;
  warrantyMonths?: number | null;
  warrantyKind?: WarrantyKind | null;
  warrantyCoverage?: WarrantyCoverage[];
  warrantyCustom?: string[];
  warrantyNotes?: string | null;
  /** Creation only: the garage-register car this listing is made from (gets linked). */
  stockVehicleId?: number;
}

export type UpdateListingInput = Partial<CreateListingInput>;
