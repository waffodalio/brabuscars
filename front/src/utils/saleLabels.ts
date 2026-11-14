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

/** One issued document in a register (« Factures » / « Bons de commande »), with its sale file. */
export interface RegisterEntry<S> {
  sale: S;
  document: { id: number; kind: SaleDocumentKind; number: string; filename: string; issuedAt: string; total: number; paid: number };
  /** Purchase orders: the invoice that followed, if the balance was paid. */
  invoiceNumber: string | null;
  /** Invoices: the purchase order they settle (none for a sale paid in full at once). */
  orderNumber: string | null;
}

/**
 * Every document of one kind across the sale files, most recent number
 * first (numbers are continuous per kind and year: `F-2026-0007` sorts
 * after `F-2026-0006` and after `F-2025-0120`).
 */
export function documentRegister<
  S extends { documents: RegisterEntry<unknown>["document"][] },
>(sales: S[], kind: SaleDocumentKind): RegisterEntry<S>[] {
  return sales
    .flatMap((sale) =>
      sale.documents
        .filter((document) => document.kind === kind)
        .map((document) => ({
          sale,
          document,
          invoiceNumber: sale.documents.find((other) => other.kind === "invoice")?.number ?? null,
          orderNumber: sale.documents.find((other) => other.kind === "order")?.number ?? null,
        })),
    )
    .sort((a, b) => b.document.number.localeCompare(a.document.number));
}

/** Calendar year of an issued document (`issuedAt` is an ISO timestamp), in Brussels time. */
export function documentYear(issuedAt: string): number {
  return Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Europe/Brussels" }).format(new Date(issuedAt)));
}

/** `YYYY-MM` of an issued document, in Brussels time. */
export function documentMonth(issuedAt: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: "Europe/Brussels" })
    .formatToParts(new Date(issuedAt));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}`;
}

/** « novembre 2026 » from `2026-11`. */
export function monthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-BE", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, m - 1, 15)),
  );
}
