import {
  CreateDateColumn,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { User } from "./User";
import { Listing } from "./Listing";

/**
 * A listing bookmarked by a user. Association table between `User` and
 * `Listing`; a user cannot favourite the same listing twice. Removing either
 * side removes the favourite.
 */
@Entity("favorite")
@Unique("uq_favorite_user_listing", ["userId", "listingId"])
export class Favorite {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.favorites, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "user_id", type: "int" })
  userId!: number;

  @ManyToOne(() => Listing, (listing) => listing.favorites, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "listing_id" })
  listing!: Listing;

  @Column({ name: "listing_id", type: "int" })
  listingId!: number;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
