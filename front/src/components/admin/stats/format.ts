import { INTL_LOCALES } from "@/i18n/locales";

/** Shared number formatting for the statistics page (French back-office). */
export const formatNumber = (value: number) => value.toLocaleString(INTL_LOCALES.fr);

export const formatPercent = (ratio: number) =>
  ratio.toLocaleString(INTL_LOCALES.fr, { style: "percent", maximumFractionDigits: 0 });

/** Relative change, or `null` when there is nothing to compare with. */
export function relativeChange(current: number, previous: number): number | null {
  return previous === 0 ? null : (current - previous) / previous;
}
