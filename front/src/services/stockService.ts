import { apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type { ListingImage } from "@/types/listing";
import type { ExitReason, StockStatus, StockVehicle, StockVehicleInput } from "@/types/stock";

/** `/stock` — the garage register (admin session). */
export const stockService = {
  async list(status?: StockStatus): Promise<StockVehicle[]> {
    return (await apiClient.get<ApiSuccess<StockVehicle[]>>(`/stock${status ? `?status=${status}` : ""}`)).data;
  },
  async get(id: number): Promise<StockVehicle> {
    return (await apiClient.get<ApiSuccess<StockVehicle>>(`/stock/${id}`)).data;
  },
  async create(input: StockVehicleInput): Promise<StockVehicle> {
    return (await apiClient.post<ApiSuccess<StockVehicle>>("/stock", input)).data;
  },
  async update(id: number, input: StockVehicleInput): Promise<StockVehicle> {
    return (await apiClient.put<ApiSuccess<StockVehicle>>(`/stock/${id}`, input)).data;
  },
  async remove(id: number): Promise<void> {
    await apiClient.delete<void>(`/stock/${id}`);
  },
  async exit(id: number, exitDate: string, exitReason: ExitReason): Promise<StockVehicle> {
    return (await apiClient.post<ApiSuccess<StockVehicle>>(`/stock/${id}/exit`, { exitDate, exitReason })).data;
  },
  async reopen(id: number): Promise<StockVehicle> {
    return (await apiClient.post<ApiSuccess<StockVehicle>>(`/stock/${id}/reopen`, {})).data;
  },
  async addCost(id: number, cost: { label: string; amount: number; spentOn: string }): Promise<StockVehicle> {
    return (await apiClient.post<ApiSuccess<StockVehicle>>(`/stock/${id}/costs`, cost)).data;
  },
  async listImages(id: number): Promise<ListingImage[]> {
    return (await apiClient.get<ApiSuccess<ListingImage[]>>(`/stock/${id}/images`)).data;
  },
  async uploadImage(id: number, file: File): Promise<ListingImage> {
    const form = new FormData();
    form.append("file", file);
    return (await apiClient.postForm<ApiSuccess<ListingImage>>(`/stock/${id}/images`, form)).data;
  },
  async updateImage(id: number, imageId: number, input: { isCover?: boolean; position?: number }): Promise<ListingImage> {
    return (await apiClient.patch<ApiSuccess<ListingImage>>(`/stock/${id}/images/${imageId}`, input)).data;
  },
  async removeImage(id: number, imageId: number): Promise<void> {
    await apiClient.delete<void>(`/stock/${id}/images/${imageId}`);
  },
  async removeCost(id: number, costId: number): Promise<StockVehicle> {
    return (await apiClient.delete<ApiSuccess<StockVehicle>>(`/stock/${id}/costs/${costId}`)).data;
  },
};

/** The photo gallery of a stock car, for `ListingImagePanel`. */
export function stockGallery(id: number) {
  return {
    list: () => stockService.listImages(id),
    upload: (file: File) => stockService.uploadImage(id, file),
    update: (imageId: number, input: { isCover?: boolean }) => stockService.updateImage(id, imageId, input),
    remove: (imageId: number) => stockService.removeImage(id, imageId),
  };
}
