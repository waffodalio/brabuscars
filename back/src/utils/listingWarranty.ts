import type { WarrantyCoverage, WarrantyKind } from "../entities/listingDetails";

export interface WarrantyFields {
  warrantyMonths: number | null;
  warrantyKind: WarrantyKind | null;
  warrantyCoverage: WarrantyCoverage[] | null;
  warrantyCustom: string[] | null;
  warrantyNotes: string | null;
}

/** Same values, each once, in their first order. */
export function uniqueValues<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

/**
 * A warranty is defined by its length: without one there is no warranty, so
 * the type, covered parts and conditions are dropped too. With one, the type
 * defaults to the dealership's own warranty.
 */
export function normalizeWarranty(input: {
  months?: number | null;
  kind?: WarrantyKind | null;
  coverage?: readonly WarrantyCoverage[] | null;
  custom?: readonly string[] | null;
  notes?: string | null;
}): WarrantyFields {
  if (!input.months) {
    return { warrantyMonths: null, warrantyKind: null, warrantyCoverage: null, warrantyCustom: null, warrantyNotes: null };
  }
  // Own items: trimmed, blanks dropped, each once whatever its case.
  const seen = new Set<string>();
  const custom = (input.custom ?? [])
    .map((label) => label.trim())
    .filter((label) => label && !seen.has(label.toLowerCase()) && seen.add(label.toLowerCase()));
  return {
    warrantyMonths: input.months,
    warrantyKind: input.kind ?? "dealer",
    warrantyCoverage: uniqueValues(input.coverage ?? []),
    warrantyCustom: custom,
    warrantyNotes: input.notes?.trim() || null,
  };
}
