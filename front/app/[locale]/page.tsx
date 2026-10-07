"use client";

import Link from "next/link";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { useAsync } from "@/hooks/useAsync";
import { HeroCarIllustration } from "@/components/HeroCarIllustration";
import { ListingCard } from "@/components/ListingCard";
import { ListingCardSkeleton } from "@/components/ListingCardSkeleton";
import { useCompany } from "@/context/CompanyContext";
import { useLanguage } from "@/context/LanguageContext";
import { listingService } from "@/services/listingService";
import type { Listing } from "@/types/listing";

export default function HomePage() {
  const { t, withLocale } = useLanguage();
  const company = useCompany();
  const state = useAsync<Listing[]>(() =>
    listingService.list({ status: "published" }),
  );
  const recent =
    state.status === "ready" ? state.data.slice(0, 6) : [];

  return (
    <>
      <section className="chc-hero chc-animate-in mb-5">
        <Row className="align-items-center g-3">
          <Col xs={4} md={6}>
            <HeroCarIllustration label={t.home.heroAlt} />
          </Col>
          <Col xs={8} md={6} className="text-end">
            <h1 className="h2 fw-bold mb-3">
              {company?.name ?? "BrabusCars"}
              <span className="visually-hidden"> — {t.home.title}</span>
            </h1>
            <Link
              href={withLocale("/annonces")}
              className="btn chc-hero-cta"
            >
              {t.home.cta}
              <span className="chc-hero-cta-arrow" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </span>
            </Link>
          </Col>
        </Row>
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
