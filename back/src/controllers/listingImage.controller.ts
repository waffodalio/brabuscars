import type { Request, Response } from "express";
import {
  listingImageCollectionParamsSchema,
  listingImageItemParamsSchema,
  updateListingImageSchema,
} from "../dto/listingImage.dto";
import { listingImageService } from "../services/listingImage.service";
import { ApiError } from "../utils/ApiError";
import { success } from "../utils/apiResponse";

/**
 * HTTP layer for `/api/listings/:listingId/images`. `list` is public; the
 * write operations are admin-only (route middleware).
 */
export const listingImageController = {
  async list(req: Request, res: Response): Promise<void> {
    const { listingId } = listingImageCollectionParamsSchema.parse(req.params);
    const images = await listingImageService.list(listingId);
    res.status(200).json(success(images));
  },

  async add(req: Request, res: Response): Promise<void> {
    const { listingId } = listingImageCollectionParamsSchema.parse(req.params);
    if (!req.file) {
      throw ApiError.badRequest("Fichier image manquant (champ « file »)");
    }
    const image = await listingImageService.add(listingId, req.file.buffer);
    res.status(201).json(success(image));
  },

  async update(req: Request, res: Response): Promise<void> {
    const { listingId, imageId } = listingImageItemParamsSchema.parse(
      req.params,
    );
    const dto = updateListingImageSchema.parse(req.body);
    const image = await listingImageService.update(listingId, imageId, dto);
    res.status(200).json(success(image));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { listingId, imageId } = listingImageItemParamsSchema.parse(
      req.params,
    );
    await listingImageService.remove(listingId, imageId);
    res.status(204).send();
  },
};
