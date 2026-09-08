import { z } from "zod";

/** `:id` path parameter, coerced from string to a positive integer. */
export const brandIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const slugRule = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case");

export const createBrandSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    /** Optional: derived from `name` when omitted. */
    slug: slugRule.optional(),
  })
  .strict();

export const updateBrandSchema = createBrandSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "at least one field must be provided",
  });

export const listBrandQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
});

export type CreateBrandDto = z.infer<typeof createBrandSchema>;
export type UpdateBrandDto = z.infer<typeof updateBrandSchema>;
export type ListBrandQuery = z.infer<typeof listBrandQuerySchema>;
