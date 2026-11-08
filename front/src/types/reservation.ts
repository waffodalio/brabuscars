import type { Locale } from "@/i18n/locales";
import type { ListingStatus } from "./listing";

export const RESERVATION_TYPES = ["hold", "visit"] as const;
/** `hold`: put the car aside · `visit`: come and see / test-drive it. */
export type ReservationType = (typeof RESERVATION_TYPES)[number];

export const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "declined",
  "cancelled",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export interface Reservation {
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
  /** Tied to a customer account. */
  hasAccount: boolean;
  message: string | null;
  locale: string;
  /** ISO date-time of a visit. */
  visitAt: string | null;
  /** ISO end of a confirmed hold. */
  holdUntil: string | null;
  adminNote: string | null;
  decidedAt: string | null;
  createdAt: string;
}

/** `POST /reservations` — signed-in customer; name and e-mail come from the account. */
export interface ReservationInput {
  listingId: number;
  type: ReservationType;
  phone: string;
  /** ISO 8601 with offset; required for a visit. */
  visitAt?: string;
  message?: string;
  locale: Locale;
}

export type ReservationDecision = "confirmed" | "declined" | "cancelled";
