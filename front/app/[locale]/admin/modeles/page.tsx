"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { AdminFormModal } from "@/components/admin/AdminFormModal";
import { ErrorAlert } from "@/components/ErrorAlert";
import { brandService } from "@/services/brandService";
import { carModelService } from "@/services/carModelService";
import type { Brand } from "@/types/brand";
import type { CarModel } from "@/types/carModel";
import { errorMessage } from "@/utils/errors";

export default function AdminCarModelsPage() {
  const [models, setModels] = useState<CarModel[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [listError, setListError] = useState("");

  const [editing, setEditing] = useState<CarModel | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", brandId: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setStatus("loading");
    Promise.all([carModelService.list(), brandService.list()])
      .then(([modelList, brandList]) => {
        setModels(modelList);
        setBrands(brandList);
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

  function openCreate() {
    setEditing(null);
    setForm({ name: "", brandId: "" });
    setFormError("");
    setShowForm(true);
  }

  function openEdit(model: CarModel) {
    setEditing(model);
    setForm({ name: model.name, brandId: String(model.brandId) });
    setFormError("");
    setShowForm(true);
  }

  async function submit() {
    setSubmitting(true);
    setFormError("");
    try {
      const payload = { name: form.name.trim(), brandId: Number(form.brandId) };
      if (editing) await carModelService.update(editing.id, payload);
      else await carModelService.create(payload);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(errorMessage(err, "Enregistrement impossible"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(model: CarModel) {
    if (!window.confirm(`Supprimer le modèle « ${model.name} » ?`)) return;
    try {
      await carModelService.remove(model.id);
      load();
    } catch (err) {
      setListError(errorMessage(err, "Suppression impossible"));
    }
  }

  return (
    <section>
      <div className="d-flex justify-content-end mb-3">
        <Button onClick={openCreate} disabled={status !== "ready"}>
          Ajouter un modèle
        </Button>
      </div>

      {status === "loading" && (
        <Spinner animation="border" role="status" aria-label="Chargement" />
      )}
      {status === "error" && <ErrorAlert message={listError} />}

      {status === "ready" && (
        <>
          <ErrorAlert message={listError} />
          {models.length === 0 ? (
            <Alert variant="info">Aucun modèle enregistré.</Alert>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Marque</th>
                  <th>Modèle</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.id}>
                    <td>{model.id}</td>
                    <td>{model.brand?.name ?? model.brandId}</td>
                    <td>{model.name}</td>
                    <td className="text-end text-nowrap">
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        className="me-2"
                        onClick={() => openEdit(model)}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDelete(model)}
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
        title={editing ? "Modifier le modèle" : "Nouveau modèle"}
        error={formError}
        submitting={submitting}
        onSubmit={submit}
        onHide={() => setShowForm(false)}
      >
        <Form.Group className="mb-3" controlId="model-brand">
          <Form.Label>Marque</Form.Label>
          <Form.Select
            value={form.brandId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                brandId: event.target.value,
              }))
            }
            required
          >
            <option value="">Sélectionner une marque</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group controlId="model-name">
          <Form.Label>Nom du modèle</Form.Label>
          <Form.Control
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            required
            autoFocus
          />
        </Form.Group>
      </AdminFormModal>
    </section>
  );
}
