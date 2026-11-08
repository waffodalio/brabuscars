import type { ReservationStatus } from "../entities/Reservation";

/** The dealership's time zone: visit slots are read in it. */
export const DEALERSHIP_TIME_ZONE = "Europe/Paris";

/** Default and bounds of a hold's duration, in days. */
export const DEFAULT_HOLD_DAYS = 7;

/** A visit must be booked at least this long in advance… */
export const VISIT_MIN_NOTICE_MS = 60 * 60 * 1000;
/** …and at most this far ahead. */
export const VISIT_MAX_AHEAD_DAYS = 90;
/** Visits take place between these hours (dealership time), end excluded. */
export const VISIT_OPENING_HOUR = 8;
export const VISIT_CLOSING_HOUR = 20;

const hourFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: DEALERSHIP_TIME_ZONE,
  hour: "2-digit",
  hourCycle: "h23",
});

/**
 * Why a requested visit slot is not acceptable, or `null` when it is:
 * in the future (with some notice), not too far ahead, during the day.
 */
export function visitSlotProblem(visitAt: Date, now = new Date()): string | null {
  if (Number.isNaN(visitAt.getTime())) return "Invalid visit date";
  if (visitAt.getTime() < now.getTime() + VISIT_MIN_NOTICE_MS) {
    return "The visit must be booked at least one hour in advance";
  }
  if (visitAt.getTime() > now.getTime() + VISIT_MAX_AHEAD_DAYS * 86_400_000) {
    return `The visit cannot be more than ${VISIT_MAX_AHEAD_DAYS} days ahead`;
  }
  const hour = Number(hourFormat.format(visitAt));
  if (hour < VISIT_OPENING_HOUR || hour >= VISIT_CLOSING_HOUR) {
    return `Visits take place between ${VISIT_OPENING_HOUR}:00 and ${VISIT_CLOSING_HOUR}:00`;
  }
  return null;
}

/** End of a hold confirmed `now` for `days` days. */
export function holdEnd(days: number, now = new Date()): Date {
  return new Date(now.getTime() + days * 86_400_000);
}

/** Decisions the back-office may take from each status. */
const TRANSITIONS: Partial<Record<ReservationStatus, ReservationStatus[]>> = {
  pending: ["confirmed", "declined", "cancelled"],
  confirmed: ["cancelled"],
};

export function canMoveTo(from: ReservationStatus, to: ReservationStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** A customer may withdraw a request until it is settled. */
export function customerCanCancel(status: ReservationStatus): boolean {
  return status === "pending" || status === "confirmed";
}
