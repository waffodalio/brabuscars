import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { decimalTransformer } from "../utils/decimalTransformer";
import { Sale } from "./Sale";

/** One line of a sale (the vehicle, registration fees, warranty…), VAT included. */
@Entity("sale_line")
@Index("idx_sale_line_sale", ["saleId", "position"])
export class SaleLine {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Sale, (sale) => sale.lines, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "sale_id" })
  sale!: Sale;

  @Column({ name: "sale_id", type: "int" })
  saleId!: number;

  @Column({ type: "smallint", unsigned: true, default: 0 })
  position!: number;

  @Column({ type: "varchar", length: 255 })
  description!: string;

  @Column({ type: "smallint", unsigned: true, default: 1 })
  quantity!: number;

  @Column({ name: "unit_price", type: "decimal", precision: 12, scale: 2, transformer: decimalTransformer })
  unitPrice!: number;
}
