import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";
import { USER_ROLES, type UserRole } from "./User";

/**
 * Audit trail of role changes made by a super admin through the API.
 *
 * Emails are copied at change time so the history stays readable even if an
 * account is later removed (the user ids are then set to NULL by the DB).
 */
@Entity("role_change_log")
@Index("idx_role_change_log_target", ["targetUserId", "createdAt"])
@Index("idx_role_change_log_created", ["createdAt"])
export class RoleChangeLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "target_user_id", type: "int", nullable: true })
  targetUserId!: number | null;

  @Column({ name: "target_email", type: "varchar", length: 255 })
  targetEmail!: string;

  @Column({ name: "actor_user_id", type: "int", nullable: true })
  actorUserId!: number | null;

  @Column({ name: "actor_email", type: "varchar", length: 255 })
  actorEmail!: string;

  @Column({ name: "old_role", type: "enum", enum: USER_ROLES })
  oldRole!: UserRole;

  @Column({ name: "new_role", type: "enum", enum: USER_ROLES })
  newRole!: UserRole;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
