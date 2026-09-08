import type { FindOptionsWhere } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Vehicle } from "../entities/Vehicle";
import type { ListVehicleQuery } from "../dto/vehicle.dto";

/**
 * Data-access layer for {@link Vehicle}. List/detail queries load the parent
 * `model` (with its `brand`) and `category` relations; detail also loads the
 * image gallery.
 */
export const vehicleRepository = AppDataSource.getRepository(Vehicle).extend({
  findAllFiltered(query: ListVehicleQuery): Promise<Vehicle[]> {
    const where: FindOptionsWhere<Vehicle> = {};
    if (query.modelId) where.modelId = query.modelId;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.fuelType) where.fuelType = query.fuelType;
    if (query.transmission) where.transmission = query.transmission;
    if (query.brandId) where.model = { brandId: query.brandId };

    return this.find({
      where,
      relations: { model: { brand: true }, category: true },
      order: { createdAt: "DESC" },
    });
  },

  findById(id: number): Promise<Vehicle | null> {
    return this.findOne({
      where: { id },
      relations: { model: { brand: true }, category: true, images: true },
    });
  },
});
