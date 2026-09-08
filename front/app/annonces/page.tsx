"use client";

import Link from "next/link";
import Alert from "react-bootstrap/Alert";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { ListingCard } from "@/components/ListingCard";
import { listingService } from "@/services/listingService";
import type { Listing } from "@/types/listing";

export default function ListingsPage() {
  const { user } = useAuth();
  const state = useAsync<Listing[]>(() =>
    listingService.list({ status: "published" }),
  );

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Annonces</h1>
        {user?.role === "admin" && (
          <Link href="/admin/annonces" className="btn btn-outline-primary">
            Gérer les annonces
          </Link>
        )}
      </div>

      {state.status === "loading" && (
        <Spinner animation="border" role="status" aria-label="Chargement" />
      )}

      {state.status === "error" && (
        <Alert variant="danger">Erreur de chargement : {state.error}</Alert>
      )}

      {state.status === "ready" && state.data.length === 0 && (
        <Alert variant="info">Aucune annonce publiée pour le moment.</Alert>
      )}

      {state.status === "ready" && state.data.length > 0 && (
        <Row xs={1} md={2} lg={3} className="g-3">
          {state.data.map((listing) => (
            <Col key={listing.id}>
              <ListingCard listing={listing} />
            </Col>
          ))}
        </Row>
      )}
    </section>
  );
}
