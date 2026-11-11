/**
 * Detailed listing fields — same value sets as the API
 * (`back/src/entities/listingDetails.ts`, migration 008).
 */

/** Equipment keys, grouped as shown on the listing page and in the admin form. */
export const EQUIPMENT_GROUPS = {
  comfort: [
    "climateControl",
    "heatedSeats",
    "leatherSeats",
    "electricSeats",
    "keyless",
    "cruiseControl",
    "electricTailgate",
    "panoramicRoof",
  ],
  multimedia: [
    "gps",
    "appleCarplay",
    "androidAuto",
    "bluetooth",
    "premiumAudio",
    "headUpDisplay",
    "wirelessCharging",
  ],
  safety: ["rearCamera", "camera360", "parkingSensors", "adaptiveCruise", "blindSpot", "laneAssist", "isofix"],
  exterior: ["ledHeadlights", "alloyWheels", "towBar", "tintedWindows"],
} as const;
export type EquipmentGroup = keyof typeof EQUIPMENT_GROUPS;
export type Equipment = (typeof EQUIPMENT_GROUPS)[EquipmentGroup][number];

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

export const WARRANTY_KINDS = ["dealer", "manufacturer"] as const;
export type WarrantyKind = (typeof WARRANTY_KINDS)[number];

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

/** Usual warranty lengths offered as quick picks (any 1–120 months is accepted). */
export const WARRANTY_PRESETS = [3, 6, 12, 24, 36] as const;

/** « Euro 6d-TEMP », « Euro 5 »… (the same in every language). */
export function euroNormLabel(norm: EuroNorm): string {
  if (norm === "euro6dTemp") return "Euro 6d-TEMP";
  return `Euro ${norm.slice(4)}`;
}
