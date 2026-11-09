"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import Spinner from "react-bootstrap/Spinner";
import { ConfirmButton } from "@/components/ConfirmButton";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useLanguage } from "@/context/LanguageContext";
import { usePublicErrorMessage } from "@/hooks/usePublicErrorMessage";
import { reservationService } from "@/services/reservationService";
import type { Reservation } from "@/types/reservation";
import { listingPath } from "@/utils/listingPath";
import { isOpenReservation } from "@/utils/reservationAvailability";
import {
  RESERVATION_STATUS_VARIANTS,
  formatReservationDay,
  formatSlot,
} from "@/utils/reservationLabels";

/**
 * The signed-in customer's reservations, with a way to withdraw open ones
 * (confirmed in a bubble; a cancelled request leaves the list).
 */
export function MyReservations() {
  const { t, locale, withLocale } = useLanguage();
  const toMessage = usePublicErrorMessage();
  const [items, setItems] = useState<Reservation[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    reservationService
      .mine()
      .then(setItems)
      .catch((err: unknown) => {
        setItems([]);
        setError(toMessage(err, t.reservation.mineError));
      });
  }, [t, toMessage]);

  useEffect(() => {
    load();
  }, [load]);

  async function cancel(reservation: Reservation) {
    setBusyId(reservation.id);
    setError("");
    try {
      await reservationService.cancelMine(reservation.id);
      // A cancelled request leaves the list.
      setItems((current) => current?.filter((r) => r.id !== reservation.id) ?? null);
    } catch (err) {
      setError(toMessage(err, t.reservation.error));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card className="mb-4">
      <Card.Body className="p-4">
        <h2 className="h5 mb-3">{t.reservation.mineTitle}</h2>
        <ErrorAlert message={error} />
        {items === null ? (
          <Spinner animation="border" size="sm" role="status" aria-label={t.common.loading} />
        ) : items.length === 0 ? (
          <p className="text-secondary mb-0">{t.reservation.mineEmpty}</p>
        ) : (
          <ul className="list-unstyled mb-0 chc-my-resa">
            {items.map((r) => (
              <li key={r.id}>
                <div className="chc-my-resa-thumb">
                  {r.listing.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.listing.thumbnailUrl} alt="" loading="lazy" />
                  )}
                </div>
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <Link href={withLocale(listingPath(r.listing))} className="fw-semibold text-reset text-truncate">
                      {r.listing.title}
                    </Link>
                    <Badge bg={RESERVATION_STATUS_VARIANTS[r.status]} text={r.status === "pending" ? "dark" : undefined}>
                      {t.reservation.statuses[r.status]}
                    </Badge>
                    {isOpenReservation(r) && r.listing.status !== "published" && (
                      <Badge bg="danger">
                        {r.listing.status === "sold" ? t.reservation.listingSold : t.reservation.listingUnavailable}
                      </Badge>
                    )}
                  </div>
                  <div className="small text-secondary">
                    {t.reservation.types[r.type]}
                    {r.type === "visit" && r.visitAt && <> · {t.reservation.visitOn(formatSlot(r.visitAt, locale))}</>}
                    {r.type === "hold" && r.status === "confirmed" && r.holdUntil && (
                      <> · {t.reservation.holdUntil(formatReservationDay(r.holdUntil, locale))}</>
                    )}
                  </div>
                  {r.adminNote && (
                    <div className="small mt-1">
                      <span className="text-secondary">{t.reservation.dealershipNote}</span> {r.adminNote}
                    </div>
                  )}
                </div>
                {(r.status === "pending" || r.status === "confirmed") && (
                  <ConfirmButton
                    variant="outline-secondary"
                    className="text-nowrap align-self-center"
                    disabled={busyId === r.id}
                    message={t.reservation.mineCancelConfirm}
                    confirmLabel={t.reservation.mineCancelYes}
                    onConfirm={() => cancel(r)}
                  >
                    {t.reservation.mineCancel}
                  </ConfirmButton>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card.Body>
    </Card>
  );
}
