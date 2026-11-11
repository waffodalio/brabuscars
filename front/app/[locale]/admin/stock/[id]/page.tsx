"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import { ConfirmButton } from "@/components/ConfirmButton";
import { ErrorAlert } from "@/components/ErrorAlert";
import { StockVehicleForm } from "@/components/admin/StockVehicleForm";
import { useLanguage } from "@/context/LanguageContext";
import { carModelService } from "@/services/carModelService";
import { listingService } from "@/services/listingService";
import { stockGallery, stockService } from "@/services/stockService";
import { ListingImagePanel } from "@/components/ListingImagePanel";
import type { CarModel } from "@/types/carModel";
import type { Listing } from "@/types/listing";
import { EXIT_REASONS, type ExitReason, type StockVehicle, type StockVehicleInput } from "@/types/stock";
import { errorMessage } from "@/utils/errors";
import { LISTING_STATUS_LABELS } from "@/utils/listingLabels";
import { listingPath } from "@/utils/listingPath";
import { SALE_STATUS_LABELS, formatDay, formatEuros, todayIso } from "@/utils/saleLabels";
import { stockGaps } from "@/utils/stockGaps";
import { ListingEquipment } from "@/components/ListingDetails";
import { euroNormLabel } from "@/types/listingDetails";
import {
  ENTRY_SOURCE_LABELS,
  EXIT_REASON_LABELS,
  STOCK_STATUS_LABELS,
  STOCK_STATUS_VARIANTS,
  isInGarage,
} from "@/utils/stockLabels";
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "@/utils/vehicleLabels";

/** The car as an update payload (same values), with some fields replaced. */
function inputOf(vehicle: StockVehicle, changes: Partial<StockVehicleInput> = {}): StockVehicleInput {
  return {
    modelId: vehicle.modelId,
    listingId: vehicle.listing?.id ?? null,
    version: vehicle.version,
    vin: vehicle.vin,
    year: vehicle.year,
    firstRegistration: vehicle.firstRegistration,
    mileage: vehicle.mileage,
    fuelType: vehicle.fuelType,
    transmission: vehicle.transmission,
    power: vehicle.power,
    color: vehicle.color,
    doors: vehicle.doors,
    equipment: vehicle.equipment,
    euroNorm: vehicle.euroNorm,
    co2: vehicle.co2,
    hasCarPass: vehicle.hasCarPass,
    entryDate: vehicle.entryDate,
    entrySource: vehicle.entrySource,
    supplier: vehicle.supplier,
    purchasePrice: vehicle.purchasePrice,
    targetPrice: vehicle.targetPrice,
    location: vehicle.location,
    notes: vehicle.notes,
    ...changes,
  };
}

/** Back-office: one car of the garage register. */
export default function StockVehiclePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { withLocale } = useLanguage();
  const [vehicle, setVehicle] = useState<StockVehicle | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [models, setModels] = useState<CarModel[]>([]);
  /** Listings no other car carries (to link one) + the linked one in full (to check it). */
  const [listings, setListings] = useState<Listing[]>([]);
  const [linkedListing, setLinkedListing] = useState<Listing | null>(null);
  const [linkChoice, setLinkChoice] = useState("");
  const [exitDate, setExitDate] = useState(todayIso());
  const [exitReason, setExitReason] = useState<ExitReason>("sale");
  const [cost, setCost] = useState({ label: "", amount: "", spentOn: todayIso() });

  const load = useCallback(() => {
    stockService
      .get(id)
      .then(setVehicle)
      .catch((err: unknown) => setError(errorMessage(err, "Véhicule introuvable")));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    Promise.all([listingService.list(), stockService.list()])
      .then(([all, stock]) => {
        const carried = new Set(stock.map((item) => item.listing?.id).filter(Boolean));
        setListings(all.filter((listing) => !carried.has(listing.id) && listing.status !== "sold"));
      })
      .catch(() => setListings([]));
  }, [vehicle?.listing?.id]);

  const linkedId = vehicle?.listing?.id ?? null;
  useEffect(() => {
    if (!linkedId) return;
    listingService
      .getById(linkedId)
      .then(setLinkedListing)
      .catch(() => setLinkedListing(null));
  }, [linkedId]);

  async function run(action: () => Promise<StockVehicle>, fallback: string) {
    setError("");
    try {
      setVehicle(await action());
    } catch (err) {
      setError(errorMessage(err, fallback));
    }
  }

  async function addCost(event: FormEvent) {
    event.preventDefault();
    const amount = Number(cost.amount.replace(/\s/g, "").replace(",", "."));
    if (!cost.label.trim() || !(amount > 0)) {
      setError("Indiquez un libellé et un montant positif.");
      return;
    }
    await run(() => stockService.addCost(id, { label: cost.label.trim(), amount, spentOn: cost.spentOn }), "Frais non enregistré");
    setCost({ label: "", amount: "", spentOn: todayIso() });
  }

  async function remove() {
    setError("");
    try {
      await stockService.remove(id);
      router.replace(withLocale("/admin/stock"));
    } catch (err) {
      setError(errorMessage(err, "Suppression impossible"));
    }
  }

  if (!vehicle) {
    return error ? <ErrorAlert message={error} /> : <Spinner animation="border" role="status" aria-label="Chargement" />;
  }

  const inGarage = isInGarage(vehicle.status);
  const gaps = linkedListing && linkedListing.id === vehicle.listing?.id ? stockGaps(vehicle, linkedListing) : [];
  const specs: [string, string][] = [
    ["Année", String(vehicle.year)],
    ["1re immatriculation", vehicle.firstRegistration ? formatDay(vehicle.firstRegistration) : "—"],
    ["Km à l'entrée", `${vehicle.mileage.toLocaleString("fr-BE")} km`],
    ["Carburant", FUEL_TYPE_LABELS[vehicle.fuelType]],
    ["Boîte", TRANSMISSION_LABELS[vehicle.transmission]],
    ["Puissance", vehicle.power ? `${vehicle.power} ch` : "—"],
    ["Portes", vehicle.doors ? String(vehicle.doors) : "—"],
    ["Couleur", vehicle.color ?? "—"],
    ["Norme Euro", vehicle.euroNorm ? euroNormLabel(vehicle.euroNorm) : "—"],
    ["CO₂", vehicle.co2 !== null ? `${vehicle.co2} g/km` : "—"],
    ["Car-Pass", vehicle.hasCarPass ? "Oui" : "Non"],
    ["VIN", vehicle.vin ?? "—"],
    ["Emplacement", vehicle.location ?? "—"],
    ["Origine", `${ENTRY_SOURCE_LABELS[vehicle.entrySource]}${vehicle.supplier ? ` · ${vehicle.supplier}` : ""}`],
  ];

  return (
    <section style={{ maxWidth: 1180 }}>
      <header
        className={`chc-sale-hero chc-stock-hero${
          vehicle.status === "sold" ? " chc-sale-hero--paid" : vehicle.status === "exited" ? " chc-sale-hero--draft" : ""
        }`}
      >
        <div className="chc-sale-hero-main">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
            <span className="chc-sale-hero-eyebrow">Stock · {vehicle.reference}</span>
            <Badge bg={STOCK_STATUS_VARIANTS[vehicle.status]} text={vehicle.status === "preparation" ? "dark" : undefined}>
              {STOCK_STATUS_LABELS[vehicle.status]}
            </Badge>
          </div>
          <h1 className="chc-sale-hero-title">{vehicle.label}</h1>
          <p className="chc-sale-hero-sub mb-0">
            {[vehicle.vin, String(vehicle.year), `${vehicle.mileage.toLocaleString("fr-BE")} km`, FUEL_TYPE_LABELS[vehicle.fuelType]]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="chc-sale-hero-side">
          <div className="chc-stock-days">
            <strong>{vehicle.daysInStock}</strong>
            <span>{inGarage ? "jours au garage" : "jours au total"}</span>
          </div>
          {!editing && (
            <div className="d-flex gap-2">
              <Button size="sm" variant="light" onClick={() => setEditing(true)}>
                Modifier
              </Button>
              {vehicle.sales.length === 0 && !vehicle.listing && (
                <ConfirmButton
                  variant="outline-light"
                  message="Supprimer ce véhicule du stock (saisie erronée) ?"
                  confirmLabel="Oui, supprimer"
                  cancelLabel="Non"
                  onConfirm={remove}
                >
                  Supprimer
                </ConfirmButton>
              )}
            </div>
          )}
        </div>
      </header>

      <ErrorAlert message={error} />

      {gaps.length > 0 && (
        <Alert variant="warning" className="mb-4">
          <div>
            <strong>L&apos;annonce ne correspond pas au véhicule enregistré :</strong>
            <ul className="mb-2 mt-2 ps-3">
              {gaps.map((gap) => (
                <li key={gap.label}>
                  {gap.label} : stock <strong>{gap.stock}</strong> · annonce <strong>{gap.listing}</strong>
                </li>
              ))}
            </ul>
            <Link href={withLocale(`/admin/annonces/${vehicle.listing?.id}/modifier`)}>Corriger l&apos;annonce →</Link>
          </div>
        </Alert>
      )}

      {editing ? (
        <>
          <ModelsLoader onLoad={setModels} />
          {models.length === 0 ? (
            <Spinner animation="border" role="status" aria-label="Chargement" />
          ) : (
            <StockVehicleForm
              models={models}
              initial={vehicle}
              submitLabel="Enregistrer"
              onSubmit={async (input) => {
                setVehicle(await stockService.update(id, input));
                setEditing(false);
              }}
            />
          )}
          <Button variant="link" className="mt-2 px-0" onClick={() => setEditing(false)}>
            Annuler la modification
          </Button>
        </>
      ) : (
        <Row className="g-4">
          <Col lg={8} className="d-flex flex-column gap-3 gap-lg-4">
            <Card>
              <Card.Body className="p-3 p-md-4">
                <div className="d-flex align-items-baseline justify-content-between gap-2">
                  <h2 className="h6 mb-0">Photos</h2>
                  <span className="small text-secondary">
                    {vehicle.listing ? "Affichées sur l'annonce" : "Serviront pour l'annonce"}
                  </span>
                </div>
                {vehicle.images.length === 0 && (
                  <Alert variant="warning" className="small py-2 mt-3 mb-0">
                    Aucune photo : ajoutez-en avant de mettre le véhicule en vente.
                  </Alert>
                )}
                <ListingImagePanel
                  api={stockGallery(vehicle.id)}
                  title=""
                  images={vehicle.images}
                  canManage
                  onChange={(images) => setVehicle((current) => (current ? { ...current, images } : current))}
                />
              </Card.Body>
            </Card>

            <Card>
              <Card.Body className="p-3 p-md-4">
                <h2 className="h6 mb-3">Caractéristiques</h2>
                <dl className="chc-stock-specs">
                  {specs.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd className={label === "VIN" ? "font-monospace" : undefined}>{value}</dd>
                    </div>
                  ))}
                </dl>
                {vehicle.notes && <p className="small mt-3 mb-0 chc-resa-message">{vehicle.notes}</p>}
              </Card.Body>
            </Card>

            <ListingEquipment listing={vehicle} className="m-0" />

            <Card>
              <Card.Body className="p-3 p-md-4">
                <div className="d-flex align-items-baseline justify-content-between mb-3">
                  <h2 className="h6 mb-0">Frais</h2>
                  <span className="fw-bold chc-num">{formatEuros(vehicle.totals.costs)}</span>
                </div>
                {vehicle.costs.length > 0 && (
                  <ul className="list-unstyled chc-payments mb-3">
                    {vehicle.costs.map((item) => (
                      <li key={item.id}>
                        <span>
                          <span className="fw-semibold">{item.label}</span>{" "}
                          <span className="small text-secondary">· {formatDay(item.spentOn)}</span>
                        </span>
                        <span className="d-flex align-items-center gap-2">
                          <span className="chc-num">{formatEuros(item.amount)}</span>
                          <ConfirmButton
                            variant="outline-secondary"
                            message="Retirer ce frais ?"
                            confirmLabel="Oui, retirer"
                            cancelLabel="Non"
                            onConfirm={() => run(() => stockService.removeCost(id, item.id), "Suppression impossible")}
                          >
                            Retirer
                          </ConfirmButton>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <Form onSubmit={addCost} className="chc-sale-payment-box">
                  <Row className="g-2 align-items-end">
                    <Col sm={5}>
                      <Form.Label className="small">Libellé</Form.Label>
                      <Form.Control
                        value={cost.label}
                        onChange={(event) => setCost({ ...cost, label: event.target.value })}
                        maxLength={150}
                        placeholder="Pneus, contrôle technique, carrosserie…"
                      />
                    </Col>
                    <Col xs={6} sm={3}>
                      <Form.Label className="small">Montant (€)</Form.Label>
                      <Form.Control inputMode="decimal" value={cost.amount} onChange={(event) => setCost({ ...cost, amount: event.target.value })} />
                    </Col>
                    <Col xs={6} sm={4}>
                      <Form.Label className="small">Date</Form.Label>
                      <Form.Control type="date" value={cost.spentOn} onChange={(event) => setCost({ ...cost, spentOn: event.target.value })} />
                    </Col>
                    <Col xs={12}>
                      <Button type="submit" variant="outline-primary" size="sm">
                        + Ajouter le frais
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>

            {vehicle.sales.length > 0 && (
              <Card>
                <Card.Body className="p-3 p-md-4">
                  <h2 className="h6 mb-3">Dossiers de vente</h2>
                  <div className="chc-sale-links">
                    {vehicle.sales.map((sale) => (
                      <Link key={sale.id} href={withLocale(`/admin/ventes/${sale.id}`)} className="chc-sale-link">
                        <span className="fw-semibold">{sale.reference ?? "Dossier brouillon"}</span>
                        <span className="text-secondary">
                          {sale.buyerName} · {SALE_STATUS_LABELS[sale.status as keyof typeof SALE_STATUS_LABELS] ?? sale.status}
                        </span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>

          <Col lg={4}>
            <div className="chc-sale-aside">
              <Card>
                <Card.Body className="p-3 p-md-4">
                  <h2 className="h6 mb-3">Chiffres</h2>
                  <dl className="chc-sale-amounts mb-0">
                    <div>
                      <dt>Prix d&apos;achat</dt>
                      <dd className="chc-num">{vehicle.purchasePrice !== null ? formatEuros(vehicle.purchasePrice) : "—"}</dd>
                    </div>
                    <div>
                      <dt>Frais</dt>
                      <dd className="chc-num">{formatEuros(vehicle.totals.costs)}</dd>
                    </div>
                    <div className="is-total">
                      <dt>Prix de revient</dt>
                      <dd className="chc-num">{vehicle.totals.costPrice !== null ? formatEuros(vehicle.totals.costPrice) : "—"}</dd>
                    </div>
                    <div>
                      <dt>Prix visé</dt>
                      <dd className="chc-num">{vehicle.targetPrice !== null ? formatEuros(vehicle.targetPrice) : "—"}</dd>
                    </div>
                    <div>
                      <dt>Marge potentielle</dt>
                      <dd
                        className={`chc-num ${
                          vehicle.totals.potentialMargin === null ? "" : vehicle.totals.potentialMargin >= 0 ? "text-primary-emphasis" : "text-danger"
                        }`}
                      >
                        {vehicle.totals.potentialMargin !== null ? formatEuros(vehicle.totals.potentialMargin) : "—"}
                      </dd>
                    </div>
                  </dl>
                </Card.Body>
              </Card>

              <Card>
                <Card.Body className="p-3 p-md-4">
                  <h2 className="h6 mb-3">Annonce</h2>
                  {vehicle.listing ? (
                    <>
                      <Link href={withLocale(listingPath(vehicle.listing))} className="chc-sale-link mb-2">
                        <span className="fw-semibold">{vehicle.listing.title}</span>
                        <span className="text-secondary">
                          {LISTING_STATUS_LABELS[vehicle.listing.status]} · {formatEuros(vehicle.listing.price)}
                        </span>
                        <span aria-hidden="true">→</span>
                      </Link>
                      {gaps.length === 0 && linkedListing && (
                        <div className="small text-primary-emphasis mb-2">✓ Conforme au véhicule enregistré</div>
                      )}
                      <ConfirmButton
                        variant="link"
                        className="px-0 text-secondary"
                        message="L'annonce ne sera plus liée à ce véhicule et n'affichera plus ses photos. Détacher ?"
                        confirmLabel="Oui, détacher"
                        cancelLabel="Non"
                        onConfirm={() => run(() => stockService.update(id, inputOf(vehicle, { listingId: null })), "Action impossible")}
                      >
                        Détacher l&apos;annonce
                      </ConfirmButton>
                    </>
                  ) : (
                    <>
                      {inGarage && (
                        <Link href={withLocale(`/admin/annonces/nouvelle?stock=${vehicle.id}`)} className="btn btn-primary w-100 mb-3">
                          Créer l&apos;annonce depuis ce véhicule
                        </Link>
                      )}
                      {listings.length > 0 && (
                        <div className="d-flex gap-2">
                          <Form.Select
                            size="sm"
                            value={linkChoice}
                            onChange={(event) => setLinkChoice(event.target.value)}
                            aria-label="Lier une annonce existante"
                          >
                            <option value="">Lier une annonce existante…</option>
                            {listings.map((listing) => (
                              <option key={listing.id} value={listing.id}>
                                {listing.title} · {listing.year}
                              </option>
                            ))}
                          </Form.Select>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            disabled={!linkChoice}
                            onClick={() =>
                              run(() => stockService.update(id, inputOf(vehicle, { listingId: Number(linkChoice) })), "Liaison impossible")
                            }
                          >
                            Lier
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </Card.Body>
              </Card>

              <Card>
                <Card.Body className="p-3 p-md-4">
                  <h2 className="h6 mb-3">{inGarage ? "Sortie du garage" : "Sortie"}</h2>
                  {inGarage ? (
                    <>
                      <Row className="g-2 mb-3">
                        <Col xs={6}>
                          <Form.Label className="small">Date</Form.Label>
                          <Form.Control type="date" size="sm" value={exitDate} onChange={(event) => setExitDate(event.target.value)} />
                        </Col>
                        <Col xs={6}>
                          <Form.Label className="small">Motif</Form.Label>
                          <Form.Select size="sm" value={exitReason} onChange={(event) => setExitReason(event.target.value as ExitReason)}>
                            {EXIT_REASONS.map((reason) => (
                              <option key={reason} value={reason}>
                                {EXIT_REASON_LABELS[reason]}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>
                      </Row>
                      <ConfirmButton
                        variant="outline-primary"
                        className="w-100"
                        message={`Enregistrer la sortie (${EXIT_REASON_LABELS[exitReason].toLowerCase()}) ?${
                          vehicle.listing ? ` Son annonce passera « ${exitReason === "sale" ? "Vendue" : "Archivée"} ».` : ""
                        }`}
                        confirmLabel="Oui, enregistrer"
                        cancelLabel="Non"
                        onConfirm={() => run(() => stockService.exit(id, exitDate, exitReason), "Sortie impossible")}
                      >
                        Enregistrer la sortie
                      </ConfirmButton>
                      <p className="small text-secondary mt-2 mb-0">
                        Une vente facturée (ou l&apos;annonce passée « Vendue ») la fait automatiquement.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mb-3">
                        {EXIT_REASON_LABELS[vehicle.exitReason ?? "other"]} le{" "}
                        <strong>{formatDay(vehicle.exitDate ?? vehicle.entryDate)}</strong>
                      </p>
                      <ConfirmButton
                        variant="outline-secondary"
                        message={
                          vehicle.listing
                            ? "Remettre ce véhicule en stock ? Son annonce repassera en ligne (ou en brouillon si elle ne l'a jamais été)."
                            : "Remettre ce véhicule en stock ?"
                        }
                        confirmLabel="Oui"
                        cancelLabel="Non"
                        onConfirm={() => run(() => stockService.reopen(id), "Action impossible")}
                      >
                        Remettre en stock
                      </ConfirmButton>
                    </>
                  )}
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      )}
    </section>
  );
}

/** Loads the catalogue models once the edit form opens. */
function ModelsLoader({ onLoad }: { onLoad: (models: CarModel[]) => void }) {
  useEffect(() => {
    carModelService
      .list()
      .then(onLoad)
      .catch(() => undefined);
  }, [onLoad]);
  return null;
}
