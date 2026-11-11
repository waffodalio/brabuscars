import { apiClient } from "./apiClient";
import { cachedQuery, primeQuery } from "@/utils/queryCache";
import type { ApiSuccess } from "@/types/api";
import type {
  CreateListingInput,
  Listing,
  ListingSort,
  ListingStatus,
  UpdateListingInput,
} from "@/types/listing";
import type { FuelType, Transmission } from "@/types/vehicle";

export interface ListingFilters {
  status?: ListingStatus;
  sellerId?: number;
  brandId?: number;
  modelId?: number;
  categoryId?: number;
  fuelType?: FuelType;
  transmission?: Transmission;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  maxMileage?: number;
  search?: string;
  sort?: ListingSort;
}

/** Cache keys (see `utils/queryCache`): every listing read starts with "listing". */
export function listingsKey(filters: ListingFilters = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  params.sort();
  return `listings?${params.toString()}`;
}
export const listingKey = (id: number): string => `listing/${id}`;

/**
 * Access to the `/listings` endpoints. Reads go through the shared cache
 * (instant back / forward navigation; `apiClient` clears it on any write);
 * write calls require the auth token.
 */
export const listingService = {
  list(filters: ListingFilters = {}): Promise<Listing[]> {
    const key = listingsKey(filters);
    return cachedQuery(key, async () => {
      const response = await apiClient.get<ApiSuccess<Listing[]>>(`/${key.replace(/\?$/, "")}`);
      // Each card's page then opens at once (refreshed in the background).
      for (const listing of response.data) primeQuery(listingKey(listing.id), listing);
      return response.data;
    });
  },

  getById(id: number): Promise<Listing> {
    return cachedQuery(
      listingKey(id),
      async () => (await apiClient.get<ApiSuccess<Listing>>(`/listings/${id}`)).data,
      0,
    );
  },

  async create(input: CreateListingInput): Promise<Listing> {
    const response = await apiClient.post<ApiSuccess<Listing>>(
      "/listings",
      input,
    );
    return response.data;
  },

  async update(id: number, input: UpdateListingInput): Promise<Listing> {
    const response = await apiClient.put<ApiSuccess<Listing>>(
      `/listings/${id}`,
      input,
    );
    return response.data;
  },

  async updateStatus(id: number, status: ListingStatus): Promise<Listing> {
    const response = await apiClient.patch<ApiSuccess<Listing>>(
      `/listings/${id}/status`,
      { status },
    );
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete<void>(`/listings/${id}`);
  },
};
