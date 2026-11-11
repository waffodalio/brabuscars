"use client";

import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Row from "react-bootstrap/Row";
import { brandService } from "@/services/brandService";
import { carModelService } from "@/services/carModelService";
import type { Brand } from "@/types/brand";
import type { CarModel } from "@/types/carModel";
import { errorMessage } from "@/utils/errors";

const NEW = "__new__";
const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "fr");

/**
 * Brand, then model, from the catalogue — with « + Nouvelle marque » /
 * « + Nouveau modèle » right there when the car's one is missing, so the
 * entry never has to be interrupted to visit the catalogue pages.
 */
export function CatalogModelField({
  models,
  modelId,
  onModelId,
  onModelsChange,
}: {
  models: CarModel[];
  modelId: string;
  onModelId: (modelId: string) => void;
  onModelsChange: (models: CarModel[]) => void;
}) {
  const [brands, setBrands] = useState<Brand[]>([]);
  /** Brand picked before its model (or with no model yet). */
  const [pickedBrand, setPickedBrand] = useState("");
  const [adding, setAdding] = useState<"brand" | "model" | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    brandService
      .list()
      .then((list) => setBrands([...list].sort(byName)))
      .catch(() => setBrands([]));
  }, []);

  const current = models.find((model) => String(model.id) === modelId);
  const brandId = current ? String(current.brandId) : pickedBrand;
  const brandModels = models.filter((model) => String(model.brandId) === brandId).sort(byName);

  function startAdding(kind: "brand" | "model") {
    setAdding(kind);
    setName("");
    setError("");
  }

  async function add() {
    const value = name.trim();
    if (!value) return;
    setBusy(true);
    setError("");
    try {
      if (adding === "brand") {
        const brand = await brandService.create({ name: value });
        setBrands((list) => [...list, brand].sort(byName));
        setPickedBrand(String(brand.id));
        onModelId("");
        // Straight on to its first model.
        setAdding("model");
        setName("");
      } else {
        const created = await carModelService.create({ name: value, brandId: Number(brandId) });
        const brand = brands.find((item) => String(item.id) === brandId);
        onModelsChange([...models, { ...created, brand: created.brand ?? brand }]);
        onModelId(String(created.id));
        setAdding(null);
      }
    } catch (err) {
      setError(errorMessage(err, "Ajout impossible"));
    } finally {
      setBusy(false);
    }
  }

  const adder = (label: string, placeholder: string) => (
    <div className="chc-catalog-add">
      <Form.Label className="small fw-semibold mb-1">{label}</Form.Label>
      <InputGroup size="sm">
        <Form.Control
          autoFocus
          value={name}
          maxLength={100}
          placeholder={placeholder}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void add();
            }
            if (event.key === "Escape") setAdding(null);
          }}
        />
        <Button onClick={() => void add()} disabled={busy || !name.trim()}>
          Ajouter
        </Button>
        <Button variant="outline-secondary" onClick={() => setAdding(null)}>
          Annuler
        </Button>
      </InputGroup>
      {error && <div className="small text-danger mt-1">{error}</div>}
    </div>
  );

  return (
    <>
      <Row className="g-3">
        <Col sm={6}>
          <Form.Group controlId="catalog-brand">
            <Form.Label>Marque</Form.Label>
            <Form.Select
              value={brandId}
              required
              onChange={(event) => {
                if (event.target.value === NEW) return startAdding("brand");
                setPickedBrand(event.target.value);
                onModelId("");
                setAdding(null);
              }}
            >
              <option value="">Choisir…</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
              <option value={NEW}>+ Nouvelle marque…</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col sm={6}>
          <Form.Group controlId="catalog-model">
            <Form.Label>Modèle</Form.Label>
            <Form.Select
              value={modelId}
              required
              disabled={!brandId}
              onChange={(event) => {
                if (event.target.value === NEW) return startAdding("model");
                onModelId(event.target.value);
                setAdding(null);
              }}
            >
              <option value="">{brandId ? "Choisir…" : "Choisissez d'abord la marque"}</option>
              {brandModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
              {brandId && <option value={NEW}>+ Nouveau modèle…</option>}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      {adding === "brand" && adder("Nouvelle marque", "Ex. : Škoda")}
      {adding === "model" &&
        adder(`Nouveau modèle ${brands.find((brand) => String(brand.id) === brandId)?.name ?? ""}`, "Ex. : Octavia")}
    </>
  );
}
