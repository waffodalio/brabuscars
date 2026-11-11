"use client";

import { useCompany } from "@/context/CompanyContext";
import { useLanguage } from "@/context/LanguageContext";
import type { Listing } from "@/types/listing";
import { formatPrice } from "@/utils/listingLabels";

/** Id of the block « Réserver » scrolls to on the listing page. */
export const RESERVE_ANCHOR = "reserver";

/**
 * Phones only: a bar pinned to the bottom of a listing page with the price,
 * « Réserver » (scrolls to the reservation block) and « Appeler ».
 */
export function ListingActionBar({ listing }: { listing: Listing }) {
  const { t, locale } = useLanguage();
  const company = useCompany();
  const phone = company?.phone?.replace(/[^+0-9]/g, "");

  return (
    <div className="chc-actionbar d-lg-none">
      <div className="chc-actionbar-price">
        <span className="chc-price">{formatPrice(listing.price, locale)}</span>
        <span className="chc-actionbar-title">{listing.title}</span>
      </div>
      {phone && (
        <a href={`tel:${phone}`} className="btn btn-outline-primary chc-actionbar-btn">
          {t.details.call}
        </a>
      )}
      <button
        type="button"
        className="btn btn-primary chc-actionbar-btn"
        onClick={() => document.getElementById(RESERVE_ANCHOR)?.scrollIntoView({ behavior: "smooth", block: "center" })}
      >
        {t.details.reserve}
      </button>
    </div>
  );
}
