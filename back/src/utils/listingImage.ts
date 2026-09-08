import { env } from "../config/env";
import type { ListingImage } from "../entities/ListingImage";

export interface ListingImageResponse {
  id: number;
  url: string;
  thumbnailUrl: string;
  width: number | null;
  height: number | null;
  position: number;
  isCover: boolean;
}

const PUBLIC_BASE = env.PUBLIC_UPLOADS_URL.replace(/\/+$/, "");

/** Storage key of the thumbnail variant for a full-size key. */
export function thumbnailKey(storageKey: string): string {
  return storageKey.replace(/\.webp$/i, "_thumb.webp");
}

export function toListingImageResponse(
  image: ListingImage,
): ListingImageResponse {
  return {
    id: image.id,
    url: `${PUBLIC_BASE}/${image.storageKey}`,
    thumbnailUrl: `${PUBLIC_BASE}/${thumbnailKey(image.storageKey)}`,
    width: image.width,
    height: image.height,
    position: image.position,
    isCover: image.isCover,
  };
}
