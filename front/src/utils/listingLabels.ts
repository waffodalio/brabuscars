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

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatPrice(price: number): string {
  return priceFormatter.format(price);
}
