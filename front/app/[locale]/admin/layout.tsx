import type { ReactNode } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminNav } from "@/components/admin/AdminNav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <h1 className="h3 mb-3">Administration</h1>
      <AdminNav />
      {children}
    </AdminGuard>
  );
}
