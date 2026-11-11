import type { ListingImage, ListingStatus } from "./listing";
import type { Equipment, EuroNorm } from "./listingDetails";
import type { FuelType, Transmission } from "./vehicle";

/** Garage register (`/api/stock`), same value sets as the API (migration 009). */
export const STOCK_STATUSES = ["incoming", "in_stock", "preparation", "sold", "exited"] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];
/** Set by hand; sold / exited come from an exit. */
export const OPEN_STOCK_STATUSES = ["incoming", "in_stock", "preparation"] as const;
export type OpenStockStatus = (typeof OPEN_STOCK_STATUSES)[number];

export const ENTRY_SOURCES = ["purchase", "trade_in", "consignment", "other"] as const;
export type EntrySource = (typeof ENTRY_SOURCES)[number];

export const EXIT_REASONS = ["sale", "return", "scrap", "transfer", "other"] as const;
export type ExitReason = (typeof EXIT_REASONS)[number];

export interface StockVehicle {
  id: number;
  /** `STK-0007` (internal). */
  reference: string;
  /** « Audi A4 2.0 TDI S line ». */
  label: string;
  status: StockStatus;
  model: { id: number; name: string; brand: { id: number; name: string } | null } | null;
  modelId: number;
  version: string | null;
  vin: string | null;
  year: number;
  firstRegistration: string | null;
  mileage: number;
  fuelType: FuelType;
  transmission: Transmission;
  power: number | null;
  color: string | null;
  doors: number | null;
  /** Options (equipment keys), copied to the listing. */
  equipment: Equipment[];
  euroNorm: EuroNorm | null;
  /** g/km */
  co2: number | null;
  hasCarPass: boolean;
  entryDate: string;
  entrySource: EntrySource;
  supplier: string | null;
  purchasePrice: number | null;
  targetPrice: number | null;
  location: string | null;
  exitDate: string | null;
  exitReason: ExitReason | null;
  notes: string | null;
  listing: { id: number; title: string; status: ListingStatus; price: number } | null;
  /** The car's photos (cover first) — its listing shows them. */
  images: ListingImage[];
  costs: { id: number; label: string; amount: number; spentOn: string }[];
  totals: { costs: number; costPrice: number | null; potentialMargin: number | null };
  daysInStock: number;
  /** Detail only: sale files of this car. */
  sales: { id: number; reference: string | null; status: string; buyerName: string }[];
  createdAt: string;
}

/** `POST /stock` and `PUT /stock/:id`. */
export interface StockVehicleInput {
  modelId: number;
  listingId: number | null;
  status?: OpenStockStatus;
  version: string | null;
  vin: string | null;
  year: number;
  firstRegistration: string | null;
  mileage: number;
  fuelType: FuelType;
  transmission: Transmission;
  power: number | null;
  color: string | null;
  doors: number | null;
  /** Options (equipment keys), copied to the listing. */
  equipment: Equipment[];
  euroNorm: EuroNorm | null;
  /** g/km */
  co2: number | null;
  hasCarPass: boolean;
  entryDate: string;
  entrySource: EntrySource;
  supplier: string | null;
  purchasePrice: number | null;
  targetPrice: number | null;
  location: string | null;
  notes: string | null;
}
