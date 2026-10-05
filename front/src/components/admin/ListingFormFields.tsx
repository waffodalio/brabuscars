"use client";

import type { ChangeEvent } from "react";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import type { CarModel } from "@/types/carModel";
import type { Category } from "@/types/category";
import type { CreateListingInput } from "@/types/listing";
import { FUEL_TYPES, TRANSMISSIONS } from "@/types/vehicle";
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "@/utils/vehicleLabels";

/** Every listing field as a string, the shape the admin forms keep in state. */
export interface ListingFormState {
  modelId: string;
  categoryId: string;
  title: string;
  description: string;
  price: string;
  year: string;
  mileage: string;
  fuelType: string;
  transmission: string;
  power: string;
  doors: string;
  color: string;
}

export const EMPTY_LISTING_FORM: ListingFormState = {
  modelId: "",
  categoryId: "",
  title: "",
  description: "",
  price: "",
  year: "",
  mileage: "",
  fuelType: "petrol",
  transmission: "manual",
  power: "",
  doors: "",
  color: "",
};

/** Turn the string form into the API payload (or throw a readable error). */
export function toListingPayload(form: ListingFormState): CreateListingInput {
  const modelId = Number(form.modelId);
  if (!modelId) throw new Error("Sélectionnez un modèle.");
  const price = Number(form.price);
  if (!(price > 0)) throw new Error("Le prix doit être supérieur à 0.");
  const year = Number(form.year);
  if (!year) throw new Error("Renseignez l'année.");
  // `Number("")` is 0, not NaN, so a blank field must be rejected explicitly
  // — otherwise it would silently submit as "0 km" instead of prompting.
  if (form.mileage.trim() === "") {
    throw new Error("Renseignez le kilométrage.");
  }
  const mileage = Number(form.mileage);
  if (Number.isNaN(mileage) || mileage < 0) {
    throw new Error("Le kilométrage doit être un nombre positif.");
  }

  return {
    modelId,
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    title: form.title.trim(),
    description: form.description.trim() || null,
    price,
    year,
    mileage,
    fuelType: form.fuelType as CreateListingInput["fuelType"],
    transmission: form.transmission as CreateListingInput["transmission"],
    power: form.power ? Number(form.power) : null,
    doors: form.doors ? Number(form.doors) : null,
    color: form.color.trim() || null,
  };
}

interface Props {
  form: ListingFormState;
  models: CarModel[];
  categories: Category[];
  onChange: (field: keyof ListingFormState, value: string) => void;
}

/** Shared field set for the "create" and "edit" listing forms. */
export function ListingFormFields({
  form,
  models,
  categories,
  onChange,
}: Props) {
  const set =
    (field: keyof ListingFormState) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      onChange(field, event.target.value);

  return (
    <>
      <Row>
        <Col sm={7}>
          <Form.Group className="mb-3" controlId="listing-model">
            <Form.Label>Modèle</Form.Label>
            <Form.Select value={form.modelId} onChange={set("modelId")} required>
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
          <Form.Group className="mb-3" controlId="listing-category">
            <Form.Label>Catégorie</Form.Label>
            <Form.Select value={form.categoryId} onChange={set("categoryId")}>
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

      <Form.Group className="mb-3" controlId="listing-title">
        <Form.Label>Titre de l&apos;annonce</Form.Label>
        <Form.Control
          value={form.title}
          onChange={set("title")}
          required
          maxLength={150}
          placeholder="Peugeot 308 GT Line 1.5 BlueHDi"
        />
      </Form.Group>

      <Row>
        <Col sm={4}>
          <Form.Group className="mb-3" controlId="listing-price">
            <Form.Label>Prix (€)</Form.Label>
            <Form.Control
              type="number"
              min={1}
              step="0.01"
              value={form.price}
              onChange={set("price")}
              required
            />
          </Form.Group>
        </Col>
        <Col sm={4}>
          <Form.Group className="mb-3" controlId="listing-year">
            <Form.Label>Année</Form.Label>
            <Form.Control
              type="number"
              value={form.year}
              onChange={set("year")}
              required
            />
          </Form.Group>
        </Col>
        <Col sm={4}>
          <Form.Group className="mb-3" controlId="listing-mileage">
            <Form.Label>Kilométrage</Form.Label>
            <Form.Control
              type="number"
              min={0}
              value={form.mileage}
              onChange={set("mileage")}
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col sm={6}>
          <Form.Group className="mb-3" controlId="listing-fuel">
            <Form.Label>Carburant</Form.Label>
            <Form.Select value={form.fuelType} onChange={set("fuelType")}>
              {FUEL_TYPES.map((value) => (
                <option key={value} value={value}>
                  {FUEL_TYPE_LABELS[value]}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col sm={6}>
          <Form.Group className="mb-3" controlId="listing-transmission">
            <Form.Label>Boîte</Form.Label>
            <Form.Select
              value={form.transmission}
              onChange={set("transmission")}
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
          <Form.Group className="mb-3" controlId="listing-power">
            <Form.Label>Puissance (ch)</Form.Label>
            <Form.Control
              type="number"
              min={1}
              value={form.power}
              onChange={set("power")}
            />
          </Form.Group>
        </Col>
        <Col sm={4}>
          <Form.Group className="mb-3" controlId="listing-doors">
            <Form.Label>Portes</Form.Label>
            <Form.Control
              type="number"
              min={1}
              max={9}
              value={form.doors}
              onChange={set("doors")}
            />
          </Form.Group>
        </Col>
        <Col sm={4}>
          <Form.Group className="mb-3" controlId="listing-color">
            <Form.Label>Couleur</Form.Label>
            <Form.Control value={form.color} onChange={set("color")} />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group controlId="listing-description">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          value={form.description}
          onChange={(event) => onChange("description", event.target.value)}
          maxLength={5000}
        />
      </Form.Group>
    </>
  );
}
