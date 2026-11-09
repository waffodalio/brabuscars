import type { PaymentMethod, Sale, SaleDocumentKind, SaleStatus, VatRegime } from "../entities/Sale";
import type { ListingStatus } from "../entities/Listing";
import {
  canDeletePayment,
  documentFilename,
  fromCents,
  isEditable,
  toCents,
  totalCents,
  vatBreakdown,
} from "./saleRules";

export interface SaleResponse {
  id: number;
  status: SaleStatus;
  vatRegime: VatRegime;
  listing: { id: number; title: string; status: ListingStatus } | null;
  buyer: {
    name: string;
    company: string | null;
    vatNumber: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
    email: string | null;
    phone: string | null;
  };
  vehicleVin: string | null;
  notes: string | null;
  lines: { id: number; description: string; quantity: number; unitPrice: number; total: number }[];
  /** Euros. `net` / `vat` are only split under the standard regime. */
  totals: { net: number; vat: number; total: number; paid: number; due: number };
  payments: {
    id: number;
    amount: number;
    paidOn: string;
    method: PaymentMethod;
    reference: string | null;
    /** Can still be removed (entry mistake). */
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

/** Expects lines, payments and documents loaded (listing optional). */
export function toSaleResponse(sale: Sale): SaleResponse {
  const lines = [...(sale.lines ?? [])].sort((a, b) => a.position - b.position);
  const total = totalCents(lines);
  const paid = (sale.payments ?? []).reduce((sum, payment) => sum + toCents(payment.amount), 0);
  const split = vatBreakdown(total, sale.vatRegime);
  return {
    id: sale.id,
    status: sale.status,
    vatRegime: sale.vatRegime,
    listing: sale.listing ? { id: sale.listing.id, title: sale.listing.title, status: sale.listing.status } : null,
    buyer: {
      name: sale.buyerName,
      company: sale.buyerCompany,
      vatNumber: sale.buyerVatNumber,
      address: sale.buyerAddress,
      postalCode: sale.buyerPostalCode,
      city: sale.buyerCity,
      country: sale.buyerCountry,
      email: sale.buyerEmail,
      phone: sale.buyerPhone,
    },
    vehicleVin: sale.vehicleVin,
    notes: sale.notes,
    lines: lines.map((line) => ({
      id: line.id,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: fromCents(line.quantity * toCents(line.unitPrice)),
    })),
    totals: {
      net: fromCents(split.netCents),
      vat: fromCents(split.vatCents),
      total: fromCents(total),
      paid: fromCents(paid),
      due: fromCents(Math.max(total - paid, 0)),
    },
    payments: [...(sale.payments ?? [])]
      .sort((a, b) => a.paidOn.localeCompare(b.paidOn) || a.id - b.id)
      .map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        paidOn: payment.paidOn,
        method: payment.method,
        reference: payment.reference,
        deletable: canDeletePayment(sale.status, payment.documentId),
      })),
    documents: [...(sale.documents ?? [])]
      .sort((a, b) => a.issuedAt.getTime() - b.issuedAt.getTime())
      .map((document) => ({
        id: document.id,
        kind: document.kind,
        number: document.number,
        filename: documentFilename(document.number, lines[0]?.description, sale.buyerName),
        issuedAt: document.issuedAt.toISOString(),
        total: document.total,
        paid: document.paid,
      })),
    editable: isEditable(sale.status),
    createdAt: sale.createdAt.toISOString(),
    updatedAt: sale.updatedAt.toISOString(),
  };
}
