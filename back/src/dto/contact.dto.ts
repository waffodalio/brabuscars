import { z } from "zod";

export const contactIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createContactMessageSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().max(255),
    message: z.string().trim().min(10).max(5000),
    /** Honeypot — bots tend to fill every field; the service drops these. */
    website: z.string().max(200).optional(),
  })
  .strict();

export const updateContactMessageSchema = z
  .object({ handled: z.boolean() })
  .strict();

export type CreateContactMessageDto = z.infer<
  typeof createContactMessageSchema
>;
export type UpdateContactMessageDto = z.infer<
  typeof updateContactMessageSchema
>;
