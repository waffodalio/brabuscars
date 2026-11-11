import type { ListingStatus } from "../entities/Listing";
import type { StockVehicle } from "../entities/StockVehicle";
import { toListingImageResponse } from "./listingImage";
import { daysInStock, stockReference, stockTotals, todayInBrussels } from "./stockRules";

/** « Audi A4 2.0 TDI S line » — brand, model and version (when loaded). */
export function stockVehicleLabel(vehicle: Pick<StockVehicle, "model" | "version">): string {
  return [vehicle.model?.brand?.name, vehicle.model?.name, vehicle.version].filter(Boolean).join(" ");
}

export type StockVehicleResponse = ReturnType<typeof toStockVehicleResponse>;

/**
 * A garage-register car as returned by the API: its reference and label,
 * the linked listing (summary), the costs and the computed figures (cost
 * price, potential margin, days at the garage). Expects `model.brand`,
 * `listing` and `costs` loaded.
 */
export function toStockVehicleResponse(
  vehicle: StockVehicle,
  sales: { id: number; reference: string | null; status: string; buyerName: string }[] = [],
) {
  const costs = [...(vehicle.costs ?? [])].sort((a, b) => a.spentOn.localeCompare(b.spentOn) || a.id - b.id);
  return {
    id: vehicle.id,
    reference: stockReference(vehicle.id),
    label: stockVehicleLabel(vehicle),
    status: vehicle.status,
    model: vehicle.model
      ? { id: vehicle.model.id, name: vehicle.model.name, brand: vehicle.model.brand ? { id: vehicle.model.brand.id, name: vehicle.model.brand.name } : null }
      : null,
    modelId: vehicle.modelId,
    version: vehicle.version,
    vin: vehicle.vin,
    year: vehicle.year,
    firstRegistration: vehicle.firstRegistration,
    mileage: vehicle.mileage,
    fuelType: vehicle.fuelType,
    transmission: vehicle.transmission,
    power: vehicle.power,
    color: vehicle.color,
    doors: vehicle.doors,
    equipment: vehicle.equipment ?? [],
    euroNorm: vehicle.euroNorm,
    co2: vehicle.co2,
    hasCarPass: vehicle.hasCarPass,
    entryDate: vehicle.entryDate,
    entrySource: vehicle.entrySource,
    supplier: vehicle.supplier,
    purchasePrice: vehicle.purchasePrice,
    targetPrice: vehicle.targetPrice,
    location: vehicle.location,
    exitDate: vehicle.exitDate,
    exitReason: vehicle.exitReason,
    notes: vehicle.notes,
    listing: vehicle.listing
      ? {
          id: vehicle.listing.id,
          title: vehicle.listing.title,
          status: vehicle.listing.status as ListingStatus,
          price: vehicle.listing.price,
        }
      : null,
    /** Cover first, then by position (the listing shows the same). */
    images: [...(vehicle.images ?? [])]
      .map(toListingImageResponse)
      .sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.position - b.position),
    costs: costs.map((cost) => ({ id: cost.id, label: cost.label, amount: cost.amount, spentOn: cost.spentOn })),
    totals: stockTotals(vehicle.purchasePrice, costs, vehicle.targetPrice),
    daysInStock: daysInStock(vehicle.entryDate, vehicle.exitDate, todayInBrussels()),
    /** Sale files of this car (detail only). */
    sales,
    createdAt: vehicle.createdAt,
  };
}
