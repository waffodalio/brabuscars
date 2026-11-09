import type { ListingStatus } from "@/types/listing";
import type { Reservation } from "@/types/reservation";

/**
 * A request still in progress: pending, or confirmed and not over yet (hold
 * still running, visit still to come). Same rule as the API.
 */
export function isOpenReservation(reservation: Reservation, now = Date.now()): boolean {
  if (reservation.status === "pending") return true;
  if (reservation.status !== "confirmed") return false;
  const end = reservation.type === "hold" ? reservation.holdUntil : reservation.visitAt;
  return end !== null && new Date(end).getTime() > now;
}

/** Open requests per listing id. */
export function openReservationsByListing(reservations: Reservation[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const reservation of reservations) {
    if (isOpenReservation(reservation)) {
      counts.set(reservation.listing.id, (counts.get(reservation.listing.id) ?? 0) + 1);
    }
  }
  return counts;
}

/** Why the car can no longer be reserved (back-office wording), or `null` while it is for sale. */
export const UNAVAILABLE_LABELS: Record<Exclude<ListingStatus, "published">, string> = {
  sold: "Véhicule vendu",
  archived: "Annonce archivée",
  draft: "Annonce hors ligne",
};

export function unavailableLabel(status: ListingStatus): string | null {
  return status === "published" ? null : UNAVAILABLE_LABELS[status];
}
