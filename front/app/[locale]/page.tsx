"use client";

import Link from "next/link";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { useAsync } from "@/hooks/useAsync";
import { HeroCarPhoto } from "@/components/HeroCarPhoto";
import { ListingCard } from "@/components/ListingCard";
import { ListingCardSkeleton } from "@/components/ListingCardSkeleton";
import { useCompany } from "@/context/CompanyContext";
import { useLanguage } from "@/context/LanguageContext";
import { listingService, listingsKey } from "@/services/listingService";
import { peekQuery } from "@/utils/queryCache";
import type { Listing } from "@/types/listing";

export default function HomePage() {
  const { t, withLocale } = useLanguage();
  const company = useCompany();
  const state = useAsync<Listing[]>(
    () => listingService.list({ status: "published" }),
    [],
    peekQuery<Listing[]>(listingsKey({ status: "published" })),
  );
  const recent =
    state.status === "ready" ? state.data.slice(0, 6) : [];

  return (
    <>
      <section className="chc-hero chc-animate-in mb-5">
        <HeroCarPhoto label={t.home.heroAlt} />
        <div className="chc-hero-content">
          <h1 className="chc-hero-title">{company?.name ?? "BrabusCars"}</h1>
          <p className="chc-hero-lead">{t.home.title}</p>
          <div className="chc-hero-actions">
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
            <Link href={withLocale("/trouver")} className="btn chc-hero-cta-ghost">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
              </svg>
              {t.finder.cta}
            </Link>
          </div>
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
          <Row xs={2} lg={3} className="g-2 g-sm-3 g-lg-4">
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
          <Row xs={2} lg={3} className="g-2 g-sm-3 g-lg-4 chc-stagger">
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
