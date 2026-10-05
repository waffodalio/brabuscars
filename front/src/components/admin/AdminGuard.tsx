"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Spinner from "react-bootstrap/Spinner";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Gates the whole `/admin` section: sends anonymous visitors to the login
 * page and non-admins back to the home page.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, initializing, isAdmin } = useAuth();
  const { locale } = useLanguage();

  useEffect(() => {
    if (initializing) return;
    if (!user) router.replace(`/${locale}/connexion`);
    else if (!isAdmin) router.replace(`/${locale}`);
  }, [initializing, user, isAdmin, router, locale]);

  if (initializing || !isAdmin) {
    return <Spinner animation="border" role="status" aria-label="Chargement" />;
  }

  return <>{children}</>;
}
