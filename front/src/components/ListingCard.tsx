"use client";

import Link from "next/link";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import { FavoriteButton } from "@/components/FavoriteButton";
import { VehicleSpecs } from "@/components/VehicleSpecs";
import { useCompany } from "@/context/CompanyContext";
import type { Listing } from "@/types/listing";
import {
  LISTING_STATUS_LABELS,
  LISTING_STATUS_VARIANTS,
  formatPrice,
} from "@/utils/listingLabels";
import { vehicleTitle } from "@/utils/vehicleLabels";

/** Listing summary used in the listings and favourites grids. */
export function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.images[0];
  const company = useCompany();

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
              {LISTING_STATUS_LABELS[listing.status]}
            </Badge>
          )}
        </div>
      </div>

      <Card.Body className="d-flex flex-column">
        <div className="chc-price mb-1">{formatPrice(listing.price)}</div>
        <Card.Title className="h6 fw-semibold mb-1">
          <Link
            href={`/annonces/${listing.id}`}
            className="text-reset stretched-link"
          >
            {listing.title}
          </Link>
        </Card.Title>
        {listing.vehicle && (
          <div className="text-secondary small mb-2">
            {vehicleTitle(listing.vehicle)}
          </div>
        )}
        {listing.vehicle && (
          <VehicleSpecs vehicle={listing.vehicle} className="mb-2" />
        )}
        {company && (
          <div className="mt-auto small text-secondary pt-1">
            {company.city}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
