/** Technical enums shared by listings and garage-register cars. */
export const FUEL_TYPES = ["petrol", "diesel", "hybrid", "electric", "lpg"] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const TRANSMISSIONS = ["manual", "automatic"] as const;
export type Transmission = (typeof TRANSMISSIONS)[number];
