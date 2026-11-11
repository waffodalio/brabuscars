/** Value sets of the garage register (migration 009), shared by entities and DTOs. */

/** incoming (on its way) → in_stock → preparation → sold | exited (left without a sale). */
export const STOCK_STATUSES = ["incoming", "in_stock", "preparation", "sold", "exited"] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

/** Statuses of a vehicle still at (or coming to) the garage. */
export const IN_GARAGE_STATUSES: StockStatus[] = ["incoming", "in_stock", "preparation"];

/** How the car came in: bought, taken in part-exchange, on consignment… */
export const ENTRY_SOURCES = ["purchase", "trade_in", "consignment", "other"] as const;
export type EntrySource = (typeof ENTRY_SOURCES)[number];

/** Why it left: sold, returned to its owner (consignment), scrapped, moved… */
export const EXIT_REASONS = ["sale", "return", "scrap", "transfer", "other"] as const;
export type ExitReason = (typeof EXIT_REASONS)[number];
