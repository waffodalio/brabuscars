"use client";

import { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { ListingCard } from "@/components/ListingCard";
import { useLanguage } from "@/context/LanguageContext";
import { listingService, listingsKey } from "@/services/listingService";
import type { Listing } from "@/types/listing";
import { peekQuery } from "@/utils/queryCache";
import { similarListings } from "@/utils/similarListings";

/** « Véhicules similaires » under a listing (hidden when there is none). */
export function SimilarListings({ listing }: { listing: Listing }) {
  const { t } = useLanguage();
  const [all, setAll] = useState<Listing[]>(
    () => peekQuery<Listing[]>(listingsKey({ status: "published" })) ?? [],
  );

  useEffect(() => {
    listingService
      .list({ status: "published" })
      .then(setAll)
      .catch(() => undefined);
  }, []);

  const similar = similarListings(listing, all);
  if (similar.length === 0) return null;

  return (
    <section className="mt-5">
      <h2 className="h5 mb-3">{t.details.similarTitle}</h2>
      <Row xs={2} lg={3} className="g-2 g-sm-3 g-lg-4">
        {similar.map((other) => (
          <Col key={other.id}>
            <ListingCard listing={other} />
          </Col>
        ))}
      </Row>
    </section>
  );
}
