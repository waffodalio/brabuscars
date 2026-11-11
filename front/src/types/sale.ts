import type { StockStatus } from "./stock";
import type { ListingStatus } from "./listing";

export const SALE_STATUSES = ["draft", "ordered", "paid"] as const;
/** `draft` → `ordered` (purchase order issued on an advance) → `paid` (invoice issued). */
export type SaleStatus = (typeof SALE_STATUSES)[number];

/** `margin`: second-hand margin scheme (VAT not shown) · `standard`: 21 % shown. */
export type VatRegime = "margin" | "standard";

export const PAYMENT_METHODS = ["transfer", "cash", "card", "cheque", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type SaleDocumentKind = "order" | "invoice";

export interface SaleBuyer {
  name: string;
  company: string | null;
  vatNumber: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
}

export interface Sale {
  id: number;
  status: SaleStatus;
  vatRegime: VatRegime;
  listing: { id: number; title: string; status: ListingStatus } | null;
  /** Garage-register car sold here, if any. */
  stockVehicle: { id: number; reference: string; label: string; status: StockStatus } | null;
  buyer: SaleBuyer;
  vehicleVin: string | null;
  notes: string | null;
  lines: { id: number; description: string; quantity: number; unitPrice: number; total: number }[];
  /** Euros; `net` / `vat` only split under the standard regime. */
  totals: { net: number; vat: number; total: number; paid: number; due: number };
  payments: {
    id: number;
    amount: number;
    paidOn: string;
    method: PaymentMethod;
    reference: string | null;
    /** Document this payment triggered (purchase order or invoice), if any. */
    documentId: number | null;
    /** Not frozen by a document: can still be removed. */
    deletable: boolean;
  }[];
  documents: {
    id: number;
    kind: SaleDocumentKind;
    number: string;
    /** Download name, e.g. `F-2026-0001_audi-a4-avant_alice-martin.pdf`. */
    filename: string;
    issuedAt: string;
    total: number;
    paid: number;
  }[];
  /** Buyer, lines and regime can still change (no document issued yet). */
  editable: boolean;
  createdAt: string;
  updatedAt: string;
}

/** `POST /sales` and `PUT /sales/:id` — prices VAT included. */
export interface SaleInput {
  vatRegime: VatRegime;
  listingId: number | null;
  stockVehicleId: number | null;
  buyer: SaleBuyer;
  vehicleVin: string | null;
  notes: string | null;
  lines: { description: string; quantity: number; unitPrice: number }[];
}

export interface SalePaymentInput {
  amount: number;
  /** `YYYY-MM-DD`. */
  paidOn: string;
  method: PaymentMethod;
  reference: string | null;
}
