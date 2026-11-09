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
  paid: "success",
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
