"use client";

import { useState, type FormEvent } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { ErrorAlert } from "@/components/ErrorAlert";
import { CatalogModelField } from "@/components/admin/CatalogModelField";
import { EquipmentFields } from "@/components/admin/EquipmentFields";
import { PhotoPicker } from "@/components/admin/PhotoPicker";
import type { Equipment, EuroNorm } from "@/types/listingDetails";
import type { CarModel } from "@/types/carModel";
import {
  ENTRY_SOURCES,
  OPEN_STOCK_STATUSES,
  type EntrySource,
  type OpenStockStatus,
  type StockVehicle,
  type StockVehicleInput,
} from "@/types/stock";
import { FUEL_TYPES, TRANSMISSIONS, type FuelType, type Transmission } from "@/types/vehicle";
import { errorMessage } from "@/utils/errors";
import { todayIso } from "@/utils/saleLabels";
import { ENTRY_SOURCE_LABELS, STOCK_STATUS_LABELS } from "@/utils/stockLabels";
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "@/utils/vehicleLabels";

/** Form state: numbers kept as typed text until submitted. */
interface StockForm {
  modelId: string;
  status: OpenStockStatus;
  version: string;
  vin: string;
  year: string;
  firstRegistration: string;
  mileage: string;
  fuelType: FuelType;
  transmission: Transmission;
  power: string;
  doors: string;
  color: string;
  equipment: Equipment[];
  euroNorm: EuroNorm | "";
  co2: string;
  hasCarPass: boolean;
  entryDate: string;
  entrySource: EntrySource;
  supplier: string;
  purchasePrice: string;
  targetPrice: string;
  location: string;
  notes: string;
}

const text = (value: string | number | null | undefined) => (value === null || value === undefined ? "" : String(value));

function formOf(vehicle?: StockVehicle): StockForm {
  return {
    modelId: text(vehicle?.modelId),
    status: vehicle && (OPEN_STOCK_STATUSES as readonly string[]).includes(vehicle.status) ? (vehicle.status as OpenStockStatus) : "in_stock",
    version: text(vehicle?.version),
    vin: text(vehicle?.vin),
    year: text(vehicle?.year),
    firstRegistration: text(vehicle?.firstRegistration),
    mileage: text(vehicle?.mileage),
    fuelType: vehicle?.fuelType ?? "diesel",
    transmission: vehicle?.transmission ?? "manual",
    power: text(vehicle?.power),
    doors: text(vehicle?.doors),
    color: text(vehicle?.color),
    equipment: vehicle?.equipment ?? [],
    euroNorm: vehicle?.euroNorm ?? "",
    co2: text(vehicle?.co2),
    hasCarPass: vehicle?.hasCarPass ?? false,
    entryDate: vehicle?.entryDate ?? todayIso(),
    entrySource: vehicle?.entrySource ?? "purchase",
    supplier: text(vehicle?.supplier),
    purchasePrice: text(vehicle?.purchasePrice),
    targetPrice: text(vehicle?.targetPrice),
    location: text(vehicle?.location),
    notes: text(vehicle?.notes),
  };
}

/** "24 990,50" or "24990.5" → 24990.5; blank → null; NaN when not a number. */
const amount = (value: string): number | null => {
  const trimmed = value.replace(/\s/g, "").replace(",", ".");
  return trimmed === "" ? null : Number(trimmed);
};
const integer = (value: string): number | null => (value.trim() === "" ? null : Number(value));

/** The string form → the API payload, or a readable error. */
export function toStockPayload(form: StockForm, listingId: number | null): StockVehicleInput {
  if (!form.modelId) throw new Error("Choisissez le modèle (catalogue).");
  const year = Number(form.year);
  if (!Number.isInteger(year) || year < 1900) throw new Error("Renseignez une année valide.");
  const mileage = integer(form.mileage);
  if (mileage === null || !Number.isInteger(mileage) || mileage < 0) throw new Error("Renseignez le kilométrage.");
  const purchasePrice = amount(form.purchasePrice);
  const targetPrice = amount(form.targetPrice);
  for (const price of [purchasePrice, targetPrice]) {
    if (price !== null && (!Number.isFinite(price) || price < 0)) throw new Error("Les prix doivent être des montants positifs.");
  }
  if (form.vin.trim() && form.vin.trim().length !== 17) throw new Error("Un VIN compte 17 caractères.");
  const co2 = integer(form.co2);
  if (co2 !== null && (!Number.isInteger(co2) || co2 < 0 || co2 > 999)) {
    throw new Error("Le CO₂ doit être un nombre entier entre 0 et 999 g/km.");
  }
  const clean = (value: string) => value.trim() || null;
  return {
    modelId: Number(form.modelId),
    listingId,
    status: form.status,
    version: clean(form.version),
    vin: clean(form.vin)?.toUpperCase() ?? null,
    year,
    firstRegistration: clean(form.firstRegistration),
    mileage,
    fuelType: form.fuelType,
    transmission: form.transmission,
    power: integer(form.power),
    doors: integer(form.doors),
    color: clean(form.color),
    equipment: form.equipment,
    euroNorm: form.euroNorm || null,
    co2,
    hasCarPass: form.hasCarPass,
    entryDate: form.entryDate,
    entrySource: form.entrySource,
    supplier: clean(form.supplier),
    purchasePrice,
    targetPrice,
    location: clean(form.location),
    notes: clean(form.notes),
  };
}

/**
 * Enter / edit a garage-register car: the model comes from the catalogue
 * (brand checked), then identification, technical data, entry and prices.
 */
export function StockVehicleForm({
  models: initialModels,
  initial,
  submitLabel,
  offerListing = false,
  onSubmit,
}: {
  models: CarModel[];
  initial?: StockVehicle;
  submitLabel: string;
  /** New car: offer to go straight on to its listing, and ask for its photos. */
  offerListing?: boolean;
  onSubmit: (input: StockVehicleInput, thenListing: boolean, photos: File[]) => Promise<void>;
}) {
  const [form, setForm] = useState<StockForm>(() => formOf(initial));
  /** Catalogue, plus the brands / models added from this form. */
  const [models, setModels] = useState<CarModel[]>(initialModels);
  const [thenListing, setThenListing] = useState(offerListing);
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set =
    <K extends keyof StockForm>(field: K) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value as StockForm[K] }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    let payload: StockVehicleInput;
    try {
      payload = toStockPayload(form, initial?.listing?.id ?? null);
    } catch (err) {
      setError(errorMessage(err, "Formulaire incomplet"));
      return;
    }
    if (offerListing && thenListing && photos.length === 0) {
      setError("Ajoutez au moins une photo pour mettre le véhicule en vente (ou décochez « Mettre en vente ensuite »).");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(payload, offerListing && thenListing, photos);
    } catch (err) {
      setError(errorMessage(err, "Enregistrement impossible"));
      setSubmitting(false);
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <ErrorAlert message={error} />

      <Card className="mb-4">
        <Card.Body className="p-3 p-md-4">
          <h2 className="h6 mb-4">Identification</h2>
          <Row className="g-4">
            <Col xs={12}>
              <CatalogModelField
                models={models}
                modelId={form.modelId}
                onModelId={(modelId) => setForm((current) => ({ ...current, modelId }))}
                onModelsChange={setModels}
              />
            </Col>
            <Col md={6}>
              <Form.Group controlId="stock-version">
                <Form.Label>Version / motorisation</Form.Label>
                <Form.Control value={form.version} onChange={set("version")} maxLength={150} placeholder="2.0 TDI S line" />
              </Form.Group>
            </Col>
            <Col sm={7} md={8}>
              <Form.Group controlId="stock-vin">
                <Form.Label>N° de châssis (VIN)</Form.Label>
                <Form.Control value={form.vin} onChange={set("vin")} maxLength={17} className="font-monospace" />
              </Form.Group>
            </Col>
            <Col sm={5} md={4}>
              <Form.Group controlId="stock-status">
                <Form.Label>Statut</Form.Label>
                <Form.Select value={form.status} onChange={set("status")}>
                  {OPEN_STOCK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STOCK_STATUS_LABELS[status]}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {offerListing && (
        <Card className="mb-4">
          <Card.Body className="p-3 p-md-4">
            <h2 className="h6 mb-1">Photos du véhicule</h2>
            <p className="small text-secondary mb-3">Prises à l&apos;arrivée au garage : elles serviront pour l&apos;annonce.</p>
            <PhotoPicker files={photos} onChange={setPhotos} />
          </Card.Body>
        </Card>
      )}

      <Card className="mb-4">
        <Card.Body className="p-3 p-md-4">
          <h2 className="h6 mb-4">Caractéristiques</h2>
          <Row className="g-4">
            <Col xs={6} md={3}>
              <Form.Group controlId="stock-year">
                <Form.Label>Année</Form.Label>
                <Form.Control type="number" value={form.year} onChange={set("year")} required />
              </Form.Group>
            </Col>
            <Col xs={6} md={3}>
              <Form.Group controlId="stock-first-registration">
                <Form.Label>1re immatriculation</Form.Label>
                <Form.Control type="date" value={form.firstRegistration} onChange={set("firstRegistration")} />
              </Form.Group>
            </Col>
            <Col xs={6} md={3}>
              <Form.Group controlId="stock-mileage">
                <Form.Label>Km à l&apos;entrée</Form.Label>
                <Form.Control type="number" min={0} value={form.mileage} onChange={set("mileage")} required />
              </Form.Group>
            </Col>
            <Col xs={6} md={3}>
              <Form.Group controlId="stock-power">
                <Form.Label>Puissance (ch)</Form.Label>
                <Form.Control type="number" min={1} value={form.power} onChange={set("power")} />
              </Form.Group>
            </Col>
            <Col xs={6} md={3}>
              <Form.Group controlId="stock-fuel">
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
            <Col xs={6} md={3}>
              <Form.Group controlId="stock-transmission">
                <Form.Label>Boîte</Form.Label>
                <Form.Select value={form.transmission} onChange={set("transmission")}>
                  {TRANSMISSIONS.map((value) => (
                    <option key={value} value={value}>
                      {TRANSMISSION_LABELS[value]}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={6} md={3}>
              <Form.Group controlId="stock-doors">
                <Form.Label>Portes</Form.Label>
                <Form.Control type="number" min={1} max={9} value={form.doors} onChange={set("doors")} />
              </Form.Group>
            </Col>
            <Col xs={6} md={3}>
              <Form.Group controlId="stock-color">
                <Form.Label>Couleur</Form.Label>
                <Form.Control value={form.color} onChange={set("color")} maxLength={50} />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body className="p-3 p-md-4 chc-form-first-section">
          <EquipmentFields
            idPrefix="stock"
            equipment={form.equipment}
            euroNorm={form.euroNorm}
            co2={form.co2}
            hasCarPass={form.hasCarPass}
            onEquipment={(equipment) => setForm((current) => ({ ...current, equipment }))}
            onEuroNorm={(euroNorm) => setForm((current) => ({ ...current, euroNorm }))}
            onCo2={(co2) => setForm((current) => ({ ...current, co2 }))}
            onCarPass={(hasCarPass) => setForm((current) => ({ ...current, hasCarPass }))}
          />
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body className="p-3 p-md-4">
          <h2 className="h6 mb-4">Entrée au garage et prix</h2>
          <Row className="g-4">
            <Col xs={6} md={3}>
              <Form.Group controlId="stock-entry-date">
                <Form.Label>Date d&apos;entrée</Form.Label>
                <Form.Control type="date" value={form.entryDate} onChange={set("entryDate")} required />
              </Form.Group>
            </Col>
            <Col xs={6} md={3}>
              <Form.Group controlId="stock-entry-source">
                <Form.Label>Origine</Form.Label>
                <Form.Select value={form.entrySource} onChange={set("entrySource")}>
                  {ENTRY_SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {ENTRY_SOURCE_LABELS[source]}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="stock-supplier">
                <Form.Label>{form.entrySource === "consignment" ? "Propriétaire" : "Fournisseur / vendeur"}</Form.Label>
                <Form.Control value={form.supplier} onChange={set("supplier")} maxLength={150} />
              </Form.Group>
            </Col>
            <Col xs={6} md={3}>
              <Form.Group controlId="stock-purchase-price">
                <Form.Label>Prix d&apos;achat (€)</Form.Label>
                <Form.Control inputMode="decimal" value={form.purchasePrice} onChange={set("purchasePrice")} />
              </Form.Group>
            </Col>
            <Col xs={6} md={3}>
              <Form.Group controlId="stock-target-price">
                <Form.Label>Prix de vente visé (€)</Form.Label>
                <Form.Control inputMode="decimal" value={form.targetPrice} onChange={set("targetPrice")} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="stock-location">
                <Form.Label>Emplacement</Form.Label>
                <Form.Control value={form.location} onChange={set("location")} maxLength={100} placeholder="Parc A, atelier, carrossier…" />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group controlId="stock-notes">
                <Form.Label>Notes internes</Form.Label>
                <Form.Control as="textarea" rows={3} value={form.notes} onChange={set("notes")} maxLength={5000} />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="d-flex flex-wrap justify-content-end align-items-center gap-3">
        {offerListing && (
          <Form.Check
            type="switch"
            id="stock-then-listing"
            label="Mettre en vente ensuite (créer l'annonce)"
            checked={thenListing}
            onChange={(event) => setThenListing(event.target.checked)}
          />
        )}
        <Button type="submit" size="lg" className="px-4" disabled={submitting}>
          {submitting ? "Enregistrement…" : thenListing && offerListing ? `${submitLabel} et créer l'annonce` : submitLabel}
        </Button>
      </div>
    </Form>
  );
}
