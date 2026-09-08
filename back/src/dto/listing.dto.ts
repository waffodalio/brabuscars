import { z } from "zod";
import { LISTING_STATUSES } from "../entities/Listing";
import { FUEL_TYPES, TRANSMISSIONS } from "../entities/Vehicle";

/** `:id` path parameter, coerced from string to a positive integer. */
export const listingIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const priceRule = z
  .number()
  .positive()
  .max(99_999_999.99)
  .multipleOf(0.01, "price supports at most 2 decimals");

/** Fields an admin can edit after creation. */
const editableFields = {
  title: z.string().trim().min(1).max(150),
  description: z.string().trim().min(1).max(5000).nullable().optional(),
  price: priceRule,
};

export const createListingSchema = z
  .object({
    vehicleId: z.number().int().positive(),
    ...editableFields,
  })
  .strict();

export const updateListingSchema = z
  .object(editableFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "at least one field must be provided",
  });

export const updateListingStatusSchema = z
  .object({ status: z.enum(LISTING_STATUSES) })
  .strict();

export const listListingQuerySchema = z.object({
  status: z.enum(LISTING_STATUSES).optional(),
  sellerId: z.coerce.number().int().positive().optional(),
  brandId: z.coerce.number().int().positive().optional(),
  fuelType: z.enum(FUEL_TYPES).optional(),
  transmission: z.enum(TRANSMISSIONS).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  search: z.string().trim().min(1).optional(),
});

export type CreateListingDto = z.infer<typeof createListingSchema>;
export type UpdateListingDto = z.infer<typeof updateListingSchema>;
export type UpdateListingStatusDto = z.infer<typeof updateListingStatusSchema>;
export type ListListingQuery = z.infer<typeof listListingQuerySchema>;
