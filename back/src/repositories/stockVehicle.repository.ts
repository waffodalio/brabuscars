import { In, type EntityManager } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { IN_GARAGE_STATUSES } from "../entities/stockTypes";
import { StockVehicle } from "../entities/StockVehicle";
import { StockVehicleCost } from "../entities/StockVehicleCost";

const RELATIONS = { model: { brand: true }, listing: true, costs: true, images: true } as const;

/** Data access for the garage register. */
export const stockVehicleRepository = AppDataSource.getRepository(StockVehicle).extend({
  findDetail(id: number): Promise<StockVehicle | null> {
    return this.findOne({ where: { id }, relations: RELATIONS });
  },

  /** Every car, the latest entries first. */
  findAllForList(): Promise<StockVehicle[]> {
    return this.find({ relations: RELATIONS, order: { entryDate: "DESC", id: "DESC" } });
  },
});

/**
 * The car of `listingId` (if any, and still at the garage) leaves the stock as
 * sold on `day`. Pass the transaction's manager to do it inside it.
 */
export async function markListingVehicleSold(listingId: number, day: string, manager?: EntityManager): Promise<void> {
  const repo = manager ? manager.getRepository(StockVehicle) : stockVehicleRepository;
  await repo.update(
    { listingId, status: In(IN_GARAGE_STATUSES) },
    { status: "sold", exitDate: day, exitReason: "sale" },
  );
}

export const stockVehicleCostRepository = AppDataSource.getRepository(StockVehicleCost);
