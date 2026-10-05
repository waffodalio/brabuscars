import type { CarModel } from "@/types/carModel";
import type { FuelType, Transmission } from "@/types/vehicle";

/** French display labels for the technical enums stored in English. */
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
export function vehicleTitle(input: {
  modelId: number;
  model?: CarModel;
}): string {
  const brand = input.model?.brand?.name;
  const model = input.model?.name;
  if (brand && model) return `${brand} ${model}`;
  return model ?? `Modèle #${input.modelId}`;
}
