import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

/**
 * TOTP two-factor state of an account (one row per enrolled / enrolling
 * user). Kept out of `user` so the feature only adds tables.
 *
 * - `secretEncrypted` — AES-256-GCM encrypted base32 secret (`secretBox`).
 * - `enabledAt`       — NULL while enrollment is pending (secret generated,
 *                       first code not yet confirmed).
 * - `lastUsedStep`    — last accepted 30 s time step, refuses code replay.
 * - `failedAttempts` / `lockedUntil` — per-account brute-force lockout.
 */
@Entity("user_mfa")
export class UserMfa {
  @PrimaryColumn({ name: "user_id", type: "int" })
  userId!: number;

  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "secret_encrypted", type: "varchar", length: 255 })
  secretEncrypted!: string;

  @Column({ name: "enabled_at", type: "datetime", nullable: true })
  enabledAt!: Date | null;

  @Column({
    name: "last_used_step",
    type: "int",
    unsigned: true,
    nullable: true,
  })
  lastUsedStep!: number | null;

  @Column({
    name: "failed_attempts",
    type: "smallint",
    unsigned: true,
    default: 0,
  })
  failedAttempts!: number;

  @Column({ name: "locked_until", type: "datetime", nullable: true })
  lockedUntil!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}
