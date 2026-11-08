import { z } from "zod";
import { RESERVATION_STATUSES, RESERVATION_TYPES } from "../entities/Reservation";
import { FRONT_LOCALES } from "./auth.dto";

export const reservationIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/** International-friendly phone: digits, spaces, `+ ( ) . -`, 6–30 chars. */
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ().-]{6,30}$/, "Invalid phone number");

/** `POST /reservations` — signed-in customer; name and e-mail come from the account. */
export const createReservationSchema = z
  .object({
    listingId: z.number().int().positive(),
    type: z.enum(RESERVATION_TYPES),
    phone: phoneSchema,
    /** Required for a `visit` (ISO 8601 date-time). */
    visitAt: z.string().datetime({ offset: true }).optional(),
    message: z.string().trim().max(1000).optional(),
    /** Language of the e-mails sent to the customer. */
    locale: z.enum(FRONT_LOCALES).default("fr"),
  })
  .strict()
  .refine((dto) => dto.type !== "visit" || dto.visitAt !== undefined, {
    message: "A visit needs a date and time",
    path: ["visitAt"],
  });

/** `GET /reservations` (admin) filters. */
export const listReservationsQuerySchema = z
  .object({
    status: z.enum(RESERVATION_STATUSES).optional(),
    type: z.enum(RESERVATION_TYPES).optional(),
  })
  .strict();

/** Admin decisions on a request. */
export const ADMIN_DECISIONS = ["confirmed", "declined", "cancelled"] as const;

/** `PATCH /reservations/:id` (admin). */
export const decideReservationSchema = z
  .object({
    status: z.enum(ADMIN_DECISIONS),
    /** Confirmed hold: how many days the car is kept aside (default 7). */
    holdDays: z.number().int().min(1).max(30).optional(),
    /** Confirmed visit: the slot actually agreed, if it differs. */
    visitAt: z.string().datetime({ offset: true }).optional(),
    /** Shown to the customer in the e-mail (e.g. why it is declined). */
    adminNote: z.string().trim().max(500).optional(),
  })
  .strict();

export type CreateReservationDto = z.infer<typeof createReservationSchema>;
export type ListReservationsQuery = z.infer<typeof listReservationsQuerySchema>;
export type DecideReservationDto = z.infer<typeof decideReservationSchema>;
