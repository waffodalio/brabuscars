import type { FuelType, Transmission, Vehicle } from "@/types/vehicle";

/** French display labels for the vehicle enums stored in English. */
export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  petrol: "Essence",
  diesel: "Diesel",
  hybrid: "Hybride",
  electric: "Électrique",
  lpg: "GPL",
};

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  manual: "Manuelle",
  automatic: "Automatique",
};

/** "Peugeot 308", or a fallback when the model relation is not loaded. */
export function vehicleTitle(
  vehicle: Pick<Vehicle, "modelId" | "model">,
): string {
  const brand = vehicle.model?.brand?.name;
  const model = vehicle.model?.name;
  if (brand && model) return `${brand} ${model}`;
  return model ?? `Modèle #${vehicle.modelId}`;
}
