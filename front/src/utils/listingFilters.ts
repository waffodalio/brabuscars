import type { ListingFilters } from "@/services/listingService";
import type { ListingSort } from "@/types/listing";

/** The `/annonces` filter form, kept as strings (raw `<input>`/`<select>` state). */
export interface FilterForm {
  brandId: string;
  modelId: string;
  categoryId: string;
  fuelType: string;
  transmission: string;
  minPrice: string;
  maxPrice: string;
  minYear: string;
  maxYear: string;
  maxMileage: string;
  search: string;
  sort: ListingSort;
}

export const EMPTY_FILTERS: FilterForm = {
  brandId: "",
  modelId: "",
  categoryId: "",
  fuelType: "",
  transmission: "",
  minPrice: "",
  maxPrice: "",
  minYear: "",
  maxYear: "",
  maxMileage: "",
  search: "",
  sort: "recent",
};

/** Turns the string form into the `GET /api/listings` query object. */
export function toQuery(form: FilterForm): ListingFilters {
  const num = (value: string) =>
    value.trim() === "" ? undefined : Number(value);
  return {
    status: "published",
    brandId: num(form.brandId),
    modelId: num(form.modelId),
    categoryId: num(form.categoryId),
    fuelType: (form.fuelType || undefined) as ListingFilters["fuelType"],
    transmission: (form.transmission ||
      undefined) as ListingFilters["transmission"],
    minPrice: num(form.minPrice),
    maxPrice: num(form.maxPrice),
    minYear: num(form.minYear),
    maxYear: num(form.maxYear),
    maxMileage: num(form.maxMileage),
    search: form.search.trim() || undefined,
    sort: form.sort,
  };
}

/** True when a "min" filter is greater than its paired "max" — an empty
 * bound never conflicts, only two bounds that are both set can. */
export function hasInvalidRange(query: ListingFilters): boolean {
  const priceInvalid =
    query.minPrice !== undefined &&
    query.maxPrice !== undefined &&
    query.minPrice > query.maxPrice;
  const yearInvalid =
    query.minYear !== undefined &&
    query.maxYear !== undefined &&
    query.minYear > query.maxYear;
  return priceInvalid || yearInvalid;
}
