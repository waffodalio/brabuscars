import type { Listing, ListingStatus } from "../entities/Listing";
import type {
  CreateListingDto,
  ListListingQuery,
  UpdateListingDto,
} from "../dto/listing.dto";
import { listingRepository } from "../repositories/listing.repository";
import { carModelRepository } from "../repositories/carModel.repository";
import { categoryRepository } from "../repositories/category.repository";
import { saleRepository } from "../repositories/sale.repository";
import { markListingVehicleSold, stockVehicleRepository } from "../repositories/stockVehicle.repository";
import { todayInBrussels } from "../utils/stockRules";
import { isInGarage, listingStatusProblem, reopensVehicle } from "../utils/stockListingRules";
import { syncListingFromVehicle } from "./stockSync";
import { ApiError } from "../utils/ApiError";
import type { Actor } from "../utils/actor";
import { toListingResponse, type ListingResponse } from "../utils/listingResponse";
import { listingImageService } from "./listingImage.service";
import { reservationService } from "./reservation.service";
import { normalizeWarranty, uniqueValues } from "../utils/listingWarranty";

/** A listing plus whether it is currently held for a customer. */
export type PublicListing = ListingResponse & { reserved: boolean };

async function withReservedFlag(listings: Listing[]): Promise<PublicListing[]> {
  const held = await reservationService.heldListingIds(listings.map((l) => l.id));
  return listings.map((listing) => ({ ...toListingResponse(listing), reserved: held.has(listing.id) }));
}

async function loadOrFail(id: number): Promise<Listing> {
  const listing = await listingRepository.findById(id);
  if (!listing) {
    throw ApiError.notFound(`Listing ${id} not found`);
  }
  return listing;
}

async function assertModelExists(modelId: number): Promise<void> {
  if (!(await carModelRepository.findById(modelId))) {
    throw ApiError.badRequest(`Car model ${modelId} does not exist`);
  }
}

async function assertCategoryExists(categoryId: number): Promise<void> {
  if (!(await categoryRepository.findById(categoryId))) {
    throw ApiError.badRequest(`Category ${categoryId} does not exist`);
  }
}

/**
 * Business logic for listings. An admin creates a listing directly — model,
 * category and the technical fields are part of the same form. `seller_id`
 * records which admin created it. Managed by administrators only (route
 * middleware).
 */
export const listingService = {
  async list(query: ListListingQuery): Promise<PublicListing[]> {
    return withReservedFlag(await listingRepository.findAllFiltered(query));
  },

  async getById(id: number): Promise<PublicListing> {
    const [listing] = await withReservedFlag([await loadOrFail(id)]);
    return listing;
  },

  async create(actor: Actor, dto: CreateListingDto): Promise<ListingResponse> {
    await assertModelExists(dto.modelId);
    if (dto.stockVehicleId !== undefined) {
      const vehicle = await stockVehicleRepository.findOneBy({ id: dto.stockVehicleId });
      if (!vehicle) throw ApiError.badRequest(`Stock vehicle ${dto.stockVehicleId} does not exist`);
      if (vehicle.listingId !== null) throw ApiError.conflict("This stock vehicle already has a listing");
      if (!isInGarage(vehicle.status)) throw ApiError.conflict("This stock vehicle has left the garage");
    }
    if (dto.categoryId != null) {
      await assertCategoryExists(dto.categoryId);
    }

    const saved = await listingRepository.save(
      listingRepository.create({
        sellerId: actor.id,
        modelId: dto.modelId,
        categoryId: dto.categoryId ?? null,
        title: dto.title,
        description: dto.description ?? null,
        price: dto.price,
        year: dto.year,
        mileage: dto.mileage,
        fuelType: dto.fuelType,
        transmission: dto.transmission,
        power: dto.power ?? null,
        doors: dto.doors ?? null,
        color: dto.color ?? null,
        equipment: uniqueValues(dto.equipment ?? []),
        euroNorm: dto.euroNorm ?? null,
        co2: dto.co2 ?? null,
        hasCarPass: dto.hasCarPass ?? false,
        ...normalizeWarranty({
          months: dto.warrantyMonths,
          kind: dto.warrantyKind,
          coverage: dto.warrantyCoverage,
          custom: dto.warrantyCustom,
          notes: dto.warrantyNotes,
        }),
        status: "draft",
      }),
    );
    if (dto.stockVehicleId !== undefined) {
      await stockVehicleRepository.update({ id: dto.stockVehicleId }, { listingId: saved.id });
      // Technical data and options exactly the car's, whatever the form sent.
      const vehicle = await stockVehicleRepository.findOneBy({ id: dto.stockVehicleId });
      if (vehicle) await syncListingFromVehicle(vehicle);
    }
    return toListingResponse(await loadOrFail(saved.id));
  },

  async update(id: number, dto: UpdateListingDto): Promise<ListingResponse> {
    const listing = await loadOrFail(id);

    if (dto.modelId !== undefined && dto.modelId !== listing.modelId) {
      await assertModelExists(dto.modelId);
    }
    if (dto.categoryId != null && dto.categoryId !== listing.categoryId) {
      await assertCategoryExists(dto.categoryId);
    }

    if (dto.modelId !== undefined) listing.modelId = dto.modelId;
    if (dto.categoryId !== undefined) listing.categoryId = dto.categoryId;
    if (dto.title !== undefined) listing.title = dto.title;
    if (dto.description !== undefined) listing.description = dto.description;
    if (dto.price !== undefined) listing.price = dto.price;
    if (dto.year !== undefined) listing.year = dto.year;
    if (dto.mileage !== undefined) listing.mileage = dto.mileage;
    if (dto.fuelType !== undefined) listing.fuelType = dto.fuelType;
    if (dto.transmission !== undefined) listing.transmission = dto.transmission;
    if (dto.power !== undefined) listing.power = dto.power;
    if (dto.doors !== undefined) listing.doors = dto.doors;
    if (dto.color !== undefined) listing.color = dto.color;
    if (dto.equipment !== undefined) listing.equipment = uniqueValues(dto.equipment);
    if (dto.euroNorm !== undefined) listing.euroNorm = dto.euroNorm;
    if (dto.co2 !== undefined) listing.co2 = dto.co2;
    if (dto.hasCarPass !== undefined) listing.hasCarPass = dto.hasCarPass;
    const warrantyTouched =
      dto.warrantyMonths !== undefined ||
      dto.warrantyKind !== undefined ||
      dto.warrantyCoverage !== undefined ||
      dto.warrantyCustom !== undefined ||
      dto.warrantyNotes !== undefined;
    if (warrantyTouched) {
      // Fields left out keep their current value; the whole warranty is then re-checked.
      Object.assign(
        listing,
        normalizeWarranty({
          months: dto.warrantyMonths !== undefined ? dto.warrantyMonths : listing.warrantyMonths,
          kind: dto.warrantyKind !== undefined ? dto.warrantyKind : listing.warrantyKind,
          coverage: dto.warrantyCoverage !== undefined ? dto.warrantyCoverage : listing.warrantyCoverage,
          custom: dto.warrantyCustom !== undefined ? dto.warrantyCustom : listing.warrantyCustom,
          notes: dto.warrantyNotes !== undefined ? dto.warrantyNotes : listing.warrantyNotes,
        }),
      );
    }

    await listingRepository.save(listing);
    return toListingResponse(await loadOrFail(id));
  },

  async updateStatus(
    id: number,
    status: ListingStatus,
  ): Promise<ListingResponse> {
    const listing = await loadOrFail(id);
    const vehicle = await stockVehicleRepository.findOneBy({ listingId: id });
    const invoiced =
      (await saleRepository.existsBy({ listingId: id, status: "paid" })) ||
      (vehicle !== null && (await saleRepository.existsBy({ stockVehicleId: vehicle.id, status: "paid" })));
    const change = { current: listing.status, next: status, vehicleStatus: vehicle?.status ?? null, invoiced };
    const problem = listingStatusProblem(change);
    if (problem) throw ApiError.conflict(problem);
    // Un-selling a car sold by hand (no invoice): the car is back in stock.
    if (vehicle && reopensVehicle(change)) {
      await stockVehicleRepository.update({ id: vehicle.id }, { status: "in_stock", exitDate: null, exitReason: null });
    }

    listing.status = status;
    if (status === "published" && listing.publishedAt === null) {
      listing.publishedAt = new Date();
    }

    await listingRepository.save(listing);
    // Marked sold by hand: the garage register is told (its car leaves the stock).
    if (status === "sold") await markListingVehicleSold(id, todayInBrussels());
    return toListingResponse(await loadOrFail(id));
  },

  /**
   * Deletes a listing and its photos. Refused while reservations are in
   * progress on it: deleting would silently remove the customers' requests
   * (cascade) — they must be declined / cancelled first, which tells them.
   */
  async remove(id: number): Promise<void> {
    await loadOrFail(id); // 404 if missing
    const open = await reservationService.countOpenForListing(id);
    if (open > 0) {
      throw ApiError.conflict(
        `${open} reservation(s) in progress on this listing: decline or cancel them first`,
      );
    }
    // A purchase order or an invoice names this car: deleting the listing
    // would cut that link (sale.listing_id → NULL). Archive it instead.
    const documents = await saleRepository.documentNumbersForListing(id);
    if (documents.length > 0) {
      throw ApiError.conflict(
        `This listing is on sale documents (${documents.join(", ")}): archive it instead of deleting it`,
      );
    }
    await listingImageService.purgeForListing(id); // delete image files first
    const result = await listingRepository.delete({ id });
    if (!result.affected) {
      throw ApiError.notFound(`Listing ${id} not found`);
    }
  },
};
