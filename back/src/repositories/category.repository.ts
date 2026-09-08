import { Like } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Category } from "../entities/Category";
import { escapeLike } from "../utils/escapeLike";

/**
 * Data-access layer for {@link Category}. All TypeORM queries touching the
 * `category` table live here.
 *
 * (MariaDB `LIKE` is case-insensitive with the default `utf8mb4_unicode_ci`
 * collation, so `Like` is enough for the search filter.)
 */
export const categoryRepository = AppDataSource.getRepository(Category).extend({
  findAllOrdered(search?: string): Promise<Category[]> {
    return this.find({
      where: search ? { name: Like(`%${escapeLike(search)}%`) } : {},
      order: { name: "ASC" },
    });
  },

  findById(id: number): Promise<Category | null> {
    return this.findOneBy({ id });
  },

  existsByName(name: string): Promise<boolean> {
    return this.existsBy({ name });
  },

  existsBySlug(slug: string): Promise<boolean> {
    return this.existsBy({ slug });
  },
});
