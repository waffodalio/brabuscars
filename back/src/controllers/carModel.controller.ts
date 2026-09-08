import type { Request, Response } from "express";
import {
  carModelIdParamSchema,
  createCarModelSchema,
  listCarModelQuerySchema,
  updateCarModelSchema,
} from "../dto/carModel.dto";
import { carModelService } from "../services/carModel.service";
import { success } from "../utils/apiResponse";

/**
 * HTTP layer for `/api/car-models`. Validates input with the car-model DTO
 * schemas, delegates to the service, shapes the response. No business logic.
 */
export const carModelController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listCarModelQuerySchema.parse(req.query);
    const carModels = await carModelService.list(query);
    res.status(200).json(success(carModels));
  },

  async get(req: Request, res: Response): Promise<void> {
    const { id } = carModelIdParamSchema.parse(req.params);
    const carModel = await carModelService.getById(id);
    res.status(200).json(success(carModel));
  },

  async create(req: Request, res: Response): Promise<void> {
    const dto = createCarModelSchema.parse(req.body);
    const carModel = await carModelService.create(dto);
    res.status(201).json(success(carModel));
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = carModelIdParamSchema.parse(req.params);
    const dto = updateCarModelSchema.parse(req.body);
    const carModel = await carModelService.update(id, dto);
    res.status(200).json(success(carModel));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = carModelIdParamSchema.parse(req.params);
    await carModelService.remove(id);
    res.status(204).send();
  },
};
