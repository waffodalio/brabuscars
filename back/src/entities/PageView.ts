import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Listing } from "./Listing";

/**
 * One public page displayed to a visitor who accepted the audience-measurement
 * cookie. `visitorId` is that cookie's random UUID — never linked to an
 * account; no IP, user agent or query string is kept.
 */
@Entity("page_view")
export class PageView {
  /** BIGINT: returned as a string by the driver. */
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "visitor_id", type: "char", length: 36 })
  visitorId!: string;

  /** Path without its locale prefix, e.g. `/annonces/12`. */
  @Column({ type: "varchar", length: 255 })
  path!: string;

  @Column({ type: "varchar", length: 5, nullable: true })
  locale!: string | null;

  @ManyToOne(() => Listing, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "listing_id" })
  listing!: Listing | null;

  @Column({ name: "listing_id", type: "int", nullable: true })
  listingId!: number | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
