import { In, MoreThan, type EntityManager } from "typeorm";
import { AppDataSource } from "../config/data-source";
import {
  Reservation,
  type ReservationStatus,
  type ReservationType,
} from "../entities/Reservation";

/** Statuses of a request still "in progress" (blocks a duplicate). */
export const OPEN_STATUSES: ReservationStatus[] = ["pending", "confirmed"];

const WITH_LISTING = { listing: { model: { brand: true }, images: true } } as const;

/** Data-access layer for {@link Reservation}. */
export const reservationRepository = AppDataSource.getRepository(Reservation).extend({
  findById(id: number): Promise<Reservation | null> {
    return this.findOne({ where: { id }, relations: WITH_LISTING });
  },

  /** Back-office list, newest first. */
  findForAdmin(filters: { status?: ReservationStatus; type?: ReservationType }): Promise<Reservation[]> {
    return this.find({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.type ? { type: filters.type } : {}),
      },
      relations: WITH_LISTING,
      order: { createdAt: "DESC" },
    });
  },

  findForUser(userId: number): Promise<Reservation[]> {
    return this.find({
      where: { userId },
      relations: WITH_LISTING,
      order: { createdAt: "DESC" },
    });
  },

  /** Requests of this kind by this person on this listing not settled yet. */
  findOpen(params: {
    listingId: number;
    type: ReservationType;
    email: string;
  }): Promise<Reservation[]> {
    return this.find({
      where: {
        listingId: params.listingId,
        type: params.type,
        email: params.email,
        status: In(OPEN_STATUSES),
      },
    });
  },

  /**
   * Confirmed hold of a listing still running, if any. Pass the transaction's
   * manager to read it under the listing lock.
   */
  findActiveHold(listingId: number, manager?: EntityManager): Promise<Reservation | null> {
    const repo = manager ? manager.getRepository(Reservation) : this;
    return repo.findOne({
      where: {
        listingId,
        type: "hold",
        status: "confirmed",
        holdUntil: MoreThan(new Date()),
      },
    });
  },

  /** Ids, among `listingIds`, of the listings currently held for a customer. */
  async heldListingIds(listingIds: number[]): Promise<Set<number>> {
    if (listingIds.length === 0) return new Set();
    const rows = await this.find({
      select: { listingId: true },
      where: {
        listingId: In(listingIds),
        type: "hold",
        status: "confirmed",
        holdUntil: MoreThan(new Date()),
      },
    });
    return new Set(rows.map((row) => row.listingId));
  },

  countPending(): Promise<number> {
    return this.countBy({ status: "pending" });
  },
});
