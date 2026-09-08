"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Alert from "react-bootstrap/Alert";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { ListingCard } from "@/components/ListingCard";

export default function FavoritesPage() {
  const router = useRouter();
  const { user, initializing } = useAuth();
  const { favorites, loading } = useFavorites();

  useEffect(() => {
    if (!initializing && !user) {
      router.replace("/connexion");
    }
  }, [initializing, user, router]);

  if (initializing || !user) {
    return <Spinner animation="border" role="status" aria-label="Chargement" />;
  }

  return (
    <section>
      <h1 className="h3 mb-4">Mes favoris</h1>

      {loading && (
        <Spinner animation="border" role="status" aria-label="Chargement" />
      )}

      {!loading && favorites.length === 0 && (
        <Alert variant="light" className="border text-center py-5">
          Vous n&apos;avez aucune annonce en favori.
        </Alert>
      )}

      {!loading && favorites.length > 0 && (
        <Row xs={1} sm={2} lg={3} className="g-4">
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
