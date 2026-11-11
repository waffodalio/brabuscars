import { Not } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { StockVehicleImage } from "../entities/StockVehicleImage";

/** Photos of a garage-register car; item lookups check both ids. */
export const stockVehicleImageRepository = AppDataSource.getRepository(StockVehicleImage).extend({
  findByVehicle(vehicleId: number): Promise<StockVehicleImage[]> {
    return this.find({ where: { vehicleId }, order: { position: "ASC", id: "ASC" } });
  },

  findInVehicle(vehicleId: number, imageId: number): Promise<StockVehicleImage | null> {
    return this.findOneBy({ id: imageId, vehicleId });
  },

  countForVehicle(vehicleId: number): Promise<number> {
    return this.countBy({ vehicleId });
  },

  clearCover(vehicleId: number, exceptId?: number): Promise<unknown> {
    return this.update(exceptId ? { vehicleId, id: Not(exceptId) } : { vehicleId }, { isCover: false });
  },
});
