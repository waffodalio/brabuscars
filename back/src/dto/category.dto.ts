import { z } from "zod";

/** `:id` path parameter, coerced from string to a positive integer. */
export const categoryIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const slugRule = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case");

export const createCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    /** Optional: derived from `name` when omitted. */
    slug: slugRule.optional(),
  })
  .strict();

export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "at least one field must be provided",
  });

export const listCategoryQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type ListCategoryQuery = z.infer<typeof listCategoryQuerySchema>;
