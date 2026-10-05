"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import { useLanguage } from "@/context/LanguageContext";
import { ErrorAlert } from "@/components/ErrorAlert";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ListingImagePanel } from "@/components/ListingImagePanel";
import { VehicleSpecs } from "@/components/VehicleSpecs";
import { listingService } from "@/services/listingService";
import type { Listing, ListingImage, ListingStatus } from "@/types/listing";
import { errorMessage } from "@/utils/errors";
import {
  LISTING_STATUS_LABELS,
  LISTING_STATUS_VARIANTS,
  formatPrice,
} from "@/utils/listingLabels";
import { vehicleTitle } from "@/utils/vehicleLabels";

const ALL_STATUSES: ListingStatus[] = ["draft", "published", "sold", "archived"];

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { isAdmin } = useAuth();
  const company = useCompany();
  const { t, withLocale } = useLanguage();

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
        setError(errorMessage(err, t.common.unknownError)),
      );
  }, [id, t]);

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

  const images = listing?.images ?? [];
  const activeIndex = Math.max(
    0,
    images.findIndex((image) => image.url === activeUrl),
  );

  function showAdjacent(delta: 1 | -1) {
    if (images.length === 0) return;
    const next = (activeIndex + delta + images.length) % images.length;
    setActiveUrl(images[next].url);
  }

  async function changeStatus(status: ListingStatus) {
    setBusy(true);
    setError("");
    try {
      const updated = await listingService.updateStatus(id, status);
      setListing(updated);
    } catch (err) {
      setError(errorMessage(err, "Action impossible"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Supprimer définitivement cette annonce ?")) return;
    setBusy(true);
    try {
      await listingService.remove(id);
      router.push(withLocale("/annonces"));
    } catch (err) {
      setError(errorMessage(err, "Suppression impossible"));
      setBusy(false);
    }
  }

  if (error && !listing) {
    return <ErrorAlert message={error} />;
  }
  if (!listing) {
    return (
      <Spinner animation="border" role="status" aria-label={t.common.loading} />
    );
  }

  return (
    <article>
      <Row className="g-4">
        {/* Gallery */}
        <Col lg={7} className="chc-animate-in">
          <div
            className={`chc-media chc-media--gallery rounded-3 border${
              activeUrl ? "" : " chc-media--placeholder"
            }`}
          >
            {activeUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeUrl} alt={listing.title} />
            ) : (
              "🚗"
            )}
            {listing.images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label={t.common.prevPhoto}
                  className="chc-media__nav chc-media__nav--prev"
                  onClick={() => showAdjacent(-1)}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M10 3 5 8l5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label={t.common.nextPhoto}
                  className="chc-media__nav chc-media__nav--next"
                  onClick={() => showAdjacent(1)}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 3l5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </>
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
        <Col lg={5} className="chc-animate-in" style={{ animationDelay: "90ms" }}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start gap-2">
                <span className="chc-price chc-price--lg">
                  {formatPrice(listing.price)}
                </span>
                {listing.status !== "published" && (
                  <Badge bg={LISTING_STATUS_VARIANTS[listing.status]}>
                    {t.listingStatus[listing.status]}
                  </Badge>
                )}
              </div>

              <h1 className="h4 mt-2 mb-1">{listing.title}</h1>
              <p className="text-secondary mb-3">
                {vehicleTitle(listing)}
                {listing.category ? ` · ${listing.category.name}` : ""}
              </p>

              <VehicleSpecs listing={listing} className="mb-3" />

              {company && (
                <div className="small text-secondary mb-3">
                  <span className="fw-semibold text-body">
                    {t.listingDetail.availableAt(company.name)}
                  </span>{" "}
                  —{" "}
                  <Link href={withLocale("/contact")}>
                    {t.listingDetail.contactUs}
                  </Link>
                </div>
              )}

              <div className="d-flex flex-wrap gap-2 mt-3">
                <Link href={withLocale("/contact")} className="btn btn-primary">
                  {t.listingDetail.contact}
                </Link>
                <FavoriteButton listingId={listing.id} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <ErrorAlert message={error} className="mt-4 mb-0" />

      {listing.description && (
        <Card className="chc-animate-in mt-4" style={{ animationDelay: "150ms" }}>
          <Card.Body>
            <h2 className="h6">{t.listingDetail.description}</h2>
            <p className="mb-0" style={{ whiteSpace: "pre-line" }}>
              {listing.description}
            </p>
          </Card.Body>
        </Card>
      )}

      <Card className="chc-animate-in mt-4" style={{ animationDelay: "200ms" }}>
        <Card.Body>
          <h2 className="h6">{t.listingDetail.specsTitle}</h2>
            <Row as="dl" className="row-cols-2 row-cols-sm-3 g-3 mb-0">
              {[
                [t.listingDetail.year, listing.year],
                [
                  t.listingDetail.mileage,
                  `${listing.mileage.toLocaleString("fr-FR")} km`,
                ],
                [t.listingDetail.fuel, t.vehicle.fuelType[listing.fuelType]],
                [
                  t.listingDetail.gearbox,
                  t.vehicle.transmission[listing.transmission],
                ],
                listing.power !== null
                  ? [t.listingDetail.power, `${listing.power} ${t.vehicle.powerUnit}`]
                  : null,
                listing.doors !== null
                  ? [t.listingDetail.doors, listing.doors]
                  : null,
                listing.color ? [t.listingDetail.color, listing.color] : null,
                [t.listingDetail.category, listing.category?.name ?? "—"],
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
