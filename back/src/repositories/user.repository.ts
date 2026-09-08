import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";

/**
 * Data-access layer for {@link User}. Rows include `passwordHash`; callers
 * must map to a public shape before sending a user to a client.
 */
export const userRepository = AppDataSource.getRepository(User).extend({
  findByEmail(email: string): Promise<User | null> {
    return this.findOneBy({ email });
  },

  findById(id: number): Promise<User | null> {
    return this.findOneBy({ id });
  },

  existsByEmail(email: string): Promise<boolean> {
    return this.existsBy({ email });
  },
});
