import type { ListingStatus } from "../entities/Listing";
import { IN_GARAGE_STATUSES, type ExitReason, type StockStatus } from "../entities/stockTypes";

/**
 * How a listing and its garage-register car follow each other. The car is
 * the reference: what happens to it decides what the listing can show.
 */

/** Still at (or coming to) the garage. */
export const isInGarage = (status: StockStatus): boolean => IN_GARAGE_STATUSES.includes(status);

/** The car left: its listing is sold (a sale) or taken offline (any other reason). */
export function listingStatusAfterExit(reason: ExitReason): ListingStatus {
  return reason === "sale" ? "sold" : "archived";
}

/**
 * The car is back in stock: its listing (if it was closed by the exit) goes
 * back online when it had been published before, else back to draft.
 */
export function listingStatusAfterReopen(current: ListingStatus, everPublished: boolean): ListingStatus | null {
  if (current !== "sold" && current !== "archived") return null; // untouched
  return everPublished ? "published" : "draft";
}

/**
 * Why a listing can't take `next` given its car, or null when it can.
 * - publishing needs the car at the garage;
 * - un-selling (sold → published / draft) is refused once an invoice exists.
 */
export function listingStatusProblem(params: {
  current: ListingStatus;
  next: ListingStatus;
  vehicleStatus: StockStatus | null;
  invoiced: boolean;
}): string | null {
  const { current, next, vehicleStatus, invoiced } = params;
  if (current === "sold" && (next === "published" || next === "draft") && invoiced) {
    return "This car has been invoiced: it can't be put back on sale";
  }
  if (next === "published" && vehicleStatus !== null && !isInGarage(vehicleStatus)) {
    // Un-selling a car sold by hand reopens it (see below) — allowed.
    const reopensSale = current === "sold" && vehicleStatus === "sold" && !invoiced;
    if (!reopensSale) return "Its stock vehicle has left the garage: put it back in stock first";
  }
  return null;
}

/** Un-selling a listing sold by hand (no invoice) puts its car back in stock. */
export function reopensVehicle(params: {
  current: ListingStatus;
  next: ListingStatus;
  vehicleStatus: StockStatus | null;
  invoiced: boolean;
}): boolean {
  return (
    params.current === "sold" &&
    (params.next === "published" || params.next === "draft") &&
    params.vehicleStatus === "sold" &&
    !params.invoiced
  );
}
