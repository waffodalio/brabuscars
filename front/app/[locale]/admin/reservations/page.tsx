"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Spinner from "react-bootstrap/Spinner";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useLanguage } from "@/context/LanguageContext";
import { INTL_LOCALES } from "@/i18n/locales";
import { reservationService } from "@/services/reservationService";
import type {
  Reservation,
  ReservationDecision,
  ReservationStatus,
  ReservationType,
} from "@/types/reservation";
import { errorMessage } from "@/utils/errors";
import { formatPrice } from "@/utils/listingLabels";
import { ConfirmButton } from "@/components/ConfirmButton";
import { listingPath } from "@/utils/listingPath";
import { isOpenReservation, unavailableLabel } from "@/utils/reservationAvailability";
import {
  RESERVATION_STATUS_VARIANTS,
  formatReservationDay,
  formatSlot,
} from "@/utils/reservationLabels";

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "À traiter",
  confirmed: "Confirmée",
  declined: "Refusée",
  cancelled: "Annulée",
};
const TYPE_LABELS: Record<ReservationType, string> = {
  hold: "Mise de côté",
  visit: "Essai / visite",
};

type Tab = ReservationStatus | "all";
const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "À traiter" },
  { key: "confirmed", label: "Confirmées" },
  { key: "declined", label: "Refusées" },
  { key: "cancelled", label: "Annulées" },
  { key: "all", label: "Toutes" },
];

const HOLD_DAYS = [3, 7, 14, 30];

/** `YYYY-MM-DDTHH:mm` of an ISO date in the browser's time (for `datetime-local`). */
function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const DECISION_TITLES: Record<ReservationDecision, string> = {
  confirmed: "Confirmer la demande",
  declined: "Refuser la demande",
  cancelled: "Annuler la réservation",
};

/** Confirm / decline / cancel, with the type-specific settings and a note for the customer. */
function DecisionModal({
  reservation,
  decision,
  onClose,
  onDone,
}: {
  reservation: Reservation;
  decision: ReservationDecision;
  onClose: () => void;
  onDone: (updated: Reservation) => void;
}) {
  const [holdDays, setHoldDays] = useState(7);
  const [visitAt, setVisitAt] = useState(reservation.visitAt ? toLocalInput(reservation.visitAt) : "");
  // Car sold / taken offline: the customer is told why, pre-filled.
  const unavailable = unavailableLabel(reservation.listing.status);
  const [note, setNote] = useState(
    unavailable && decision !== "confirmed"
      ? reservation.listing.status === "sold"
        ? "Ce véhicule a été vendu entre-temps. N'hésitez pas à nous contacter : nous vous proposerons volontiers un modèle similaire."
        : "Ce véhicule n'est plus disponible à la vente. N'hésitez pas à nous contacter pour un autre modèle."
      : "",
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const movedVisit =
        decision === "confirmed" &&
        reservation.type === "visit" &&
        visitAt &&
        visitAt !== (reservation.visitAt ? toLocalInput(reservation.visitAt) : "");
      const updated = await reservationService.decide(reservation.id, {
        status: decision,
        ...(decision === "confirmed" && reservation.type === "hold" ? { holdDays } : {}),
        ...(movedVisit ? { visitAt: new Date(visitAt).toISOString() } : {}),
        ...(note.trim() ? { adminNote: note.trim() } : {}),
      });
      onDone(updated);
    } catch (err) {
      setError(errorMessage(err, "Action impossible"));
      setBusy(false);
    }
  }

  return (
    <Modal show onHide={onClose} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">{DECISION_TITLES[decision]}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-secondary">
            {TYPE_LABELS[reservation.type]} · <span className="fw-semibold text-body">{reservation.listing.title}</span>
            <br />
            {reservation.customer.firstName} {reservation.customer.lastName}
          </p>
          <ErrorAlert message={error} />

          {decision === "confirmed" && reservation.type === "hold" && (
            <Form.Group className="mb-3" controlId="decision-days">
              <Form.Label>Mettre de côté pendant</Form.Label>
              <Form.Select value={holdDays} onChange={(e) => setHoldDays(Number(e.target.value))}>
                {HOLD_DAYS.map((days) => (
                  <option key={days} value={days}>
                    {days} jours
                  </option>
                ))}
              </Form.Select>
              <Form.Text muted>
                L&apos;annonce affichera « Réservé » ; aucune autre mise de côté ne sera possible d&apos;ici là.
              </Form.Text>
            </Form.Group>
          )}

          {decision === "confirmed" && reservation.type === "visit" && (
            <Form.Group className="mb-3" controlId="decision-visit">
              <Form.Label>Créneau du rendez-vous</Form.Label>
              <Form.Control type="datetime-local" value={visitAt} onChange={(e) => setVisitAt(e.target.value)} required />
              <Form.Text muted>Modifiez-le si vous avez convenu d&apos;un autre horaire avec le client.</Form.Text>
            </Form.Group>
          )}

          <Form.Group controlId="decision-note">
            <Form.Label>Message au client (facultatif)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                decision === "declined" ? "Ex. : véhicule déjà vendu, créneau indisponible…" : "Ex. : pensez à apporter votre permis."
              }
            />
            <Form.Text muted>Il est repris dans l&apos;e-mail envoyé au client.</Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} disabled={busy}>
            Fermer
          </Button>
          <Button
            type="submit"
            variant={decision === "confirmed" ? "success" : "danger"}
            disabled={busy}
          >
            {DECISION_TITLES[decision]}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

/** Back-office: reservation requests (put aside / visit), pending ones first. */
export default function AdminReservationsPage() {
  const { withLocale } = useLanguage();
  const [items, setItems] = useState<Reservation[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("pending");
  const [type, setType] = useState<ReservationType | "all">("all");
  const [deciding, setDeciding] = useState<{ reservation: Reservation; decision: ReservationDecision } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    reservationService
      .list()
      .then((data) => {
        setItems(data);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        setError(errorMessage(err, "Erreur inconnue"));
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const byStatus: Partial<Record<Tab, number>> = { all: items.length };
    for (const r of items) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    return byStatus;
  }, [items]);

  // Requests in progress on a car that can no longer be sold.
  const conflicts = items.filter((r) => isOpenReservation(r) && unavailableLabel(r.listing.status)).length;

  const shown = items
    .filter((r) => tab === "all" || r.status === tab)
    .filter((r) => type === "all" || r.type === type)
    // Pending: oldest first (first come, first served); others: newest first.
    .sort((a, b) =>
      tab === "pending"
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt),
    );

  function replace(updated: Reservation) {
    setItems((current) => current.map((r) => (r.id === updated.id ? updated : r)));
  }

  async function remove(reservation: Reservation) {
    setBusyId(reservation.id);
    setError("");
    try {
      await reservationService.remove(reservation.id);
      setItems((current) => current.filter((r) => r.id !== reservation.id));
    } catch (err) {
      setError(errorMessage(err, "Suppression impossible"));
    } finally {
      setBusyId(null);
    }
  }

  if (status === "loading") {
    return <Spinner animation="border" role="status" aria-label="Chargement" />;
  }
  if (status === "error") {
    return <ErrorAlert message={error} />;
  }

  return (
    <section>
      <p className="text-secondary">
        Demandes de mise de côté et de rendez-vous d&apos;essai faites par les clients connectés. Le client
        est prévenu par e-mail de chaque décision.
      </p>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <div className="chc-segmented" role="group" aria-label="Statut">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={tab === t.key ? "is-active" : undefined}
              aria-pressed={tab === t.key}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {(counts[t.key] ?? 0) > 0 && <span className="chc-tab-count">{counts[t.key]}</span>}
            </button>
          ))}
        </div>
        <Form.Select
          size="sm"
          className="w-auto ms-auto"
          aria-label="Type de demande"
          value={type}
          onChange={(e) => setType(e.target.value as ReservationType | "all")}
        >
          <option value="all">Tous les types</option>
          <option value="hold">Mises de côté</option>
          <option value="visit">Essais / visites</option>
        </Form.Select>
      </div>

      <ErrorAlert message={error} />

      {conflicts > 0 && (
        <Alert variant="danger" className="d-flex flex-wrap align-items-center gap-2">
          <strong>
            {conflicts} demande{conflicts > 1 ? "s" : ""} en cours concerne{conflicts > 1 ? "nt" : ""} un véhicule qui
            n&apos;est plus en vente
          </strong>
          <span>(vendu, archivé ou hors ligne) : refusez ou annulez-les pour prévenir le client.</span>
        </Alert>
      )}

      {shown.length === 0 ? (
        <Alert variant="light" className="border">
          {tab === "pending" ? "Aucune demande à traiter." : "Aucune demande ici."}
        </Alert>
      ) : (
        <div className="d-flex flex-column gap-3">
          {shown.map((r) => (
            <Card
              key={r.id}
              className={
                isOpenReservation(r) && unavailableLabel(r.listing.status)
                  ? "border-danger"
                  : r.status === "pending"
                    ? "border-warning-subtle"
                    : undefined
              }
            >
              <Card.Body className="d-flex flex-column flex-md-row gap-3">
                <div className="chc-stats-thumb d-none d-sm-block">
                  {r.listing.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.listing.thumbnailUrl} alt="" loading="lazy" />
                  )}
                </div>

                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                    <Badge bg={r.type === "hold" ? "primary" : "info"}>{TYPE_LABELS[r.type]}</Badge>
                    {isOpenReservation(r) && unavailableLabel(r.listing.status) && (
                      <Badge bg="danger">⚠ {unavailableLabel(r.listing.status)}</Badge>
                    )}
                    <Badge bg={RESERVATION_STATUS_VARIANTS[r.status]} text={r.status === "pending" ? "dark" : undefined}>
                      {STATUS_LABELS[r.status]}
                    </Badge>
                    <Link href={withLocale(listingPath(r.listing))} className="fw-semibold text-reset text-truncate">
                      {r.listing.title}
                    </Link>
                    <span className="small text-secondary">{formatPrice(r.listing.price)}</span>
                  </div>

                  <div className="small">
                    <span className="fw-semibold">
                      {r.customer.firstName} {r.customer.lastName}
                    </span>
                    {r.hasAccount && <Badge bg="light" text="dark" className="border ms-2">Client inscrit</Badge>}
                    <span className="text-secondary"> · </span>
                    <a href={`mailto:${r.customer.email}`}>{r.customer.email}</a>
                    <span className="text-secondary"> · </span>
                    <a href={`tel:${r.customer.phone.replace(/[^+0-9]/g, "")}`}>{r.customer.phone}</a>
                  </div>

                  <div className="small mt-1">
                    {r.type === "visit" && r.visitAt && (
                      <span className="fw-semibold">Rendez-vous : {formatSlot(r.visitAt)}</span>
                    )}
                    {r.type === "hold" && r.status === "confirmed" && r.holdUntil && (
                      <span className="fw-semibold">Réservé jusqu&apos;au {formatReservationDay(r.holdUntil)}</span>
                    )}
                    <span className="text-secondary">
                      {(r.visitAt || (r.status === "confirmed" && r.holdUntil)) && " · "}
                      Demandé le {new Date(r.createdAt).toLocaleString(INTL_LOCALES.fr, { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>

                  {r.message && (
                    <p className="small mt-2 mb-0 chc-resa-message" style={{ whiteSpace: "pre-line" }}>
                      {r.message}
                    </p>
                  )}
                  {r.adminNote && (
                    <p className="small text-secondary mt-2 mb-0">
                      Votre message au client : {r.adminNote}
                    </p>
                  )}
                </div>

                <div className="d-flex flex-md-column gap-2 flex-wrap align-items-start align-items-md-end">
                  {r.status === "pending" && (
                    <>
                      {!unavailableLabel(r.listing.status) && (
                        <Button size="sm" variant="success" onClick={() => setDeciding({ reservation: r, decision: "confirmed" })}>
                          Confirmer
                        </Button>
                      )}
                      <Button size="sm" variant="outline-danger" onClick={() => setDeciding({ reservation: r, decision: "declined" })}>
                        Refuser
                      </Button>
                    </>
                  )}
                  {r.status === "confirmed" && (
                    <Button size="sm" variant="outline-danger" onClick={() => setDeciding({ reservation: r, decision: "cancelled" })}>
                      Annuler
                    </Button>
                  )}
                  {(r.status === "declined" || r.status === "cancelled") && (
                    <ConfirmButton
                      variant="outline-secondary"
                      disabled={busyId === r.id}
                      message={<>Supprimer la demande de {r.customer.firstName} {r.customer.lastName} ?</>}
                      confirmLabel="Oui, supprimer"
                      cancelLabel="Non"
                      onConfirm={() => remove(r)}
                    >
                      Supprimer
                    </ConfirmButton>
                  )}
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {deciding && (
        <DecisionModal
          reservation={deciding.reservation}
          decision={deciding.decision}
          onClose={() => setDeciding(null)}
          onDone={(updated) => {
            replace(updated);
            setDeciding(null);
          }}
        />
      )}
    </section>
  );
}
