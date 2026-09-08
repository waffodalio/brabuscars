import { apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type { Company } from "@/types/company";

export const companyService = {
  async get(): Promise<Company> {
    const response = await apiClient.get<ApiSuccess<Company>>("/company");
    return response.data;
  },
};
