import { z } from "zod";
import { FUEL_TYPES, TRANSMISSIONS } from "../entities/Listing";
import { EQUIPMENT, EURO_NORMS } from "../entities/listingDetails";
import { ENTRY_SOURCES, EXIT_REASONS, STOCK_STATUSES } from "../entities/stockTypes";

const CURRENT_YEAR = new Date().getFullYear();

export const stockIdParamSchema = z.object({ id: z.coerce.number().int().positive() });
export const stockImageParamSchema = stockIdParamSchema.extend({
  imageId: z.coerce.number().int().positive(),
});
export const stockCostParamSchema = stockIdParamSchema.extend({
  costId: z.coerce.number().int().positive(),
});

/** Blank text → null. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
    .nullish();

/** `YYYY-MM-DD`, a real calendar day. */
const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "Invalid date");

/** A euro amount with at most 2 decimals. */
const euros = z
  .number()
  .finite()
  .min(0)
  .max(99_999_999)
  .refine((value) => Math.abs(Math.round(value * 100) - value * 100) < 1e-6, "At most 2 decimals");

/** Statuses an admin sets by hand; sold / exited go through `/exit`. */
const OPEN_STATUSES = ["incoming", "in_stock", "preparation"] as const;

/** `POST /stock` and `PUT /stock/:id`: the whole car. */
export const stockVehicleInputSchema = z
  .object({
    modelId: z.number().int().positive(),
    listingId: z.number().int().positive().nullish(),
    status: z.enum(OPEN_STATUSES).optional(),
    version: optionalText(150),
    vin: z
      .string()
      .trim()
      .toUpperCase()
      .max(17)
      .transform((value) => value || null)
      .nullish(),
    year: z.number().int().min(1900).max(CURRENT_YEAR + 1),
    firstRegistration: day.nullish(),
    mileage: z.number().int().min(0).max(2_000_000),
    fuelType: z.enum(FUEL_TYPES),
    transmission: z.enum(TRANSMISSIONS),
    power: z.number().int().positive().max(2000).nullish(),
    color: optionalText(50),
    doors: z.number().int().min(1).max(9).nullish(),
    equipment: z.array(z.enum(EQUIPMENT)).max(EQUIPMENT.length * 2).optional(),
    euroNorm: z.enum(EURO_NORMS).nullish(),
    co2: z.number().int().min(0).max(999).nullish(),
    hasCarPass: z.boolean().optional(),
    entryDate: day,
    entrySource: z.enum(ENTRY_SOURCES),
    supplier: optionalText(150),
    purchasePrice: euros.nullish(),
    targetPrice: euros.nullish(),
    location: optionalText(100),
    notes: optionalText(5000),
  })
  .strict();

/** `POST /stock/:id/exit`: the car leaves the garage. */
export const stockExitSchema = z.object({ exitDate: day, exitReason: z.enum(EXIT_REASONS) }).strict();

/** `POST /stock/:id/costs`. */
export const stockCostSchema = z
  .object({
    label: z.string().trim().min(1).max(150),
    amount: euros.pipe(z.number().positive()),
    spentOn: day,
  })
  .strict();

export const listStockQuerySchema = z.object({ status: z.enum(STOCK_STATUSES).optional() }).strict();

export type StockVehicleInputDto = z.infer<typeof stockVehicleInputSchema>;
export type StockExitDto = z.infer<typeof stockExitSchema>;
export type StockCostDto = z.infer<typeof stockCostSchema>;
