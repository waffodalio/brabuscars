import type { ReactNode } from "react";
import { AppNavbar } from "@/components/AppNavbar";
import { AppFooter } from "@/components/AppFooter";

/**
 * Application shell shared by every page: top navigation, centered content
 * container and footer. Rendered once from the root layout.
 */
export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppNavbar />
      <main className="flex-grow-1 py-4 py-lg-5">
        <div className="container" style={{ maxWidth: 1140 }}>
          {children}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
