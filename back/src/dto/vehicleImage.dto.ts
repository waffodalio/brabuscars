import { z } from "zod";

/** Params for collection routes: `/vehicles/:vehicleId/images`. */
export const vehicleImageCollectionParamsSchema = z.object({
  vehicleId: z.coerce.number().int().positive(),
});

/** Params for item routes: `/vehicles/:vehicleId/images/:imageId`. */
export const vehicleImageItemParamsSchema = z.object({
  vehicleId: z.coerce.number().int().positive(),
  imageId: z.coerce.number().int().positive(),
});

const imageFields = {
  url: z.string().trim().url().max(500),
  position: z.number().int().min(0).max(10_000),
  isCover: z.boolean(),
};

export const createVehicleImageSchema = z
  .object({
    url: imageFields.url,
    position: imageFields.position.optional(),
    isCover: imageFields.isCover.optional(),
  })
  .strict();

export const updateVehicleImageSchema = z
  .object({
    url: imageFields.url.optional(),
    position: imageFields.position.optional(),
    isCover: imageFields.isCover.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "at least one field must be provided",
  });

export type CreateVehicleImageDto = z.infer<typeof createVehicleImageSchema>;
export type UpdateVehicleImageDto = z.infer<typeof updateVehicleImageSchema>;
