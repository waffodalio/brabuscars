/** Shared number formatting for the statistics page (French back-office). */
export const formatNumber = (value: number) => value.toLocaleString("fr-FR");

export const formatPercent = (ratio: number) =>
  ratio.toLocaleString("fr-FR", { style: "percent", maximumFractionDigits: 0 });

/** Relative change, or `null` when there is nothing to compare with. */
export function relativeChange(current: number, previous: number): number | null {
  return previous === 0 ? null : (current - previous) / previous;
}
