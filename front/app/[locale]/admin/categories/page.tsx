"use client";

import { SlugResourceAdmin } from "@/components/admin/SlugResourceAdmin";
import { categoryService } from "@/services/categoryService";

export default function AdminCategoriesPage() {
  return (
    <SlugResourceAdmin
      singular="catégorie"
      fetchAll={() => categoryService.list()}
      create={(input) => categoryService.create(input)}
      update={(id, input) => categoryService.update(id, input)}
      remove={(id) => categoryService.remove(id)}
    />
  );
}
