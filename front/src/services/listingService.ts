import { apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type {
  CreateListingInput,
  Listing,
  ListingStatus,
  UpdateListingInput,
} from "@/types/listing";
import type { FuelType, Transmission } from "@/types/vehicle";

export interface ListingFilters {
  status?: ListingStatus;
  sellerId?: number;
  brandId?: number;
  fuelType?: FuelType;
  transmission?: Transmission;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

/** Access to the `/listings` endpoints. Write calls require the auth token. */
export const listingService = {
  async list(filters: ListingFilters = {}): Promise<Listing[]> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) params.set(key, String(value));
    }
    const query = params.toString() ? `?${params.toString()}` : "";

    const response = await apiClient.get<ApiSuccess<Listing[]>>(
      `/listings${query}`,
    );
    return response.data;
  },

  async getById(id: number): Promise<Listing> {
    const response = await apiClient.get<ApiSuccess<Listing>>(`/listings/${id}`);
    return response.data;
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
