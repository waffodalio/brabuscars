import { INTL_LOCALES, type Locale } from "@/i18n/locales";
import type { ListingStatus } from "@/types/listing";

/** French labels for the listing lifecycle status. */
export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  draft: "Brouillon",
  published: "Publiée",
  sold: "Vendue",
  archived: "Archivée",
};

/** Bootstrap badge variant per status. */
export const LISTING_STATUS_VARIANTS: Record<ListingStatus, string> = {
  draft: "secondary",
  published: "success",
  sold: "dark",
  archived: "warning",
};

const priceFormatters = new Map<Locale, Intl.NumberFormat>();

/** Whole-euro price in the site language's conventions (`12 999 €`, `€12,999`, `€ 12.999`). */
export function formatPrice(price: number, locale: Locale = "fr"): string {
  let formatter = priceFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(INTL_LOCALES[locale], {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    });
    priceFormatters.set(locale, formatter);
  }
  return formatter.format(price);
}

/** Odometer reading with the site language's digit grouping (`125 000 km`, `125,000 km`). */
export function formatMileage(km: number, locale: Locale = "fr"): string {
  return `${km.toLocaleString(INTL_LOCALES[locale])} km`;
}
