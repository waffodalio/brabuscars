"use client";

import Link from "next/link";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { useAsync } from "@/hooks/useAsync";
import { ListingCard } from "@/components/ListingCard";
import { ListingCardSkeleton } from "@/components/ListingCardSkeleton";
import { useLanguage } from "@/context/LanguageContext";
import { listingService } from "@/services/listingService";
import type { Listing } from "@/types/listing";

export default function HomePage() {
  const { t, withLocale } = useLanguage();
  const state = useAsync<Listing[]>(() =>
    listingService.list({ status: "published" }),
  );
  const recent =
    state.status === "ready" ? state.data.slice(0, 6) : [];

  return (
    <>
      <section className="chc-hero chc-animate-in mb-5">
        <div style={{ maxWidth: 620 }}>
          <h1 className="display-5 fw-bold mb-3">{t.home.title}</h1>
          <p className="fs-5 opacity-75 mb-4">{t.home.subtitle}</p>
          <Link href={withLocale("/annonces")} className="btn btn-light btn-lg">
            {t.home.cta}
          </Link>
        </div>
      </section>

      <section className="chc-animate-in" style={{ animationDelay: "80ms" }}>
        <div className="d-flex justify-content-between align-items-baseline mb-3">
          <h2 className="h4 mb-0">{t.home.recentTitle}</h2>
          <Link href={withLocale("/annonces")} className="small">
            {t.home.seeAll}
          </Link>
        </div>

        {state.status === "loading" && (
          <Row xs={1} sm={2} lg={3} className="g-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Col key={i}>
                <ListingCardSkeleton />
              </Col>
            ))}
          </Row>
        )}
        {state.status === "error" && (
          <p className="text-secondary">{t.home.loadError}</p>
        )}
        {state.status === "ready" && recent.length === 0 && (
          <p className="text-secondary">{t.home.empty}</p>
        )}
        {recent.length > 0 && (
          <Row xs={1} sm={2} lg={3} className="g-4 chc-stagger">
            {recent.map((listing) => (
              <Col key={listing.id}>
                <ListingCard listing={listing} />
              </Col>
            ))}
          </Row>
        )}
      </section>
    </>
  );
}
