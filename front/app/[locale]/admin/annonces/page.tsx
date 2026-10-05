"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useLanguage } from "@/context/LanguageContext";
import { listingService } from "@/services/listingService";
import { LISTING_STATUSES, type Listing } from "@/types/listing";
import { errorMessage } from "@/utils/errors";
import {
  LISTING_STATUS_LABELS,
  LISTING_STATUS_VARIANTS,
  formatPrice,
} from "@/utils/listingLabels";
import { vehicleTitle } from "@/utils/vehicleLabels";

export default function AdminListingsPage() {
  const { withLocale } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [listError, setListError] = useState("");

  const load = useCallback(() => {
    setStatus("loading");
    listingService
      .list()
      .then((listingList) => {
        setListings(listingList);
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
      load();
    } catch (err) {
      setListError(errorMessage(err, "Action impossible"));
    }
  }

  async function handleDelete(listing: Listing) {
    if (!window.confirm(`Supprimer l'annonce « ${listing.title} » ?`)) return;
    try {
      await listingService.remove(listing.id);
      load();
    } catch (err) {
      setListError(errorMessage(err, "Suppression impossible"));
    }
  }

  return (
    <section>
      <div className="d-flex justify-content-end mb-3">
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
          {listings.length === 0 ? (
            <Alert variant="info">
              Aucune annonce. Créez-en une avec « Nouvelle annonce ».
            </Alert>
          ) : (
            <Table striped hover responsive className="chc-table-cards">
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
                      <Link href={withLocale(`/annonces/${listing.id}`)}>
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
                              onClick={() => changeStatus(listing, value)}
                            >
                              {LISTING_STATUS_LABELS[value]}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                      <Link
                        href={withLocale(`/annonces/${listing.id}`)}
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
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDelete(listing)}
                      >
                        Supprimer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}
    </section>
  );
}
