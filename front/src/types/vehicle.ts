import type { CarModel } from "./carModel";
import type { Category } from "./category";

export const FUEL_TYPES = [
  "petrol",
  "diesel",
  "hybrid",
  "electric",
  "lpg",
] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const TRANSMISSIONS = ["manual", "automatic"] as const;
export type Transmission = (typeof TRANSMISSIONS)[number];

export interface Vehicle {
  id: number;
  modelId: number;
  /** Present when the API loads the relation. */
  model?: CarModel;
  categoryId: number | null;
  category?: Category | null;
  year: number;
  mileage: number;
  fuelType: FuelType;
  transmission: Transmission;
  power: number | null;
  doors: number | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}
