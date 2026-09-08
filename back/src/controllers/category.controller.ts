import type { Request, Response } from "express";
import {
  categoryIdParamSchema,
  createCategorySchema,
  listCategoryQuerySchema,
  updateCategorySchema,
} from "../dto/category.dto";
import { categoryService } from "../services/category.service";
import { success } from "../utils/apiResponse";

/**
 * HTTP layer for `/api/categories`. Validates input with the category DTO
 * schemas, delegates to the service, shapes the response. No business logic.
 */
export const categoryController = {
  async list(req: Request, res: Response): Promise<void> {
    const { search } = listCategoryQuerySchema.parse(req.query);
    const categories = await categoryService.list(search);
    res.status(200).json(success(categories));
  },

  async get(req: Request, res: Response): Promise<void> {
    const { id } = categoryIdParamSchema.parse(req.params);
    const category = await categoryService.getById(id);
    res.status(200).json(success(category));
  },

  async create(req: Request, res: Response): Promise<void> {
    const dto = createCategorySchema.parse(req.body);
    const category = await categoryService.create(dto);
    res.status(201).json(success(category));
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = categoryIdParamSchema.parse(req.params);
    const dto = updateCategorySchema.parse(req.body);
    const category = await categoryService.update(id, dto);
    res.status(200).json(success(category));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = categoryIdParamSchema.parse(req.params);
    await categoryService.remove(id);
    res.status(204).send();
  },
};
