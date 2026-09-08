"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { listingService } from "@/services/listingService";
import { vehicleService } from "@/services/vehicleService";
import type { Vehicle } from "@/types/vehicle";
import { vehicleTitle } from "@/utils/vehicleLabels";

export default function NewListingPage() {
  const router = useRouter();
  const { user, initializing } = useAuth();
  const vehicles = useAsync<Vehicle[]>(() => vehicleService.list());

  const [form, setForm] = useState({
    vehicleId: "",
    title: "",
    price: "",
    city: "",
    postalCode: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (initializing) return;
    if (!user) {
      router.replace("/connexion");
    } else if (!isAdmin) {
      router.replace("/annonces");
    }
  }, [initializing, user, isAdmin, router]);

  if (initializing || !isAdmin) {
    return <Spinner animation="border" role="status" aria-label="Chargement" />;
  }

  function update(field: keyof typeof form) {
    return (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const created = await listingService.create({
        vehicleId: Number(form.vehicleId),
        title: form.title,
        price: Number(form.price),
        city: form.city,
        postalCode: form.postalCode || null,
        description: form.description || null,
      });
      router.push(`/annonces/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publication impossible");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto" style={{ maxWidth: 560 }}>
      <h1 className="h3 mb-4">Publier une annonce</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="listing-vehicle">
          <Form.Label>Véhicule</Form.Label>
          <Form.Select
            value={form.vehicleId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                vehicleId: event.target.value,
              }))
            }
            required
            disabled={vehicles.status !== "ready"}
          >
            <option value="">
              {vehicles.status === "loading"
                ? "Chargement des véhicules…"
                : "Sélectionner un véhicule"}
            </option>
            {vehicles.status === "ready" &&
              vehicles.data.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicleTitle(vehicle)} · {vehicle.year} ·{" "}
                  {vehicle.mileage.toLocaleString("fr-FR")} km
                </option>
              ))}
          </Form.Select>
          {vehicles.status === "error" && (
            <Form.Text className="text-danger">
              Impossible de charger les véhicules : {vehicles.error}
            </Form.Text>
          )}
        </Form.Group>

        <Form.Group className="mb-3" controlId="listing-title">
          <Form.Label>Titre</Form.Label>
          <Form.Control
            value={form.title}
            onChange={update("title")}
            required
            maxLength={150}
          />
        </Form.Group>

        <Row>
          <Col sm={6}>
            <Form.Group className="mb-3" controlId="listing-price">
              <Form.Label>Prix (€)</Form.Label>
              <Form.Control
                type="number"
                min={1}
                step="0.01"
                value={form.price}
                onChange={update("price")}
                required
              />
            </Form.Group>
          </Col>
          <Col sm={6}>
            <Form.Group className="mb-3" controlId="listing-postalCode">
              <Form.Label>Code postal</Form.Label>
              <Form.Control
                value={form.postalCode}
                onChange={update("postalCode")}
                maxLength={10}
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3" controlId="listing-city">
          <Form.Label>Ville</Form.Label>
          <Form.Control
            value={form.city}
            onChange={update("city")}
            required
            maxLength={120}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="listing-description">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={form.description}
            onChange={update("description")}
            maxLength={5000}
          />
        </Form.Group>

        <Button type="submit" disabled={submitting}>
          {submitting ? "Publication…" : "Créer l'annonce (brouillon)"}
        </Button>
      </Form>
    </div>
  );
}
