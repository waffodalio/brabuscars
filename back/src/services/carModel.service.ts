import type { CarModel } from "../entities/CarModel";
import type {
  CreateCarModelDto,
  ListCarModelQuery,
  UpdateCarModelDto,
} from "../dto/carModel.dto";
import { carModelRepository } from "../repositories/carModel.repository";
import { brandRepository } from "../repositories/brand.repository";
import { ApiError } from "../utils/ApiError";

async function assertBrandExists(brandId: number): Promise<void> {
  if (!(await brandRepository.findById(brandId))) {
    throw ApiError.badRequest(`Brand ${brandId} does not exist`);
  }
}

async function assertNamePairFree(
  brandId: number,
  name: string,
  currentId?: number,
): Promise<void> {
  const existing = await carModelRepository.findByBrandAndName(brandId, name);
  if (existing && existing.id !== currentId) {
    throw ApiError.conflict(
      `Brand ${brandId} already has a model named "${name}"`,
    );
  }
}

/**
 * Business logic for car models. Enforces that the parent brand exists and
 * that a model name is unique within its brand.
 */
export const carModelService = {
  list(query: ListCarModelQuery): Promise<CarModel[]> {
    return carModelRepository.findAllOrdered(query);
  },

  async getById(id: number): Promise<CarModel> {
    const carModel = await carModelRepository.findById(id);
    if (!carModel) {
      throw ApiError.notFound(`Car model ${id} not found`);
    }
    return carModel;
  },

  async create(dto: CreateCarModelDto): Promise<CarModel> {
    await assertBrandExists(dto.brandId);
    await assertNamePairFree(dto.brandId, dto.name);

    const carModel = carModelRepository.create({
      name: dto.name,
      brandId: dto.brandId,
    });
    const saved = await carModelRepository.save(carModel);
    return carModelService.getById(saved.id);
  },

  async update(id: number, dto: UpdateCarModelDto): Promise<CarModel> {
    const carModel = await carModelService.getById(id);

    const nextBrandId = dto.brandId ?? carModel.brandId;
    const nextName = dto.name ?? carModel.name;

    if (dto.brandId !== undefined && dto.brandId !== carModel.brandId) {
      await assertBrandExists(dto.brandId);
    }
    if (nextBrandId !== carModel.brandId || nextName !== carModel.name) {
      await assertNamePairFree(nextBrandId, nextName, id);
    }

    carModel.brandId = nextBrandId;
    carModel.name = nextName;
    await carModelRepository.save(carModel);
    return carModelService.getById(id);
  },

  async remove(id: number): Promise<void> {
    const result = await carModelRepository.delete({ id });
    if (!result.affected) {
      throw ApiError.notFound(`Car model ${id} not found`);
    }
  },
};
