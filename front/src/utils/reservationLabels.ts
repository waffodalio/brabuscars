import { INTL_LOCALES, type Locale } from "@/i18n/locales";
import type { ReservationStatus } from "@/types/reservation";

/** The dealership's time zone: visit slots are shown in it. */
const DEALERSHIP_TIME_ZONE = "Europe/Paris";

/** Bootstrap badge colour per status. */
export const RESERVATION_STATUS_VARIANTS: Record<ReservationStatus, string> = {
  pending: "warning",
  confirmed: "success",
  declined: "danger",
  cancelled: "secondary",
};

/** "jeudi 13 novembre 2026 à 15:00" (dealership time). */
export function formatSlot(iso: string, locale: Locale = "fr"): string {
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: DEALERSHIP_TIME_ZONE,
  }).format(new Date(iso));
}

/** "13 novembre 2026" (dealership time). */
export function formatReservationDay(iso: string, locale: Locale = "fr"): string {
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    dateStyle: "long",
    timeZone: DEALERSHIP_TIME_ZONE,
  }).format(new Date(iso));
}
