import { randomBytes } from "node:crypto";
import { env } from "../config/env";
import type { UpdateListingImageDto } from "../dto/listingImage.dto";
import { AppDataSource } from "../config/data-source";
import { ListingImage } from "../entities/ListingImage";
import { StockVehicleImage } from "../entities/StockVehicleImage";
import { listingImageRepository } from "../repositories/listingImage.repository";
import { stockVehicleImageRepository } from "../repositories/stockVehicleImage.repository";
import { stockVehicleRepository } from "../repositories/stockVehicle.repository";
import { ApiError } from "../utils/ApiError";
import { thumbnailKey, toListingImageResponse, type ListingImageResponse } from "../utils/listingImage";
import { processImage } from "./imageProcessor";
import { storage } from "./storage";

function deleteFiles(storageKey: string): Promise<unknown> {
  return Promise.all([storage.delete(storageKey), storage.delete(thumbnailKey(storageKey))]);
}

async function loadOrFail(vehicleId: number, imageId: number): Promise<StockVehicleImage> {
  const image = await stockVehicleImageRepository.findInVehicle(vehicleId, imageId);
  if (!image) throw ApiError.notFound(`Image ${imageId} not found for stock vehicle ${vehicleId}`);
  return image;
}

/**
 * Photos of a garage-register car (admin only): same pipeline as listing
 * photos — re-encoded to WebP + thumbnail, EXIF dropped, files on disk. The
 * car's listing shows them.
 */
export const stockVehicleImageService = {
  async list(vehicleId: number): Promise<ListingImageResponse[]> {
    return (await stockVehicleImageRepository.findByVehicle(vehicleId)).map(toListingImageResponse);
  },

  async add(vehicleId: number, file: Buffer): Promise<ListingImageResponse> {
    if (!(await stockVehicleRepository.existsBy({ id: vehicleId }))) {
      throw ApiError.notFound(`Stock vehicle ${vehicleId} not found`);
    }
    const count = await stockVehicleImageRepository.countForVehicle(vehicleId);
    if (count >= env.MAX_IMAGES_PER_LISTING) {
      throw ApiError.badRequest(`Un véhicule ne peut pas dépasser ${env.MAX_IMAGES_PER_LISTING} photos`);
    }

    const processed = await processImage(file);
    const key = `stock/${vehicleId}/${randomBytes(16).toString("hex")}.webp`;
    await storage.save(key, processed.full);
    await storage.save(thumbnailKey(key), processed.thumbnail);

    try {
      const saved = await stockVehicleImageRepository.save(
        stockVehicleImageRepository.create({
          vehicleId,
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
      await deleteFiles(key); // no orphan files if the insert fails
      throw err;
    }
  },

  async update(vehicleId: number, imageId: number, dto: UpdateListingImageDto): Promise<ListingImageResponse> {
    const image = await loadOrFail(vehicleId, imageId);
    if (dto.isCover === true) await stockVehicleImageRepository.clearCover(vehicleId, imageId);
    if (dto.position !== undefined) image.position = dto.position;
    if (dto.isCover !== undefined) image.isCover = dto.isCover;
    return toListingImageResponse(await stockVehicleImageRepository.save(image));
  },

  async remove(vehicleId: number, imageId: number): Promise<void> {
    const image = await loadOrFail(vehicleId, imageId);
    await deleteFiles(image.storageKey);
    await stockVehicleImageRepository.delete({ id: imageId, vehicleId });
    // The cover is gone: the first remaining photo takes over.
    if (image.isCover) {
      const [first] = await stockVehicleImageRepository.findByVehicle(vehicleId);
      if (first) await stockVehicleImageRepository.update({ id: first.id }, { isCover: true });
    }
  },

  /**
   * A listing with its own photos gets linked to a car: those photos move to
   * the car (same files, rows moved), after the car's own — nothing is lost
   * and the listing keeps showing them.
   */
  async adoptListingPhotos(listingId: number, vehicleId: number): Promise<void> {
    const own = await listingImageRepository.findByListing(listingId);
    if (own.length === 0) return;
    const already = await stockVehicleImageRepository.findByVehicle(vehicleId);
    const hasCover = already.some((image) => image.isCover);
    await AppDataSource.transaction(async (manager) => {
      await manager.getRepository(StockVehicleImage).insert(
        own.map((image, index) => ({
          vehicleId,
          storageKey: image.storageKey,
          mimeType: image.mimeType,
          sizeBytes: image.sizeBytes,
          width: image.width,
          height: image.height,
          position: already.length + index,
          isCover: !hasCover && (image.isCover || (index === 0 && !own.some((item) => item.isCover))),
        })),
      );
      await manager.getRepository(ListingImage).delete({ listingId }); // rows only: the files now belong to the car
    });
  },

  /** Deletes the files of every photo of a car (rows go with the FK cascade). */
  async purgeForVehicle(vehicleId: number): Promise<void> {
    const images = await stockVehicleImageRepository.findByVehicle(vehicleId);
    await Promise.all(images.map((image) => deleteFiles(image.storageKey)));
  },
};
