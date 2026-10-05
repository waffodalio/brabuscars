import {
  Between,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  type FindOperator,
  type FindOptionsOrder,
  type FindOptionsWhere,
} from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Listing } from "../entities/Listing";
import type { ListingSort, ListListingQuery } from "../dto/listing.dto";
import { escapeLike } from "../utils/escapeLike";

const RELATIONS = {
  seller: true,
  model: { brand: true },
  category: true,
  images: true,
} as const;

const ORDER_BY: Record<ListingSort, FindOptionsOrder<Listing>> = {
  recent: { createdAt: "DESC" },
  price_asc: { price: "ASC" },
  price_desc: { price: "DESC" },
  year_desc: { year: "DESC" },
  mileage_asc: { mileage: "ASC" },
};

function rangeOf(
  min: number | undefined,
  max: number | undefined,
): FindOperator<number> | undefined {
  if (min !== undefined && max !== undefined) return Between(min, max);
  if (min !== undefined) return MoreThanOrEqual(min);
  if (max !== undefined) return LessThanOrEqual(max);
  return undefined;
}

function buildWhere(query: ListListingQuery): FindOptionsWhere<Listing> {
  const where: FindOptionsWhere<Listing> = {};

  if (query.status) where.status = query.status;
  if (query.sellerId) where.sellerId = query.sellerId;
  if (query.modelId) where.modelId = query.modelId;
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.fuelType) where.fuelType = query.fuelType;
  if (query.transmission) where.transmission = query.transmission;
  if (query.search) where.title = Like(`%${escapeLike(query.search)}%`);
  if (query.brandId) where.model = { brandId: query.brandId };

  const price = rangeOf(query.minPrice, query.maxPrice);
  if (price !== undefined) where.price = price;

  const year = rangeOf(query.minYear, query.maxYear);
  if (year !== undefined) where.year = year;

  if (query.maxMileage !== undefined) {
    where.mileage = LessThanOrEqual(query.maxMileage);
  }

  return where;
}

/**
 * Data-access layer for {@link Listing}. Queries load the seller, the model
 * (with its brand), the category and the image gallery.
 */
export const listingRepository = AppDataSource.getRepository(Listing).extend({
  findAllFiltered(query: ListListingQuery): Promise<Listing[]> {
    return this.find({
      where: buildWhere(query),
      relations: RELATIONS,
      order: ORDER_BY[query.sort] ?? ORDER_BY.recent,
    });
  },

  findById(id: number): Promise<Listing | null> {
    return this.findOne({ where: { id }, relations: RELATIONS });
  },
});
