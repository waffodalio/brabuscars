import type { Request, Response } from "express";
import {
  createVehicleImageSchema,
  updateVehicleImageSchema,
  vehicleImageCollectionParamsSchema,
  vehicleImageItemParamsSchema,
} from "../dto/vehicleImage.dto";
import { vehicleImageService } from "../services/vehicleImage.service";
import { success } from "../utils/apiResponse";

/**
 * HTTP layer for `/api/vehicles/:vehicleId/images`. `list` is public; the
 * write operations are admin-only (route middleware).
 */
export const vehicleImageController = {
  async list(req: Request, res: Response): Promise<void> {
    const { vehicleId } = vehicleImageCollectionParamsSchema.parse(req.params);
    const images = await vehicleImageService.list(vehicleId);
    res.status(200).json(success(images));
  },

  async create(req: Request, res: Response): Promise<void> {
    const { vehicleId } = vehicleImageCollectionParamsSchema.parse(req.params);
    const dto = createVehicleImageSchema.parse(req.body);
    const image = await vehicleImageService.create(vehicleId, dto);
    res.status(201).json(success(image));
  },

  async update(req: Request, res: Response): Promise<void> {
    const { vehicleId, imageId } = vehicleImageItemParamsSchema.parse(
      req.params,
    );
    const dto = updateVehicleImageSchema.parse(req.body);
    const image = await vehicleImageService.update(vehicleId, imageId, dto);
    res.status(200).json(success(image));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { vehicleId, imageId } = vehicleImageItemParamsSchema.parse(
      req.params,
    );
    await vehicleImageService.remove(vehicleId, imageId);
    res.status(204).send();
  },
};
