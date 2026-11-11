import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Listing } from "./Listing";
import { SaleDocument } from "./SaleDocument";
import { SaleLine } from "./SaleLine";
import { SalePayment } from "./SalePayment";
import { StockVehicle } from "./StockVehicle";
import { SALE_STATUSES, VAT_REGIMES, type SaleStatus, type VatRegime } from "./saleTypes";

export {
  PAYMENT_METHODS,
  SALE_DOCUMENT_KINDS,
  SALE_STATUSES,
  VAT_REGIMES,
  type PaymentMethod,
  type SaleDocumentKind,
  type SaleStatus,
  type VatRegime,
} from "./saleTypes";

/**
 * A sale file of the back-office billing: buyer typed in by the admin (not
 * tied to customer accounts), what is sold, payments, and the purchase order
 * / invoice issued from them. Optionally linked to the listing sold.
 */
@Entity("sale")
@Index("idx_sale_status", ["status", "createdAt"])
export class Sale {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "enum", enum: [...SALE_STATUSES], default: "draft" })
  status!: SaleStatus;

  @Column({ name: "vat_regime", type: "enum", enum: [...VAT_REGIMES], default: "margin" })
  vatRegime!: VatRegime;

  @ManyToOne(() => Listing, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "listing_id" })
  listing!: Listing | null;

  @Index("idx_sale_listing")
  @Column({ name: "listing_id", type: "int", nullable: true })
  listingId!: number | null;

  /** Garage-register car sold here (migration 009); the final invoice marks it sold. */
  @ManyToOne(() => StockVehicle, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "stock_vehicle_id" })
  stockVehicle!: StockVehicle | null;

  @Index("idx_sale_stock_vehicle")
  @Column({ name: "stock_vehicle_id", type: "int", nullable: true })
  stockVehicleId!: number | null;

  @Column({ name: "buyer_name", type: "varchar", length: 150 })
  buyerName!: string;

  @Column({ name: "buyer_company", type: "varchar", length: 150, nullable: true })
  buyerCompany!: string | null;

  @Column({ name: "buyer_vat_number", type: "varchar", length: 30, nullable: true })
  buyerVatNumber!: string | null;

  @Column({ name: "buyer_address", type: "varchar", length: 255, nullable: true })
  buyerAddress!: string | null;

  @Column({ name: "buyer_postal_code", type: "varchar", length: 20, nullable: true })
  buyerPostalCode!: string | null;

  @Column({ name: "buyer_city", type: "varchar", length: 100, nullable: true })
  buyerCity!: string | null;

  @Column({ name: "buyer_country", type: "varchar", length: 100, nullable: true })
  buyerCountry!: string | null;

  @Column({ name: "buyer_email", type: "varchar", length: 255, nullable: true })
  buyerEmail!: string | null;

  @Column({ name: "buyer_phone", type: "varchar", length: 30, nullable: true })
  buyerPhone!: string | null;

  @Column({ name: "vehicle_vin", type: "varchar", length: 17, nullable: true })
  vehicleVin!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy!: number | null;

  @OneToMany(() => SaleLine, (line) => line.sale, { cascade: true })
  lines!: SaleLine[];

  @OneToMany(() => SalePayment, (payment) => payment.sale)
  payments!: SalePayment[];

  @OneToMany(() => SaleDocument, (document) => document.sale)
  documents!: SaleDocument[];

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}
