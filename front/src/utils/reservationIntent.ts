import type { ReservationType } from "@/types/reservation";

/**
 * The reservation form a visitor asked for before being sent to log in, so
 * the listing page can open it once they are back (whether they come back
 * through the history or through `?reserver=`). Per tab (`sessionStorage`).
 */
const KEY = "chcars_reserve_intent";

export function setReservationIntent(listingId: number, type: ReservationType): void {
  try {
    sessionStorage.setItem(KEY, `${listingId}:${type}`);
  } catch {
    // Storage unavailable: the form simply won't reopen by itself.
  }
}

/** The form asked for on this listing, if any — without consuming it. */
export function peekReservationIntent(listingId: number): ReservationType | null {
  try {
    const [id, type] = (sessionStorage.getItem(KEY) ?? "").split(":");
    return Number(id) === listingId && (type === "hold" || type === "visit") ? type : null;
  } catch {
    return null;
  }
}

export function clearReservationIntent(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
