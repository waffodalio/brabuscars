import type { Request, Response } from "express";
import {
  brandIdParamSchema,
  createBrandSchema,
  listBrandQuerySchema,
  updateBrandSchema,
} from "../dto/brand.dto";
import { brandService } from "../services/brand.service";
import { success } from "../utils/apiResponse";

/**
 * HTTP layer for `/api/brands`. Each handler validates its input (params /
 * query / body) with the brand DTO schemas, delegates to the service, and
 * shapes the HTTP response. No business logic here.
 *
 * Thrown errors (ZodError, ApiError) are caught by the central error handler.
 */
export const brandController = {
  async list(req: Request, res: Response): Promise<void> {
    const { search } = listBrandQuerySchema.parse(req.query);
    const brands = await brandService.list(search);
    res.status(200).json(success(brands));
  },

  async get(req: Request, res: Response): Promise<void> {
    const { id } = brandIdParamSchema.parse(req.params);
    const brand = await brandService.getById(id);
    res.status(200).json(success(brand));
  },

  async create(req: Request, res: Response): Promise<void> {
    const dto = createBrandSchema.parse(req.body);
    const brand = await brandService.create(dto);
    res.status(201).json(success(brand));
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = brandIdParamSchema.parse(req.params);
    const dto = updateBrandSchema.parse(req.body);
    const brand = await brandService.update(id, dto);
    res.status(200).json(success(brand));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = brandIdParamSchema.parse(req.params);
    await brandService.remove(id);
    res.status(204).send();
  },
};
