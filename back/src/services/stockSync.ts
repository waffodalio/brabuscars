import type { StockVehicle } from "../entities/StockVehicle";
import { listingRepository } from "../repositories/listing.repository";

/**
 * The car is the technical reference: its listing takes the same model,
 * year, mileage, fuel, gearbox, power, doors, colour, options, Euro norm,
 * CO₂ and Car-Pass. The listing keeps its own commercial data (title, price,
 * category, description, warranty, photos).
 */
export async function syncListingFromVehicle(vehicle: StockVehicle): Promise<void> {
  if (!vehicle.listingId) return;
  await listingRepository.update(
    { id: vehicle.listingId },
    {
      modelId: vehicle.modelId,
      year: vehicle.year,
      mileage: vehicle.mileage,
      fuelType: vehicle.fuelType,
      transmission: vehicle.transmission,
      power: vehicle.power,
      doors: vehicle.doors,
      color: vehicle.color,
      equipment: vehicle.equipment ?? [],
      euroNorm: vehicle.euroNorm,
      co2: vehicle.co2,
      hasCarPass: vehicle.hasCarPass,
    },
  );
}
