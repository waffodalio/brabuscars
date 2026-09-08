import type { Brand } from "./brand";

export interface CarModel {
  id: number;
  name: string;
  brandId: number;
  /** Present when the API loads the relation (list & detail endpoints). */
  brand?: Brand;
  createdAt: string;
}
