"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Alert from "react-bootstrap/Alert";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useLanguage } from "@/context/LanguageContext";
import { ListingCard } from "@/components/ListingCard";
import { ListingCardSkeleton } from "@/components/ListingCardSkeleton";

export default function FavoritesPage() {
  const router = useRouter();
  const { user, initializing } = useAuth();
  const { favorites, loading } = useFavorites();
  const { t, locale } = useLanguage();

  useEffect(() => {
    if (!initializing && !user) {
      router.replace(`/${locale}/connexion`);
    }
  }, [initializing, user, router, locale]);

  if (initializing || !user) {
    return (
      <Spinner animation="border" role="status" aria-label={t.common.loading} />
    );
  }

  return (
    <section>
      <h1 className="h3 mb-4 chc-animate-in">{t.favorites.title}</h1>

      {loading && (
        <Row xs={1} sm={2} lg={3} className="g-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Col key={i}>
              <ListingCardSkeleton />
            </Col>
          ))}
        </Row>
      )}

      {!loading && favorites.length === 0 && (
        <Alert variant="light" className="border text-center py-5">
          {t.favorites.empty}
        </Alert>
      )}

      {!loading && favorites.length > 0 && (
        <Row xs={1} sm={2} lg={3} className="g-4 chc-stagger">
          {favorites.map((favorite) => (
            <Col key={favorite.id}>
              <ListingCard listing={favorite.listing} />
            </Col>
          ))}
        </Row>
      )}
    </section>
  );
}
