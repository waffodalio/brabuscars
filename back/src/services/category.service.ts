import type { Category } from "../entities/Category";
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../dto/category.dto";
import { categoryRepository } from "../repositories/category.repository";
import { ApiError } from "../utils/ApiError";
import { slugify } from "../utils/slugify";

/**
 * Business logic for categories: uniqueness rules, slug derivation and the
 * existence checks that turn missing rows into 404s.
 */
export const categoryService = {
  list(search?: string): Promise<Category[]> {
    return categoryRepository.findAllOrdered(search);
  },

  async getById(id: number): Promise<Category> {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw ApiError.notFound(`Category ${id} not found`);
    }
    return category;
  },

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = dto.slug ?? slugify(dto.name);

    if (await categoryRepository.existsByName(dto.name)) {
      throw ApiError.conflict(`A category named "${dto.name}" already exists`);
    }
    if (await categoryRepository.existsBySlug(slug)) {
      throw ApiError.conflict(`The slug "${slug}" is already in use`);
    }

    const category = categoryRepository.create({ name: dto.name, slug });
    return categoryRepository.save(category);
  },

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await categoryService.getById(id);

    if (dto.name !== undefined && dto.name !== category.name) {
      if (await categoryRepository.existsByName(dto.name)) {
        throw ApiError.conflict(`A category named "${dto.name}" already exists`);
      }
      category.name = dto.name;
    }

    const nextSlug =
      dto.slug ?? (dto.name !== undefined ? slugify(dto.name) : undefined);
    if (nextSlug !== undefined && nextSlug !== category.slug) {
      if (await categoryRepository.existsBySlug(nextSlug)) {
        throw ApiError.conflict(`The slug "${nextSlug}" is already in use`);
      }
      category.slug = nextSlug;
    }

    return categoryRepository.save(category);
  },

  async remove(id: number): Promise<void> {
    const result = await categoryRepository.delete({ id });
    if (!result.affected) {
      throw ApiError.notFound(`Category ${id} not found`);
    }
  },
};
