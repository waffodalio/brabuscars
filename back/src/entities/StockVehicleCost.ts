import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { StockVehicle } from "./StockVehicle";
import { decimalTransformer } from "../utils/decimalTransformer";

/** Money spent on a stock vehicle (repairs, inspection, bodywork…). */
@Entity("stock_vehicle_cost")
export class StockVehicleCost {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => StockVehicle, (vehicle) => vehicle.costs, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle!: StockVehicle;

  @Column({ name: "vehicle_id", type: "int" })
  vehicleId!: number;

  @Column({ type: "varchar", length: 150 })
  label!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, transformer: decimalTransformer })
  amount!: number;

  /** `YYYY-MM-DD`. */
  @Column({ name: "spent_on", type: "date" })
  spentOn!: string;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
