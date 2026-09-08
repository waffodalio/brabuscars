import { Like } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { CarModel } from "../entities/CarModel";

interface CarModelFilters {
  search?: string;
  brandId?: number;
}

/**
 * Data-access layer for {@link CarModel}. Queries load the parent `brand`
 * relation so callers get the brand name without a second round-trip.
 */
export const carModelRepository = AppDataSource.getRepository(CarModel).extend({
  findAllOrdered(filters: CarModelFilters = {}): Promise<CarModel[]> {
    return this.find({
      where: {
        ...(filters.brandId ? { brandId: filters.brandId } : {}),
        ...(filters.search ? { name: Like(`%${filters.search}%`) } : {}),
      },
      relations: { brand: true },
      order: { brandId: "ASC", name: "ASC" },
    });
  },

  findById(id: number): Promise<CarModel | null> {
    return this.findOne({ where: { id }, relations: { brand: true } });
  },

  /** Existing model with the same (brand, name) pair, or null. */
  findByBrandAndName(brandId: number, name: string): Promise<CarModel | null> {
    return this.findOneBy({ brandId, name });
  },
});
