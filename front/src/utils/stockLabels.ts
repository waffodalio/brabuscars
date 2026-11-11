import type { EntrySource, ExitReason, StockStatus, StockVehicle } from "@/types/stock";

/** Back-office labels (French). */
export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  incoming: "En arrivage",
  in_stock: "En stock",
  preparation: "En préparation",
  sold: "Vendu",
  exited: "Sorti",
};

/** Bootstrap colour of each status badge. */
export const STOCK_STATUS_VARIANTS: Record<StockStatus, string> = {
  incoming: "info",
  in_stock: "primary",
  preparation: "warning",
  sold: "dark",
  exited: "secondary",
};

export const ENTRY_SOURCE_LABELS: Record<EntrySource, string> = {
  purchase: "Achat",
  trade_in: "Reprise",
  consignment: "Dépôt-vente",
  other: "Autre",
};

export const EXIT_REASON_LABELS: Record<ExitReason, string> = {
  sale: "Vente",
  return: "Rendu au propriétaire",
  scrap: "Épave / démolition",
  transfer: "Transfert",
  other: "Autre",
};

/** Still at (or coming to) the garage. */
export const isInGarage = (status: StockStatus): boolean =>
  status === "incoming" || status === "in_stock" || status === "preparation";

const fold = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
/** References and VINs compared without spaces / dashes: « STK 0007 » = « stk-0007 ». */
const compact = (text: string) => fold(text).replace(/[\s.-]/g, "");

/**
 * Free-text search over a stock vehicle: reference, brand / model / version,
 * VIN, year, supplier, location, linked listing — every word must match.
 */
export function stockMatches(
  vehicle: Pick<StockVehicle, "reference" | "label" | "vin" | "year" | "supplier" | "location" | "listing" | "color">,
  query: string,
): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const text = fold(
    [vehicle.reference, vehicle.label, vehicle.vin, vehicle.year, vehicle.supplier, vehicle.location, vehicle.color, vehicle.listing?.title]
      .filter((value) => value !== null && value !== undefined)
      .join(" "),
  );
  const packed = compact(text);
  return words.every((word) => text.includes(word) || packed.includes(compact(word)));
}

/**
 * Why a listing can't take `next` given its stock car (null = allowed) —
 * the API's own rule (`back/src/utils/stockListingRules.ts`), so the buttons
 * are disabled up front instead of failing.
 */
export function listingStatusBlock(params: {
  current: "draft" | "published" | "sold" | "archived";
  next: "draft" | "published" | "sold" | "archived";
  vehicleStatus: StockStatus | null;
  invoiced: boolean;
}): string | null {
  const { current, next, vehicleStatus, invoiced } = params;
  if (current === "sold" && (next === "published" || next === "draft") && invoiced) {
    return "Véhicule facturé : il ne peut pas être remis en vente.";
  }
  if (next === "published" && vehicleStatus !== null && !isInGarage(vehicleStatus)) {
    const reopensSale = current === "sold" && vehicleStatus === "sold" && !invoiced;
    if (!reopensSale) return "Véhicule sorti du stock : remettez-le d'abord en stock.";
  }
  return null;
}
