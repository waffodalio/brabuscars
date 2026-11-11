"use client";

import { useState } from "react";
import Link from "next/link";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import { CompareButton } from "@/components/CompareButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { VehicleSpecs } from "@/components/VehicleSpecs";
import { useLanguage } from "@/context/LanguageContext";
import type { Listing } from "@/types/listing";
import { LISTING_STATUS_VARIANTS, formatPrice } from "@/utils/listingLabels";
import { listingHighlights, type Highlight } from "@/utils/listingHighlights";
import { listingPath } from "@/utils/listingPath";
import { vehicleTitle } from "@/utils/vehicleLabels";

const HIGHLIGHT_ICONS: Record<Highlight, string> = {
  new: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  lowMileage: "M12 13l4-4M4.9 19a9 9 0 1 1 14.2 0",
  recent: "M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
};

/** Listing summary used in the listings and favourites grids. */
export function ListingCard({ listing }: { listing: Listing }) {
  const { t, locale, withLocale } = useLanguage();
  const images = listing.images;
  const [index, setIndex] = useState(0);
  const cover = images[index];
  const highlights = listing.status === "published" ? listingHighlights(listing) : [];

  function showAdjacent(delta: 1 | -1, event: React.MouseEvent) {
    event.preventDefault();
    if (images.length === 0) return;
    setIndex((current) => (current + delta + images.length) % images.length);
  }

  return (
    <Card className="chc-listing-card h-100 position-relative overflow-hidden">
      <div className={`chc-media${cover ? "" : " chc-media--placeholder"}`}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.thumbnailUrl} alt="" loading="lazy" />
        ) : (
          "🚗"
        )}
        <div className="chc-media__overlay">
          <span className="chc-fav d-flex gap-2">
            <FavoriteButton listingId={listing.id} />
            {listing.status === "published" && <CompareButton listing={listing} />}
          </span>
          {listing.status !== "published" ? (
            <Badge bg={LISTING_STATUS_VARIANTS[listing.status]}>
              {t.listingStatus[listing.status]}
            </Badge>
          ) : (
            listing.reserved && (
              <Badge bg="warning" text="dark">
                {t.reservation.reservedBadge}
              </Badge>
            )
          )}
        </div>
        {highlights.length > 0 && (
          <div className="chc-highlights">
            {highlights.map((highlight) => (
              <span key={highlight} className={`chc-highlight chc-highlight--${highlight}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={HIGHLIGHT_ICONS[highlight]} />
                </svg>
                {t.highlights[highlight]}
              </span>
            ))}
          </div>
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label={t.common.prevPhoto}
              className="chc-media__nav chc-media__nav--prev"
              onClick={(event) => showAdjacent(-1, event)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M10 3 5 8l5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              aria-label={t.common.nextPhoto}
              className="chc-media__nav chc-media__nav--next"
              onClick={(event) => showAdjacent(1, event)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 3l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      <Card.Body className="d-flex flex-column">
        <div className="chc-price mb-1">{formatPrice(listing.price, locale)}</div>
        <Card.Title className="h6 fw-semibold mb-1">
          <Link
            href={withLocale(listingPath(listing))}
            className="text-reset stretched-link"
          >
            {listing.title}
          </Link>
        </Card.Title>
        <div className="text-secondary small mb-2 chc-card-sub">{vehicleTitle(listing)}</div>
        <VehicleSpecs listing={listing} className="mb-2 mt-auto" />
      </Card.Body>
    </Card>
  );
}
