import { Not } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { VehicleImage } from "../entities/VehicleImage";

/**
 * Data-access layer for {@link VehicleImage}. Images are always scoped to a
 * vehicle; item lookups check both ids so one vehicle's image cannot be
 * reached through another vehicle's URL.
 */
export const vehicleImageRepository = AppDataSource.getRepository(
  VehicleImage,
).extend({
  findByVehicle(vehicleId: number): Promise<VehicleImage[]> {
    return this.find({
      where: { vehicleId },
      order: { position: "ASC", id: "ASC" },
    });
  },

  findInVehicle(
    vehicleId: number,
    imageId: number,
  ): Promise<VehicleImage | null> {
    return this.findOneBy({ id: imageId, vehicleId });
  },

  /** Clears the cover flag on a vehicle's images (optionally except one). */
  clearCover(vehicleId: number, exceptId?: number): Promise<unknown> {
    return this.update(
      exceptId ? { vehicleId, id: Not(exceptId) } : { vehicleId },
      { isCover: false },
    );
  },
});
