import type { Request, Response } from "express";
import {
  createListingSchema,
  listListingQuerySchema,
  listingIdParamSchema,
  updateListingSchema,
  updateListingStatusSchema,
} from "../dto/listing.dto";
import { listingService } from "../services/listing.service";
import { actorOf } from "../utils/actor";
import { success } from "../utils/apiResponse";

/**
 * HTTP layer for `/api/listings`. `list` and `get` are public; `create`,
 * `update`, `updateStatus` and `remove` are admin-only (route middleware).
 */
export const listingController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listListingQuerySchema.parse(req.query);
    const listings = await listingService.list(query);
    res.status(200).json(success(listings));
  },

  async get(req: Request, res: Response): Promise<void> {
    const { id } = listingIdParamSchema.parse(req.params);
    const listing = await listingService.getById(id);
    res.status(200).json(success(listing));
  },

  async create(req: Request, res: Response): Promise<void> {
    const dto = createListingSchema.parse(req.body);
    const listing = await listingService.create(actorOf(req), dto);
    res.status(201).json(success(listing));
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = listingIdParamSchema.parse(req.params);
    const dto = updateListingSchema.parse(req.body);
    const listing = await listingService.update(id, dto);
    res.status(200).json(success(listing));
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const { id } = listingIdParamSchema.parse(req.params);
    const { status } = updateListingStatusSchema.parse(req.body);
    const listing = await listingService.updateStatus(id, status);
    res.status(200).json(success(listing));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = listingIdParamSchema.parse(req.params);
    await listingService.remove(id);
    res.status(204).send();
  },
};
