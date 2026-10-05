"use client";

import { useState } from "react";
import Link from "next/link";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import { FavoriteButton } from "@/components/FavoriteButton";
import { VehicleSpecs } from "@/components/VehicleSpecs";
import { useLanguage } from "@/context/LanguageContext";
import type { Listing } from "@/types/listing";
import { LISTING_STATUS_VARIANTS, formatPrice } from "@/utils/listingLabels";
import { vehicleTitle } from "@/utils/vehicleLabels";

/** Listing summary used in the listings and favourites grids. */
export function ListingCard({ listing }: { listing: Listing }) {
  const { t, withLocale } = useLanguage();
  const images = listing.images;
  const [index, setIndex] = useState(0);
  const cover = images[index];

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
          <span className="chc-fav">
            <FavoriteButton listingId={listing.id} />
          </span>
          {listing.status !== "published" && (
            <Badge bg={LISTING_STATUS_VARIANTS[listing.status]}>
              {t.listingStatus[listing.status]}
            </Badge>
          )}
        </div>
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
        <div className="chc-price mb-1">{formatPrice(listing.price)}</div>
        <Card.Title className="h6 fw-semibold mb-1">
          <Link
            href={withLocale(`/annonces/${listing.id}`)}
            className="text-reset stretched-link"
          >
            {listing.title}
          </Link>
        </Card.Title>
        <div className="text-secondary small mb-2">{vehicleTitle(listing)}</div>
        <VehicleSpecs listing={listing} className="mb-2 mt-auto" />
      </Card.Body>
    </Card>
  );
}
