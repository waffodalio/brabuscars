import { z } from "zod";
import {
  FUEL_TYPES,
  LISTING_STATUSES,
  TRANSMISSIONS,
} from "../entities/Listing";

const CURRENT_YEAR = new Date().getFullYear();

/** `:id` path parameter, coerced from string to a positive integer. */
export const listingIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const priceRule = z
  .number()
  .positive()
  .max(99_999_999.99)
  .multipleOf(0.01, "price supports at most 2 decimals");

/** Every field of a listing an admin can set. */
const listingFields = {
  modelId: z.number().int().positive(),
  categoryId: z.number().int().positive().nullable().optional(),
  title: z.string().trim().min(1).max(150),
  description: z.string().trim().min(1).max(5000).nullable().optional(),
  price: priceRule,
  year: z
    .number()
    .int()
    .min(1900)
    .max(CURRENT_YEAR + 1),
  mileage: z.number().int().min(0).max(2_000_000),
  fuelType: z.enum(FUEL_TYPES),
  transmission: z.enum(TRANSMISSIONS),
  power: z.number().int().positive().max(2000).nullable().optional(),
  doors: z.number().int().min(1).max(9).nullable().optional(),
  color: z.string().trim().min(1).max(50).nullable().optional(),
};

export const createListingSchema = z.object(listingFields).strict();

export const updateListingSchema = z
  .object(listingFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "at least one field must be provided",
  });

export const updateListingStatusSchema = z
  .object({ status: z.enum(LISTING_STATUSES) })
  .strict();

const SORTS = [
  "recent",
  "price_asc",
  "price_desc",
  "year_desc",
  "mileage_asc",
] as const;
export type ListingSort = (typeof SORTS)[number];

export const listListingQuerySchema = z
  .object({
    status: z.enum(LISTING_STATUSES).optional(),
    sellerId: z.coerce.number().int().positive().optional(),
    brandId: z.coerce.number().int().positive().optional(),
    modelId: z.coerce.number().int().positive().optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    fuelType: z.enum(FUEL_TYPES).optional(),
    transmission: z.enum(TRANSMISSIONS).optional(),
    minPrice: z.coerce.number().positive().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    minYear: z.coerce.number().int().min(1900).optional(),
    maxYear: z.coerce
      .number()
      .int()
      .max(CURRENT_YEAR + 1)
      .optional(),
    maxMileage: z.coerce.number().int().min(0).optional(),
    search: z.string().trim().min(1).optional(),
    sort: z.enum(SORTS).default("recent"),
  })
  .refine(
    (value) =>
      value.minPrice === undefined ||
      value.maxPrice === undefined ||
      value.minPrice <= value.maxPrice,
    { message: "minPrice must not be greater than maxPrice", path: ["maxPrice"] },
  )
  .refine(
    (value) =>
      value.minYear === undefined ||
      value.maxYear === undefined ||
      value.minYear <= value.maxYear,
    { message: "minYear must not be greater than maxYear", path: ["maxYear"] },
  );

export type CreateListingDto = z.infer<typeof createListingSchema>;
export type UpdateListingDto = z.infer<typeof updateListingSchema>;
export type UpdateListingStatusDto = z.infer<typeof updateListingStatusSchema>;
export type ListListingQuery = z.infer<typeof listListingQuerySchema>;
