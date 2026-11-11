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
        <Col xs={12}>
          <Button type="submit" className="w-100" disabled={busy}>
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
    <section style={{ maxWidth: 1080 }}>
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
              <div className="text-truncate">{celebration.lines[0]?.description ?? `Dossier #${celebration.id}`}</div>
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
      <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
        <h1 className="h4 mb-0 me-2">Dossier de vente #{sale.id}</h1>
        <Badge bg={SALE_STATUS_VARIANTS[sale.status]} text={sale.status === "ordered" ? "dark" : undefined}>
          {SALE_STATUS_LABELS[sale.status]}
        </Badge>
        {sale.editable && !editing && (
          <div className="ms-auto d-flex gap-2">
            <Button size="sm" variant="outline-secondary" onClick={() => setEditing(true)}>
              Modifier
            </Button>
            <ConfirmButton message="Supprimer ce brouillon ?" confirmLabel="Oui, supprimer" cancelLabel="Non" onConfirm={removeDraft}>
              Supprimer
            </ConfirmButton>
          </div>
        )}
      </div>

      <ol className="chc-steps mb-5">
        {STEPS.map((step, index) => (
          <li key={step.key} className={index < stepIndex ? "is-done" : index === stepIndex ? "is-current" : undefined}>
            <span className="chc-steps-dot" aria-hidden="true">{index < stepIndex ? "✓" : index + 1}</span>
            {step.label}
          </li>
        ))}
      </ol>

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
          {/* Amounts */}
          <Col lg={5}>
            <Card className="h-100">
              <Card.Body className="p-3 p-md-4">
                <h2 className="h6 mb-3">Montants</h2>
                <div className="d-flex justify-content-between mb-1"><span>Total TVAC</span><strong className="chc-num">{formatEuros(sale.totals.total)}</strong></div>
                {sale.vatRegime === "standard" && (
                  <div className="small text-secondary">
                    dont TVA 21 % : {formatEuros(sale.totals.vat)} (HTVA {formatEuros(sale.totals.net)})
                  </div>
                )}
                <div className="d-flex justify-content-between mt-3 mb-1"><span>Encaissé</span><span className="chc-num">{formatEuros(sale.totals.paid)}</span></div>
                <div className="d-flex justify-content-between fw-bold"><span>Reste à payer</span><span className="chc-num">{formatEuros(sale.totals.due)}</span></div>
                <ProgressBar now={progress} variant={progress >= 100 ? "success" : "primary"} className="mt-4" aria-label={`Payé à ${progress} %`} />
                <div className="small text-secondary mt-2">Payé à {progress} %</div>
                <hr className="my-4" />
                <div className="small text-secondary">{VAT_REGIME_LABELS[sale.vatRegime]}</div>
                {sale.listing && (
                  <div className="small mt-2">
                    Annonce : <Link href={withLocale(listingPath(sale.listing))}>{sale.listing.title}</Link>
                    {sale.listing.status === "sold" && <Badge bg="dark" className="ms-2">Vendue</Badge>}
                  </div>
                )}
                {sale.vehicleVin && <div className="small mt-2">VIN : <span className="font-monospace">{sale.vehicleVin}</span></div>}
              </Card.Body>
            </Card>
          </Col>

          {/* Buyer */}
          <Col lg={7}>
            <Card className="h-100">
              <Card.Body className="p-3 p-md-4">
                <h2 className="h6 mb-3">Acheteur</h2>
                <div className="fw-semibold fs-6 mb-1">
                  {sale.buyer.name}
                  {sale.buyer.company && <span className="text-secondary fw-normal"> · {sale.buyer.company}</span>}
                </div>
                <div className="small text-secondary">
                  {[sale.buyer.address, [sale.buyer.postalCode, sale.buyer.city].filter(Boolean).join(" "), sale.buyer.country]
                    .filter(Boolean)
                    .join(", ") || "Adresse non renseignée"}
                </div>
                <div className="small mt-2">
                  {sale.buyer.email && <a href={`mailto:${sale.buyer.email}`}>{sale.buyer.email}</a>}
                  {sale.buyer.email && sale.buyer.phone && " · "}
                  {sale.buyer.phone && <a href={`tel:${sale.buyer.phone.replace(/[^+0-9]/g, "")}`}>{sale.buyer.phone}</a>}
                </div>
                {sale.buyer.vatNumber && <div className="small mt-2">TVA : {sale.buyer.vatNumber}</div>}
                {sale.notes && <p className="small mt-3 mb-0 chc-resa-message">{sale.notes}</p>}
              </Card.Body>
            </Card>
          </Col>

          {/* Lines */}
          <Col xs={12}>
            <Card>
              <Card.Body className="p-3 p-md-4">
                <h2 className="h6 mb-3">Lignes</h2>
                <Table responsive className="mb-0 align-middle chc-sale-lines">
                  <thead>
                    <tr>
                      <th>Désignation</th>
                      <th className="text-end">Qté</th>
                      <th className="text-end">Prix unit. TVAC</th>
                      <th className="text-end">Total TVAC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.lines.map((line) => (
                      <tr key={line.id}>
                        <td>{line.description}</td>
                        <td className="text-end chc-num">{line.quantity}</td>
                        <td className="text-end chc-num">{formatEuros(line.unitPrice)}</td>
                        <td className="text-end chc-num">{formatEuros(line.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {!sale.editable && (
                  <div className="small text-secondary mt-3">
                    Un document a été émis : le contenu du dossier est figé.
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Payments */}
          <Col lg={7}>
            <Card className="h-100">
              <Card.Body className="p-3 p-md-4">
                <h2 className="h6 mb-3">Paiements</h2>
                {sale.payments.length === 0 ? (
                  <p className="small text-secondary mb-4">Aucun paiement enregistré.</p>
                ) : (
                  <ul className="list-unstyled mb-4 chc-payments">
                    {sale.payments.map((payment) => (
                      <li key={payment.id}>
                        <span>
                          <span className="fw-semibold chc-num">{formatEuros(payment.amount)}</span>
                          <span className="small text-secondary">
                            {" "}· {formatDay(payment.paidOn)} · {PAYMENT_METHOD_LABELS[payment.method]}
                            {payment.reference && ` · ${payment.reference}`}
                          </span>
                        </span>
                        {payment.deletable && (
                          <ConfirmButton
                            variant="outline-secondary"
                            message="Supprimer ce paiement (erreur de saisie) ?"
                            confirmLabel="Oui, supprimer"
                            cancelLabel="Non"
                            onConfirm={() => run(() => saleService.deletePayment(sale.id, payment.id), "Suppression impossible")}
                          >
                            Supprimer
                          </ConfirmButton>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {sale.status === "paid" ? (
                  <Alert variant="success" className="mb-0 py-2 small">Dossier entièrement payé.</Alert>
                ) : (
                  <PaymentForm key={sale.totals.due} sale={sale} onDone={paymentRecorded} />
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Documents */}
          <Col lg={5}>
            <Card className="h-100">
              <Card.Body className="p-3 p-md-4">
                <h2 className="h6 mb-3">Documents</h2>
                {sale.documents.length === 0 ? (
                  <p className="small text-secondary mb-0">
                    Le bon de commande sera généré au premier paiement (avance), la facture une fois tout payé.
                  </p>
                ) : (
                  <ul className="list-unstyled mb-0 chc-payments">
                    {sale.documents.map((document) => (
                      <li key={document.id}>
                        <span>
                          <span className="fw-semibold">{DOCUMENT_KIND_LABELS[document.kind]}</span>{" "}
                          <span className="small text-secondary">
                            {document.number} · {new Date(document.issuedAt).toLocaleDateString("fr-BE")}
                          </span>
                        </span>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="chc-icon-btn"
                          aria-label={`Télécharger ${document.number} (PDF)`}
                          title={`Télécharger ${document.filename}`}
                          onClick={() => void download(document.id, document.filename)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
                          </svg>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </section>
  );
}
