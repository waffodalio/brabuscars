"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { AdminFormModal } from "@/components/admin/AdminFormModal";
import { carModelService } from "@/services/carModelService";
import { categoryService } from "@/services/categoryService";
import { vehicleService, type VehicleInput } from "@/services/vehicleService";
import type { CarModel } from "@/types/carModel";
import type { Category } from "@/types/category";
import {
  FUEL_TYPES,
  TRANSMISSIONS,
  type Vehicle,
} from "@/types/vehicle";
import {
  FUEL_TYPE_LABELS,
  TRANSMISSION_LABELS,
  vehicleTitle,
} from "@/utils/vehicleLabels";

const EMPTY_FORM = {
  modelId: "",
  categoryId: "",
  year: "",
  mileage: "",
  fuelType: "petrol",
  transmission: "manual",
  power: "",
  doors: "",
  color: "",
};

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [listError, setListError] = useState("");

  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setStatus("loading");
    Promise.all([
      vehicleService.list(),
      carModelService.list(),
      categoryService.list(),
    ])
      .then(([vehicleList, modelList, categoryList]) => {
        setVehicles(vehicleList);
        setModels(modelList);
        setCategories(categoryList);
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

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormError("");
    setShowForm(true);
  }

  function openEdit(vehicle: Vehicle) {
    setEditing(vehicle);
    setForm({
      modelId: String(vehicle.modelId),
      categoryId: vehicle.categoryId ? String(vehicle.categoryId) : "",
      year: String(vehicle.year),
      mileage: String(vehicle.mileage),
      fuelType: vehicle.fuelType,
      transmission: vehicle.transmission,
      power: vehicle.power ? String(vehicle.power) : "",
      doors: vehicle.doors ? String(vehicle.doors) : "",
      color: vehicle.color ?? "",
    });
    setFormError("");
    setShowForm(true);
  }

  function set(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit() {
    setSubmitting(true);
    setFormError("");
    const payload: VehicleInput = {
      modelId: Number(form.modelId),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      year: Number(form.year),
      mileage: Number(form.mileage),
      fuelType: form.fuelType as VehicleInput["fuelType"],
      transmission: form.transmission as VehicleInput["transmission"],
      power: form.power ? Number(form.power) : null,
      doors: form.doors ? Number(form.doors) : null,
      color: form.color.trim() || null,
    };
    try {
      if (editing) await vehicleService.update(editing.id, payload);
      else await vehicleService.create(payload);
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

  async function handleDelete(vehicle: Vehicle) {
    if (!window.confirm(`Supprimer ${vehicleTitle(vehicle)} ?`)) return;
    try {
      await vehicleService.remove(vehicle.id);
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
        <Button onClick={openCreate} disabled={status !== "ready"}>
          Ajouter un véhicule
        </Button>
      </div>

      {status === "loading" && (
        <Spinner animation="border" role="status" aria-label="Chargement" />
      )}
      {status === "error" && <Alert variant="danger">{listError}</Alert>}

      {status === "ready" && (
        <>
          {listError && <Alert variant="danger">{listError}</Alert>}
          {models.length === 0 && (
            <Alert variant="warning">
              Créez au moins une marque et un modèle avant d&apos;ajouter un
              véhicule.
            </Alert>
          )}
          {vehicles.length === 0 ? (
            <Alert variant="info">Aucun véhicule enregistré.</Alert>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Véhicule</th>
                  <th>Année</th>
                  <th>Kilométrage</th>
                  <th>Carburant</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>{vehicle.id}</td>
                    <td>{vehicleTitle(vehicle)}</td>
                    <td>{vehicle.year}</td>
                    <td>{vehicle.mileage.toLocaleString("fr-FR")} km</td>
                    <td>{FUEL_TYPE_LABELS[vehicle.fuelType]}</td>
                    <td className="text-end text-nowrap">
                      <Link
                        href={`/admin/vehicules/${vehicle.id}`}
                        className="btn btn-sm btn-outline-primary me-2"
                      >
                        Photos
                      </Link>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        className="me-2"
                        onClick={() => openEdit(vehicle)}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDelete(vehicle)}
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
        title={editing ? "Modifier le véhicule" : "Nouveau véhicule"}
        error={formError}
        submitting={submitting}
        onSubmit={submit}
        onHide={() => setShowForm(false)}
      >
        <Row>
          <Col sm={7}>
            <Form.Group className="mb-3" controlId="vehicle-model">
              <Form.Label>Modèle</Form.Label>
              <Form.Select
                value={form.modelId}
                onChange={(event) => set("modelId", event.target.value)}
                required
              >
                <option value="">Sélectionner…</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.brand?.name ? `${model.brand.name} ` : ""}
                    {model.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col sm={5}>
            <Form.Group className="mb-3" controlId="vehicle-category">
              <Form.Label>Catégorie</Form.Label>
              <Form.Select
                value={form.categoryId}
                onChange={(event) => set("categoryId", event.target.value)}
              >
                <option value="">—</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col sm={6}>
            <Form.Group className="mb-3" controlId="vehicle-year">
              <Form.Label>Année</Form.Label>
              <Form.Control
                type="number"
                value={form.year}
                onChange={(event) => set("year", event.target.value)}
                required
              />
            </Form.Group>
          </Col>
          <Col sm={6}>
            <Form.Group className="mb-3" controlId="vehicle-mileage">
              <Form.Label>Kilométrage</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={form.mileage}
                onChange={(event) => set("mileage", event.target.value)}
                required
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col sm={6}>
            <Form.Group className="mb-3" controlId="vehicle-fuel">
              <Form.Label>Carburant</Form.Label>
              <Form.Select
                value={form.fuelType}
                onChange={(event) => set("fuelType", event.target.value)}
              >
                {FUEL_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {FUEL_TYPE_LABELS[value]}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col sm={6}>
            <Form.Group className="mb-3" controlId="vehicle-transmission">
              <Form.Label>Boîte</Form.Label>
              <Form.Select
                value={form.transmission}
                onChange={(event) => set("transmission", event.target.value)}
              >
                {TRANSMISSIONS.map((value) => (
                  <option key={value} value={value}>
                    {TRANSMISSION_LABELS[value]}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col sm={4}>
            <Form.Group className="mb-3" controlId="vehicle-power">
              <Form.Label>Puissance (ch)</Form.Label>
              <Form.Control
                type="number"
                min={1}
                value={form.power}
                onChange={(event) => set("power", event.target.value)}
              />
            </Form.Group>
          </Col>
          <Col sm={4}>
            <Form.Group className="mb-3" controlId="vehicle-doors">
              <Form.Label>Portes</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={9}
                value={form.doors}
                onChange={(event) => set("doors", event.target.value)}
              />
            </Form.Group>
          </Col>
          <Col sm={4}>
            <Form.Group className="mb-3" controlId="vehicle-color">
              <Form.Label>Couleur</Form.Label>
              <Form.Control
                value={form.color}
                onChange={(event) => set("color", event.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>
      </AdminFormModal>
    </section>
  );
}
