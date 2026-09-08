"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { AdminFormModal } from "@/components/admin/AdminFormModal";
import { listingService } from "@/services/listingService";
import { vehicleService } from "@/services/vehicleService";
import { LISTING_STATUSES, type Listing } from "@/types/listing";
import type { Vehicle } from "@/types/vehicle";
import {
  LISTING_STATUS_LABELS,
  LISTING_STATUS_VARIANTS,
  formatPrice,
} from "@/utils/listingLabels";
import { vehicleTitle } from "@/utils/vehicleLabels";

const EMPTY_FORM = {
  vehicleId: "",
  title: "",
  price: "",
  description: "",
};

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [listError, setListError] = useState("");

  const [editing, setEditing] = useState<Listing | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setStatus("loading");
    Promise.all([listingService.list(), vehicleService.list()])
      .then(([listingList, vehicleList]) => {
        setListings(listingList);
        setVehicles(vehicleList);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        setListError(err instanceof Error ? err.message : "Erreur inconnue");
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const listedVehicleIds = useMemo(
    () => new Set(listings.map((listing) => listing.vehicleId)),
    [listings],
  );
  const freeVehicles = vehicles.filter(
    (vehicle) => !listedVehicleIds.has(vehicle.id),
  );

  function set(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormError("");
    setShowForm(true);
  }

  function openEdit(listing: Listing) {
    setEditing(listing);
    setForm({
      vehicleId: String(listing.vehicleId),
      title: listing.title,
      price: String(listing.price),
      description: listing.description ?? "",
    });
    setFormError("");
    setShowForm(true);
  }

  async function submit() {
    setSubmitting(true);
    setFormError("");
    const common = {
      title: form.title.trim(),
      price: Number(form.price),
      description: form.description.trim() || null,
    };
    try {
      if (editing) {
        await listingService.update(editing.id, common);
      } else {
        await listingService.create({
          vehicleId: Number(form.vehicleId),
          ...common,
        });
      }
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Enregistrement impossible",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(listing: Listing, next: Listing["status"]) {
    try {
      await listingService.updateStatus(listing.id, next);
      load();
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Action impossible");
    }
  }

  async function handleDelete(listing: Listing) {
    if (!window.confirm(`Supprimer l'annonce « ${listing.title} » ?`)) return;
    try {
      await listingService.remove(listing.id);
      load();
    } catch (err) {
      setListError(
        err instanceof Error ? err.message : "Suppression impossible",
      );
    }
  }

  return (
    <section>
      <div className="d-flex justify-content-end mb-3">
        <Button
          onClick={openCreate}
          disabled={status !== "ready" || freeVehicles.length === 0}
        >
          Nouvelle annonce
        </Button>
      </div>

      {status === "loading" && (
        <Spinner animation="border" role="status" aria-label="Chargement" />
      )}
      {status === "error" && <Alert variant="danger">{listError}</Alert>}

      {status === "ready" && (
        <>
          {listError && <Alert variant="danger">{listError}</Alert>}
          {status === "ready" &&
            freeVehicles.length === 0 &&
            vehicles.length > 0 && (
              <Alert variant="info">
                Tous les véhicules ont déjà une annonce.
              </Alert>
            )}
          {listings.length === 0 ? (
            <Alert variant="info">Aucune annonce.</Alert>
          ) : (
            <Table striped hover responsive>
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
                    <td>{listing.id}</td>
                    <td>
                      <Link href={`/annonces/${listing.id}`}>
                        {listing.title}
                      </Link>
                    </td>
                    <td>
                      {listing.vehicle
                        ? vehicleTitle(listing.vehicle)
                        : listing.vehicleId}
                    </td>
                    <td>{formatPrice(listing.price)}</td>
                    <td>
                      <Badge bg={LISTING_STATUS_VARIANTS[listing.status]}>
                        {LISTING_STATUS_LABELS[listing.status]}
                      </Badge>
                    </td>
                    <td className="text-end text-nowrap">
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
                        href={`/annonces/${listing.id}`}
                        className="btn btn-sm btn-outline-primary me-2"
                      >
                        Photos
                      </Link>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        className="me-2"
                        onClick={() => openEdit(listing)}
                      >
                        Modifier
                      </Button>
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

      <AdminFormModal
        show={showForm}
        title={editing ? "Modifier l'annonce" : "Nouvelle annonce"}
        error={formError}
        submitting={submitting}
        onSubmit={submit}
        onHide={() => setShowForm(false)}
      >
        {!editing && (
          <Form.Group className="mb-3" controlId="listing-vehicle">
            <Form.Label>Véhicule</Form.Label>
            <Form.Select
              value={form.vehicleId}
              onChange={(event) => set("vehicleId", event.target.value)}
              required
            >
              <option value="">Sélectionner…</option>
              {freeVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicleTitle(vehicle)} · {vehicle.year}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        )}

        <Form.Group className="mb-3" controlId="listing-title">
          <Form.Label>Titre</Form.Label>
          <Form.Control
            value={form.title}
            onChange={(event) => set("title", event.target.value)}
            required
            maxLength={150}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="listing-price">
          <Form.Label>Prix (€)</Form.Label>
          <Form.Control
            type="number"
            min={1}
            step="0.01"
            value={form.price}
            onChange={(event) => set("price", event.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="listing-description">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
            maxLength={5000}
          />
        </Form.Group>
      </AdminFormModal>
    </section>
  );
}
