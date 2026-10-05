import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

/**
 * Body type / market segment (SUV, berline, citadine, break, …). Reference
 * data. A listing may belong to at most one category, or none.
 */
@Entity("category")
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 80, unique: true })
  name!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  slug!: string;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
