import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { CarModel } from "./CarModel";

/**
 * A vehicle manufacturer (Peugeot, BMW, …). Reference data shared by many
 * models. `slug` is a URL-friendly identifier used by the frontend.
 */
@Entity("brand")
export class Brand {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100, unique: true })
  name!: string;

  @Column({ type: "varchar", length: 120, unique: true })
  slug!: string;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @OneToMany(() => CarModel, (model) => model.brand)
  models!: CarModel[];
}
