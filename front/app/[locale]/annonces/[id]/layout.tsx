import type { Metadata } from "next";
import type { ReactNode } from "react";
import { localeAlternates, resolveLocale } from "@/i18n/metadata";
import { fetchPublicListing } from "@/services/serverApi";
import { formatMileage, formatPrice } from "@/utils/listingLabels";
import { listingIdFromParam, listingPath } from "@/utils/listingPath";

/**
 * Listing page metadata: the car's own title and summary in the tab, in
 * search results and in the preview of a shared link (WhatsApp, Facebook…,
 * with its first photo), plus its address in the three languages.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  const { id: param } = await params;
  const id = listingIdFromParam(param);
  const listing = id === null ? null : await fetchPublicListing(id);
  if (!listing) return { title: t.meta.listings, alternates: {} };

  const title = `${listing.title} — ${formatPrice(listing.price, locale)}`;
  const summary = [
    String(listing.year),
    formatMileage(listing.mileage, locale),
    t.vehicle.fuelType[listing.fuelType],
    t.vehicle.transmission[listing.transmission],
  ].join(" · ");
  const text = listing.description?.replace(/\s+/g, " ").trim();
  const description = text ? `${summary}. ${text.length > 140 ? `${text.slice(0, 140).trimEnd()}…` : text}` : summary;
  const photo = listing.images[0];

  return {
    title,
    description,
    alternates: localeAlternates(locale, listingPath(listing)),
    openGraph: {
      title,
      description,
      url: `/${locale}${listingPath(listing)}`,
      images: photo ? [{ url: photo.url, alt: listing.title }] : undefined,
    },
  };
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
