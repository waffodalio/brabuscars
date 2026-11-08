"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { takeReturnPath } from "@/utils/returnPath";

/**
 * "Sign in with Google" always lands on the home page: once the session is
 * there, send the visitor on to where they asked to log in from (e.g. a
 * listing they wanted to reserve). The password and sign-up pages handle it
 * themselves. Renders nothing.
 */
export function ReturnAfterLogin() {
  const { user, initializing } = useAuth();
  const { locale } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (initializing || !user || pathname !== `/${locale}`) return;
    const path = takeReturnPath();
    if (path) router.replace(path);
  }, [initializing, user, pathname, locale, router]);

  return null;
}
