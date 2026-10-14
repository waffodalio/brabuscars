import type { ReactNode } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";

/** The side menu (`AdminSidebar`) is rendered by `MainLayout`, outside the keyed page container. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <h1 className="h3 mb-3">Administration</h1>
      {children}
    </AdminGuard>
  );
}
