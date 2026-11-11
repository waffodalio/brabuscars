import type { Request, Response } from "express";
import {
  listStockQuerySchema,
  stockCostParamSchema,
  stockCostSchema,
  stockExitSchema,
  stockIdParamSchema,
  stockImageParamSchema,
  stockVehicleInputSchema,
} from "../dto/stock.dto";
import { updateListingImageSchema } from "../dto/listingImage.dto";
import { stockVehicleImageService } from "../services/stockVehicleImage.service";
import { stockVehicleService } from "../services/stockVehicle.service";
import { ApiError } from "../utils/ApiError";
import { success } from "../utils/apiResponse";

/** HTTP layer for `/api/stock` (admin only, see the routes). */
export const stockVehicleController = {
  async list(req: Request, res: Response): Promise<void> {
    const { status } = listStockQuerySchema.parse(req.query);
    res.status(200).json(success(await stockVehicleService.list(status)));
  },

  async get(req: Request, res: Response): Promise<void> {
    const { id } = stockIdParamSchema.parse(req.params);
    res.status(200).json(success(await stockVehicleService.get(id)));
  },

  async create(req: Request, res: Response): Promise<void> {
    const dto = stockVehicleInputSchema.parse(req.body);
    res.status(201).json(success(await stockVehicleService.create(dto)));
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = stockIdParamSchema.parse(req.params);
    const dto = stockVehicleInputSchema.parse(req.body);
    res.status(200).json(success(await stockVehicleService.update(id, dto)));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = stockIdParamSchema.parse(req.params);
    await stockVehicleService.remove(id);
    res.status(204).send();
  },

  async exit(req: Request, res: Response): Promise<void> {
    const { id } = stockIdParamSchema.parse(req.params);
    const dto = stockExitSchema.parse(req.body);
    res.status(200).json(success(await stockVehicleService.exit(id, dto)));
  },

  async reopen(req: Request, res: Response): Promise<void> {
    const { id } = stockIdParamSchema.parse(req.params);
    res.status(200).json(success(await stockVehicleService.reopen(id)));
  },

  async addCost(req: Request, res: Response): Promise<void> {
    const { id } = stockIdParamSchema.parse(req.params);
    const dto = stockCostSchema.parse(req.body);
    res.status(201).json(success(await stockVehicleService.addCost(id, dto)));
  },

  async listImages(req: Request, res: Response): Promise<void> {
    const { id } = stockIdParamSchema.parse(req.params);
    res.status(200).json(success(await stockVehicleImageService.list(id)));
  },

  async addImage(req: Request, res: Response): Promise<void> {
    const { id } = stockIdParamSchema.parse(req.params);
    if (!req.file) throw ApiError.badRequest("Fichier image manquant (champ « file »)");
    res.status(201).json(success(await stockVehicleImageService.add(id, req.file.buffer)));
  },

  async updateImage(req: Request, res: Response): Promise<void> {
    const { id, imageId } = stockImageParamSchema.parse(req.params);
    const dto = updateListingImageSchema.parse(req.body);
    res.status(200).json(success(await stockVehicleImageService.update(id, imageId, dto)));
  },

  async removeImage(req: Request, res: Response): Promise<void> {
    const { id, imageId } = stockImageParamSchema.parse(req.params);
    await stockVehicleImageService.remove(id, imageId);
    res.status(204).send();
  },

  async removeCost(req: Request, res: Response): Promise<void> {
    const { id, costId } = stockCostParamSchema.parse(req.params);
    res.status(200).json(success(await stockVehicleService.removeCost(id, costId)));
  },
};
