"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import ProgressBar from "react-bootstrap/ProgressBar";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Confetti } from "@/components/Confetti";
import { ErrorAlert } from "@/components/ErrorAlert";
import { SaleForm } from "@/components/admin/SaleForm";
import { useLanguage } from "@/context/LanguageContext";
import { reservationService } from "@/services/reservationService";
import { saleService } from "@/services/saleService";
import { PAYMENT_METHODS, type PaymentMethod, type Sale, type SaleInput } from "@/types/sale";
import { errorMessage } from "@/utils/errors";
import { listingPath } from "@/utils/listingPath";
import { openReservationsByListing } from "@/utils/reservationAvailability";
import {
  DOCUMENT_KIND_LABELS,
  PAYMENT_METHOD_LABELS,
  SALE_STATUS_LABELS,
  SALE_STATUS_VARIANTS,
  VAT_REGIME_LABELS,
  formatDay,
  formatEuros,
  saleReference,
  todayIso,
} from "@/utils/saleLabels";

const STEPS = [
  { key: "draft", label: "Brouillon" },
  { key: "ordered", label: "Bon de commande" },
  { key: "paid", label: "Facture · payé" },
] as const;

function toInput(sale: Sale): SaleInput {
  return {
    vatRegime: sale.vatRegime,
    listingId: sale.listing?.id ?? null,
    stockVehicleId: sale.stockVehicle?.id ?? null,
    buyer: sale.buyer,
    vehicleVin: sale.vehicleVin,
    notes: sale.notes,
    lines: sale.lines.map(({ description, quantity, unitPrice }) => ({ description, quantity, unitPrice })),
  };
}

/** Record a payment; the amount defaults to what is still due. */
function PaymentForm({ sale, onDone }: { sale: Sale; onDone: (sale: Sale) => void }) {
  const [amount, setAmount] = useState(String(sale.totals.due));
  const [paidOn, setPaidOn] = useState(todayIso());
  const [method, setMethod] = useState<PaymentMethod>("transfer");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const value = Number(amount.replace(/\s/g, "").replace(",", "."));
  const willIssue =
    Number.isFinite(value) && value > 0
      ? value >= sale.totals.due
        ? "la facture finale"
        : sale.status === "draft"
          ? "le bon de commande"
          : null
      : null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      onDone(await saleService.addPayment(sale.id, { amount: value, paidOn, method, reference: reference.trim() || null }));
    } catch (err) {
      setError(errorMessage(err, "Paiement non enregistré"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Form onSubmit={submit} className="chc-payment-form">
      <ErrorAlert message={error} />
      <Row className="g-3 align-items-end">
        <Col xs={6}>
          <Form.Group controlId="pay-amount">
            <Form.Label className="small">Montant (€)</Form.Label>
            <Form.Control inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </Form.Group>
        </Col>
        <Col xs={6}>
          <Form.Group controlId="pay-date">
            <Form.Label className="small">Date</Form.Label>
            <Form.Control type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} required />
          </Form.Group>
        </Col>
        <Col xs={6}>
          <Form.Group controlId="pay-method">
            <Form.Label className="small">Mode</Form.Label>
            <Form.Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col xs={6}>
          <Form.Group controlId="pay-ref">
            <Form.Label className="small">Référence</Form.Label>
            <Form.Control value={reference} onChange={(e) => setReference(e.target.value)} maxLength={100} placeholder="facultatif" />
          </Form.Group>
        </Col>
        <Col xs={12} className="text-end">
          <Button type="submit" disabled={busy}>
            {busy ? "Enregistrement…" : "Encaisser ce paiement"}
          </Button>
        </Col>
      </Row>
      {willIssue && (
        <div className="small text-secondary mt-3">
          Ce paiement générera <strong className="text-body">{willIssue}</strong>.
        </div>
      )}
    </Form>
  );
}

/** Back-office: one sale file — status, payments, documents; editable while a draft. */
export default function SaleDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { withLocale } = useLanguage();
  const [sale, setSale] = useState<Sale | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  /** The payment that settled the sale: confetti and the « Vendu ! » card. */
  const [celebration, setCelebration] = useState<Sale | null>(null);
  /** Other customers' reservations in progress on the car sold here. */
  const [openReservations, setOpenReservations] = useState(0);
  const listingId = sale?.listing?.id ?? null;
  const saleStatus = sale?.status;

  useEffect(() => {
    if (!listingId) return;
    reservationService
      .list()
      .then((reservations) => setOpenReservations(openReservationsByListing(reservations).get(listingId) ?? 0))
      .catch(() => setOpenReservations(0));
    // Recount when the sale moves on (the car gets sold).
  }, [listingId, saleStatus]);

  const load = useCallback(() => {
    saleService
      .get(id)
      .then(setSale)
      .catch((err: unknown) => setError(errorMessage(err, "Dossier introuvable")));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(action: () => Promise<Sale>, fallback: string) {
    setError("");
    try {
      setSale(await action());
    } catch (err) {
      setError(errorMessage(err, fallback));
    }
  }

  function paymentRecorded(next: Sale) {
    if (next.status === "paid" && sale?.status !== "paid") setCelebration(next);
    setSale(next);
  }

  async function download(documentId: number, filename: string) {
    setError("");
    try {
      await saleService.downloadDocument(id, documentId, filename);
    } catch (err) {
      setError(errorMessage(err, "Téléchargement impossible"));
    }
  }

  async function removeDraft() {
    setError("");
    try {
      await saleService.remove(id);
      router.replace(withLocale("/admin/ventes"));
    } catch (err) {
      setError(errorMessage(err, "Suppression impossible"));
    }
  }

  if (!sale) {
    return error ? <ErrorAlert message={error} /> : <Spinner animation="border" role="status" aria-label="Chargement" />;
  }

  const stepIndex = STEPS.findIndex((step) => step.key === sale.status);
  const progress = sale.totals.total > 0 ? Math.round((sale.totals.paid / sale.totals.total) * 100) : 0;

  const invoice = celebration?.documents.find((document) => document.kind === "invoice");

  return (
    <section style={{ maxWidth: 1180 }}>
      {celebration &&
        createPortal(
        <>
          <Confetti />
          <div className="chc-sold-card" role="status">
            <span className="chc-sold-icon" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <div className="chc-sold-title">Vendu !</div>
              <div className="text-truncate">{celebration.lines[0]?.description ?? saleReference(celebration) ?? "Dossier"}</div>
              <div className="small text-secondary">
                {celebration.buyer.name} · <span className="chc-num">{formatEuros(celebration.totals.total)}</span>
              </div>
              <div className="d-flex flex-wrap gap-2 mt-3">
                {invoice && (
                  <Button size="sm" onClick={() => void download(invoice.id, invoice.filename)}>
                    Télécharger la facture
                  </Button>
                )}
                <Button size="sm" variant="outline-secondary" onClick={() => setCelebration(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </>,
          // Window-fixed, out of the page container (see Confetti).
          document.body,
        )}
      {/* Hero: reference, buyer & car, progress steps, paid ring */}
      <header className={`chc-sale-hero chc-sale-hero--${sale.status}`}>
        <div className="chc-sale-hero-main">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
            <span className="chc-sale-hero-eyebrow">Dossier de vente</span>
            <Badge bg={SALE_STATUS_VARIANTS[sale.status]} text={sale.status === "ordered" ? "dark" : undefined}>
              {SALE_STATUS_LABELS[sale.status]}
            </Badge>
          </div>
          <h1 className="chc-sale-hero-title">{saleReference(sale) ?? "Brouillon"}</h1>
          <p className="chc-sale-hero-sub">
            <strong>{sale.buyer.name}</strong>
            {sale.buyer.company && ` · ${sale.buyer.company}`}
            {sale.lines[0] && <> · {sale.lines[0].description.split(" — ")[0]}</>}
          </p>
          <ol className="chc-steps chc-steps--hero">
            {STEPS.map((step, index) => (
              <li key={step.key} className={index < stepIndex ? "is-done" : index === stepIndex ? "is-current" : undefined}>
                <span className="chc-steps-dot" aria-hidden="true">{index < stepIndex ? "✓" : index + 1}</span>
                {step.label}
              </li>
            ))}
          </ol>
        </div>

        <div className="chc-sale-hero-side">
          <div
            className={`chc-sale-ring${progress >= 100 ? " is-full" : ""}`}
            style={{ "--chc-progress": progress } as React.CSSProperties}
            role="img"
            aria-label={`Payé à ${progress} %`}
          >
            <span className="chc-sale-ring-value">
              {progress}
              <small>%</small>
            </span>
            <span className="chc-sale-ring-label">payé</span>
          </div>
          {sale.editable && !editing && (
            <div className="d-flex gap-2">
              <Button size="sm" variant="light" onClick={() => setEditing(true)}>
                Modifier
              </Button>
              <ConfirmButton
                variant="outline-light"
                message="Supprimer ce brouillon ?"
                confirmLabel="Oui, supprimer"
                cancelLabel="Non"
                onConfirm={removeDraft}
              >
                Supprimer
              </ConfirmButton>
            </div>
          )}
        </div>
      </header>

      <ErrorAlert message={error} />

      {sale.listing && openReservations > 0 && (
        <Alert variant={sale.status === "paid" ? "danger" : "warning"} className="d-flex flex-wrap gap-1 mb-4">
          <strong>
            {openReservations} réservation{openReservations > 1 ? "s" : ""} en cours sur ce véhicule
          </strong>
          <span>
            {sale.status === "paid"
              ? "— il est vendu : refusez ou annulez-les pour prévenir les clients."
              : "— d'autres clients attendent une réponse : à traiter avant de conclure la vente."}
          </span>
          <Link href={withLocale("/admin/reservations")} className="ms-auto">
            Voir les réservations →
          </Link>
        </Alert>
      )}

      {editing ? (
        <>
          <SaleForm
            initial={toInput(sale)}
            submitLabel="Enregistrer"
            onSubmit={async (input) => {
              setSale(await saleService.update(sale.id, input));
              setEditing(false);
            }}
          />
          <Button variant="link" className="mt-2 px-0" onClick={() => setEditing(false)}>
            Annuler la modification
          </Button>
        </>
      ) : (
        <Row className="g-4">
          {/* Main column: what is sold, then the payments */}
          <Col lg={8} className="d-flex flex-column gap-3 gap-lg-4">
            <Card>
              <Card.Body className="p-3 p-md-4">
                <div className="d-flex align-items-baseline justify-content-between gap-2 mb-3">
                  <h2 className="h6 mb-0">Lignes</h2>
                  {!sale.editable && (
                    <span className="chc-sale-frozen" title="Un document a été émis : le contenu du dossier est figé.">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4" />
                      </svg>
                      Figé
                    </span>
                  )}
                </div>
                <Table responsive className="mb-0 align-middle chc-sale-lines">
                  <thead>
                    <tr>
                      <th>Désignation</th>
                      <th className="text-end d-none d-sm-table-cell">Qté</th>
                      <th className="text-end d-none d-sm-table-cell">Prix unit. TVAC</th>
                      <th className="text-end">Total TVAC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.lines.map((line) => (
                      <tr key={line.id}>
                        <td className="fw-semibold">
                          {line.description}
                          {line.quantity > 1 && <span className="d-sm-none text-secondary fw-normal"> × {line.quantity}</span>}
                        </td>
                        <td className="text-end chc-num d-none d-sm-table-cell">{line.quantity}</td>
                        <td className="text-end chc-num d-none d-sm-table-cell">{formatEuros(line.unitPrice)}</td>
                        <td className="text-end chc-num">{formatEuros(line.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="text-end text-secondary d-none d-sm-table-cell">Total TVAC</td>
                      <td className="text-end text-secondary d-sm-none">Total TVAC</td>
                      <td className="text-end chc-num fw-bold fs-5 text-nowrap">{formatEuros(sale.totals.total)}</td>
                    </tr>
                  </tfoot>
                </Table>
              </Card.Body>
            </Card>

            <Card>
              <Card.Body className="p-3 p-md-4">
                <h2 className="h6 mb-4">Paiements</h2>
                {sale.payments.length === 0 ? (
                  <p className="small text-secondary mb-4">
                    Aucun paiement pour l&apos;instant. Une avance génère le bon de commande, le solde la facture.
                  </p>
                ) : (
                  <ol className="chc-timeline">
                    {sale.payments.map((payment) => {
                      const document = sale.documents.find((item) => item.id === payment.documentId);
                      return (
                        <li key={payment.id} className="chc-timeline-item">
                          <span className="chc-timeline-dot" aria-hidden="true" />
                          <div className="chc-timeline-body">
                            <div className="d-flex flex-wrap align-items-center gap-2">
                              <span className="chc-timeline-amount chc-num">{formatEuros(payment.amount)}</span>
                              {document && (
                                <span className={`chc-doc-chip chc-doc-chip--${document.kind}`}>
                                  → {document.number}
                                </span>
                              )}
                              {payment.deletable && (
                                <ConfirmButton
                                  className="ms-auto"
                                  variant="outline-secondary"
                                  message="Supprimer ce paiement (erreur de saisie) ?"
                                  confirmLabel="Oui, supprimer"
                                  cancelLabel="Non"
                                  onConfirm={() => run(() => saleService.deletePayment(sale.id, payment.id), "Suppression impossible")}
                                >
                                  Supprimer
                                </ConfirmButton>
                              )}
                            </div>
                            <div className="small text-secondary">
                              {formatDay(payment.paidOn)} · {PAYMENT_METHOD_LABELS[payment.method]}
                              {payment.reference && ` · ${payment.reference}`}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
                {sale.status === "paid" ? (
                  <div className="chc-sale-settled">
                    <span aria-hidden="true">✓</span> Dossier entièrement payé
                  </div>
                ) : (
                  <div className="chc-sale-payment-box">
                    <div className="fw-semibold mb-3">Encaisser un paiement</div>
                    <PaymentForm key={sale.totals.due} sale={sale} onDone={paymentRecorded} />
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Side column (sticky): amounts, documents, buyer, vehicle */}
          <Col lg={4}>
            <div className="chc-sale-aside">
              <Card>
                <Card.Body className="p-3 p-md-4">
                  <h2 className="h6 mb-3">Montants</h2>
                  <dl className="chc-sale-amounts">
                    <div>
                      <dt>Total TVAC</dt>
                      <dd className="chc-num">{formatEuros(sale.totals.total)}</dd>
                    </div>
                    {sale.vatRegime === "standard" && (
                      <div className="is-sub">
                        <dt>dont TVA 21 %</dt>
                        <dd className="chc-num">{formatEuros(sale.totals.vat)}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Encaissé</dt>
                      <dd className="chc-num text-primary-emphasis">{formatEuros(sale.totals.paid)}</dd>
                    </div>
                    <div className="is-total">
                      <dt>Reste à payer</dt>
                      <dd className="chc-num">{formatEuros(sale.totals.due)}</dd>
                    </div>
                  </dl>
                  <ProgressBar now={progress} className="chc-sale-bar" aria-hidden="true" />
                </Card.Body>
              </Card>

              <Card>
                <Card.Body className="p-3 p-md-4">
                  <h2 className="h6 mb-3">Documents</h2>
                  {sale.documents.length === 0 ? (
                    <p className="small text-secondary mb-0">
                      Le bon de commande sera généré au premier paiement, la facture une fois tout payé.
                    </p>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {sale.documents.map((document) => (
                        <button
                          key={document.id}
                          type="button"
                          className={`chc-doc-tile chc-doc-tile--${document.kind}`}
                          title={`Télécharger ${document.filename}`}
                          onClick={() => void download(document.id, document.filename)}
                        >
                          <span className="chc-doc-tile-icon" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5" />
                            </svg>
                          </span>
                          <span className="flex-grow-1 text-start" style={{ minWidth: 0 }}>
                            <span className="d-block fw-semibold">{DOCUMENT_KIND_LABELS[document.kind]}</span>
                            <span className="d-block small text-secondary">
                              {document.number} · {new Date(document.issuedAt).toLocaleDateString("fr-BE")}
                            </span>
                          </span>
                          <span className="chc-doc-tile-download" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
                            </svg>
                          </span>
                          <span className="visually-hidden">Télécharger {document.number} (PDF)</span>
                        </button>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>

              <Card>
                <Card.Body className="p-3 p-md-4">
                  <h2 className="h6 mb-3">Acheteur</h2>
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <span className="chc-admin-avatar" aria-hidden="true">
                      {sale.buyer.name
                        .split(/\s+/)
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="fw-semibold text-truncate">{sale.buyer.name}</div>
                      {sale.buyer.company && <div className="small text-secondary text-truncate">{sale.buyer.company}</div>}
                    </div>
                  </div>
                  <ul className="chc-sale-facts">
                    <li>
                      {[sale.buyer.address, [sale.buyer.postalCode, sale.buyer.city].filter(Boolean).join(" "), sale.buyer.country]
                        .filter(Boolean)
                        .join(", ") || "Adresse non renseignée"}
                    </li>
                    {sale.buyer.email && (
                      <li>
                        <a href={`mailto:${sale.buyer.email}`}>{sale.buyer.email}</a>
                      </li>
                    )}
                    {sale.buyer.phone && (
                      <li>
                        <a href={`tel:${sale.buyer.phone.replace(/[^+0-9]/g, "")}`}>{sale.buyer.phone}</a>
                      </li>
                    )}
                    {sale.buyer.vatNumber && <li>TVA : {sale.buyer.vatNumber}</li>}
                  </ul>
                  {sale.notes && <p className="small mt-3 mb-0 chc-resa-message">{sale.notes}</p>}
                </Card.Body>
              </Card>

              <Card>
                <Card.Body className="p-3 p-md-4">
                  <h2 className="h6 mb-3">Véhicule</h2>
                  <ul className="chc-sale-facts">
                    {sale.stockVehicle && (
                      <li>
                        Stock :{" "}
                        <Link href={withLocale(`/admin/stock/${sale.stockVehicle.id}`)}>
                          {sale.stockVehicle.reference} · {sale.stockVehicle.label}
                        </Link>
                      </li>
                    )}
                    {sale.listing ? (
                      <li>
                        <Link href={withLocale(listingPath(sale.listing))}>{sale.listing.title}</Link>
                        {sale.listing.status === "sold" && <Badge bg="dark" className="ms-2">Vendue</Badge>}
                      </li>
                    ) : (
                      <li className="text-secondary">Aucune annonce liée</li>
                    )}
                    {sale.vehicleVin && (
                      <li>
                        VIN <span className="font-monospace">{sale.vehicleVin}</span>
                      </li>
                    )}
                    <li className="text-secondary">{VAT_REGIME_LABELS[sale.vatRegime]}</li>
                  </ul>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      )}
    </section>
  );
}
