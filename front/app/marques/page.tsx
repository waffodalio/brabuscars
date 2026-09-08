"use client";

import { ReferenceTable } from "@/components/ReferenceTable";
import { brandService } from "@/services/brandService";

export default function BrandsPage() {
  return (
    <ReferenceTable
      title="Marques"
      emptyLabel="Aucune marque enregistrée."
      fetcher={() => brandService.list()}
    />
  );
}
