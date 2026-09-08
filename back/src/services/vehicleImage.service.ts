import type { VehicleImage } from "../entities/VehicleImage";
import type {
  CreateVehicleImageDto,
  UpdateVehicleImageDto,
} from "../dto/vehicleImage.dto";
import { vehicleImageRepository } from "../repositories/vehicleImage.repository";
import { vehicleRepository } from "../repositories/vehicle.repository";
import { ApiError } from "../utils/ApiError";

async function assertVehicleExists(vehicleId: number): Promise<void> {
  if (!(await vehicleRepository.findById(vehicleId))) {
    throw ApiError.notFound(`Vehicle ${vehicleId} not found`);
  }
}

async function loadImageOrFail(
  vehicleId: number,
  imageId: number,
): Promise<VehicleImage> {
  const image = await vehicleImageRepository.findInVehicle(vehicleId, imageId);
  if (!image) {
    throw ApiError.notFound(
      `Image ${imageId} not found for vehicle ${vehicleId}`,
    );
  }
  return image;
}

/**
 * Business logic for a vehicle's image gallery. Write operations are
 * admin-only (enforced by the route middleware); only one image per vehicle
 * carries the cover flag.
 */
export const vehicleImageService = {
  async list(vehicleId: number): Promise<VehicleImage[]> {
    await assertVehicleExists(vehicleId);
    return vehicleImageRepository.findByVehicle(vehicleId);
  },

  async create(
    vehicleId: number,
    dto: CreateVehicleImageDto,
  ): Promise<VehicleImage> {
    await assertVehicleExists(vehicleId);

    if (dto.isCover) {
      await vehicleImageRepository.clearCover(vehicleId);
    }

    return vehicleImageRepository.save(
      vehicleImageRepository.create({
        vehicleId,
        url: dto.url,
        position: dto.position ?? 0,
        isCover: dto.isCover ?? false,
      }),
    );
  },

  async update(
    vehicleId: number,
    imageId: number,
    dto: UpdateVehicleImageDto,
  ): Promise<VehicleImage> {
    const image = await loadImageOrFail(vehicleId, imageId);

    if (dto.isCover === true) {
      await vehicleImageRepository.clearCover(vehicleId, imageId);
    }

    if (dto.url !== undefined) image.url = dto.url;
    if (dto.position !== undefined) image.position = dto.position;
    if (dto.isCover !== undefined) image.isCover = dto.isCover;

    return vehicleImageRepository.save(image);
  },

  async remove(vehicleId: number, imageId: number): Promise<void> {
    await loadImageOrFail(vehicleId, imageId);
    await vehicleImageRepository.delete({ id: imageId, vehicleId });
  },
};
