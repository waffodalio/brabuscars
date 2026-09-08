"use client";

import Link from "next/link";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import { useAsync } from "@/hooks/useAsync";
import { ListingCard } from "@/components/ListingCard";
import { listingService } from "@/services/listingService";
import type { Listing } from "@/types/listing";

export default function HomePage() {
  const state = useAsync<Listing[]>(() =>
    listingService.list({ status: "published" }),
  );
  const recent =
    state.status === "ready" ? state.data.slice(0, 6) : [];

  return (
    <>
      <section className="chc-hero mb-5">
        <div style={{ maxWidth: 620 }}>
          <h1 className="display-5 fw-bold mb-3">
            Trouvez le véhicule qu&apos;il vous faut
          </h1>
          <p className="fs-5 opacity-75 mb-4">
            Des annonces vérifiées, des photos de qualité et toutes les
            caractéristiques d&apos;un coup d&apos;œil.
          </p>
          <Link href="/annonces" className="btn btn-light btn-lg">
            Voir les annonces
          </Link>
        </div>
      </section>

      <section>
        <div className="d-flex justify-content-between align-items-baseline mb-3">
          <h2 className="h4 mb-0">Dernières annonces</h2>
          <Link href="/annonces" className="small">
            Tout voir
          </Link>
        </div>

        {state.status === "loading" && (
          <Spinner animation="border" role="status" aria-label="Chargement" />
        )}
        {state.status === "error" && (
          <p className="text-secondary">
            Impossible de charger les annonces pour le moment.
          </p>
        )}
        {state.status === "ready" && recent.length === 0 && (
          <p className="text-secondary">Aucune annonce publiée pour le moment.</p>
        )}
        {recent.length > 0 && (
          <Row xs={1} sm={2} lg={3} className="g-4">
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
