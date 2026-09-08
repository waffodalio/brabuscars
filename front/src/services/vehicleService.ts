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

export interface VehicleInput {
  modelId: number;
  categoryId?: number | null;
  year: number;
  mileage: number;
  fuelType: FuelType;
  transmission: Transmission;
  power?: number | null;
  doors?: number | null;
  color?: string | null;
}

/**
 * Access to the `/vehicles` endpoints. Reads are public; writes require an
 * admin token.
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

  async create(input: VehicleInput): Promise<Vehicle> {
    const response = await apiClient.post<ApiSuccess<Vehicle>>(
      "/vehicles",
      input,
    );
    return response.data;
  },

  async update(id: number, input: Partial<VehicleInput>): Promise<Vehicle> {
    const response = await apiClient.put<ApiSuccess<Vehicle>>(
      `/vehicles/${id}`,
      input,
    );
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete<void>(`/vehicles/${id}`);
  },
};
