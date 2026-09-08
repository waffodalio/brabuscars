"use client";

import { ReferenceTable } from "@/components/ReferenceTable";
import { categoryService } from "@/services/categoryService";

export default function CategoriesPage() {
  return (
    <ReferenceTable
      title="Catégories"
      emptyLabel="Aucune catégorie enregistrée."
      fetcher={() => categoryService.list()}
    />
  );
}
