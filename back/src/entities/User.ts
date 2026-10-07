import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Favorite } from "./Favorite";
import { Listing } from "./Listing";

export const USER_ROLES = ["user", "admin", "super_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** `admin` or `super_admin` — the roles that must sign in with 2FA. */
export const isAdminRole = (role: UserRole): boolean =>
  role === "admin" || role === "super_admin";

/** Roles a super admin may assign through the API (never `super_admin`). */
export const ASSIGNABLE_ROLES = ["user", "admin"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

/**
 * A registered account.
 *
 * Roles form a hierarchy: `user` < `admin` < `super_admin`.
 *  - `user`        — browse the catalogue, manage favourites
 *  - `admin`       — manage the catalogue and the listings
 *  - `super_admin` — everything, plus manage other users' roles
 *
 * Passwords are only ever stored hashed. An account created through "Sign in
 * with Google" has no password (`passwordHash` null) and is identified by its
 * Google `sub` claim.
 */
@Entity("user")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ name: "password_hash", type: "varchar", length: 255, nullable: true })
  passwordHash!: string | null;

  /** Stable Google account id (OpenID `sub`), set once linked to Google. */
  @Column({ name: "google_sub", type: "varchar", length: 255, nullable: true, unique: true })
  googleSub!: string | null;

  @Column({ name: "first_name", type: "varchar", length: 100 })
  firstName!: string;

  @Column({ name: "last_name", type: "varchar", length: 100 })
  lastName!: string;

  @Column({ type: "enum", enum: [...USER_ROLES], default: "user" })
  role!: UserRole;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;

  @OneToMany(() => Listing, (listing) => listing.seller)
  listings!: Listing[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites!: Favorite[];
}
