import type { Listing, ListingStatus } from "../entities/Listing";
import type {
  CreateListingDto,
  ListListingQuery,
  UpdateListingDto,
} from "../dto/listing.dto";
import { listingRepository } from "../repositories/listing.repository";
import { vehicleRepository } from "../repositories/vehicle.repository";
import { ApiError } from "../utils/ApiError";
import type { Actor } from "../utils/actor";
import { toListingResponse, type ListingResponse } from "../utils/listingResponse";
import { listingImageService } from "./listingImage.service";

async function loadOrFail(id: number): Promise<Listing> {
  const listing = await listingRepository.findById(id);
  if (!listing) {
    throw ApiError.notFound(`Listing ${id} not found`);
  }
  return listing;
}

/**
 * Business logic for listings: vehicle validation, the "one listing per
 * vehicle" rule and the status lifecycle. Listings are managed by
 * administrators only (enforced by the route middleware); `seller_id` records
 * which admin created the listing.
 */
export const listingService = {
  async list(query: ListListingQuery): Promise<ListingResponse[]> {
    const rows = await listingRepository.findAllFiltered(query);
    return rows.map(toListingResponse);
  },

  async getById(id: number): Promise<ListingResponse> {
    return toListingResponse(await loadOrFail(id));
  },

  async create(actor: Actor, dto: CreateListingDto): Promise<ListingResponse> {
    if (!(await vehicleRepository.findById(dto.vehicleId))) {
      throw ApiError.badRequest(`Vehicle ${dto.vehicleId} does not exist`);
    }
    if (await listingRepository.existsByVehicleId(dto.vehicleId)) {
      throw ApiError.conflict(`Vehicle ${dto.vehicleId} already has a listing`);
    }

    const saved = await listingRepository.save(
      listingRepository.create({
        sellerId: actor.id,
        vehicleId: dto.vehicleId,
        title: dto.title,
        description: dto.description ?? null,
        price: dto.price,
        status: "draft",
      }),
    );
    return toListingResponse(await loadOrFail(saved.id));
  },

  async update(id: number, dto: UpdateListingDto): Promise<ListingResponse> {
    const listing = await loadOrFail(id);

    if (dto.title !== undefined) listing.title = dto.title;
    if (dto.description !== undefined) listing.description = dto.description;
    if (dto.price !== undefined) listing.price = dto.price;

    await listingRepository.save(listing);
    return toListingResponse(await loadOrFail(id));
  },

  async updateStatus(
    id: number,
    status: ListingStatus,
  ): Promise<ListingResponse> {
    const listing = await loadOrFail(id);

    listing.status = status;
    if (status === "published" && listing.publishedAt === null) {
      listing.publishedAt = new Date();
    }

    await listingRepository.save(listing);
    return toListingResponse(await loadOrFail(id));
  },

  async remove(id: number): Promise<void> {
    await loadOrFail(id); // 404 if missing
    await listingImageService.purgeForListing(id); // delete image files first
    const result = await listingRepository.delete({ id });
    if (!result.affected) {
      throw ApiError.notFound(`Listing ${id} not found`);
    }
  },
};
