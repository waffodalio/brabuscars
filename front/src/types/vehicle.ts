/**
 * Technical enums shared by listings. CHCars is a single dealership: the advert
 * and the car it describes are one record (see {@link ./listing}), so there is
 * no standalone `Vehicle` type — only these value sets.
 */
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
