import type { SaleDocumentKind, SaleStatus, VatRegime } from "../entities/Sale";
import { slugify } from "./slugify";

/** Belgian standard VAT rate. */
export const STANDARD_VAT_RATE = 0.21;

/** Euros (as stored, 2 decimals) → integer cents: all arithmetic is done in cents. */
export const toCents = (euros: number): number => Math.round(euros * 100);
export const fromCents = (cents: number): number => cents / 100;

/** Total of the lines, in cents (prices are VAT included). */
export function totalCents(lines: { quantity: number; unitPrice: number }[]): number {
  return lines.reduce((sum, line) => sum + line.quantity * toCents(line.unitPrice), 0);
}

export interface VatBreakdown {
  /** Amount without VAT (= total under the margin scheme, VAT not shown). */
  netCents: number;
  vatCents: number;
  totalCents: number;
}

/**
 * Splits a VAT-inclusive total. Under the margin scheme (second-hand goods)
 * the VAT is not shown on the documents, so nothing is split.
 */
export function vatBreakdown(total: number, regime: VatRegime): VatBreakdown {
  if (regime === "margin") return { netCents: total, vatCents: 0, totalCents: total };
  const net = Math.round(total / (1 + STANDARD_VAT_RATE));
  return { netCents: net, vatCents: total - net, totalCents: total };
}

const PREFIX: Record<SaleDocumentKind, string> = { order: "BC", invoice: "F" };

/** `BC-2026-0001` / `F-2026-0001`. */
export function documentNumber(kind: SaleDocumentKind, year: number, seq: number): string {
  return `${PREFIX[kind]}-${year}-${String(seq).padStart(4, "0")}`;
}

/** `slugify` cut to `max` characters, never ending on a dash. */
const shortSlug = (text: string, max: number) => slugify(text).slice(0, max).replace(/-+$/g, "");

/**
 * Download name of a document, to recognise it among others:
 * `F-2026-0001_audi-a4-avant_alice-martin.pdf` (number, vehicle, buyer).
 * The vehicle is the first line, without the details after " — ".
 */
export function documentFilename(number: string, vehicleLine: string | undefined, buyerName: string): string {
  const vehicle = shortSlug((vehicleLine ?? "").split(" — ")[0], 40);
  const buyer = shortSlug(buyerName, 30);
  return [number, vehicle, buyer].filter(Boolean).join("_") + ".pdf";
}

/**
 * What a new payment does to the sale: an advance on a draft issues the
 * purchase order; reaching the total issues the final invoice (directly,
 * without purchase order, when everything is paid at once).
 */
export function afterPayment(
  status: SaleStatus,
  total: number,
  paid: number,
): { status: SaleStatus; issue: SaleDocumentKind | null } {
  if (paid >= total) return { status: "paid", issue: "invoice" };
  if (status === "draft") return { status: "ordered", issue: "order" };
  return { status, issue: null };
}

/** Why a payment of `amount` cents can't be recorded, or `null`. */
export function paymentProblem(status: SaleStatus, total: number, paid: number, amount: number): string | null {
  if (status === "paid") return "This sale is already fully paid";
  if (total <= 0) return "Add at least one priced line before recording a payment";
  if (amount <= 0) return "The amount must be positive";
  if (paid + amount > total) return "The payment exceeds the amount still due";
  return null;
}

/**
 * A payment can be removed (entry mistake) only while it is not frozen by a
 * document: neither the one that triggered the purchase order nor any once
 * the invoice is issued.
 */
export function canDeletePayment(status: SaleStatus, documentId: number | null): boolean {
  return status !== "paid" && documentId === null;
}

/** Buyer, lines, VAT regime and vehicle can only change before any document. */
export const isEditable = (status: SaleStatus): boolean => status === "draft";
