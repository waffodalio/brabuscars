import { z } from "zod";

export const createFavoriteSchema = z
  .object({
    listingId: z.number().int().positive(),
  })
  .strict();

/** `:listingId` path parameter for removing a favorite. */
export const favoriteListingParamSchema = z.object({
  listingId: z.coerce.number().int().positive(),
});

export type CreateFavoriteDto = z.infer<typeof createFavoriteSchema>;
