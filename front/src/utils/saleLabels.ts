import { INTL_LOCALES } from "@/i18n/locales";
import type { PaymentMethod, SaleDocumentKind, SaleStatus, VatRegime } from "@/types/sale";

/** Back-office labels (French-only, like the rest of the admin). */
export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  draft: "Brouillon",
  ordered: "Bon de commande émis",
  paid: "Payé",
};

export const SALE_STATUS_VARIANTS: Record<SaleStatus, string> = {
  draft: "secondary",
  ordered: "warning",
  paid: "primary",
};

export const VAT_REGIME_LABELS: Record<VatRegime, string> = {
  margin: "Régime de la marge (occasion)",
  standard: "TVA 21 %",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  transfer: "Virement",
  cash: "Espèces",
  card: "Carte",
  cheque: "Chèque",
  other: "Autre",
};

export const DOCUMENT_KIND_LABELS: Record<SaleDocumentKind, string> = {
  order: "Bon de commande",
  invoice: "Facture",
};

const euroFormat = new Intl.NumberFormat(INTL_LOCALES.fr, { style: "currency", currency: "EUR" });

/** `55 640,00 €` — cents shown, unlike listing prices. */
export const formatEuros = (amount: number): string => euroFormat.format(amount);

/** `02/11/2026` from `YYYY-MM-DD`. */
export function formatDay(day: string): string {
  const [y, m, d] = day.split("-");
  return `${d}/${m}/${y}`;
}

/** Today as `YYYY-MM-DD` (local date). */
export function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * What identifies a sale file to people: its invoice number, else its
 * purchase-order number, null while it is a draft. (The database id stays in
 * the address only: it means nothing to the dealership and skips values
 * when drafts are deleted.)
 */
export function saleReference(sale: { documents: { kind: SaleDocumentKind; number: string }[] }): string | null {
  const invoice = sale.documents.find((document) => document.kind === "invoice");
  const order = sale.documents.find((document) => document.kind === "order");
  return (invoice ?? order)?.number ?? null;
}

/** Sale files per listing id (a car can be on several: a cancelled draft, then the real sale). */
export function salesByListing<T extends { listing: { id: number } | null }>(sales: T[]): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const sale of sales) {
    if (!sale.listing) continue;
    map.set(sale.listing.id, [...(map.get(sale.listing.id) ?? []), sale]);
  }
  return map;
}

/** Lowercase, without accents: « Élodie » matches « elodie ». */
const fold = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * Does the sale match a free-text search? Looks at the document numbers,
 * the buyer (name, company, e-mail, phone, VAT), the lines (vehicle), the
 * linked listing's title and the VIN; every word must be found.
 */
export function saleMatches(
  sale: {
    documents: { number: string }[];
    buyer: { name: string; company: string | null; email: string | null; phone: string | null; vatNumber: string | null };
    lines: { description: string }[];
    listing: { title: string } | null;
    vehicleVin: string | null;
  },
  query: string,
): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const text = fold(
    [
      ...sale.documents.map((document) => document.number),
      sale.buyer.name,
      sale.buyer.company,
      sale.buyer.email,
      sale.buyer.phone,
      sale.buyer.vatNumber,
      ...sale.lines.map((line) => line.description),
      sale.listing?.title,
      sale.vehicleVin,
    ]
      .filter(Boolean)
      .join(" "),
  );
  return words.every((word) => text.includes(word));
}
