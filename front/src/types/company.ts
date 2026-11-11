import type { Locale } from "@/i18n/locales";

export interface Company {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  /** Opening hours per site language (untranslated ones fall back to French). */
  hours: Record<Locale, string>;
  /** Social pages (footer) — `null` when not configured. */
  instagramUrl: string | null;
  facebookUrl: string | null;
  /** VAT number (« BE 0123.456.789 »), shown in the footer — `null` when not configured. */
  vatNumber: string | null;
}
