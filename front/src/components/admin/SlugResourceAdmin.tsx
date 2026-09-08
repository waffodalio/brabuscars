"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { AdminFormModal } from "@/components/admin/AdminFormModal";

interface SlugRow {
  id: number;
  name: string;
  slug: string;
}

interface SlugInput {
  name: string;
  slug?: string;
}

interface SlugResourceAdminProps<T extends SlugRow> {
  /** Singular label, e.g. "marque". */
  singular: string;
  fetchAll: () => Promise<T[]>;
  create: (input: SlugInput) => Promise<T>;
  update: (id: number, input: Partial<SlugInput>) => Promise<T>;
  remove: (id: number) => Promise<void>;
}

/** CRUD screen for a simple reference resource shaped as { id, name, slug }. */
export function SlugResourceAdmin<T extends SlugRow>({
  singular,
  fetchAll,
  create,
  update,
  remove,
}: SlugResourceAdminProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [listError, setListError] = useState("");

  const [editing, setEditing] = useState<T | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setStatus("loading");
    fetchAll()
      .then((data) => {
        setRows(data);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        setListError(err instanceof Error ? err.message : "Erreur inconnue");
        setStatus("error");
      });
  }, [fetchAll]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", slug: "" });
    setFormError("");
    setShowForm(true);
  }

  function openEdit(row: T) {
    setEditing(row);
    setForm({ name: row.name, slug: row.slug });
    setFormError("");
    setShowForm(true);
  }

  async function submit() {
    setSubmitting(true);
    setFormError("");
    const payload: SlugInput = { name: form.name.trim() };
    if (form.slug.trim()) payload.slug = form.slug.trim();

    try {
      if (editing) await update(editing.id, payload);
      else await create(payload);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(row: T) {
    if (!window.confirm(`Supprimer « ${row.name} » ?`)) return;
    try {
      await remove(row.id);
      load();
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Suppression impossible");
    }
  }

  return (
    <section>
      <div className="d-flex justify-content-end mb-3">
        <Button onClick={openCreate}>Ajouter une {singular}</Button>
      </div>

      {status === "loading" && (
        <Spinner animation="border" role="status" aria-label="Chargement" />
      )}
      {status === "error" && <Alert variant="danger">{listError}</Alert>}

      {status === "ready" && (
        <>
          {listError && <Alert variant="danger">{listError}</Alert>}
          {rows.length === 0 ? (
            <Alert variant="info">Aucune {singular} enregistrée.</Alert>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nom</th>
                  <th>Slug</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.name}</td>
                    <td>
                      <code>{row.slug}</code>
                    </td>
                    <td className="text-end text-nowrap">
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        className="me-2"
                        onClick={() => openEdit(row)}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDelete(row)}
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
        title={
          editing
            ? `Modifier la ${singular}`
            : `Nouvelle ${singular}`
        }
        error={formError}
        submitting={submitting}
        onSubmit={submit}
        onHide={() => setShowForm(false)}
      >
        <Form.Group className="mb-3" controlId="slug-resource-name">
          <Form.Label>Nom</Form.Label>
          <Form.Control
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            required
            autoFocus
          />
        </Form.Group>
        <Form.Group controlId="slug-resource-slug">
          <Form.Label>Slug</Form.Label>
          <Form.Control
            value={form.slug}
            onChange={(event) =>
              setForm((current) => ({ ...current, slug: event.target.value }))
            }
            placeholder="généré depuis le nom si vide"
          />
          <Form.Text muted>Minuscules, chiffres et tirets.</Form.Text>
        </Form.Group>
      </AdminFormModal>
    </section>
  );
}
