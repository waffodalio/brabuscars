import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Vehicle } from "./Vehicle";

/**
 * Body type / market segment of a vehicle (SUV, berline, citadine, break, …).
 * Reference data. A vehicle may belong to at most one category, or none.
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

  @OneToMany(() => Vehicle, (vehicle) => vehicle.category)
  vehicles!: Vehicle[];
}
