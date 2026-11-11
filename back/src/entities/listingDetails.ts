/**
 * Value sets of a listing's detailed fields (migration 008). Kept apart from
 * `Listing.ts` so the DTOs and the front labels share one list.
 */

/** Equipment a buyer looks for, stored as a JSON array of these keys. */
export const EQUIPMENT = [
  // Comfort
  "climateControl",
  "heatedSeats",
  "leatherSeats",
  "electricSeats",
  "keyless",
  "cruiseControl",
  "electricTailgate",
  "panoramicRoof",
  // Multimedia
  "gps",
  "appleCarplay",
  "androidAuto",
  "bluetooth",
  "premiumAudio",
  "headUpDisplay",
  "wirelessCharging",
  // Safety & driving aids
  "rearCamera",
  "camera360",
  "parkingSensors",
  "adaptiveCruise",
  "blindSpot",
  "laneAssist",
  "isofix",
  // Exterior
  "ledHeadlights",
  "alloyWheels",
  "towBar",
  "tintedWindows",
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

/** European emission standards (low-emission zones, registration tax). */
export const EURO_NORMS = [
  "euro1",
  "euro2",
  "euro3",
  "euro4",
  "euro5",
  "euro6",
  "euro6dTemp",
  "euro6d",
  "euro7",
] as const;
export type EuroNorm = (typeof EURO_NORMS)[number];

/** Who backs the warranty: the dealership itself, or the manufacturer's remaining one. */
export const WARRANTY_KINDS = ["dealer", "manufacturer"] as const;
export type WarrantyKind = (typeof WARRANTY_KINDS)[number];

/** Parts a warranty can cover, chosen one by one by the admin. */
export const WARRANTY_COVERAGE = [
  "engine",
  "gearbox",
  "drivetrain",
  "turbo",
  "fuelSystem",
  "cooling",
  "electrical",
  "electronics",
  "airConditioning",
  "steering",
  "brakes",
  "suspension",
  "hybridBattery",
] as const;
export type WarrantyCoverage = (typeof WARRANTY_COVERAGE)[number];
