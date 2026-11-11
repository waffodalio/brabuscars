import type { ExitReason, StockStatus } from "../entities/stockTypes";

const DAY_MS = 86_400_000;

/** Euros → integer cents (sums without floating-point drift). */
const cents = (amount: number) => Math.round(amount * 100);

/** Garage reference of a stock vehicle: `STK-0007` (internal, not a legal number). */
export function stockReference(id: number): string {
  return `STK-${String(id).padStart(4, "0")}`;
}

/**
 * Cost price = purchase price + what was spent on the car; the potential
 * margin compares it with the target selling price (null when unknown).
 */
export function stockTotals(
  purchasePrice: number | null,
  costs: readonly { amount: number }[],
  targetPrice: number | null,
): { costs: number; costPrice: number | null; potentialMargin: number | null } {
  const costCents = costs.reduce((sum, cost) => sum + cents(cost.amount), 0);
  const costPrice = purchasePrice === null ? null : (cents(purchasePrice) + costCents) / 100;
  return {
    costs: costCents / 100,
    costPrice,
    potentialMargin:
      costPrice === null || targetPrice === null ? null : (cents(targetPrice) - cents(costPrice)) / 100,
  };
}

/** Whole days between entry and exit (or `today` while still at the garage). */
export function daysInStock(entryDate: string, exitDate: string | null, today: string): number {
  const end = Date.parse(`${exitDate ?? today}T00:00:00Z`);
  const start = Date.parse(`${entryDate}T00:00:00Z`);
  return Math.max(0, Math.round((end - start) / DAY_MS));
}

/** Status after leaving the garage: sold, or exited for any other reason. */
export function exitStatus(reason: ExitReason): StockStatus {
  return reason === "sale" ? "sold" : "exited";
}

/** Today's date (`YYYY-MM-DD`) in the dealership's time zone. */
export function todayInBrussels(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(now);
}
