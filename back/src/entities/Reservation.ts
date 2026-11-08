import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Listing } from "./Listing";
import { User } from "./User";

export const RESERVATION_TYPES = ["hold", "visit"] as const;
export type ReservationType = (typeof RESERVATION_TYPES)[number];

export const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "declined",
  "cancelled",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/**
 * A signed-in customer's request on a published listing: put the car aside
 * (`hold`) or come and see / test-drive it (`visit`). The contact details are
 * copied from the account (plus a phone number), so the request keeps them if
 * the account is deleted later (`userId` then becomes `null`).
 */
@Entity("reservation")
@Index("idx_reservation_listing", ["listingId", "type", "status"])
@Index("idx_reservation_status", ["status", "createdAt"])
export class Reservation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Listing, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "listing_id" })
  listing!: Listing;

  @Column({ name: "listing_id", type: "int" })
  listingId!: number;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user!: User | null;

  @Index("idx_reservation_user")
  @Column({ name: "user_id", type: "int", nullable: true })
  userId!: number | null;

  @Column({ type: "enum", enum: [...RESERVATION_TYPES] })
  type!: ReservationType;

  @Column({ type: "enum", enum: [...RESERVATION_STATUSES] })
  status!: ReservationStatus;

  @Column({ name: "first_name", type: "varchar", length: 100 })
  firstName!: string;

  @Column({ name: "last_name", type: "varchar", length: 100 })
  lastName!: string;

  @Index("idx_reservation_email")
  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 30 })
  phone!: string;

  @Column({ type: "text", nullable: true })
  message!: string | null;

  /** Language of the e-mails sent to the customer. */
  @Column({ type: "varchar", length: 5, default: "fr" })
  locale!: string;

  /** Requested slot of a `visit`. */
  @Column({ name: "visit_at", type: "datetime", nullable: true })
  visitAt!: Date | null;

  /** End of a confirmed `hold`. */
  @Column({ name: "hold_until", type: "datetime", nullable: true })
  holdUntil!: Date | null;

  @Column({ name: "admin_note", type: "varchar", length: 500, nullable: true })
  adminNote!: string | null;

  @Column({ name: "decided_at", type: "datetime", nullable: true })
  decidedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}
