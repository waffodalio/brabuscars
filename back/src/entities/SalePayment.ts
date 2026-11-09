import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { decimalTransformer } from "../utils/decimalTransformer";
import { Sale } from "./Sale";
import { PAYMENT_METHODS, type PaymentMethod } from "./saleTypes";

/** A payment recorded by the admin on a sale. */
@Entity("sale_payment")
@Index("idx_sale_payment_sale", ["saleId", "paidOn"])
export class SalePayment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Sale, (sale) => sale.payments, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "sale_id" })
  sale!: Sale;

  @Column({ name: "sale_id", type: "int" })
  saleId!: number;

  @Column({ type: "decimal", precision: 12, scale: 2, transformer: decimalTransformer })
  amount!: number;

  /** `YYYY-MM-DD`. */
  @Column({ name: "paid_on", type: "date" })
  paidOn!: string;

  @Column({ type: "enum", enum: [...PAYMENT_METHODS] })
  method!: PaymentMethod;

  @Column({ type: "varchar", length: 100, nullable: true })
  reference!: string | null;

  /** Document issued following this payment — it then freezes the payment. */
  @Column({ name: "document_id", type: "int", nullable: true })
  documentId!: number | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
