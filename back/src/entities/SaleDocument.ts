import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { decimalTransformer } from "../utils/decimalTransformer";
import { Sale } from "./Sale";
import { SALE_DOCUMENT_KINDS, type SaleDocumentKind } from "./saleTypes";

/**
 * A purchase order or invoice issued for a sale. Frozen once issued: number,
 * amounts at that time and the PDF file (private storage, `DOCUMENTS_DIR`).
 */
@Entity("sale_document")
export class SaleDocument {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Sale, (sale) => sale.documents, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "sale_id" })
  sale!: Sale;

  @Column({ name: "sale_id", type: "int" })
  saleId!: number;

  @Column({ type: "enum", enum: [...SALE_DOCUMENT_KINDS] })
  kind!: SaleDocumentKind;

  @Column({ type: "smallint", unsigned: true })
  year!: number;

  @Column({ type: "int", unsigned: true })
  seq!: number;

  @Column({ type: "varchar", length: 20, unique: true })
  number!: string;

  /** Sale total when issued. */
  @Column({ type: "decimal", precision: 12, scale: 2, transformer: decimalTransformer })
  total!: number;

  /** Already paid when issued. */
  @Column({ type: "decimal", precision: 12, scale: 2, transformer: decimalTransformer })
  paid!: number;

  @Column({ name: "storage_key", type: "varchar", length: 255, select: false })
  storageKey!: string;

  @Column({ name: "issued_at", type: "datetime" })
  issuedAt!: Date;
}
