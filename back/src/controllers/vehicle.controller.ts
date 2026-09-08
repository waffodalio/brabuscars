import type { Request, Response } from "express";
import {
  createVehicleSchema,
  listVehicleQuerySchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
} from "../dto/vehicle.dto";
import { vehicleService } from "../services/vehicle.service";
import { success } from "../utils/apiResponse";

/**
 * HTTP layer for `/api/vehicles`. Validates input with the vehicle DTO
 * schemas, delegates to the service, shapes the response. No business logic.
 */
export const vehicleController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listVehicleQuerySchema.parse(req.query);
    const vehicles = await vehicleService.list(query);
    res.status(200).json(success(vehicles));
  },

  async get(req: Request, res: Response): Promise<void> {
    const { id } = vehicleIdParamSchema.parse(req.params);
    const vehicle = await vehicleService.getById(id);
    res.status(200).json(success(vehicle));
  },

  async create(req: Request, res: Response): Promise<void> {
    const dto = createVehicleSchema.parse(req.body);
    const vehicle = await vehicleService.create(dto);
    res.status(201).json(success(vehicle));
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = vehicleIdParamSchema.parse(req.params);
    const dto = updateVehicleSchema.parse(req.body);
    const vehicle = await vehicleService.update(id, dto);
    res.status(200).json(success(vehicle));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = vehicleIdParamSchema.parse(req.params);
    await vehicleService.remove(id);
    res.status(204).send();
  },
};
