import { INTL_LOCALES } from "@/i18n/locales";

/** Shared number formatting for the statistics page (French back-office). */
export const formatNumber = (value: number) => value.toLocaleString(INTL_LOCALES.fr);

export const formatPercent = (ratio: number) =>
  ratio.toLocaleString(INTL_LOCALES.fr, { style: "percent", maximumFractionDigits: 0 });

/** One decimal at most, e.g. `3,4`. */
export const formatDecimal = (value: number) =>
  value.toLocaleString(INTL_LOCALES.fr, { maximumFractionDigits: 1 });

/** Whole euros, e.g. `41 250 €`; `990 k€` / `1,2 M€` from 100 000 with `compact`. */
export function formatEuros(value: number, compact = false): string {
  if (compact && value >= 1_000_000) return `${formatDecimal(value / 1_000_000)} M€`;
  if (compact && value >= 100_000) return `${formatNumber(Math.round(value / 1000))} k€`;
  return value.toLocaleString(INTL_LOCALES.fr, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

/** `45 s`, `2 min 05 s`, `1 h 12 min`. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ${String(seconds % 60).padStart(2, "0")} s`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min`;
}

/** Relative change, or `null` when there is nothing to compare with. */
export function relativeChange(current: number, previous: number): number | null {
  return previous === 0 ? null : (current - previous) / previous;
}

export const ratio = (part: number, whole: number) => (whole > 0 ? part / whole : 0);
