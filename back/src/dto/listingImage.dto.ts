import { z } from "zod";

/** Params for `/listings/:listingId/images`. */
export const listingImageCollectionParamsSchema = z.object({
  listingId: z.coerce.number().int().positive(),
});

/** Params for `/listings/:listingId/images/:imageId`. */
export const listingImageItemParamsSchema = z.object({
  listingId: z.coerce.number().int().positive(),
  imageId: z.coerce.number().int().positive(),
});

export const updateListingImageSchema = z
  .object({
    position: z.number().int().min(0).max(10_000).optional(),
    isCover: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "at least one field must be provided",
  });

export type UpdateListingImageDto = z.infer<typeof updateListingImageSchema>;
