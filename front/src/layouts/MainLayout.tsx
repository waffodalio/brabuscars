"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppNavbar } from "@/components/AppNavbar";
import { AppFooter } from "@/components/AppFooter";
import { BackButton, NavigationTracker } from "@/components/BackButton";
import { AdminFooter } from "@/components/admin/AdminFooter";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { PageViewTracker } from "@/components/PageViewTracker";
import { ReturnAfterLogin } from "@/components/ReturnAfterLogin";
import { pageKey } from "@/utils/listingPath";

/**
 * Application shell shared by every page: top navigation, centered content
 * container and footer — the public footer on the client-facing pages, the
 * back-office side menu and footer under `/admin`. Rendered once from the root layout. Keying the
 * content on the pathname remounts it on every navigation, so the fade-in
 * plays as a lightweight page transition instead of only on first load.
 */
export function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // First segment after the locale: "admin" for the back-office.
  const isAdminSection = pathname.split("/")[2] === "admin";
  const content = (
    <div
      key={pageKey(pathname)}
      className="container chc-animate-in"
      style={{ maxWidth: 1140 }}
    >
      <BackButton />
      {children}
    </div>
  );

  return (
    <>
      <AppNavbar />
      {isAdminSection ? (
        // The side menu sits outside the keyed container: it stays mounted
        // across admin navigations instead of replaying its slide-in.
        // The footer sits in the content column too, so it lines up with
        // the page and the side menu runs down the whole height.
        <div className="flex-grow-1 d-lg-flex">
          <AdminSidebar />
          <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
            <main className="flex-grow-1 py-4 py-lg-5">{content}</main>
            <AdminFooter />
          </div>
        </div>
      ) : (
        <main className="flex-grow-1 py-4 py-lg-5">{content}</main>
      )}
      {!isAdminSection && <AppFooter />}
      <CookieConsentBanner />
      <PageViewTracker />
      <ReturnAfterLogin />
      <NavigationTracker />
    </>
  );
}
