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
 * Single-use 2FA recovery code. Only a SHA-256 hash is stored; the plain
 * codes are shown once, when 2FA is activated.
 */
@Entity("user_recovery_code")
@Index("idx_user_recovery_code_user", ["userId"])
export class UserRecoveryCode {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "user_id", type: "int" })
  userId!: number;

  @Column({ name: "code_hash", type: "char", length: 64 })
  codeHash!: string;

  @Column({ name: "used_at", type: "datetime", nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
