import { z } from "zod";
import {
  FUEL_TYPES,
  LISTING_STATUSES,
  TRANSMISSIONS,
} from "../entities/Listing";
import {
  EQUIPMENT,
  EURO_NORMS,
  WARRANTY_COVERAGE,
  WARRANTY_KINDS,
} from "../entities/listingDetails";

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
  equipment: z.array(z.enum(EQUIPMENT)).max(EQUIPMENT.length * 2).optional(),
  euroNorm: z.enum(EURO_NORMS).nullable().optional(),
  co2: z.number().int().min(0).max(999).nullable().optional(),
  hasCarPass: z.boolean().optional(),
  /** Null (or absent) = no warranty: the other warranty fields are then ignored. */
  warrantyMonths: z.number().int().min(1).max(120).nullable().optional(),
  warrantyKind: z.enum(WARRANTY_KINDS).nullable().optional(),
  warrantyCoverage: z.array(z.enum(WARRANTY_COVERAGE)).max(WARRANTY_COVERAGE.length * 2).optional(),
  /** Own covered parts (« Embrayage »…), beyond `warrantyCoverage`. */
  warrantyCustom: z.array(z.string().trim().min(1).max(60)).max(15).optional(),
  warrantyNotes: z.string().trim().min(1).max(500).nullable().optional(),
};

export const createListingSchema = z
  .object({
    ...listingFields,
    /** Created from a garage-register car: that car gets linked to the new listing. */
    stockVehicleId: z.number().int().positive().optional(),
  })
  .strict();

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
