import { AppDataSource } from "../config/data-source";
import { ContactMessage } from "../entities/ContactMessage";

/** Data-access layer for {@link ContactMessage}. */
export const contactMessageRepository = AppDataSource.getRepository(
  ContactMessage,
).extend({
  findAllRecent(): Promise<ContactMessage[]> {
    return this.find({
      order: { handled: "ASC", createdAt: "DESC" },
      take: 200,
    });
  },

  findById(id: number): Promise<ContactMessage | null> {
    return this.findOneBy({ id });
  },
});
