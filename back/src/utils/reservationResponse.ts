import type {
  Reservation,
  ReservationStatus,
  ReservationType,
} from "../entities/Reservation";
import type { ListingStatus } from "../entities/Listing";
import { toListingResponse } from "./listingResponse";

/** A reservation as returned by the API (never the confirmation token). */
export interface ReservationResponse {
  id: number;
  type: ReservationType;
  status: ReservationStatus;
  listing: {
    id: number;
    title: string;
    brand: string | null;
    model: string | null;
    price: number;
    status: ListingStatus;
    thumbnailUrl: string | null;
  };
  customer: { firstName: string; lastName: string; email: string; phone: string };
  /** The request is tied to a customer account. */
  hasAccount: boolean;
  message: string | null;
  locale: string;
  visitAt: string | null;
  holdUntil: string | null;
  adminNote: string | null;
  decidedAt: string | null;
  createdAt: string;
}

const iso = (date: Date | null) => (date ? date.toISOString() : null);

/** Expects the listing relation loaded (with model, brand and images). */
export function toReservationResponse(reservation: Reservation): ReservationResponse {
  const listing = toListingResponse(reservation.listing);
  return {
    id: reservation.id,
    type: reservation.type,
    status: reservation.status,
    listing: {
      id: listing.id,
      title: listing.title,
      brand: listing.model?.brand?.name ?? null,
      model: listing.model?.name ?? null,
      price: listing.price,
      status: listing.status,
      thumbnailUrl: listing.images[0]?.thumbnailUrl ?? null,
    },
    customer: {
      firstName: reservation.firstName,
      lastName: reservation.lastName,
      email: reservation.email,
      phone: reservation.phone,
    },
    hasAccount: reservation.userId !== null,
    message: reservation.message,
    locale: reservation.locale,
    visitAt: iso(reservation.visitAt),
    holdUntil: iso(reservation.holdUntil),
    adminNote: reservation.adminNote,
    decidedAt: iso(reservation.decidedAt),
    createdAt: reservation.createdAt.toISOString(),
  };
}
