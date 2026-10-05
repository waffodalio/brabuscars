import type { Request, Response } from "express";
import {
  createListingSchema,
  listListingQuerySchema,
  listingIdParamSchema,
  updateListingSchema,
  updateListingStatusSchema,
} from "../dto/listing.dto";
import { listingService } from "../services/listing.service";
import { hasRole } from "../middlewares/authenticate";
import { actorOf } from "../utils/actor";
import { ApiError } from "../utils/ApiError";
import { success } from "../utils/apiResponse";

/**
 * HTTP layer for `/api/listings`. `list` and `get` are public but
 * `optionalAuthenticate` runs first: non-admin callers only ever see
 * `published` adverts. `create`, `update`, `updateStatus` and `remove` are
 * admin-only (route middleware).
 */
export const listingController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listListingQuerySchema.parse(req.query);
    if (!hasRole(req.user?.role, "admin")) {
      query.status = "published";
      query.sellerId = undefined;
    }
    const listings = await listingService.list(query);
    res.status(200).json(success(listings));
  },

  async get(req: Request, res: Response): Promise<void> {
    const { id } = listingIdParamSchema.parse(req.params);
    const listing = await listingService.getById(id);
    if (listing.status !== "published" && !hasRole(req.user?.role, "admin")) {
      throw ApiError.notFound(`Listing ${id} not found`);
    }
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
