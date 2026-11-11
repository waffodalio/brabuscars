import type { Listing } from "@/types/listing";
import type { StockVehicle } from "@/types/stock";
import { formatMileage } from "@/utils/listingLabels";
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "@/utils/vehicleLabels";

export interface StockGap {
  label: string;
  stock: string;
  listing: string;
}

/**
 * Technical fields where a listing disagrees with its garage-register car
 * (the car is the reference: entered from the catalogue, checked at entry).
 * Mileage only counts as a gap when the listing shows *less* than the
 * odometer at entry (more is normal: the car may have been driven since).
 */
export function stockGaps(
  vehicle: Pick<StockVehicle, "modelId" | "label" | "year" | "mileage" | "fuelType" | "transmission" | "power" | "doors" | "color">,
  listing: Pick<Listing, "modelId" | "model" | "year" | "mileage" | "fuelType" | "transmission" | "power" | "doors" | "color">,
): StockGap[] {
  const gaps: StockGap[] = [];
  const add = (label: string, stock: string, shown: string) => gaps.push({ label, stock, listing: shown });

  if (vehicle.modelId !== listing.modelId) {
    add("Modèle", vehicle.label, [listing.model?.brand?.name, listing.model?.name].filter(Boolean).join(" ") || "?");
  }
  if (vehicle.year !== listing.year) add("Année", String(vehicle.year), String(listing.year));
  if (listing.mileage < vehicle.mileage) add("Kilométrage", formatMileage(vehicle.mileage), formatMileage(listing.mileage));
  if (vehicle.fuelType !== listing.fuelType) {
    add("Carburant", FUEL_TYPE_LABELS[vehicle.fuelType], FUEL_TYPE_LABELS[listing.fuelType]);
  }
  if (vehicle.transmission !== listing.transmission) {
    add("Boîte", TRANSMISSION_LABELS[vehicle.transmission], TRANSMISSION_LABELS[listing.transmission]);
  }
  if (vehicle.power !== null && listing.power !== null && vehicle.power !== listing.power) {
    add("Puissance", `${vehicle.power} ch`, `${listing.power} ch`);
  }
  if (vehicle.doors !== null && listing.doors !== null && vehicle.doors !== listing.doors) {
    add("Portes", String(vehicle.doors), String(listing.doors));
  }
  const norm = (text: string | null) => (text ?? "").trim().toLowerCase();
  if (vehicle.color && listing.color && norm(vehicle.color) !== norm(listing.color)) {
    add("Couleur", vehicle.color, listing.color);
  }
  return gaps;
}
