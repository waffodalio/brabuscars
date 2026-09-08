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
import { Favorite } from "./Favorite";
import { ListingImage } from "./ListingImage";
import { User } from "./User";
import { Vehicle } from "./Vehicle";
import { decimalTransformer } from "../utils/decimalTransformer";

export const LISTING_STATUSES = [
  "draft",
  "published",
  "sold",
  "archived",
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

/**
 * A sale advert: one vehicle offered by one seller. Carries the commercial
 * information (title, description, price, location, lifecycle status) while
 * the technical data lives on the linked `Vehicle`.
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

  @OneToOne(() => Vehicle, (vehicle) => vehicle.listing, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "vehicle_id" })
  vehicle!: Vehicle;

  @Column({ name: "vehicle_id", type: "int", unique: true })
  vehicleId!: number;

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

  @Column({ type: "varchar", length: 120 })
  city!: string;

  @Column({ name: "postal_code", type: "varchar", length: 10, nullable: true })
  postalCode!: string | null;

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
