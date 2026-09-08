import type { Vehicle } from "../entities/Vehicle";
import type {
  CreateVehicleDto,
  ListVehicleQuery,
  UpdateVehicleDto,
} from "../dto/vehicle.dto";
import { vehicleRepository } from "../repositories/vehicle.repository";
import { carModelRepository } from "../repositories/carModel.repository";
import { categoryRepository } from "../repositories/category.repository";
import { ApiError } from "../utils/ApiError";

async function assertModelExists(modelId: number): Promise<void> {
  if (!(await carModelRepository.findById(modelId))) {
    throw ApiError.badRequest(`Car model ${modelId} does not exist`);
  }
}

async function assertCategoryExists(categoryId: number): Promise<void> {
  if (!(await categoryRepository.findById(categoryId))) {
    throw ApiError.badRequest(`Category ${categoryId} does not exist`);
  }
}

/**
 * Business logic for vehicles. Validates the referenced model (required) and
 * category (optional), and normalises omitted optional fields to `null`.
 */
export const vehicleService = {
  list(query: ListVehicleQuery): Promise<Vehicle[]> {
    return vehicleRepository.findAllFiltered(query);
  },

  async getById(id: number): Promise<Vehicle> {
    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) {
      throw ApiError.notFound(`Vehicle ${id} not found`);
    }
    return vehicle;
  },

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    await assertModelExists(dto.modelId);
    if (dto.categoryId != null) {
      await assertCategoryExists(dto.categoryId);
    }

    const vehicle = vehicleRepository.create({
      modelId: dto.modelId,
      categoryId: dto.categoryId ?? null,
      year: dto.year,
      mileage: dto.mileage,
      fuelType: dto.fuelType,
      transmission: dto.transmission,
      power: dto.power ?? null,
      doors: dto.doors ?? null,
      color: dto.color ?? null,
    });

    const saved = await vehicleRepository.save(vehicle);
    return vehicleService.getById(saved.id);
  },

  async update(id: number, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await vehicleService.getById(id);

    if (dto.modelId !== undefined && dto.modelId !== vehicle.modelId) {
      await assertModelExists(dto.modelId);
    }
    if (dto.categoryId != null && dto.categoryId !== vehicle.categoryId) {
      await assertCategoryExists(dto.categoryId);
    }

    if (dto.modelId !== undefined) vehicle.modelId = dto.modelId;
    if (dto.categoryId !== undefined) vehicle.categoryId = dto.categoryId;
    if (dto.year !== undefined) vehicle.year = dto.year;
    if (dto.mileage !== undefined) vehicle.mileage = dto.mileage;
    if (dto.fuelType !== undefined) vehicle.fuelType = dto.fuelType;
    if (dto.transmission !== undefined) vehicle.transmission = dto.transmission;
    if (dto.power !== undefined) vehicle.power = dto.power;
    if (dto.doors !== undefined) vehicle.doors = dto.doors;
    if (dto.color !== undefined) vehicle.color = dto.color;

    await vehicleRepository.save(vehicle);
    return vehicleService.getById(id);
  },

  async remove(id: number): Promise<void> {
    const result = await vehicleRepository.delete({ id });
    if (!result.affected) {
      throw ApiError.notFound(`Vehicle ${id} not found`);
    }
  },
};
