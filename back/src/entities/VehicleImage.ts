import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Vehicle } from "./Vehicle";

/**
 * One picture of a vehicle. Images form an ordered gallery (`position`); one
 * image per vehicle is flagged as the cover. Deleting the vehicle removes its
 * images.
 */
@Entity("vehicle_image")
@Index("idx_vehicle_image_vehicle", ["vehicleId"])
export class VehicleImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.images, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "vehicle_id" })
  vehicle!: Vehicle;

  @Column({ name: "vehicle_id", type: "int" })
  vehicleId!: number;

  @Column({ type: "varchar", length: 500 })
  url!: string;

  /** Display order within the gallery, ascending. */
  @Column({ type: "int", unsigned: true, default: 0 })
  position!: number;

  @Column({ name: "is_cover", type: "boolean", default: false })
  isCover!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
