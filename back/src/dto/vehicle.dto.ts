import { z } from "zod";
import { FUEL_TYPES, TRANSMISSIONS } from "../entities/Vehicle";

const CURRENT_YEAR = new Date().getFullYear();

/** `:id` path parameter, coerced from string to a positive integer. */
export const vehicleIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createVehicleSchema = z
  .object({
    modelId: z.number().int().positive(),
    categoryId: z.number().int().positive().nullable().optional(),
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
  })
  .strict();

export const updateVehicleSchema = createVehicleSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "at least one field must be provided",
  });

export const listVehicleQuerySchema = z.object({
  modelId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  brandId: z.coerce.number().int().positive().optional(),
  fuelType: z.enum(FUEL_TYPES).optional(),
  transmission: z.enum(TRANSMISSIONS).optional(),
});

export type CreateVehicleDto = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleDto = z.infer<typeof updateVehicleSchema>;
export type ListVehicleQuery = z.infer<typeof listVehicleQuerySchema>;
