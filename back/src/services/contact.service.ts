import type {
  CreateContactMessageDto,
  UpdateContactMessageDto,
} from "../dto/contact.dto";
import type { ContactMessage } from "../entities/ContactMessage";
import { contactMessageRepository } from "../repositories/contactMessage.repository";
import { ApiError } from "../utils/ApiError";

/**
 * Contact form messages. `submit` is public; listing / updating / deleting is
 * admin-only (route middleware).
 */
export const contactService = {
  async submit(dto: CreateContactMessageDto): Promise<void> {
    if (dto.website) {
      // Honeypot filled → silently drop (don't tell the bot).
      return;
    }
    await contactMessageRepository.save(
      contactMessageRepository.create({
        name: dto.name,
        email: dto.email,
        message: dto.message,
      }),
    );
  },

  list(): Promise<ContactMessage[]> {
    return contactMessageRepository.findAllRecent();
  },

  async setHandled(
    id: number,
    dto: UpdateContactMessageDto,
  ): Promise<ContactMessage> {
    const message = await contactMessageRepository.findById(id);
    if (!message) {
      throw ApiError.notFound(`Message ${id} not found`);
    }
    message.handled = dto.handled;
    return contactMessageRepository.save(message);
  },

  async remove(id: number): Promise<void> {
    const result = await contactMessageRepository.delete({ id });
    if (!result.affected) {
      throw ApiError.notFound(`Message ${id} not found`);
    }
  },
};
