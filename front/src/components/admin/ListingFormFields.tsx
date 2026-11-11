"use client";

import { useState, type ChangeEvent } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import type { CarModel } from "@/types/carModel";
import type { Category } from "@/types/category";
import { fr } from "@/i18n/dictionaries";
import { Chip, EquipmentFields, toggled } from "@/components/admin/EquipmentFields";
import type { CreateListingInput } from "@/types/listing";
import {
  WARRANTY_COVERAGE,
  WARRANTY_KINDS,
  WARRANTY_PRESETS,
  type Equipment,
  type EuroNorm,
  type WarrantyCoverage,
  type WarrantyKind,
} from "@/types/listingDetails";
import { FUEL_TYPES, TRANSMISSIONS } from "@/types/vehicle";
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "@/utils/vehicleLabels";

/** Listing fields as the admin forms keep them (numbers as typed text). */
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
  equipment: Equipment[];
  euroNorm: EuroNorm | "";
  co2: string;
  hasCarPass: boolean;
  /** Sold with a warranty: the fields below apply only then. */
  warranty: boolean;
  warrantyMonths: string;
  warrantyKind: WarrantyKind;
  warrantyCoverage: WarrantyCoverage[];
  /** Own covered parts (« Embrayage »…). */
  warrantyCustom: string[];
  warrantyNotes: string;
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
  equipment: [],
  euroNorm: "",
  co2: "",
  hasCarPass: false,
  warranty: false,
  warrantyMonths: "12",
  warrantyKind: "dealer",
  warrantyCoverage: [],
  warrantyCustom: [],
  warrantyNotes: "",
};

/** Quick picks for the covered parts. */
const COVERAGE_PRESETS: {
  label: string;
  parts: readonly WarrantyCoverage[];
}[] = [
  {
    label: "Essentiel (moteur, boîte, transmission)",
    parts: ["engine", "gearbox", "drivetrain"],
  },
  {
    label: "Mécanique",
    parts: [
      "engine",
      "gearbox",
      "drivetrain",
      "turbo",
      "fuelSystem",
      "cooling",
    ],
  },
  { label: "Tout", parts: WARRANTY_COVERAGE },
];

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

  const co2 = form.co2.trim() === "" ? null : Number(form.co2);
  if (co2 !== null && (!Number.isInteger(co2) || co2 < 0 || co2 > 999)) {
    throw new Error("Le CO₂ doit être un nombre entier entre 0 et 999 g/km.");
  }
  const warrantyMonths = Number(form.warrantyMonths);
  if (
    form.warranty &&
    (!Number.isInteger(warrantyMonths) ||
      warrantyMonths < 1 ||
      warrantyMonths > 120)
  ) {
    throw new Error(
      "La durée de garantie doit être comprise entre 1 et 120 mois.",
    );
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
    equipment: form.equipment,
    euroNorm: form.euroNorm || null,
    co2,
    hasCarPass: form.hasCarPass,
    // No warranty: the API drops the type, covered parts and conditions.
    warrantyMonths: form.warranty ? warrantyMonths : null,
    warrantyKind: form.warranty ? form.warrantyKind : null,
    warrantyCoverage: form.warranty ? form.warrantyCoverage : [],
    warrantyCustom: form.warranty ? form.warrantyCustom : [],
    warrantyNotes: form.warranty ? form.warrantyNotes.trim() || null : null,
  };
}


/** « + Autre élément » : adds an own covered part (Enter or the button). */
function CustomCoverageInput({ existing, onAdd }: { existing: string[]; onAdd: (label: string) => void }) {
  const [value, setValue] = useState("");
  const label = value.trim();
  const duplicate = existing.some((item) => item.toLowerCase() === label.toLowerCase());
  const add = () => {
    if (!label || duplicate || existing.length >= 15) return;
    onAdd(label);
    setValue("");
  };
  return (
    <div className="chc-custom-coverage mb-4">
      <InputGroup size="sm">
        <Form.Control
          value={value}
          maxLength={60}
          placeholder="+ Autre élément couvert (ex. : Embrayage, boîte de transfert 4×4…)"
          aria-label="Autre élément couvert"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <Button variant="outline-primary" onClick={add} disabled={!label || duplicate || existing.length >= 15}>
          Ajouter
        </Button>
      </InputGroup>
      {duplicate && <div className="small text-secondary mt-1">Déjà dans la liste.</div>}
    </div>
  );
}

interface Props {
  form: ListingFormState;
  models: CarModel[];
  categories: Category[];
  onChange: <K extends keyof ListingFormState>(
    field: K,
    value: ListingFormState[K],
  ) => void;
  /**
   * Listing of a garage-register car: model, year, mileage, fuel, gearbox,
   * power, doors and colour come from the car (kept in sync by the API) and
   * are not typed here.
   */
  lockTechnical?: boolean;
}

/** Shared field set for the "create" and "edit" listing forms. */
export function ListingFormFields({
  form,
  models,
  categories,
  onChange,
  lockTechnical = false,
}: Props) {
  const set =
    (
      field:
        | "modelId"
        | "categoryId"
        | "title"
        | "description"
        | "price"
        | "year"
        | "mileage"
        | "fuelType"
        | "transmission"
        | "power"
        | "doors"
        | "color"
        | "co2"
        | "warrantyMonths"
        | "warrantyNotes",
    ) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      onChange(field, event.target.value);

  return (
    <>
      <Row>
        {!lockTechnical && (
          <Col sm={7}>
            <Form.Group className="mb-4" controlId="listing-model">
              <Form.Label>Modèle</Form.Label>
              <Form.Select
                value={form.modelId}
                onChange={set("modelId")}
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
        )}
        <Col sm={lockTechnical ? 12 : 5}>
          <Form.Group className="mb-4" controlId="listing-category">
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

      <Form.Group className="mb-4" controlId="listing-title">
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
          <Form.Group className="mb-4" controlId="listing-price">
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
        {!lockTechnical && (
          <>
            <Col sm={4}>
              <Form.Group className="mb-4" controlId="listing-year">
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
              <Form.Group className="mb-4" controlId="listing-mileage">
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
          </>
        )}
      </Row>

      {!lockTechnical && (
        <>
          <Row>
            <Col sm={6}>
              <Form.Group className="mb-4" controlId="listing-fuel">
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
              <Form.Group className="mb-4" controlId="listing-transmission">
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
              <Form.Group className="mb-4" controlId="listing-power">
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
              <Form.Group className="mb-4" controlId="listing-doors">
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
              <Form.Group className="mb-4" controlId="listing-color">
                <Form.Label>Couleur</Form.Label>
                <Form.Control value={form.color} onChange={set("color")} />
              </Form.Group>
            </Col>
          </Row>
        </>
      )}

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

      {/* Options & papers: the garage-register car's when linked */}
      {!lockTechnical && (
        <EquipmentFields
          idPrefix="listing"
          equipment={form.equipment}
          euroNorm={form.euroNorm}
          co2={form.co2}
          hasCarPass={form.hasCarPass}
          onEquipment={(value) => onChange("equipment", value)}
          onEuroNorm={(value) => onChange("euroNorm", value)}
          onCo2={(value) => onChange("co2", value)}
          onCarPass={(value) => onChange("hasCarPass", value)}
        />
      )}

      {/* Warranty */}
      <section className="chc-form-section">
        <h3 className="chc-form-section-title">Garantie</h3>
        <div className="chc-warranty-choice" role="radiogroup" aria-label="Garantie">
          {[
            { value: false, title: "Sans garantie", hint: "Vendu en l'état." },
            { value: true, title: "Avec garantie", hint: "Durée, type et éléments couverts à choisir." },
          ].map((option) => (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              id={option.value ? "listing-warranty" : undefined}
              aria-checked={form.warranty === option.value}
              className={`chc-warranty-kind${form.warranty === option.value ? " is-active" : ""}`}
              onClick={() => onChange("warranty", option.value)}
            >
              <strong>
                <span className="chc-warranty-radio" aria-hidden="true" />
                {option.title}
              </strong>
              <span>{option.hint}</span>
            </button>
          ))}
        </div>

        {form.warranty && (
          <div className="chc-warranty-panel">
            <Form.Label className="d-block">Durée</Form.Label>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
              {WARRANTY_PRESETS.map((months) => (
                <Chip
                  key={months}
                  active={form.warrantyMonths === String(months)}
                  onClick={() => onChange("warrantyMonths", String(months))}
                >
                  {months} mois
                </Chip>
              ))}
              <Form.Control
                type="number"
                min={1}
                max={120}
                className="chc-warranty-months"
                aria-label="Autre durée, en mois"
                placeholder="Autre"
                value={
                  WARRANTY_PRESETS.some(
                    (months) => String(months) === form.warrantyMonths,
                  )
                    ? ""
                    : form.warrantyMonths
                }
                onChange={set("warrantyMonths")}
              />
              <span className="small text-secondary">mois</span>
            </div>

            <Form.Label className="d-block">Type</Form.Label>
            <div
              className="chc-warranty-kinds mb-4"
              role="radiogroup"
              aria-label="Type de garantie"
            >
              {WARRANTY_KINDS.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  role="radio"
                  aria-checked={form.warrantyKind === kind}
                  className={`chc-warranty-kind${form.warrantyKind === kind ? " is-active" : ""}`}
                  onClick={() => onChange("warrantyKind", kind)}
                >
                  <strong>{fr.details.warrantyKinds[kind]}</strong>
                  <span>
                    {kind === "dealer"
                      ? "Assurée par la concession."
                      : "Reste de la garantie d'origine du fabricant."}
                  </span>
                </button>
              ))}
            </div>

            <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-2">
              <Form.Label className="mb-0">
                Éléments couverts{" "}
                <span className="text-secondary small">
                  ({form.warrantyCoverage.length + form.warrantyCustom.length}{" "}
                  sélectionné{form.warrantyCoverage.length + form.warrantyCustom.length > 1 ? "s" : ""})
                </span>
              </Form.Label>
              <div className="d-flex flex-wrap gap-1">
                {COVERAGE_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    size="sm"
                    variant="outline-secondary"
                    className="chc-preset-btn"
                    onClick={() =>
                      onChange("warrantyCoverage", [...preset.parts])
                    }
                  >
                    {preset.label}
                  </Button>
                ))}
                {form.warrantyCoverage.length > 0 && (
                  <Button
                    size="sm"
                    variant="link"
                    className="chc-preset-btn"
                    onClick={() => onChange("warrantyCoverage", [])}
                  >
                    Effacer
                  </Button>
                )}
              </div>
            </div>
            <div className="chc-chips mb-4">
              {WARRANTY_COVERAGE.map((part) => (
                <Chip
                  key={part}
                  active={form.warrantyCoverage.includes(part)}
                  onClick={() =>
                    onChange(
                      "warrantyCoverage",
                      toggled(form.warrantyCoverage, part),
                    )
                  }
                >
                  {fr.details.coverage[part]}
                </Chip>
              ))}
              {/* Own items: always ticked, removed with × */}
              {form.warrantyCustom.map((label) => (
                <span key={label} className="chc-chip is-active">
                  <span className="chc-chip-check" aria-hidden="true">
                    ✓
                  </span>
                  {label}
                  <button
                    type="button"
                    className="chc-chip-remove"
                    aria-label={`Retirer « ${label} »`}
                    onClick={() =>
                      onChange(
                        "warrantyCustom",
                        form.warrantyCustom.filter((item) => item !== label),
                      )
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <CustomCoverageInput
              existing={form.warrantyCustom}
              onAdd={(label) => onChange("warrantyCustom", [...form.warrantyCustom, label])}
            />

            <Form.Group controlId="listing-warranty-notes">
              <Form.Label>Conditions (facultatif)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                maxLength={500}
                value={form.warrantyNotes}
                onChange={set("warrantyNotes")}
                placeholder="Ex. : jusqu'à 150 000 km, entretien à la concession, hors pièces d'usure."
              />
            </Form.Group>
          </div>
        )}
      </section>
    </>
  );
}
