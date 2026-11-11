"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import Alert from "react-bootstrap/Alert";
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
import { CompareButton } from "@/components/CompareButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ListingActionBar, RESERVE_ANCHOR } from "@/components/ListingActionBar";
import { ListingEquipment, ListingPerks, ListingWarranty } from "@/components/ListingDetails";
import { ShareButton } from "@/components/ShareButton";
import { SimilarListings } from "@/components/SimilarListings";
import { ImageLightbox } from "@/components/ImageLightbox";
import { ListingImagePanel } from "@/components/ListingImagePanel";
import { RESERVE_PARAM, ReservationPanel } from "@/components/ReservationPanel";
import { VehicleSpecs } from "@/components/VehicleSpecs";
import { listingKey, listingService } from "@/services/listingService";
import { peekQuery } from "@/utils/queryCache";
import type { Listing, ListingImage, ListingStatus } from "@/types/listing";
import { RESERVATION_TYPES, type ReservationType } from "@/types/reservation";
import { listingIdFromParam, listingPath } from "@/utils/listingPath";
import { reservationService } from "@/services/reservationService";
import { saleService } from "@/services/saleService";
import { stockService } from "@/services/stockService";
import type { StockVehicle } from "@/types/stock";
import { listingStatusBlock } from "@/utils/stockLabels";
import type { Sale } from "@/types/sale";
import { SALE_STATUS_LABELS, saleReference, salesByListing } from "@/utils/saleLabels";
import { openReservationsByListing } from "@/utils/reservationAvailability";
import { clearReservationIntent, peekReservationIntent } from "@/utils/reservationIntent";
import { errorMessage } from "@/utils/errors";
import { usePublicErrorMessage } from "@/hooks/usePublicErrorMessage";
import {
  LISTING_STATUS_LABELS,
  LISTING_STATUS_VARIANTS,
  formatMileage,
  formatPrice,
} from "@/utils/listingLabels";
import { ConfirmButton } from "@/components/ConfirmButton";
import { vehicleTitle } from "@/utils/vehicleLabels";
import { euroNormLabel } from "@/types/listingDetails";

const ALL_STATUSES: ListingStatus[] = ["draft", "published", "sold", "archived"];

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  // `5-mercedes-benz-glc…`: only the leading id counts.
  const parsedId = listingIdFromParam(params.id);
  if (parsedId === null) notFound();
  const id = parsedId;
  const router = useRouter();
  const { isAdmin } = useAuth();
  const company = useCompany();
  const { t, locale, withLocale } = useLanguage();
  const toMessage = usePublicErrorMessage();
  const searchParams = useSearchParams();
  /**
   * Back from the login page: reopen the reservation form that was asked for
   * (`?reserver=` after a redirect, or the stored intent after going back).
   */
  const [reserveOnArrival] = useState<ReservationType | null>(() => {
    const value = searchParams.get(RESERVE_PARAM);
    return (RESERVATION_TYPES as readonly string[]).includes(value ?? "")
      ? (value as ReservationType)
      : peekReservationIntent(id);
  });

  // Opened from a card: the list already carried it, so it shows at once.
  const [listing, setListing] = useState<Listing | null>(
    () => peekQuery<Listing>(listingKey(id)) ?? null,
  );
  const [activeUrl, setActiveUrl] = useState<string | null>(
    () => peekQuery<Listing>(listingKey(id))?.images[0]?.url ?? null,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  /** Full-size viewer open on the active photo. */
  const [lightboxOpen, setLightboxOpen] = useState(false);
  /** Admin: reservations in progress on this car (to flag status changes / deletion). */
  const [openReservations, setOpenReservations] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    reservationService
      .list()
      .then((reservations) => setOpenReservations(openReservationsByListing(reservations).get(id) ?? 0))
      .catch(() => setOpenReservations(0));
  }, [isAdmin, id]);

  /** Admin: sale files of this car (purchase order / invoice). */
  const [sales, setSales] = useState<Sale[]>([]);
  useEffect(() => {
    if (!isAdmin) return;
    saleService
      .list()
      .then((all) => setSales(salesByListing(all).get(id) ?? []))
      .catch(() => setSales([]));
  }, [isAdmin, id]);
  const invoiced = sales.some((sale) => sale.documents.length > 0);
  const paid = sales.some((sale) => sale.status === "paid");

  /** Admin: the garage-register car of this listing (its photos are the listing's). */
  const [stockCar, setStockCar] = useState<StockVehicle | null>(null);
  useEffect(() => {
    if (!isAdmin) return;
    stockService
      .list()
      .then((cars) => setStockCar(cars.find((car) => car.listing?.id === id) ?? null))
      .catch(() => setStockCar(null));
  }, [isAdmin, id]);

  /** Why a status button is off (the car left the stock, or was invoiced). */
  const statusBlock = (next: ListingStatus) =>
    listing
      ? listingStatusBlock({ current: listing.status, next, vehicleStatus: stockCar?.status ?? null, invoiced: paid })
      : null;

  const load = useCallback(() => {
    setError("");
    listingService
      .getById(id)
      .then((data) => {
        setListing(data);
        setActiveUrl((current) =>
          data.images.some((image) => image.url === current) ? current : (data.images[0]?.url ?? null),
        );
        // Old / bare-id / mistyped address, or `?reserver=…` already read:
        // show the canonical one. History API rather than the router, so the
        // page (and a reservation form opened on arrival) stays as it is.
        const canonical = withLocale(listingPath(data));
        if (window.location.pathname !== canonical || window.location.search) {
          window.history.replaceState(null, "", canonical);
        }
      })
      .catch((err: unknown) =>
        setError(toMessage(err, t.common.unknownError)),
      );
  }, [id, t, toMessage, withLocale]);

  useEffect(() => {
    load();
  }, [load]);

  // Read once: drop the stored intent (a reload must not reopen the form;
  // `?reserver=…` leaves the address with the canonical-path fix above).
  useEffect(() => {
    clearReservationIntent();
  }, []);

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
      setListing((current) => ({ ...updated, reserved: current?.reserved }));
    } catch (err) {
      setError(errorMessage(err, "Action impossible"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
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
              <button
                type="button"
                className="chc-media__zoom"
                aria-label={t.lightbox.open}
                onClick={() => setLightboxOpen(true)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeUrl} alt={listing.title} />
              </button>
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

        <ImageLightbox
          images={images}
          index={lightboxOpen ? activeIndex : null}
          onIndexChange={(index) => setActiveUrl(images[index].url)}
          onClose={() => setLightboxOpen(false)}
          alt={listing.title}
        />

        {/* Summary */}
        <Col lg={5} className="chc-animate-in" style={{ animationDelay: "90ms" }}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start gap-2">
                <span className="chc-price chc-price--lg">
                  {formatPrice(listing.price, locale)}
                </span>
                {listing.status !== "published" ? (
                  <Badge bg={LISTING_STATUS_VARIANTS[listing.status]}>
                    {t.listingStatus[listing.status]}
                  </Badge>
                ) : (
                  listing.reserved && <Badge bg="warning" text="dark">{t.reservation.reservedBadge}</Badge>
                )}
              </div>

              <h1 className="h4 mt-2 mb-1">{listing.title}</h1>
              <p className="text-secondary mb-3">
                {vehicleTitle(listing)}
                {listing.category ? ` · ${listing.category.name}` : ""}
              </p>

              <VehicleSpecs listing={listing} className="mb-3" />
              <ListingPerks listing={listing} />

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

              {listing.status === "published" && (
                <div id={RESERVE_ANCHOR} className="chc-reserve-anchor">
                  <ReservationPanel listing={listing} initialType={reserveOnArrival} />
                </div>
              )}

              <div className="d-flex flex-wrap gap-2 mt-3">
                <Link href={withLocale("/contact")} className="btn btn-outline-primary">
                  {t.listingDetail.contact}
                </Link>
                <FavoriteButton listingId={listing.id} />
                {listing.status === "published" && <CompareButton listing={listing} />}
                <ShareButton title={listing.title} />
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
                  formatMileage(listing.mileage, locale),
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
                listing.euroNorm ? [t.details.euroNorm, euroNormLabel(listing.euroNorm)] : null,
                listing.co2 != null ? [t.details.co2, `${listing.co2} ${t.details.co2Unit}`] : null,
                listing.hasCarPass ? [t.details.carPass, t.details.yes] : null,
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

      <ListingEquipment listing={listing} />
      <ListingWarranty listing={listing} />

      {isAdmin && (
        <Card className="mt-4 border-primary-subtle">
          <Card.Body>
            <h2 className="h6">Gérer l&apos;annonce</h2>

            {sales.length > 0 && (
              <div className="chc-sale-links mb-3">
                {sales.map((sale) => (
                  <Link key={sale.id} href={withLocale(`/admin/ventes/${sale.id}`)} className="chc-sale-link">
                    <span className="fw-semibold">{saleReference(sale) ?? "Dossier brouillon"}</span>
                    <span className="text-secondary">
                      {sale.buyer.name} · {SALE_STATUS_LABELS[sale.status]}
                    </span>
                    <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            )}

            {openReservations > 0 && (
              <Alert variant={listing.status === "published" ? "info" : "danger"} className="small py-2">
                {listing.status === "published"
                  ? `${openReservations} réservation${openReservations > 1 ? "s" : ""} en cours sur ce véhicule.`
                  : `Ce véhicule n'est plus en vente mais a ${openReservations} réservation${openReservations > 1 ? "s" : ""} en cours : prévenez les clients.`}{" "}
                <Link href={withLocale("/admin/reservations")}>Voir les réservations →</Link>
              </Alert>
            )}

            {stockCar ? (
              <div className="chc-sale-link mt-4">
                <span className="fw-semibold">Photos du véhicule {stockCar.reference}</span>
                <span className="text-secondary">L&apos;annonce affiche les photos du stock.</span>
                <Link href={withLocale(`/admin/stock/${stockCar.id}`)}>Gérer les photos →</Link>
              </div>
            ) : (
              <ListingImagePanel
                listingId={listing.id}
                images={listing.images}
                canManage
                onChange={setImages}
              />
            )}

            <div className="border-top mt-4 pt-3 d-flex flex-wrap align-items-center gap-2">
              <span className="small text-secondary me-1">Statut :</span>
              {ALL_STATUSES.filter((status) => status !== listing.status).map(
                (status) => (
                  <Button
                    key={status}
                    variant="outline-secondary"
                    size="sm"
                    disabled={busy || statusBlock(status) !== null}
                    title={statusBlock(status) ?? undefined}
                    onClick={() => changeStatus(status)}
                  >
                    {LISTING_STATUS_LABELS[status]}
                  </Button>
                ),
              )}
              <ConfirmButton
                className="ms-auto"
                disabled={busy || openReservations > 0 || invoiced}
                message="Supprimer définitivement cette annonce et ses photos ?"
                confirmLabel="Oui, supprimer"
                cancelLabel="Non"
                onConfirm={remove}
              >
                Supprimer l&apos;annonce
              </ConfirmButton>
            </div>
          </Card.Body>
        </Card>
      )}

      {listing.status === "published" && <SimilarListings listing={listing} />}
      {listing.status === "published" && <ListingActionBar listing={listing} />}
    </article>
  );
}
