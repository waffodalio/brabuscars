import type { StockCostDto, StockExitDto, StockVehicleInputDto } from "../dto/stock.dto";
import type { StockStatus } from "../entities/stockTypes";
import { StockVehicle } from "../entities/StockVehicle";
import { carModelRepository } from "../repositories/carModel.repository";
import { listingRepository } from "../repositories/listing.repository";
import { saleRepository } from "../repositories/sale.repository";
import { stockVehicleCostRepository, stockVehicleRepository } from "../repositories/stockVehicle.repository";
import { ApiError } from "../utils/ApiError";
import { uniqueValues } from "../utils/listingWarranty";
import { exitStatus } from "../utils/stockRules";
import { listingStatusAfterExit, listingStatusAfterReopen } from "../utils/stockListingRules";
import { In } from "typeorm";
import { syncListingFromVehicle } from "./stockSync";
import { stockVehicleImageService } from "./stockVehicleImage.service";
import { toStockVehicleResponse, type StockVehicleResponse } from "../utils/stockResponse";

async function loadOrFail(id: number): Promise<StockVehicle> {
  const vehicle = await stockVehicleRepository.findDetail(id);
  if (!vehicle) throw ApiError.notFound(`Stock vehicle ${id} not found`);
  return vehicle;
}

/** Reference of the purchase order / invoice of each sale file of this car. */
async function salesOf(vehicleId: number) {
  const sales = await saleRepository.find({
    where: { stockVehicleId: vehicleId },
    relations: { documents: true },
    order: { createdAt: "ASC" },
  });
  return sales.map((sale) => {
    const invoice = sale.documents.find((document) => document.kind === "invoice");
    const order = sale.documents.find((document) => document.kind === "order");
    return { id: sale.id, reference: (invoice ?? order)?.number ?? null, status: sale.status, buyerName: sale.buyerName };
  });
}

/** A paid sale (final invoice) names this car, directly or through its listing. */
async function isInvoiced(vehicle: Pick<StockVehicle, "id" | "listingId">): Promise<boolean> {
  return (
    (await saleRepository.existsBy({ stockVehicleId: vehicle.id, status: "paid" })) ||
    (vehicle.listingId !== null && (await saleRepository.existsBy({ listingId: vehicle.listingId, status: "paid" })))
  );
}

/** Checks the model, the listing and the uniqueness of VIN / listing link. */
async function assertValid(dto: StockVehicleInputDto, id?: number): Promise<void> {
  if (!(await carModelRepository.existsBy({ id: dto.modelId }))) {
    throw ApiError.badRequest(`Model ${dto.modelId} does not exist`);
  }
  if (dto.listingId) {
    if (!(await listingRepository.existsBy({ id: dto.listingId }))) {
      throw ApiError.badRequest(`Listing ${dto.listingId} does not exist`);
    }
    const linked = await stockVehicleRepository.findOneBy({ listingId: dto.listingId });
    if (linked && linked.id !== id) {
      throw ApiError.conflict("This listing is already linked to another stock vehicle");
    }
  }
  if (dto.vin) {
    const same = await stockVehicleRepository.findOneBy({ vin: dto.vin });
    if (same && same.id !== id) throw ApiError.conflict(`VIN ${dto.vin} is already in the stock`);
  }
}

function fields(dto: StockVehicleInputDto): Partial<StockVehicle> {
  return {
    modelId: dto.modelId,
    listingId: dto.listingId ?? null,
    version: dto.version ?? null,
    vin: dto.vin ?? null,
    year: dto.year,
    firstRegistration: dto.firstRegistration ?? null,
    mileage: dto.mileage,
    fuelType: dto.fuelType,
    transmission: dto.transmission,
    power: dto.power ?? null,
    color: dto.color ?? null,
    doors: dto.doors ?? null,
    equipment: uniqueValues(dto.equipment ?? []),
    euroNorm: dto.euroNorm ?? null,
    co2: dto.co2 ?? null,
    hasCarPass: dto.hasCarPass ?? false,
    entryDate: dto.entryDate,
    entrySource: dto.entrySource,
    supplier: dto.supplier ?? null,
    purchasePrice: dto.purchasePrice ?? null,
    targetPrice: dto.targetPrice ?? null,
    location: dto.location ?? null,
    notes: dto.notes ?? null,
  };
}

/**
 * The garage register: cars managed by the dealership, independent from the
 * listings (a car may have one, or none). Entry, costs, exit; a sale file
 * can point at a car, and its final invoice marks it sold.
 */
export const stockVehicleService = {
  async list(status?: StockStatus): Promise<StockVehicleResponse[]> {
    const vehicles = await stockVehicleRepository.findAllForList();
    return vehicles.filter((vehicle) => !status || vehicle.status === status).map((vehicle) => toStockVehicleResponse(vehicle));
  },

  async get(id: number): Promise<StockVehicleResponse> {
    return toStockVehicleResponse(await loadOrFail(id), await salesOf(id));
  },

  async create(dto: StockVehicleInputDto): Promise<StockVehicleResponse> {
    await assertValid(dto);
    const saved = await stockVehicleRepository.save(
      stockVehicleRepository.create({ ...fields(dto), status: dto.status ?? "in_stock" }),
    );
    if (saved.listingId) {
      await stockVehicleImageService.adoptListingPhotos(saved.listingId, saved.id);
      await syncListingFromVehicle(saved);
    }
    return this.get(saved.id);
  },

  async update(id: number, dto: StockVehicleInputDto): Promise<StockVehicleResponse> {
    const vehicle = await loadOrFail(id);
    await assertValid(dto, id);
    const left = vehicle.status === "sold" || vehicle.status === "exited";
    await stockVehicleRepository.update(
      { id },
      // A car that left keeps its status: reopen it first to change that.
      { ...fields(dto), ...(dto.status && !left ? { status: dto.status } : {}) },
    );
    const updated = await loadOrFail(id);
    if (updated.listingId) {
      if (updated.listingId !== vehicle.listingId) {
        await stockVehicleImageService.adoptListingPhotos(updated.listingId, id);
      }
      await syncListingFromVehicle(updated);
    }
    return this.get(id);
  },

  /** Deletes an entry made by mistake — never a car named on a sale file. */
  async remove(id: number): Promise<void> {
    const vehicle = await loadOrFail(id);
    if (await saleRepository.existsBy({ stockVehicleId: id })) {
      throw ApiError.conflict("This vehicle is on a sale file: record its exit instead of deleting it");
    }
    // Its listing shows its photos: deleting would leave the listing without any.
    if (vehicle.listingId) {
      throw ApiError.conflict("This vehicle has a listing: detach or delete the listing first");
    }
    await stockVehicleImageService.purgeForVehicle(id); // files first; rows go with the cascade
    await stockVehicleRepository.delete({ id });
  },

  /** The car leaves the garage (sold, returned, scrapped, moved…). */
  async exit(id: number, dto: StockExitDto): Promise<StockVehicleResponse> {
    const vehicle = await loadOrFail(id);
    if (dto.exitDate < vehicle.entryDate) {
      throw ApiError.badRequest("The exit date can't be before the entry date");
    }
    await stockVehicleRepository.update(
      { id },
      { status: exitStatus(dto.exitReason), exitDate: dto.exitDate, exitReason: dto.exitReason },
    );
    // Its listing follows: sold on a sale, taken offline otherwise.
    if (vehicle.listingId) {
      await listingRepository.update(
        { id: vehicle.listingId, status: In(["published", "draft"]) },
        { status: listingStatusAfterExit(dto.exitReason) },
      );
    }
    return this.get(id);
  },

  /** Back in stock (exit recorded by mistake, sale cancelled…). */
  async reopen(id: number): Promise<StockVehicleResponse> {
    const vehicle = await loadOrFail(id);
    if (await isInvoiced(vehicle)) {
      throw ApiError.conflict("This vehicle has been invoiced: it can't go back in stock");
    }
    await stockVehicleRepository.update({ id }, { status: "in_stock", exitDate: null, exitReason: null });
    // Its listing, closed by the exit, comes back (online if it had been).
    if (vehicle.listing) {
      const next = listingStatusAfterReopen(vehicle.listing.status, vehicle.listing.publishedAt !== null);
      if (next) await listingRepository.update({ id: vehicle.listing.id }, { status: next });
    }
    return this.get(id);
  },

  async addCost(id: number, dto: StockCostDto): Promise<StockVehicleResponse> {
    await loadOrFail(id);
    await stockVehicleCostRepository.save(stockVehicleCostRepository.create({ vehicleId: id, ...dto }));
    return this.get(id);
  },

  async removeCost(id: number, costId: number): Promise<StockVehicleResponse> {
    const result = await stockVehicleCostRepository.delete({ id: costId, vehicleId: id });
    if (!result.affected) throw ApiError.notFound(`Cost ${costId} not found`);
    return this.get(id);
  },
};
