import type { Listing, ListingStatus } from "../entities/Listing";
import type {
  CreateListingDto,
  ListListingQuery,
  UpdateListingDto,
} from "../dto/listing.dto";
import { listingRepository } from "../repositories/listing.repository";
import { carModelRepository } from "../repositories/carModel.repository";
import { categoryRepository } from "../repositories/category.repository";
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
  async list(query: ListListingQuery): Promise<ListingResponse[]> {
    const rows = await listingRepository.findAllFiltered(query);
    return rows.map(toListingResponse);
  },

  async getById(id: number): Promise<ListingResponse> {
    return toListingResponse(await loadOrFail(id));
  },

  async create(actor: Actor, dto: CreateListingDto): Promise<ListingResponse> {
    await assertModelExists(dto.modelId);
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
        status: "draft",
      }),
    );
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
