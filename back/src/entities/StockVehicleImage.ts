import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { StockVehicle } from "./StockVehicle";

/**
 * One photo of a garage-register car (same storage as listing photos: WebP
 * + `_thumb` on disk, key and metadata here). The car's listing shows them.
 */
@Entity("stock_vehicle_image")
@Index("idx_stock_vehicle_image_vehicle", ["vehicleId"])
export class StockVehicleImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => StockVehicle, (vehicle) => vehicle.images, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle!: StockVehicle;

  @Column({ name: "vehicle_id", type: "int" })
  vehicleId!: number;

  @Column({ name: "storage_key", type: "varchar", length: 255 })
  storageKey!: string;

  @Column({ name: "mime_type", type: "varchar", length: 50 })
  mimeType!: string;

  @Column({ name: "size_bytes", type: "int", unsigned: true })
  sizeBytes!: number;

  @Column({ type: "smallint", unsigned: true, nullable: true })
  width!: number | null;

  @Column({ type: "smallint", unsigned: true, nullable: true })
  height!: number | null;

  @Column({ type: "int", unsigned: true, default: 0 })
  position!: number;

  @Column({ name: "is_cover", type: "boolean", default: false })
  isCover!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
