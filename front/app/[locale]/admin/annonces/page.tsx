"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Dropdown from "react-bootstrap/Dropdown";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useLanguage } from "@/context/LanguageContext";
import { listingService } from "@/services/listingService";
import { saleService } from "@/services/saleService";
import { stockService } from "@/services/stockService";
import type { StockStatus } from "@/types/stock";
import { listingStatusBlock } from "@/utils/stockLabels";
import type { Sale } from "@/types/sale";
import { saleReference, salesByListing } from "@/utils/saleLabels";
import { LISTING_STATUSES, type Listing } from "@/types/listing";
import { errorMessage } from "@/utils/errors";
import {
  LISTING_STATUS_LABELS,
  LISTING_STATUS_VARIANTS,
  formatPrice,
} from "@/utils/listingLabels";
import { ConfirmButton } from "@/components/ConfirmButton";
import { reservationService } from "@/services/reservationService";
import { openReservationsByListing } from "@/utils/reservationAvailability";
import { listingPath } from "@/utils/listingPath";
import { vehicleTitle } from "@/utils/vehicleLabels";

export default function AdminListingsPage() {
  const { withLocale } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [listError, setListError] = useState("");
  /** Reservations in progress per listing, to flag the risky actions. */
  const [openCounts, setOpenCounts] = useState<Map<number, number>>(new Map());
  const [warning, setWarning] = useState<{ title: string; count: number } | null>(null);
  /** Sale files per listing: the car's purchase order / invoice, one click away. */
  const [salesOf, setSalesOf] = useState<Map<number, Sale[]>>(new Map());
  /** Stock car status per listing id (publishing needs the car at the garage). */
  const [carStatusOf, setCarStatusOf] = useState<Map<number, StockStatus>>(new Map());

  const load = useCallback(() => {
    setStatus("loading");
    Promise.all([
      listingService.list(),
      reservationService.list().catch(() => []),
      saleService.list().catch(() => []),
      stockService.list().catch(() => []),
    ])
      .then(([listingList, reservations, sales, cars]) => {
        setCarStatusOf(new Map(cars.filter((car) => car.listing).map((car) => [car.listing!.id, car.status])));
        setListings(listingList);
        setOpenCounts(openReservationsByListing(reservations));
        setSalesOf(salesByListing(sales));
        setStatus("ready");
      })
      .catch((err: unknown) => {
        setListError(errorMessage(err, "Erreur inconnue"));
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(listing: Listing, next: Listing["status"]) {
    try {
      await listingService.updateStatus(listing.id, next);
      // No longer for sale while customers still wait: say so.
      const count = openCounts.get(listing.id) ?? 0;
      setWarning(next !== "published" && count > 0 ? { title: listing.title, count } : null);
      load();
    } catch (err) {
      setListError(errorMessage(err, "Action impossible"));
    }
  }

  async function handleDelete(listing: Listing) {
    try {
      await listingService.remove(listing.id);
      load();
    } catch (err) {
      setListError(errorMessage(err, "Suppression impossible"));
    }
  }

  return (
    <section>
      <div className="d-flex justify-content-end mb-4">
        <Link href={withLocale("/admin/annonces/nouvelle")} className="btn btn-primary">
          Nouvelle annonce
        </Link>
      </div>

      {status === "loading" && (
        <Spinner animation="border" role="status" aria-label="Chargement" />
      )}
      {status === "error" && <ErrorAlert message={listError} />}

      {status === "ready" && (
        <>
          <ErrorAlert message={listError} />
          {warning && (
            <Alert variant="warning" dismissible onClose={() => setWarning(null)}>
              « {warning.title} » n&apos;est plus en vente mais a {warning.count} réservation
              {warning.count > 1 ? "s" : ""} en cours.{" "}
              <Link href={withLocale("/admin/reservations")}>Prévenir les clients →</Link>
            </Alert>
          )}
          {listings.length === 0 ? (
            <Alert variant="info">
              Aucune annonce. Créez-en une avec « Nouvelle annonce ».
            </Alert>
          ) : (
            <div className="chc-admin-table">
            <Table hover responsive className="align-middle mb-0 chc-table-cards">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Titre</th>
                  <th>Véhicule</th>
                  <th>Prix</th>
                  <th>Statut</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr key={listing.id}>
                    <td data-label="#">{listing.id}</td>
                    <td data-label="Titre">
                      <Link href={withLocale(listingPath(listing))}>
                        {listing.title}
                      </Link>
                    </td>
                    <td data-label="Véhicule">
                      {vehicleTitle(listing)} · {listing.year}
                    </td>
                    <td data-label="Prix">{formatPrice(listing.price)}</td>
                    <td data-label="Statut">
                      <Badge bg={LISTING_STATUS_VARIANTS[listing.status]}>
                        {LISTING_STATUS_LABELS[listing.status]}
                      </Badge>
                      {(salesOf.get(listing.id) ?? []).map((sale) => (
                        <Link
                          key={sale.id}
                          href={withLocale(`/admin/ventes/${sale.id}`)}
                          className="badge ms-1 text-decoration-none text-bg-light border"
                          title={`Dossier de vente — ${sale.buyer.name}`}
                        >
                          {saleReference(sale) ?? "Dossier brouillon"}
                        </Link>
                      ))}
                      {(openCounts.get(listing.id) ?? 0) > 0 && (
                        <Link
                          href={withLocale("/admin/reservations")}
                          className={`badge ms-1 text-decoration-none ${listing.status === "published" ? "text-bg-info" : "text-bg-danger"}`}
                          title="Réservations en cours sur ce véhicule"
                        >
                          {openCounts.get(listing.id)} résa
                        </Link>
                      )}
                    </td>
                    <td data-label="" className="text-end text-nowrap">
                      <Dropdown className="d-inline-block me-2">
                        <Dropdown.Toggle size="sm" variant="outline-secondary">
                          Statut
                        </Dropdown.Toggle>
                        <Dropdown.Menu align="end">
                          {LISTING_STATUSES.filter(
                            (value) => value !== listing.status,
                          ).map((value) => (
                            <Dropdown.Item
                              key={value}
                              disabled={
                                listingStatusBlock({
                                  current: listing.status,
                                  next: value,
                                  vehicleStatus: carStatusOf.get(listing.id) ?? null,
                                  invoiced: (salesOf.get(listing.id) ?? []).some((sale) => sale.status === "paid"),
                                }) !== null
                              }
                              onClick={() => changeStatus(listing, value)}
                            >
                              {LISTING_STATUS_LABELS[value]}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                      <Link
                        href={withLocale(listingPath(listing))}
                        className="btn btn-sm btn-outline-primary me-2"
                      >
                        Photos
                      </Link>
                      <Link
                        href={withLocale(`/admin/annonces/${listing.id}/modifier`)}
                        className="btn btn-sm btn-outline-secondary me-2"
                      >
                        Modifier
                      </Link>
                      {(salesOf.get(listing.id) ?? []).some((sale) => sale.documents.length > 0) ? (
                        // On a purchase order / invoice: deleting would cut the link (refused by the API too).
                        <span title="Ce véhicule figure sur un bon de commande ou une facture : archivez-le plutôt.">
                          <button type="button" className="btn btn-sm btn-outline-danger" disabled>
                            Supprimer
                          </button>
                        </span>
                      ) : (openCounts.get(listing.id) ?? 0) > 0 ? (
                        // Deleting would silently drop the customers' requests (refused by the API too).
                        <span title={`${openCounts.get(listing.id)} réservation(s) en cours : refusez ou annulez-les d'abord`}>
                          <button type="button" className="btn btn-sm btn-outline-danger" disabled>
                            Supprimer
                          </button>
                        </span>
                      ) : (
                        <ConfirmButton
                          message={<>Supprimer l&apos;annonce « {listing.title} » ?</>}
                          confirmLabel="Oui, supprimer"
                          cancelLabel="Non"
                          onConfirm={() => handleDelete(listing)}
                        >
                          Supprimer
                        </ConfirmButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
