import { z } from "zod";

/** `:id` path parameter, coerced from string to a positive integer. */
export const carModelIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createCarModelSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    brandId: z.number().int().positive(),
  })
  .strict();

export const updateCarModelSchema = createCarModelSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "at least one field must be provided",
  });

export const listCarModelQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  brandId: z.coerce.number().int().positive().optional(),
});

export type CreateCarModelDto = z.infer<typeof createCarModelSchema>;
export type UpdateCarModelDto = z.infer<typeof updateCarModelSchema>;
export type ListCarModelQuery = z.infer<typeof listCarModelQuerySchema>;
