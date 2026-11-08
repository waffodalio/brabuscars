import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

/**
 * "Forgot password" link sent by e-mail. Only the SHA-256 hash of the token
 * is stored (the plain token only exists in the e-mail); single use
 * (`usedAt`), short-lived (`expiresAt`).
 */
@Entity("password_reset_token")
@Index("idx_password_reset_token_user", ["userId", "createdAt"])
export class PasswordResetToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "user_id", type: "int" })
  userId!: number;

  @Column({ name: "token_hash", type: "char", length: 64, unique: true })
  tokenHash!: string;

  @Column({ name: "expires_at", type: "datetime" })
  expiresAt!: Date;

  @Column({ name: "used_at", type: "datetime", nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
