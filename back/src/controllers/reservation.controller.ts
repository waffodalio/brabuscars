import type { Request, Response } from "express";
import {
  createReservationSchema,
  decideReservationSchema,
  listReservationsQuerySchema,
  reservationIdParamSchema,
} from "../dto/reservation.dto";
import { reservationService } from "../services/reservation.service";
import { ApiError } from "../utils/ApiError";
import { success } from "../utils/apiResponse";

/** HTTP layer for `/api/reservations`. Access rules live on the routes. */
export const reservationController = {
  async create(req: Request, res: Response): Promise<void> {
    if (!req.user) throw ApiError.unauthorized();
    const dto = createReservationSchema.parse(req.body);
    res.status(201).json(success(await reservationService.create(req.user.id, dto)));
  },

  async mine(req: Request, res: Response): Promise<void> {
    if (!req.user) throw ApiError.unauthorized();
    res.status(200).json(success(await reservationService.listForUser(req.user.id)));
  },

  async cancelMine(req: Request, res: Response): Promise<void> {
    if (!req.user) throw ApiError.unauthorized();
    const { id } = reservationIdParamSchema.parse(req.params);
    res.status(200).json(success(await reservationService.cancelByCustomer(req.user.id, id)));
  },

  async list(req: Request, res: Response): Promise<void> {
    const query = listReservationsQuerySchema.parse(req.query);
    res.status(200).json(success(await reservationService.listForAdmin(query)));
  },

  async decide(req: Request, res: Response): Promise<void> {
    const { id } = reservationIdParamSchema.parse(req.params);
    const dto = decideReservationSchema.parse(req.body);
    res.status(200).json(success(await reservationService.decide(id, dto)));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = reservationIdParamSchema.parse(req.params);
    await reservationService.remove(id);
    res.status(204).send();
  },
};
