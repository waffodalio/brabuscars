import { z } from "zod";
import { PAYMENT_METHODS, SALE_STATUSES, VAT_REGIMES } from "../entities/Sale";

export const saleIdParamSchema = z.object({ id: z.coerce.number().int().positive() });
export const salePaymentParamSchema = saleIdParamSchema.extend({
  paymentId: z.coerce.number().int().positive(),
});
export const saleDocumentParamSchema = saleIdParamSchema.extend({
  documentId: z.coerce.number().int().positive(),
});

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
    .nullish();

/** A euro amount with at most 2 decimals. */
const euros = z
  .number()
  .finite()
  .refine((value) => Math.abs(Math.round(value * 100) - value * 100) < 1e-6, "At most 2 decimals");

const buyerSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    company: optionalText(150),
    vatNumber: optionalText(30),
    address: optionalText(255),
    postalCode: optionalText(20),
    city: optionalText(100),
    country: optionalText(100),
    email: z.string().trim().toLowerCase().email().max(255).nullish().or(z.literal("").transform(() => null)),
    phone: optionalText(30),
  })
  .strict();

const lineSchema = z
  .object({
    description: z.string().trim().min(1).max(255),
    quantity: z.number().int().min(1).max(999),
    /** VAT included. */
    unitPrice: euros.pipe(z.number().min(0).max(9_999_999)),
  })
  .strict();

/** `POST /sales` and `PUT /sales/:id` (draft only): the whole sale. */
export const saleInputSchema = z
  .object({
    vatRegime: z.enum(VAT_REGIMES),
    listingId: z.number().int().positive().nullish(),
    stockVehicleId: z.number().int().positive().nullish(),
    buyer: buyerSchema,
    vehicleVin: z
      .string()
      .trim()
      .toUpperCase()
      .max(17)
      .transform((value) => value || null)
      .nullish(),
    notes: optionalText(2000),
    lines: z.array(lineSchema).min(1).max(30),
  })
  .strict();

/** `POST /sales/:id/payments`. */
export const salePaymentSchema = z
  .object({
    amount: euros.pipe(z.number().positive().max(9_999_999)),
    /** `YYYY-MM-DD`. */
    paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((day) => !Number.isNaN(Date.parse(day)), "Invalid date"),
    method: z.enum(PAYMENT_METHODS),
    reference: optionalText(100),
  })
  .strict();

export const listSalesQuerySchema = z
  .object({ status: z.enum(SALE_STATUSES).optional() })
  .strict();

export type SaleInputDto = z.infer<typeof saleInputSchema>;
export type SalePaymentDto = z.infer<typeof salePaymentSchema>;
