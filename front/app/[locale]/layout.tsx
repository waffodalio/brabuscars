import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Manrope } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "../globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CompanyProvider } from "@/context/CompanyContext";
import { CookieConsentProvider } from "@/context/CookieConsentContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider, type Theme } from "@/context/ThemeContext";
import { MainLayout } from "@/layouts/MainLayout";
import { LOCALES, isLocale, type Locale } from "@/i18n/locales";
import { cookies } from "next/headers";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

/** Pre-renders `/fr`, `/en` and `/nl` at build time instead of on first request. */
export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }));
}

type Params = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  return METADATA[isLocale(locale) ? locale : "fr"];
}

const METADATA: Record<Locale, Metadata> = {
  fr: {
    title: "CHCars — véhicules d'occasion",
    description: "Plateforme de consultation et de vente de véhicules",
  },
  en: {
    title: "CHCars — used vehicles",
    description: "Platform to browse and buy vehicles",
  },
  nl: {
    title: "CHCars — tweedehandsvoertuigen",
    description: "Platform om voertuigen te bekijken en te kopen",
  },
};

async function readThemeCookie(): Promise<Theme> {
  const cookieStore = await cookies();
  return cookieStore.get("chcars_theme")?.value === "dark" ? "dark" : "light";
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const theme = await readThemeCookie();

  return (
    // suppressHydrationWarning: browser extensions (Google Translate, Dark
    // Reader, Grammarly…) rewrite <html> attributes before React hydrates.
    // It only covers this element's own attributes, not its children.
    <html
      lang={locale}
      className={manrope.variable}
      data-bs-theme={theme}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-vh-100 d-flex flex-column">
        <LanguageProvider>
          <ThemeProvider initialTheme={theme}>
            <CompanyProvider>
              <AuthProvider>
                <FavoritesProvider>
                  <CookieConsentProvider>
                    <MainLayout>{children}</MainLayout>
                  </CookieConsentProvider>
                </FavoritesProvider>
              </AuthProvider>
            </CompanyProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
