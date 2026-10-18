import type { ReactNode } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";

/** The side menu (`AdminSidebar`) is rendered by `MainLayout`, outside the keyed page container. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminPageTitle />
      {children}
    </AdminGuard>
  );
}
