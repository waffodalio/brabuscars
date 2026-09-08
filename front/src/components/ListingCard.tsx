"use client";

import Link from "next/link";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import { FavoriteButton } from "@/components/FavoriteButton";
import type { Listing } from "@/types/listing";
import {
  LISTING_STATUS_LABELS,
  LISTING_STATUS_VARIANTS,
  formatPrice,
} from "@/utils/listingLabels";
import { vehicleTitle } from "@/utils/vehicleLabels";

/** Compact listing summary used in the listings and favourites grids. */
export function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.images[0];

  return (
    <Card className="h-100">
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover.thumbnailUrl}
          alt=""
          loading="lazy"
          className="card-img-top"
          style={{ height: 160, objectFit: "cover" }}
        />
      )}
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <Card.Title className="h6 mb-1">
            <Link
              href={`/annonces/${listing.id}`}
              className="text-reset text-decoration-none stretched-link"
            >
              {listing.title}
            </Link>
          </Card.Title>
          <Badge bg={LISTING_STATUS_VARIANTS[listing.status]}>
            {LISTING_STATUS_LABELS[listing.status]}
          </Badge>
        </div>

        {listing.vehicle && (
          <div className="text-secondary small mb-2">
            {vehicleTitle(listing.vehicle)} · {listing.vehicle.year}
          </div>
        )}

        <div className="fw-semibold">{formatPrice(listing.price)}</div>
        <div className="small text-secondary mb-2">{listing.city}</div>

        <div className="mt-auto position-relative" style={{ zIndex: 2 }}>
          <FavoriteButton listingId={listing.id} />
        </div>
      </Card.Body>
    </Card>
  );
}
