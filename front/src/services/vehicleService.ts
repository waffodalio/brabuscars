import { apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type { FuelType, Transmission, Vehicle } from "@/types/vehicle";

export interface VehicleFilters {
  modelId?: number;
  categoryId?: number;
  brandId?: number;
  fuelType?: FuelType;
  transmission?: Transmission;
}

/**
 * Access to the `/vehicles` endpoints of the backend API. Unwraps the
 * `{ success, data }` envelope and returns the payload.
 */
export const vehicleService = {
  async list(filters: VehicleFilters = {}): Promise<Vehicle[]> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) params.set(key, String(value));
    }
    const query = params.toString() ? `?${params.toString()}` : "";

    const response = await apiClient.get<ApiSuccess<Vehicle[]>>(
      `/vehicles${query}`,
    );
    return response.data;
  },

  async getById(id: number): Promise<Vehicle> {
    const response = await apiClient.get<ApiSuccess<Vehicle>>(`/vehicles/${id}`);
    return response.data;
  },
};
