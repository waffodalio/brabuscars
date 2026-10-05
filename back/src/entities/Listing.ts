import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CarModel } from "./CarModel";
import { Category } from "./Category";
import { Favorite } from "./Favorite";
import { ListingImage } from "./ListingImage";
import { User } from "./User";
import { decimalTransformer } from "../utils/decimalTransformer";

export const LISTING_STATUSES = [
  "draft",
  "published",
  "sold",
  "archived",
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

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
}
