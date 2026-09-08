import { apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type { ContactMessage, ContactMessageInput } from "@/types/contact";

/** `POST` is public; the rest requires an admin session. */
export const contactService = {
  async submit(input: ContactMessageInput): Promise<void> {
    await apiClient.post<ApiSuccess<{ received: boolean }>>("/contact", input);
  },

  async list(): Promise<ContactMessage[]> {
    const response =
      await apiClient.get<ApiSuccess<ContactMessage[]>>("/contact");
    return response.data;
  },

  async setHandled(id: number, handled: boolean): Promise<ContactMessage> {
    const response = await apiClient.patch<ApiSuccess<ContactMessage>>(
      `/contact/${id}`,
      { handled },
    );
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete<void>(`/contact/${id}`);
  },
};
