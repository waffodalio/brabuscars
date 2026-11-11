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
import { Category } from "./Category";
import { Favorite } from "./Favorite";
import { ListingImage } from "./ListingImage";
import { StockVehicle } from "./StockVehicle";
import { User } from "./User";
import { decimalTransformer } from "../utils/decimalTransformer";
import {
  EURO_NORMS,
  WARRANTY_KINDS,
  type Equipment,
  type EuroNorm,
  type WarrantyCoverage,
  type WarrantyKind,
} from "./listingDetails";

export const LISTING_STATUSES = [
  "draft",
  "published",
  "sold",
  "archived",
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

// Kept in their own module: `StockVehicle` needs them while it is being
// defined, and it is linked back from `Listing` (import cycle otherwise).
export { FUEL_TYPES, TRANSMISSIONS, type FuelType, type Transmission } from "./vehicleTypes";
import { FUEL_TYPES, TRANSMISSIONS, type FuelType, type Transmission } from "./vehicleTypes";

/**
 * A vehicle for sale. CHCars is a single dealership selling its own stock, so
 * the advert and the vehicle it describes are one and the same record: the
 * commercial fields (title, price, status) sit next to the technical ones
 * (model, year, mileage, …). `brand` is reached through `model`.
 */
@Entity("listing")
export class Listing {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.listings, { nullable: false })
  @JoinColumn({ name: "seller_id" })
  seller!: User;

  @Column({ name: "seller_id", type: "int" })
  sellerId!: number;

  @ManyToOne(() => CarModel, { nullable: false })
  @JoinColumn({ name: "model_id" })
  model!: CarModel;

  @Column({ name: "model_id", type: "int" })
  modelId!: number;

  @ManyToOne(() => Category, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "category_id" })
  category!: Category | null;

  @Column({ name: "category_id", type: "int", nullable: true })
  categoryId!: number | null;

  @Column({ type: "varchar", length: 150 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  price!: number;

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

  /** Equipment keys (JSON array). Null on listings created before migration 008. */
  @Column({ type: "simple-json", nullable: true })
  equipment!: Equipment[] | null;

  @Column({ name: "euro_norm", type: "enum", enum: [...EURO_NORMS], nullable: true })
  euroNorm!: EuroNorm | null;

  /** CO₂ emissions, g/km. */
  @Column({ type: "smallint", unsigned: true, nullable: true })
  co2!: number | null;

  @Column({ name: "has_car_pass", type: "boolean", default: false })
  hasCarPass!: boolean;

  /** Warranty length in months; null means no warranty (then the other warranty fields are null). */
  @Column({ name: "warranty_months", type: "tinyint", unsigned: true, nullable: true })
  warrantyMonths!: number | null;

  @Column({ name: "warranty_kind", type: "enum", enum: [...WARRANTY_KINDS], nullable: true })
  warrantyKind!: WarrantyKind | null;

  /** Parts covered (JSON array). */
  @Column({ name: "warranty_coverage", type: "simple-json", nullable: true })
  warrantyCoverage!: WarrantyCoverage[] | null;

  /** Covered parts typed by the admin, beyond the fixed list (JSON array of labels). */
  @Column({ name: "warranty_custom", type: "simple-json", nullable: true })
  warrantyCustom!: string[] | null;

  /** Conditions in free text (mileage cap, exclusions…). */
  @Column({ name: "warranty_notes", type: "varchar", length: 500, nullable: true })
  warrantyNotes!: string | null;

  @Column({ type: "enum", enum: [...LISTING_STATUSES], default: "draft" })
  status!: ListingStatus;

  @Column({ name: "published_at", type: "datetime", nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;

  @OneToMany(() => Favorite, (favorite) => favorite.listing)
  favorites!: Favorite[];

  @OneToMany(() => ListingImage, (image) => image.listing)
  images!: ListingImage[];

  /** Garage-register car of this listing (inverse side): its photos are the listing's. */
  @OneToOne(() => StockVehicle, (vehicle) => vehicle.listing)
  stockVehicle?: StockVehicle | null;
}
