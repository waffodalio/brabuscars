import { Like, type FindOptionsWhere } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import type { ListUsersQuery } from "../dto/user.dto";
import { escapeLike } from "../utils/escapeLike";

/**
 * Data-access layer for {@link User}. Rows include `passwordHash`; callers
 * must map to a public shape before sending a user to a client.
 */
export const userRepository = AppDataSource.getRepository(User).extend({
  findByEmail(email: string): Promise<User | null> {
    return this.findOneBy({ email });
  },

  findByGoogleSub(googleSub: string): Promise<User | null> {
    return this.findOneBy({ googleSub });
  },

  findById(id: number): Promise<User | null> {
    return this.findOneBy({ id });
  },

  existsByEmail(email: string): Promise<boolean> {
    return this.existsBy({ email });
  },

  findAllFiltered(query: ListUsersQuery): Promise<User[]> {
    const roleFilter: FindOptionsWhere<User> = query.role
      ? { role: query.role }
      : {};

    if (query.search) {
      const pattern = Like(`%${escapeLike(query.search)}%`);
      return this.find({
        where: [
          { ...roleFilter, email: pattern },
          { ...roleFilter, firstName: pattern },
          { ...roleFilter, lastName: pattern },
        ],
        order: { createdAt: "DESC" },
      });
    }

    return this.find({ where: roleFilter, order: { createdAt: "DESC" } });
  },
});
