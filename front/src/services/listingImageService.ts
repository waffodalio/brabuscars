import { apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type { ListingImage } from "@/types/listing";

/**
 * Access to `/listings/:listingId/images`. `list` is public; upload / update /
 * delete require an admin session.
 */
export const listingImageService = {
  async list(listingId: number): Promise<ListingImage[]> {
    const response = await apiClient.get<ApiSuccess<ListingImage[]>>(
      `/listings/${listingId}/images`,
    );
    return response.data;
  },

  async upload(listingId: number, file: File): Promise<ListingImage> {
    const form = new FormData();
    form.append("file", file);
    const response = await apiClient.postForm<ApiSuccess<ListingImage>>(
      `/listings/${listingId}/images`,
      form,
    );
    return response.data;
  },

  async update(
    listingId: number,
    imageId: number,
    input: { position?: number; isCover?: boolean },
  ): Promise<ListingImage> {
    const response = await apiClient.patch<ApiSuccess<ListingImage>>(
      `/listings/${listingId}/images/${imageId}`,
      input,
    );
    return response.data;
  },

  async remove(listingId: number, imageId: number): Promise<void> {
    await apiClient.delete<void>(`/listings/${listingId}/images/${imageId}`);
  },
};
