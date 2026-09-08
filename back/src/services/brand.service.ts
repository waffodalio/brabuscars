import type { Brand } from "../entities/Brand";
import type { CreateBrandDto, UpdateBrandDto } from "../dto/brand.dto";
import { brandRepository } from "../repositories/brand.repository";
import { ApiError } from "../utils/ApiError";
import { slugify } from "../utils/slugify";

/**
 * Business logic for brands: uniqueness rules, slug derivation and the
 * "does it exist?" checks that turn missing rows into 404s.
 */
export const brandService = {
  list(search?: string): Promise<Brand[]> {
    return brandRepository.findAllOrdered(search);
  },

  async getById(id: number): Promise<Brand> {
    const brand = await brandRepository.findById(id);
    if (!brand) {
      throw ApiError.notFound(`Brand ${id} not found`);
    }
    return brand;
  },

  async create(dto: CreateBrandDto): Promise<Brand> {
    const slug = dto.slug ?? slugify(dto.name);

    if (await brandRepository.existsByName(dto.name)) {
      throw ApiError.conflict(`A brand named "${dto.name}" already exists`);
    }
    if (await brandRepository.existsBySlug(slug)) {
      throw ApiError.conflict(`The slug "${slug}" is already in use`);
    }

    const brand = brandRepository.create({ name: dto.name, slug });
    return brandRepository.save(brand);
  },

  async update(id: number, dto: UpdateBrandDto): Promise<Brand> {
    const brand = await brandService.getById(id);

    if (dto.name !== undefined && dto.name !== brand.name) {
      if (await brandRepository.existsByName(dto.name)) {
        throw ApiError.conflict(`A brand named "${dto.name}" already exists`);
      }
      brand.name = dto.name;
    }

    const nextSlug =
      dto.slug ?? (dto.name !== undefined ? slugify(dto.name) : undefined);
    if (nextSlug !== undefined && nextSlug !== brand.slug) {
      if (await brandRepository.existsBySlug(nextSlug)) {
        throw ApiError.conflict(`The slug "${nextSlug}" is already in use`);
      }
      brand.slug = nextSlug;
    }

    return brandRepository.save(brand);
  },

  async remove(id: number): Promise<void> {
    const result = await brandRepository.delete({ id });
    if (!result.affected) {
      throw ApiError.notFound(`Brand ${id} not found`);
    }
  },
};
