import { And, LessThan, MoreThanOrEqual } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { ContactMessage } from "../entities/ContactMessage";
import { countPerDay, type DayCount } from "./countPerDay";

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

  countCreatedBetween(since: Date, until: Date): Promise<number> {
    return this.countBy({ createdAt: And(MoreThanOrEqual(since), LessThan(until)) });
  },

  /** Messages received per day since `since`. */
  dailyCreated(since: Date): Promise<DayCount[]> {
    const query = this.createQueryBuilder("message").where("message.created_at >= :since", { since });
    return countPerDay(query, "message.created_at");
  },

  countUnhandled(): Promise<number> {
    return this.countBy({ handled: false });
  },
});
