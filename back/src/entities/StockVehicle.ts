import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CarModel } from "./CarModel";
import { Listing } from "./Listing";
import { StockVehicleImage } from "./StockVehicleImage";
import { FUEL_TYPES, TRANSMISSIONS, type FuelType, type Transmission } from "./vehicleTypes";
import { StockVehicleCost } from "./StockVehicleCost";
import {
  ENTRY_SOURCES,
  EXIT_REASONS,
  STOCK_STATUSES,
  type EntrySource,
  type ExitReason,
  type StockStatus,
} from "./stockTypes";
import { EURO_NORMS, type Equipment, type EuroNorm } from "./listingDetails";
import { decimalTransformer } from "../utils/decimalTransformer";

/**
 * A car physically managed by the dealership (the garage register), whether
 * or not it is advertised: technical and paper data, how and when it came in
 * (purchase price, supplier), where it is, what was spent on it, and when /
 * why it left. Optionally linked to its listing (one listing ↔ one car).
 */
@Entity("stock_vehicle")
export class StockVehicle {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => CarModel, { nullable: false })
  @JoinColumn({ name: "model_id" })
  model!: CarModel;

  @Column({ name: "model_id", type: "int" })
  modelId!: number;

  @OneToOne(() => Listing, (listing) => listing.stockVehicle, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "listing_id" })
  listing!: Listing | null;

  @Column({ name: "listing_id", type: "int", nullable: true })
  listingId!: number | null;

  @Column({ type: "enum", enum: [...STOCK_STATUSES], default: "in_stock" })
  status!: StockStatus;

  /** Trim / engine, e.g. « 2.0 TDI S line ». */
  @Column({ type: "varchar", length: 150, nullable: true })
  version!: string | null;

  @Column({ type: "varchar", length: 17, nullable: true })
  vin!: string | null;

  @Column({ type: "smallint", unsigned: true })
  year!: number;

  /** `YYYY-MM-DD`. */
  @Column({ name: "first_registration", type: "date", nullable: true })
  firstRegistration!: string | null;

  /** Odometer at entry (km). */
  @Column({ type: "int", unsigned: true })
  mileage!: number;

  @Column({ name: "fuel_type", type: "enum", enum: [...FUEL_TYPES] })
  fuelType!: FuelType;

  @Column({ type: "enum", enum: [...TRANSMISSIONS] })
  transmission!: Transmission;

  @Column({ type: "smallint", unsigned: true, nullable: true })
  power!: number | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  color!: string | null;

  @Column({ type: "tinyint", unsigned: true, nullable: true })
  doors!: number | null;

  /** Equipment keys (JSON array) — the car's options, copied to its listing. */
  @Column({ type: "simple-json", nullable: true })
  equipment!: Equipment[] | null;

  @Column({ name: "euro_norm", type: "enum", enum: [...EURO_NORMS], nullable: true })
  euroNorm!: EuroNorm | null;

  /** CO₂ emissions, g/km. */
  @Column({ type: "smallint", unsigned: true, nullable: true })
  co2!: number | null;

  @Column({ name: "has_car_pass", type: "boolean", default: false })
  hasCarPass!: boolean;

  @Column({ name: "entry_date", type: "date" })
  entryDate!: string;

  @Column({ name: "entry_source", type: "enum", enum: [...ENTRY_SOURCES], default: "purchase" })
  entrySource!: EntrySource;

  /** Who it was bought from / whose car it is (consignment). */
  @Column({ type: "varchar", length: 150, nullable: true })
  supplier!: string | null;

  @Column({ name: "purchase_price", type: "decimal", precision: 10, scale: 2, nullable: true, transformer: decimalTransformer })
  purchasePrice!: number | null;

  /** Price the dealership aims to sell at. */
  @Column({ name: "target_price", type: "decimal", precision: 10, scale: 2, nullable: true, transformer: decimalTransformer })
  targetPrice!: number | null;

  /** Where it is parked: « Parc A », « Atelier »… */
  @Column({ type: "varchar", length: 100, nullable: true })
  location!: string | null;

  @Column({ name: "exit_date", type: "date", nullable: true })
  exitDate!: string | null;

  @Column({ name: "exit_reason", type: "enum", enum: [...EXIT_REASONS], nullable: true })
  exitReason!: ExitReason | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @OneToMany(() => StockVehicleCost, (cost) => cost.vehicle)
  costs!: StockVehicleCost[];

  /** Photos of the car — shown on its listing (migration 013). */
  @OneToMany(() => StockVehicleImage, (image) => image.vehicle)
  images!: StockVehicleImage[];

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}
