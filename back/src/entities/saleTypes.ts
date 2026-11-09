/**
 * Enumerations of the sale module, apart from the entities so that `Sale`,
 * `SalePayment` and `SaleDocument` can use them without a circular import.
 */
export const SALE_STATUSES = ["draft", "ordered", "paid"] as const;
/** `draft` → `ordered` (purchase order issued on an advance) → `paid` (invoice issued). */
export type SaleStatus = (typeof SALE_STATUSES)[number];

export const VAT_REGIMES = ["margin", "standard"] as const;
/** `margin`: second-hand goods margin scheme (VAT not shown) · `standard`: 21 % shown. */
export type VatRegime = (typeof VAT_REGIMES)[number];

export const SALE_DOCUMENT_KINDS = ["order", "invoice"] as const;
export type SaleDocumentKind = (typeof SALE_DOCUMENT_KINDS)[number];

export const PAYMENT_METHODS = ["transfer", "cash", "card", "cheque", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
