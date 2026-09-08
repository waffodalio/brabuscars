import { Like } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Brand } from "../entities/Brand";

/**
 * Data-access layer for {@link Brand}. All TypeORM queries touching the
 * `brand` table live here; services and controllers never query directly.
 *
 * (MySQL `LIKE` is case-insensitive with the default `utf8mb4_unicode_ci`
 * collation, so `Like` is enough for the search filter.)
 */
export const brandRepository = AppDataSource.getRepository(Brand).extend({
  findAllOrdered(search?: string): Promise<Brand[]> {
    return this.find({
      where: search ? { name: Like(`%${search}%`) } : {},
      order: { name: "ASC" },
    });
  },

  findById(id: number): Promise<Brand | null> {
    return this.findOneBy({ id });
  },

  existsByName(name: string): Promise<boolean> {
    return this.existsBy({ name });
  },

  existsBySlug(slug: string): Promise<boolean> {
    return this.existsBy({ slug });
  },
});
