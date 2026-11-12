import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";

/** Back-office: French only, never in search results. */
export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
  alternates: {},
};

/** The side menu (`AdminSidebar`) is rendered by `MainLayout`, outside the keyed page container. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminPageTitle />
      {children}
    </AdminGuard>
  );
}
