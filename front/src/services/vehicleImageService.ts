import { apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type { VehicleImage } from "@/types/vehicle";

export interface VehicleImageInput {
  url: string;
  position?: number;
  isCover?: boolean;
}

/**
 * Access to `/vehicles/:vehicleId/images`. `list` is public; write calls
 * require the auth token (seller of the vehicle, or admin).
 */
export const vehicleImageService = {
  async list(vehicleId: number): Promise<VehicleImage[]> {
    const response = await apiClient.get<ApiSuccess<VehicleImage[]>>(
      `/vehicles/${vehicleId}/images`,
    );
    return response.data;
  },

  async add(vehicleId: number, input: VehicleImageInput): Promise<VehicleImage> {
    const response = await apiClient.post<ApiSuccess<VehicleImage>>(
      `/vehicles/${vehicleId}/images`,
      input,
    );
    return response.data;
  },

  async update(
    vehicleId: number,
    imageId: number,
    input: Partial<VehicleImageInput>,
  ): Promise<VehicleImage> {
    const response = await apiClient.patch<ApiSuccess<VehicleImage>>(
      `/vehicles/${vehicleId}/images/${imageId}`,
      input,
    );
    return response.data;
  },

  async remove(vehicleId: number, imageId: number): Promise<void> {
    await apiClient.delete<void>(`/vehicles/${vehicleId}/images/${imageId}`);
  },
};
