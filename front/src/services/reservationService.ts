import { apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type {
  Reservation,
  ReservationDecision,
  ReservationInput,
  ReservationStatus,
  ReservationType,
} from "@/types/reservation";

/**
 * `/reservations`: a signed-in customer's requests (create, list, cancel)
 * and the back-office decisions (admin).
 */
export const reservationService = {
  async create(input: ReservationInput): Promise<Reservation> {
    const response = await apiClient.post<ApiSuccess<Reservation>>("/reservations", input);
    return response.data;
  },

  async mine(): Promise<Reservation[]> {
    const response = await apiClient.get<ApiSuccess<Reservation[]>>("/reservations/mine");
    return response.data;
  },

  async cancelMine(id: number): Promise<Reservation> {
    const response = await apiClient.post<ApiSuccess<Reservation>>(`/reservations/${id}/cancel`, {});
    return response.data;
  },

  async list(filters: { status?: ReservationStatus; type?: ReservationType } = {}): Promise<Reservation[]> {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.type) params.set("type", filters.type);
    const query = params.toString();
    const response = await apiClient.get<ApiSuccess<Reservation[]>>(
      `/reservations${query ? `?${query}` : ""}`,
    );
    return response.data;
  },

  async decide(
    id: number,
    decision: { status: ReservationDecision; holdDays?: number; visitAt?: string; adminNote?: string },
  ): Promise<Reservation> {
    const response = await apiClient.patch<ApiSuccess<Reservation>>(`/reservations/${id}`, decision);
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete<void>(`/reservations/${id}`);
  },
};
