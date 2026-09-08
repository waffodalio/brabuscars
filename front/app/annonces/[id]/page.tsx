"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ListingImagePanel } from "@/components/ListingImagePanel";
import { VehicleSpecs } from "@/components/VehicleSpecs";
import { listingService } from "@/services/listingService";
import type { Listing, ListingImage, ListingStatus } from "@/types/listing";
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

const ALL_STATUSES: ListingStatus[] = ["draft", "published", "sold", "archived"];

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { isAdmin } = useAuth();
  const company = useCompany();

  const [listing, setListing] = useState<Listing | null>(null);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError("");
    listingService
      .getById(id)
      .then((data) => {
        setListing(data);
        setActiveUrl(data.images[0]?.url ?? null);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Erreur inconnue"),
      );
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function setImages(images: ListingImage[]) {
    setListing((current) => (current ? { ...current, images } : current));
    setActiveUrl((current) =>
      images.some((image) => image.url === current)
        ? current
        : (images[0]?.url ?? null),
    );
  }

  async function changeStatus(status: ListingStatus) {
    setBusy(true);
    setError("");
    try {
      const updated = await listingService.updateStatus(id, status);
      setListing(updated);
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
      <Row className="g-4">
        {/* Gallery */}
        <Col lg={7}>
          <div
            className={`chc-media rounded-3 border${
              activeUrl ? "" : " chc-media--placeholder"
            }`}
          >
            {activeUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeUrl} alt={listing.title} />
            ) : (
              "🚗"
            )}
          </div>
          {listing.images.length > 1 && (
            <div className="d-flex flex-wrap gap-2 mt-2">
              {listing.images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveUrl(image.url)}
                  className={`btn p-0 border rounded-2 overflow-hidden ${
                    image.url === activeUrl
                      ? "border-primary border-2"
                      : "border-secondary-subtle"
                  }`}
                  style={{ width: 76, height: 57 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.thumbnailUrl}
                    alt=""
                    className="w-100 h-100"
                    style={{ objectFit: "cover" }}
                  />
                </button>
              ))}
            </div>
          )}
        </Col>

        {/* Summary */}
        <Col lg={5}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start gap-2">
                <span className="chc-price chc-price--lg">
                  {formatPrice(listing.price)}
                </span>
                {listing.status !== "published" && (
                  <Badge bg={LISTING_STATUS_VARIANTS[listing.status]}>
                    {LISTING_STATUS_LABELS[listing.status]}
                  </Badge>
                )}
              </div>

              <h1 className="h4 mt-2 mb-1">{listing.title}</h1>
              {vehicle && (
                <p className="text-secondary mb-3">
                  {vehicleTitle(vehicle)}
                  {vehicle.category ? ` · ${vehicle.category.name}` : ""}
                </p>
              )}

              {vehicle && <VehicleSpecs vehicle={vehicle} className="mb-3" />}

              {company && (
                <div className="small text-secondary mb-3">
                  <div className="fw-semibold text-body">
                    Disponible chez {company.name}
                  </div>
                  <div>
                    {company.address}, {company.postalCode} {company.city}
                  </div>
                </div>
              )}

              <div className="d-flex flex-wrap gap-2 mt-3">
                <Link href="/contact" className="btn btn-primary">
                  Contacter
                </Link>
                <FavoriteButton listingId={listing.id} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mt-4 mb-0">
          {error}
        </Alert>
      )}

      {listing.description && (
        <Card className="mt-4">
          <Card.Body>
            <h2 className="h6">Description</h2>
            <p className="mb-0" style={{ whiteSpace: "pre-line" }}>
              {listing.description}
            </p>
          </Card.Body>
        </Card>
      )}

      {vehicle && (
        <Card className="mt-4">
          <Card.Body>
            <h2 className="h6">Caractéristiques</h2>
            <Row as="dl" className="row-cols-2 row-cols-sm-3 g-3 mb-0">
              {[
                ["Année", vehicle.year],
                ["Kilométrage", `${vehicle.mileage.toLocaleString("fr-FR")} km`],
                ["Carburant", FUEL_TYPE_LABELS[vehicle.fuelType]],
                ["Boîte", TRANSMISSION_LABELS[vehicle.transmission]],
                vehicle.power !== null ? ["Puissance", `${vehicle.power} ch`] : null,
                vehicle.doors !== null ? ["Portes", vehicle.doors] : null,
                vehicle.color ? ["Couleur", vehicle.color] : null,
                ["Catégorie", vehicle.category?.name ?? "—"],
              ]
                .filter((entry): entry is [string, string | number] =>
                  Boolean(entry),
                )
                .map(([label, value]) => (
                  <Col key={label}>
                    <dt className="small text-secondary fw-normal">{label}</dt>
                    <dd className="mb-0 fw-semibold">{value}</dd>
                  </Col>
                ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {isAdmin && (
        <Card className="mt-4 border-primary-subtle">
          <Card.Body>
            <h2 className="h6">Gérer l&apos;annonce</h2>

            <ListingImagePanel
              listingId={listing.id}
              images={listing.images}
              canManage
              onChange={setImages}
            />

            <div className="border-top mt-4 pt-3 d-flex flex-wrap align-items-center gap-2">
              <span className="small text-secondary me-1">Statut :</span>
              {ALL_STATUSES.filter((status) => status !== listing.status).map(
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
              <Button
                variant="outline-danger"
                size="sm"
                className="ms-auto"
                disabled={busy}
                onClick={remove}
              >
                Supprimer l&apos;annonce
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
    </article>
  );
}
