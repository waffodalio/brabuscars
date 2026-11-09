import { API_BASE_URL, ApiClientError, apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type { Sale, SaleInput, SalePaymentInput, SaleStatus } from "@/types/sale";

/** `/sales` — back-office billing (admin session). */
export const saleService = {
  async list(status?: SaleStatus): Promise<Sale[]> {
    const response = await apiClient.get<ApiSuccess<Sale[]>>(`/sales${status ? `?status=${status}` : ""}`);
    return response.data;
  },

  async get(id: number): Promise<Sale> {
    const response = await apiClient.get<ApiSuccess<Sale>>(`/sales/${id}`);
    return response.data;
  },

  async create(input: SaleInput): Promise<Sale> {
    const response = await apiClient.post<ApiSuccess<Sale>>("/sales", input);
    return response.data;
  },

  async update(id: number, input: SaleInput): Promise<Sale> {
    const response = await apiClient.put<ApiSuccess<Sale>>(`/sales/${id}`, input);
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete<void>(`/sales/${id}`);
  },

  async addPayment(id: number, input: SalePaymentInput): Promise<Sale> {
    const response = await apiClient.post<ApiSuccess<Sale>>(`/sales/${id}/payments`, input);
    return response.data;
  },

  async deletePayment(id: number, paymentId: number): Promise<Sale> {
    const response = await apiClient.delete<ApiSuccess<Sale>>(`/sales/${id}/payments/${paymentId}`);
    return response.data;
  },

  /**
   * Downloads an issued document. The PDF has no public address: it is
   * fetched with the session cookie, then handed to the browser as a file.
   */
  async downloadDocument(saleId: number, documentId: number, filename: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/sales/${saleId}/documents/${documentId}/pdf`, {
      credentials: "include",
    });
    if (!response.ok) throw new ApiClientError("Download failed", response.status);
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
