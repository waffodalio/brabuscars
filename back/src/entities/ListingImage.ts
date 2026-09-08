import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Listing } from "./Listing";

/**
 * One picture of a listing. Only the storage key and a few metadata live in
 * the database — the WebP file (and its `_thumb` variant) sit on disk. Images
 * form an ordered gallery with one cover; deleting the listing removes them.
 */
@Entity("listing_image")
@Index("idx_listing_image_listing", ["listingId"])
export class ListingImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Listing, (listing) => listing.images, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "listing_id" })
  listing!: Listing;

  @Column({ name: "listing_id", type: "int" })
  listingId!: number;

  /** Path of the full-size WebP relative to the upload directory. */
  @Column({ name: "storage_key", type: "varchar", length: 255 })
  storageKey!: string;

  @Column({ name: "mime_type", type: "varchar", length: 50 })
  mimeType!: string;

  @Column({ name: "size_bytes", type: "int", unsigned: true })
  sizeBytes!: number;

  @Column({ type: "smallint", unsigned: true, nullable: true })
  width!: number | null;

  @Column({ type: "smallint", unsigned: true, nullable: true })
  height!: number | null;

  /** Display order within the gallery, ascending. */
  @Column({ type: "int", unsigned: true, default: 0 })
  position!: number;

  @Column({ name: "is_cover", type: "boolean", default: false })
  isCover!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
