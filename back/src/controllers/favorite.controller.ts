import type { Request, Response } from "express";
import {
  createFavoriteSchema,
  favoriteListingParamSchema,
} from "../dto/favorite.dto";
import { favoriteService } from "../services/favorite.service";
import { actorOf } from "../utils/actor";
import { success } from "../utils/apiResponse";

/**
 * HTTP layer for `/api/favorites`. Every route requires authentication and
 * acts on the calling user's own favourites.
 */
export const favoriteController = {
  async list(req: Request, res: Response): Promise<void> {
    const favorites = await favoriteService.list(actorOf(req).id);
    res.status(200).json(success(favorites));
  },

  async add(req: Request, res: Response): Promise<void> {
    const { listingId } = createFavoriteSchema.parse(req.body);
    const favorite = await favoriteService.add(actorOf(req).id, listingId);
    res.status(201).json(success(favorite));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { listingId } = favoriteListingParamSchema.parse(req.params);
    await favoriteService.remove(actorOf(req).id, listingId);
    res.status(204).send();
  },
};
