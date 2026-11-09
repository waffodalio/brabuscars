"use client";

import { useEffect, useState, type FormEvent } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { ErrorAlert } from "@/components/ErrorAlert";
import { listingService } from "@/services/listingService";
import type { Listing } from "@/types/listing";
import type { SaleBuyer, SaleInput, VatRegime } from "@/types/sale";
import { errorMessage } from "@/utils/errors";
import { formatMileage } from "@/utils/listingLabels";
import { VAT_REGIME_LABELS, formatEuros } from "@/utils/saleLabels";

/** Form state: numbers kept as typed text until submitted. */
interface LineDraft {
  description: string;
  quantity: string;
  unitPrice: string;
}

const EMPTY_BUYER: SaleBuyer = {
  name: "",
  company: null,
  vatNumber: null,
  address: null,
  postalCode: null,
  city: null,
  country: "Belgique",
  email: null,
  phone: null,
};

/** "24 990,50" or "24990.5" → 24990.5 (NaN when not a number). */
const parseAmount = (text: string): number => Number(text.replace(/\s/g, "").replace(",", "."));

function lineTotal(line: LineDraft): number {
  const quantity = Number(line.quantity);
  const price = parseAmount(line.unitPrice);
  return Number.isFinite(quantity) && Number.isFinite(price) ? Math.round(quantity * price * 100) / 100 : 0;
}

/** Text of the vehicle line built from a listing. */
function vehicleLine(listing: Listing): string {
  return [listing.title, String(listing.year), formatMileage(listing.mileage)].join(" — ");
}

/**
 * Sale file form (create, or edit while still a draft): optional listing to
 * prefill the vehicle line, VAT regime, buyer typed in by hand, VIN, lines
 * (VAT included) and notes.
 */
export function SaleForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: SaleInput;
  submitLabel: string;
  onSubmit: (input: SaleInput) => Promise<void>;
}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingId, setListingId] = useState<number | null>(initial?.listingId ?? null);
  const [vatRegime, setVatRegime] = useState<VatRegime>(initial?.vatRegime ?? "margin");
  const [buyer, setBuyer] = useState<SaleBuyer>(initial?.buyer ?? EMPTY_BUYER);
  const [vin, setVin] = useState(initial?.vehicleVin ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [lines, setLines] = useState<LineDraft[]>(
    initial?.lines.map((line) => ({
      description: line.description,
      quantity: String(line.quantity),
      unitPrice: String(line.unitPrice),
    })) ?? [{ description: "", quantity: "1", unitPrice: "" }],
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listingService
      .list()
      .then(setListings)
      .catch(() => setListings([]));
  }, []);

  // A sold listing is offered only when it is the one already linked.
  const choices = listings.filter((listing) => listing.status !== "sold" || listing.id === listingId);
  const total = lines.reduce((sum, line) => sum + lineTotal(line), 0);

  function chooseListing(value: string) {
    const id = value ? Number(value) : null;
    setListingId(id);
    const listing = listings.find((item) => item.id === id);
    if (!listing) return;
    // Prefill the vehicle line (first line), keep the others.
    setLines((current) => [
      { description: vehicleLine(listing), quantity: "1", unitPrice: String(listing.price) },
      ...current.slice(1),
    ]);
  }

  function setBuyerField(field: keyof SaleBuyer) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setBuyer((current) => ({ ...current, [field]: event.target.value }));
  }

  function setLine(index: number, field: keyof LineDraft, value: string) {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const parsed = lines.map((line) => ({
      description: line.description.trim(),
      quantity: Number(line.quantity),
      unitPrice: parseAmount(line.unitPrice),
    }));
    if (parsed.some((line) => !line.description || !Number.isInteger(line.quantity) || line.quantity < 1 || !Number.isFinite(line.unitPrice) || line.unitPrice < 0)) {
      setError("Chaque ligne doit avoir une désignation, une quantité (≥ 1) et un prix.");
      return;
    }
    const clean = (value: string | null) => (value?.trim() ? value.trim() : null);
    setSubmitting(true);
    try {
      await onSubmit({
        vatRegime,
        listingId,
        buyer: {
          name: buyer.name.trim(),
          company: clean(buyer.company),
          vatNumber: clean(buyer.vatNumber),
          address: clean(buyer.address),
          postalCode: clean(buyer.postalCode),
          city: clean(buyer.city),
          country: clean(buyer.country),
          email: clean(buyer.email),
          phone: clean(buyer.phone),
        },
        vehicleVin: clean(vin),
        notes: clean(notes),
        lines: parsed,
      });
    } catch (err) {
      setError(errorMessage(err, "Enregistrement impossible"));
      setSubmitting(false);
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <ErrorAlert message={error} />

      <Card className="mb-3">
        <Card.Body>
          <h2 className="h6 mb-3">Véhicule & TVA</h2>
          <Row className="g-3">
            <Col md={7}>
              <Form.Group controlId="sale-listing">
                <Form.Label>Annonce (facultatif)</Form.Label>
                <Form.Select value={listingId ?? ""} onChange={(e) => chooseListing(e.target.value)}>
                  <option value="">— Aucune (saisie libre) —</option>
                  {choices.map((listing) => (
                    <option key={listing.id} value={listing.id}>
                      {listing.title} · {listing.year} · {formatEuros(listing.price)}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text muted>Préremplit la ligne du véhicule. L&apos;annonce passera « Vendue » une fois tout payé.</Form.Text>
              </Form.Group>
            </Col>
            <Col md={5}>
              <Form.Group controlId="sale-vin">
                <Form.Label>N° de châssis (VIN)</Form.Label>
                <Form.Control value={vin} onChange={(e) => setVin(e.target.value.toUpperCase())} maxLength={17} />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Label className="d-block">Régime de TVA</Form.Label>
              {(Object.keys(VAT_REGIME_LABELS) as VatRegime[]).map((regime) => (
                <Form.Check
                  key={regime}
                  inline
                  type="radio"
                  id={`sale-vat-${regime}`}
                  name="sale-vat"
                  label={VAT_REGIME_LABELS[regime]}
                  checked={vatRegime === regime}
                  onChange={() => setVatRegime(regime)}
                />
              ))}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Body>
          <h2 className="h6 mb-3">Acheteur</h2>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group controlId="sale-buyer-name">
                <Form.Label>Nom et prénom</Form.Label>
                <Form.Control value={buyer.name} onChange={setBuyerField("name")} required maxLength={150} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="sale-buyer-company">
                <Form.Label>Société (facultatif)</Form.Label>
                <Form.Control value={buyer.company ?? ""} onChange={setBuyerField("company")} maxLength={150} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="sale-buyer-address">
                <Form.Label>Adresse</Form.Label>
                <Form.Control value={buyer.address ?? ""} onChange={setBuyerField("address")} maxLength={255} />
              </Form.Group>
            </Col>
            <Col xs={4} md={2}>
              <Form.Group controlId="sale-buyer-postal">
                <Form.Label>Code postal</Form.Label>
                <Form.Control value={buyer.postalCode ?? ""} onChange={setBuyerField("postalCode")} maxLength={20} />
              </Form.Group>
            </Col>
            <Col xs={8} md={4}>
              <Form.Group controlId="sale-buyer-city">
                <Form.Label>Ville</Form.Label>
                <Form.Control value={buyer.city ?? ""} onChange={setBuyerField("city")} maxLength={100} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="sale-buyer-country">
                <Form.Label>Pays</Form.Label>
                <Form.Control value={buyer.country ?? ""} onChange={setBuyerField("country")} maxLength={100} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="sale-buyer-email">
                <Form.Label>E-mail</Form.Label>
                <Form.Control type="email" value={buyer.email ?? ""} onChange={setBuyerField("email")} maxLength={255} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="sale-buyer-phone">
                <Form.Label>Téléphone</Form.Label>
                <Form.Control type="tel" value={buyer.phone ?? ""} onChange={setBuyerField("phone")} maxLength={30} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="sale-buyer-vat">
                <Form.Label>N° de TVA (société)</Form.Label>
                <Form.Control value={buyer.vatNumber ?? ""} onChange={setBuyerField("vatNumber")} maxLength={30} />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Body>
          <h2 className="h6 mb-1">Lignes</h2>
          <p className="small text-secondary">Prix TVA comprise. La 1re ligne est le véhicule.</p>
          <div className="d-flex flex-column gap-2">
            {lines.map((line, index) => (
              <Row key={index} className="g-2 align-items-end chc-sale-line">
                <Col xs={12} md={6}>
                  <Form.Control
                    aria-label={`Désignation ligne ${index + 1}`}
                    placeholder={index === 0 ? "Véhicule" : "Frais, garantie, reprise…"}
                    value={line.description}
                    onChange={(e) => setLine(index, "description", e.target.value)}
                    maxLength={255}
                    required
                  />
                </Col>
                <Col xs={3} md={1}>
                  <Form.Control
                    aria-label={`Quantité ligne ${index + 1}`}
                    type="number"
                    min={1}
                    max={999}
                    value={line.quantity}
                    onChange={(e) => setLine(index, "quantity", e.target.value)}
                    required
                  />
                </Col>
                <Col xs={5} md={2}>
                  <Form.Control
                    aria-label={`Prix unitaire ligne ${index + 1}`}
                    inputMode="decimal"
                    placeholder="Prix TVAC"
                    value={line.unitPrice}
                    onChange={(e) => setLine(index, "unitPrice", e.target.value)}
                    required
                  />
                </Col>
                <Col xs={4} md={3} className="d-flex align-items-center justify-content-end gap-2">
                  <span className="fw-semibold chc-num">{formatEuros(lineTotal(line))}</span>
                  {lines.length > 1 && (
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      aria-label={`Retirer la ligne ${index + 1}`}
                      onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                    >
                      ✕
                    </Button>
                  )}
                </Col>
              </Row>
            ))}
          </div>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
            <Button
              size="sm"
              variant="outline-primary"
              disabled={lines.length >= 30}
              onClick={() => setLines((current) => [...current, { description: "", quantity: "1", unitPrice: "" }])}
            >
              + Ajouter une ligne
            </Button>
            <span className="fs-5 fw-bold chc-num">Total TVAC : {formatEuros(total)}</span>
          </div>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Body>
          <Form.Group controlId="sale-notes">
            <Form.Label>Notes internes (facultatif, non imprimées)</Form.Label>
            <Form.Control as="textarea" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
          </Form.Group>
        </Card.Body>
      </Card>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Enregistrement…" : submitLabel}
      </Button>
    </Form>
  );
}
