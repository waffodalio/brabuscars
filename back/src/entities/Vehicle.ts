import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CarModel } from "./CarModel";
import { Category } from "./Category";
import { Listing } from "./Listing";

export const FUEL_TYPES = [
  "petrol",
  "diesel",
  "hybrid",
  "electric",
  "lpg",
] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const TRANSMISSIONS = ["manual", "automatic"] as const;
export type Transmission = (typeof TRANSMISSIONS)[number];

/**
 * The physical car being sold and its factual characteristics. Kept separate
 * from `Listing` (the advert) so a vehicle's data can be reused or re-listed.
 */
@Entity("vehicle")
export class Vehicle {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => CarModel, (model) => model.vehicles, { nullable: false })
  @JoinColumn({ name: "model_id" })
  model!: CarModel;

  @Column({ name: "model_id", type: "int" })
  modelId!: number;

  @ManyToOne(() => Category, (category) => category.vehicles, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "category_id" })
  category!: Category | null;

  @Column({ name: "category_id", type: "int", nullable: true })
  categoryId!: number | null;

  @Column({ type: "smallint", unsigned: true })
  year!: number;

  /** Odometer reading, in kilometres. */
  @Column({ type: "int", unsigned: true })
  mileage!: number;

  @Column({ name: "fuel_type", type: "enum", enum: [...FUEL_TYPES] })
  fuelType!: FuelType;

  @Column({ type: "enum", enum: [...TRANSMISSIONS] })
  transmission!: Transmission;

  /** Engine power in metric horsepower (ch). */
  @Column({ type: "smallint", unsigned: true, nullable: true })
  power!: number | null;

  @Column({ type: "tinyint", unsigned: true, nullable: true })
  doors!: number | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  color!: string | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;

  @OneToOne(() => Listing, (listing) => listing.vehicle)
  listing!: Listing | null;
}
