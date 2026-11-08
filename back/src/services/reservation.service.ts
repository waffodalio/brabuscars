import { AppDataSource } from "../config/data-source";
import { env } from "../config/env";
import type { FrontLocale } from "../dto/auth.dto";
import { FRONT_LOCALES } from "../dto/auth.dto";
import type {
  CreateReservationDto,
  DecideReservationDto,
  ListReservationsQuery,
} from "../dto/reservation.dto";
import { Listing } from "../entities/Listing";
import { Reservation } from "../entities/Reservation";
import { listingRepository } from "../repositories/listing.repository";
import { reservationRepository } from "../repositories/reservation.repository";
import { userRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/ApiError";
import { frontUrl } from "../utils/frontUrl";
import { isPublished } from "../utils/listingVisibility";
import {
  DEFAULT_HOLD_DAYS,
  canMoveTo,
  customerCanCancel,
  holdEnd,
  visitSlotProblem,
} from "../utils/reservationRules";
import {
  toReservationResponse,
  type ReservationResponse,
} from "../utils/reservationResponse";
import { mailer } from "./mail/mailer";
import type { MailMessage } from "./mail/mailer";
import {
  reservationAdminNotice,
  reservationDecisionEmail,
  reservationReceivedEmail,
} from "./mail/reservationTemplates";

const ALREADY_HELD = "This vehicle is already reserved";

/** E-mails never fail the request that triggers them; failures are logged. */
function send(message: MailMessage, what: string): void {
  mailer.send(message).catch((err: unknown) => {
    console.error(`[mail] ${what} failed:`, err);
  });
}

const localeOf = (reservation: Reservation): FrontLocale =>
  (FRONT_LOCALES as readonly string[]).includes(reservation.locale)
    ? (reservation.locale as FrontLocale)
    : "fr";

function notifyDealership(reservation: Reservation, event: "new" | "cancelled"): void {
  send(
    reservationAdminNotice({
      to: env.COMPANY_EMAIL,
      company: env.COMPANY_NAME,
      event,
      type: reservation.type,
      listingTitle: reservation.listing.title,
      customer: `${reservation.firstName} ${reservation.lastName}`,
      email: reservation.email,
      phone: reservation.phone,
      visitAt: reservation.visitAt,
      message: reservation.message,
      link: frontUrl("fr", "/admin/reservations"),
    }),
    "reservation notice to the dealership",
  );
}

function notifyReceived(reservation: Reservation): void {
  send(
    reservationReceivedEmail({
      to: reservation.email,
      firstName: reservation.firstName,
      locale: localeOf(reservation),
      company: env.COMPANY_NAME,
      type: reservation.type,
      listingTitle: reservation.listing.title,
      visitAt: reservation.visitAt,
    }),
    "reservation receipt",
  );
}

/** A confirmed request whose visit took place / whose hold ran out. */
function isOver(reservation: Reservation, now = Date.now()): boolean {
  const end = reservation.type === "visit" ? reservation.visitAt : reservation.holdUntil;
  return end !== null && end.getTime() <= now;
}

/** Published listing or 404 (a draft's existence is not revealed). */
async function loadBookableListing(listingId: number): Promise<Listing> {
  const listing = await listingRepository.findById(listingId);
  if (!listing || !isPublished(listing)) {
    throw ApiError.notFound(`Listing ${listingId} not found`);
  }
  return listing;
}

async function loadOrFail(id: number): Promise<Reservation> {
  const reservation = await reservationRepository.findById(id);
  if (!reservation) throw ApiError.notFound(`Reservation ${id} not found`);
  return reservation;
}

/**
 * Reservations: a signed-in customer puts a car aside (`hold`) or books a
 * visit / test drive (`visit`) on a published listing (visitors are sent to
 * log in or sign up first). The request goes straight to the dealership
 * (`pending`); name and e-mail come from the account, the phone from the form.
 * Only one confirmed, running hold per listing: checked again under a lock on
 * the listing row when the back-office confirms one.
 */
export const reservationService = {
  async create(userId: number, dto: CreateReservationDto): Promise<ReservationResponse> {
    const listing = await loadBookableListing(dto.listingId);

    let visitAt: Date | null = null;
    if (dto.type === "visit") {
      visitAt = new Date(dto.visitAt ?? "");
      const problem = visitSlotProblem(visitAt);
      if (problem) throw ApiError.badRequest(problem);
    } else if (await reservationRepository.findActiveHold(listing.id)) {
      throw ApiError.conflict(ALREADY_HELD);
    }

    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.unauthorized("Account no longer exists");

    // One request in progress per customer, vehicle and kind. A confirmed one
    // that is over (visit passed, hold expired) no longer counts.
    const open = await reservationRepository.findOpen({
      listingId: listing.id,
      type: dto.type,
      email: user.email,
    });
    if (open.some((r) => r.status === "pending" || !isOver(r))) {
      throw ApiError.conflict("You already have a request in progress for this vehicle");
    }

    const saved = await reservationRepository.save(
      reservationRepository.create({
        listingId: listing.id,
        userId: user.id,
        type: dto.type,
        status: "pending",
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: dto.phone,
        message: dto.message || null,
        locale: dto.locale,
        visitAt,
        holdUntil: null,
        adminNote: null,
        decidedAt: null,
      }),
    );
    const created = await loadOrFail(saved.id);
    notifyReceived(created);
    notifyDealership(created, "new");
    return toReservationResponse(created);
  },

  async listForAdmin(query: ListReservationsQuery): Promise<ReservationResponse[]> {
    const rows = await reservationRepository.findForAdmin(query);
    return rows.map(toReservationResponse);
  },

  async listForUser(userId: number): Promise<ReservationResponse[]> {
    const rows = await reservationRepository.findForUser(userId);
    return rows.map(toReservationResponse);
  },

  /** Back-office decision; the customer is told by e-mail. */
  async decide(id: number, dto: DecideReservationDto): Promise<ReservationResponse> {
    const reservation = await loadOrFail(id);
    if (!canMoveTo(reservation.status, dto.status)) {
      throw ApiError.conflict(`A ${reservation.status} request cannot become ${dto.status}`);
    }

    const changes: Partial<Reservation> = {
      status: dto.status,
      decidedAt: new Date(),
      adminNote: dto.adminNote || null,
    };

    if (dto.status === "confirmed" && reservation.type === "visit" && dto.visitAt) {
      const visitAt = new Date(dto.visitAt);
      if (Number.isNaN(visitAt.getTime()) || visitAt.getTime() < Date.now()) {
        throw ApiError.badRequest("The visit must be in the future");
      }
      changes.visitAt = visitAt;
    }

    if (dto.status === "confirmed" && reservation.type === "hold") {
      changes.holdUntil = holdEnd(dto.holdDays ?? DEFAULT_HOLD_DAYS);
      // Lock the listing row so two holds can't be confirmed at once.
      await AppDataSource.transaction(async (manager) => {
        const listing = await manager.getRepository(Listing).findOne({
          where: { id: reservation.listingId },
          lock: { mode: "pessimistic_write" },
        });
        if (!listing || !isPublished(listing)) {
          throw ApiError.conflict("This listing is no longer published");
        }
        const running = await reservationRepository.findActiveHold(listing.id, manager);
        if (running && running.id !== reservation.id) throw ApiError.conflict(ALREADY_HELD);
        await manager.getRepository(Reservation).update({ id: reservation.id }, changes);
      });
    } else {
      if (dto.status === "cancelled" && reservation.type === "hold") changes.holdUntil = null;
      await reservationRepository.update({ id: reservation.id }, changes);
    }

    const saved = await loadOrFail(id);
    send(
      reservationDecisionEmail({
        to: saved.email,
        firstName: saved.firstName,
        locale: localeOf(saved),
        company: env.COMPANY_NAME,
        type: saved.type,
        listingTitle: saved.listing.title,
        status: dto.status,
        visitAt: saved.visitAt,
        holdUntil: saved.holdUntil,
        note: saved.adminNote,
        contact: `${env.COMPANY_PHONE} · ${env.COMPANY_EMAIL}`,
      }),
      "reservation decision",
    );
    return toReservationResponse(saved);
  },

  /** A signed-in customer withdraws one of their own requests. */
  async cancelByCustomer(userId: number, id: number): Promise<ReservationResponse> {
    const reservation = await reservationRepository.findById(id);
    // Someone else's request: same 404 as a missing one.
    if (!reservation || reservation.userId !== userId) {
      throw ApiError.notFound(`Reservation ${id} not found`);
    }
    if (!customerCanCancel(reservation.status)) {
      throw ApiError.conflict("This request can no longer be cancelled");
    }
    await reservationRepository.update(
      { id },
      { status: "cancelled", decidedAt: new Date(), holdUntil: null },
    );
    const saved = await loadOrFail(id);
    notifyDealership(saved, "cancelled");
    return toReservationResponse(saved);
  },

  async remove(id: number): Promise<void> {
    const result = await reservationRepository.delete({ id });
    if (!result.affected) throw ApiError.notFound(`Reservation ${id} not found`);
  },

  /** Listing ids, among these, currently held for a customer. */
  heldListingIds(listingIds: number[]): Promise<Set<number>> {
    return reservationRepository.heldListingIds(listingIds);
  },
};
