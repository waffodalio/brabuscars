"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { useAuth } from "@/context/AuthContext";
import { FavoriteButton } from "@/components/FavoriteButton";
import { VehicleImagePanel } from "@/components/VehicleImagePanel";
import { listingService } from "@/services/listingService";
import type { Listing, ListingStatus } from "@/types/listing";
import {
  LISTING_STATUS_LABELS,
  LISTING_STATUS_VARIANTS,
  formatPrice,
} from "@/utils/listingLabels";
import {
  FUEL_TYPE_LABELS,
  TRANSMISSION_LABELS,
  vehicleTitle,
} from "@/utils/vehicleLabels";

const NEXT_STATUSES: ListingStatus[] = [
  "draft",
  "published",
  "sold",
  "archived",
];

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { isAdmin } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError("");
    listingService
      .getById(id)
      .then(setListing)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Erreur inconnue"),
      );
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(status: ListingStatus) {
    setBusy(true);
    setError("");
    try {
      setListing(await listingService.updateStatus(id, status));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Supprimer définitivement cette annonce ?")) return;
    setBusy(true);
    try {
      await listingService.remove(id);
      router.push("/annonces");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible");
      setBusy(false);
    }
  }

  if (error && !listing) {
    return <Alert variant="danger">{error}</Alert>;
  }
  if (!listing) {
    return <Spinner animation="border" role="status" aria-label="Chargement" />;
  }

  const { vehicle } = listing;

  return (
    <article>
      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
        <h1 className="h3 mb-0">{listing.title}</h1>
        <div className="d-flex align-items-center gap-2">
          <FavoriteButton listingId={listing.id} />
          <Badge bg={LISTING_STATUS_VARIANTS[listing.status]}>
            {LISTING_STATUS_LABELS[listing.status]}
          </Badge>
        </div>
      </div>

      <p className="fs-4 fw-semibold mb-1">{formatPrice(listing.price)}</p>
      <p className="text-secondary">
        {listing.city}
        {listing.postalCode ? ` (${listing.postalCode})` : ""}
        {listing.seller
          ? ` · Vendeur : ${listing.seller.firstName} ${listing.seller.lastName}`
          : ""}
      </p>

      {listing.description && <p>{listing.description}</p>}

      {error && <Alert variant="danger">{error}</Alert>}

      {vehicle && (
        <>
          <h2 className="h5 mt-4">Caractéristiques</h2>
          <Table bordered responsive className="w-auto">
            <tbody>
              <tr>
                <th>Véhicule</th>
                <td>
                  {vehicleTitle(vehicle)} ({vehicle.year})
                </td>
              </tr>
              <tr>
                <th>Catégorie</th>
                <td>{vehicle.category?.name ?? "—"}</td>
              </tr>
              <tr>
                <th>Kilométrage</th>
                <td>{vehicle.mileage.toLocaleString("fr-FR")} km</td>
              </tr>
              <tr>
                <th>Carburant</th>
                <td>{FUEL_TYPE_LABELS[vehicle.fuelType]}</td>
              </tr>
              <tr>
                <th>Boîte</th>
                <td>{TRANSMISSION_LABELS[vehicle.transmission]}</td>
              </tr>
              {vehicle.power !== null && (
                <tr>
                  <th>Puissance</th>
                  <td>{vehicle.power} ch</td>
                </tr>
              )}
            </tbody>
          </Table>

          <VehicleImagePanel vehicleId={vehicle.id} canManage={isAdmin} />
        </>
      )}

      {isAdmin && (
        <section className="mt-4 border-top pt-3">
          <h2 className="h6">Gérer l&apos;annonce</h2>
          <ButtonGroup className="me-2">
            {NEXT_STATUSES.filter((status) => status !== listing.status).map(
              (status) => (
                <Button
                  key={status}
                  variant="outline-secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => changeStatus(status)}
                >
                  {LISTING_STATUS_LABELS[status]}
                </Button>
              ),
            )}
          </ButtonGroup>
          <Button
            variant="outline-danger"
            size="sm"
            disabled={busy}
            onClick={remove}
          >
            Supprimer
          </Button>
        </section>
      )}
    </article>
  );
}
