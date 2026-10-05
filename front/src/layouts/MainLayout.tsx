"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppNavbar } from "@/components/AppNavbar";
import { AppFooter } from "@/components/AppFooter";
import { AdminFooter } from "@/components/admin/AdminFooter";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";

/**
 * Application shell shared by every page: top navigation, centered content
 * container and footer — the public footer on the client-facing pages, the
 * back-office footer under `/admin`. Rendered once from the root layout. Keying the
 * content on the pathname remounts it on every navigation, so the fade-in
 * plays as a lightweight page transition instead of only on first load.
 */
export function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // First segment after the locale: "admin" for the back-office.
  const isAdminSection = pathname.split("/")[2] === "admin";

  return (
    <>
      <AppNavbar />
      <main className="flex-grow-1 py-4 py-lg-5">
        <div
          key={pathname}
          className="container chc-animate-in"
          style={{ maxWidth: 1140 }}
        >
          {children}
        </div>
      </main>
      {isAdminSection ? <AdminFooter /> : <AppFooter />}
      <CookieConsentBanner />
    </>
  );
}
