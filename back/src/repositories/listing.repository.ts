import {
  Between,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  type FindOptionsWhere,
} from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Listing } from "../entities/Listing";
import { Vehicle } from "../entities/Vehicle";
import type { ListListingQuery } from "../dto/listing.dto";
import { escapeLike } from "../utils/escapeLike";

const LIST_RELATIONS = {
  seller: true,
  vehicle: { model: { brand: true }, category: true },
  images: true,
} as const;

function buildWhere(query: ListListingQuery): FindOptionsWhere<Listing> {
  const where: FindOptionsWhere<Listing> = {};

  if (query.status) where.status = query.status;
  if (query.sellerId) where.sellerId = query.sellerId;
  if (query.search) where.title = Like(`%${escapeLike(query.search)}%`);

  if (query.minPrice !== undefined && query.maxPrice !== undefined) {
    where.price = Between(query.minPrice, query.maxPrice);
  } else if (query.minPrice !== undefined) {
    where.price = MoreThanOrEqual(query.minPrice);
  } else if (query.maxPrice !== undefined) {
    where.price = LessThanOrEqual(query.maxPrice);
  }

  const vehicleWhere: FindOptionsWhere<Vehicle> = {};
  if (query.fuelType) vehicleWhere.fuelType = query.fuelType;
  if (query.transmission) vehicleWhere.transmission = query.transmission;
  if (query.brandId) vehicleWhere.model = { brandId: query.brandId };
  if (Object.keys(vehicleWhere).length > 0) where.vehicle = vehicleWhere;

  return where;
}

/**
 * Data-access layer for {@link Listing}. Queries load the seller, the vehicle
 * (with model, brand, category) and the image gallery.
 */
export const listingRepository = AppDataSource.getRepository(Listing).extend({
  findAllFiltered(query: ListListingQuery): Promise<Listing[]> {
    return this.find({
      where: buildWhere(query),
      relations: LIST_RELATIONS,
      order: { createdAt: "DESC" },
    });
  },

  findById(id: number): Promise<Listing | null> {
    return this.findOne({
      where: { id },
      relations: {
        seller: true,
        vehicle: { model: { brand: true }, category: true },
        images: true,
      },
    });
  },

  existsByVehicleId(vehicleId: number): Promise<boolean> {
    return this.existsBy({ vehicleId });
  },
});
