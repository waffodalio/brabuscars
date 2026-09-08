import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

/**
 * A message sent from the public contact form. The sender may not have an
 * account, so name and email are stored inline. `handled` lets an admin tick
 * off processed messages.
 */
@Entity("contact_message")
@Index("idx_contact_message_handled", ["handled", "createdAt"])
export class ContactMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "boolean", default: false })
  handled!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
