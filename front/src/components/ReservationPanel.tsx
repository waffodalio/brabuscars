"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Row from "react-bootstrap/Row";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { usePublicErrorMessage } from "@/hooks/usePublicErrorMessage";
import { ApiClientError } from "@/services/apiClient";
import { reservationService } from "@/services/reservationService";
import type { Listing } from "@/types/listing";
import type { ReservationType } from "@/types/reservation";
import { setReservationIntent } from "@/utils/reservationIntent";
import { listingPath } from "@/utils/listingPath";
import { setReturnPath } from "@/utils/returnPath";

/** Visit slots offered: every half hour, 08:00 → 19:30 (dealership hours). */
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const minutes = 8 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

/** `YYYY-MM-DD` of a local date. */
function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const EMPTY = { phone: "", date: "", time: "", message: "" };

/** Query parameter that reopens the form after the login detour. */
export const RESERVE_PARAM = "reserver";

/**
 * "Interested in this car?" box of a listing page: put the car aside or book
 * a visit / test drive. Reserving needs an account: a visitor is taken
 * straight to the login page and brought back here afterwards, with the form
 * open (`?reserver=hold|visit`, see `initialType`). A car already held can
 * still be visited.
 */
export function ReservationPanel({
  listing,
  initialType = null,
}: {
  listing: Listing;
  /** Form to open on arrival (back from the login page). */
  initialType?: ReservationType | null;
}) {
  const { user, initializing } = useAuth();
  const router = useRouter();
  const { t, locale, withLocale } = useLanguage();
  const toMessage = usePublicErrorMessage();
  // Back from the login page to put aside a car held meanwhile: open nothing.
  const [type, setType] = useState<ReservationType | null>(() =>
    initialType === "hold" && listing.reserved ? null : initialType,
  );
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [heldNow, setHeldNow] = useState(false);
  const reserved = Boolean(listing.reserved) || heldNow;

  const today = new Date();
  const maxDay = new Date(today.getTime() + 89 * 86_400_000);

  function open(next: ReservationType) {
    if (initializing) return; // session not known yet
    if (!user) {
      // Visitor: straight to the login page, back here afterwards with this form open.
      setReturnPath(`/${locale}${listingPath(listing)}?${RESERVE_PARAM}=${next}`);
      setReservationIntent(listing.id, next);
      router.push(withLocale("/connexion"));
      return;
    }
    setType(next);
    setError("");
    setSent(false);
  }

  function close() {
    setType(null);
    if (sent) setForm(EMPTY);
  }

  function update(field: keyof typeof EMPTY) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!type) return;
    setError("");
    setSubmitting(true);
    try {
      await reservationService.create({
        listingId: listing.id,
        type,
        phone: form.phone,
        visitAt:
          type === "visit" ? new Date(`${form.date}T${form.time}:00`).toISOString() : undefined,
        message: form.message || undefined,
        locale,
      });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        const held = /already reserved/i.test(err.message);
        if (held) setHeldNow(true);
        setError(held ? t.reservation.alreadyReserved : t.reservation.duplicate);
      } else {
        setError(toMessage(err, t.reservation.error));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const title = type === "hold" ? t.reservation.modalHoldTitle : t.reservation.modalVisitTitle;

  return (
    <div className="chc-reserve">
      {reserved && <div className="chc-reserve-note">{t.reservation.reservedNotice}</div>}
      <div className="chc-reserve-actions">
        {!reserved && (
          <button
            type="button"
            className="chc-reserve-tile chc-reserve-tile--main"
            title={t.reservation.holdHint}
            onClick={() => open("hold")}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {t.reservation.holdAction}
          </button>
        )}
        <button
          type="button"
          className="chc-reserve-tile"
          title={t.reservation.visitHint}
          onClick={() => open("visit")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          </svg>
          {t.reservation.visitAction}
        </button>
      </div>

      <Modal show={Boolean(user) && type !== null} onHide={close} centered>
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">
            {title}
          </Modal.Title>
        </Modal.Header>

        {!user ? null : sent ? (
          <>
            <Modal.Body>
              <div className="text-center py-2">
                <div className="chc-reserve-done" aria-hidden="true">✓</div>
                <h3 className="h5 mt-3">{t.reservation.sentPendingTitle}</h3>
                <p className="text-secondary mb-0">{t.reservation.sentPending}</p>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Link href={withLocale("/mon-compte")} className="btn btn-outline-secondary">
                {t.reservation.seeAccount}
              </Link>
              <Button onClick={close}>{t.reservation.close}</Button>
            </Modal.Footer>
          </>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <p className="small text-secondary">
                <span className="fw-semibold text-body">{listing.title}</span>
              </p>
              <ErrorAlert message={error} />
              <Alert variant="light" className="border small py-2">
                {t.reservation.accountNote(`${user.firstName} ${user.lastName}`)}
              </Alert>

              <Form.Group className="mb-3" controlId="resa-phone">
                <Form.Label>{t.reservation.phone}</Form.Label>
                <Form.Control
                  type="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  required
                  minLength={6}
                  maxLength={30}
                  autoComplete="tel"
                />
                <Form.Text muted>{t.reservation.phoneHint}</Form.Text>
              </Form.Group>

              {type === "visit" && (
                <Row className="g-3 mb-3">
                  <Col sm={7}>
                    <Form.Group controlId="resa-date">
                      <Form.Label>{t.reservation.date}</Form.Label>
                      <Form.Control
                        type="date"
                        value={form.date}
                        onChange={update("date")}
                        min={isoDay(today)}
                        max={isoDay(maxDay)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={5}>
                    <Form.Group controlId="resa-time">
                      <Form.Label>{t.reservation.time}</Form.Label>
                      <Form.Select value={form.time} onChange={update("time")} required>
                        <option value="" disabled>
                          —
                        </option>
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col xs={12} className="mt-1">
                    <Form.Text muted>{t.reservation.slotHint}</Form.Text>
                  </Col>
                </Row>
              )}

              <Form.Group controlId="resa-message">
                <Form.Label>{t.reservation.message}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={form.message}
                  onChange={update("message")}
                  maxLength={1000}
                  placeholder={t.reservation.messagePlaceholder}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={close} disabled={submitting}>
                {t.reservation.cancel}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? t.reservation.submitting : t.reservation.submit}
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>
    </div>
  );
}
