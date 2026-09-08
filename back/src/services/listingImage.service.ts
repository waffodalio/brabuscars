import { randomBytes } from "node:crypto";
import { env } from "../config/env";
import type { UpdateListingImageDto } from "../dto/listingImage.dto";
import { listingImageRepository } from "../repositories/listingImage.repository";
import { listingRepository } from "../repositories/listing.repository";
import { ApiError } from "../utils/ApiError";
import {
  thumbnailKey,
  toListingImageResponse,
  type ListingImageResponse,
} from "../utils/listingImage";
import { processImage } from "./imageProcessor";
import { storage } from "./storage";
import type { ListingImage } from "../entities/ListingImage";

async function assertListingExists(listingId: number): Promise<void> {
  if (!(await listingRepository.findById(listingId))) {
    throw ApiError.notFound(`Listing ${listingId} not found`);
  }
}

async function loadOrFail(
  listingId: number,
  imageId: number,
): Promise<ListingImage> {
  const image = await listingImageRepository.findInListing(listingId, imageId);
  if (!image) {
    throw ApiError.notFound(
      `Image ${imageId} not found for listing ${listingId}`,
    );
  }
  return image;
}

function deleteFiles(storageKey: string): Promise<unknown> {
  return Promise.all([
    storage.delete(storageKey),
    storage.delete(thumbnailKey(storageKey)),
  ]);
}

/**
 * A listing's image gallery. Write operations are admin-only (route
 * middleware). Each upload is re-encoded to WebP + a thumbnail, both stored on
 * disk; the database only keeps the storage key and metadata.
 */
export const listingImageService = {
  async list(listingId: number): Promise<ListingImageResponse[]> {
    await assertListingExists(listingId);
    const images = await listingImageRepository.findByListing(listingId);
    return images.map(toListingImageResponse);
  },

  async add(listingId: number, file: Buffer): Promise<ListingImageResponse> {
    await assertListingExists(listingId);

    const count = await listingImageRepository.countForListing(listingId);
    if (count >= env.MAX_IMAGES_PER_LISTING) {
      throw ApiError.badRequest(
        `Une annonce ne peut pas dépasser ${env.MAX_IMAGES_PER_LISTING} images`,
      );
    }

    const processed = await processImage(file);
    const key = `listings/${listingId}/${randomBytes(16).toString("hex")}.webp`;

    await storage.save(key, processed.full);
    await storage.save(thumbnailKey(key), processed.thumbnail);

    try {
      const saved = await listingImageRepository.save(
        listingImageRepository.create({
          listingId,
          storageKey: key,
          mimeType: processed.mimeType,
          sizeBytes: processed.sizeBytes,
          width: processed.width,
          height: processed.height,
          position: count,
          isCover: count === 0,
        }),
      );
      return toListingImageResponse(saved);
    } catch (err) {
      await deleteFiles(key); // don't leave orphan files if the insert fails
      throw err;
    }
  },

  async update(
    listingId: number,
    imageId: number,
    dto: UpdateListingImageDto,
  ): Promise<ListingImageResponse> {
    const image = await loadOrFail(listingId, imageId);

    if (dto.isCover === true) {
      await listingImageRepository.clearCover(listingId, imageId);
    }
    if (dto.position !== undefined) image.position = dto.position;
    if (dto.isCover !== undefined) image.isCover = dto.isCover;

    return toListingImageResponse(await listingImageRepository.save(image));
  },

  async remove(listingId: number, imageId: number): Promise<void> {
    const image = await loadOrFail(listingId, imageId);
    await deleteFiles(image.storageKey);
    await listingImageRepository.delete({ id: imageId, listingId });
  },

  /** Deletes every image file of a listing (its rows go via FK cascade). */
  async purgeForListing(listingId: number): Promise<void> {
    const images = await listingImageRepository.findByListing(listingId);
    await Promise.all(images.map((image) => deleteFiles(image.storageKey)));
  },
};
