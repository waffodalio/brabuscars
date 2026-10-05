import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Brand } from "./Brand";

/**
 * A model belonging to a brand (Peugeot 308, BMW Série 3, …). A model name is
 * unique within its brand. Reference data used by listings.
 */
@Entity("car_model")
@Unique("uq_car_model_brand_name", ["brandId", "name"])
export class CarModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @ManyToOne(() => Brand, (brand) => brand.models, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "brand_id" })
  brand!: Brand;

  @Column({ name: "brand_id", type: "int" })
  brandId!: number;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
