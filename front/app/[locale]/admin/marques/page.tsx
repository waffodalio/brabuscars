"use client";

import { SlugResourceAdmin } from "@/components/admin/SlugResourceAdmin";
import { brandService } from "@/services/brandService";

export default function AdminBrandsPage() {
  return (
    <SlugResourceAdmin
      singular="marque"
      fetchAll={() => brandService.list()}
      create={(input) => brandService.create(input)}
      update={(id, input) => brandService.update(id, input)}
      remove={(id) => brandService.remove(id)}
    />
  );
}
