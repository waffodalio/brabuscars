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
import { SITE_NAME, TITLE_TEMPLATE, localeAlternates, resolveLocale, siteOrigin } from "@/i18n/metadata";
import { LOCALES, isLocale, type Locale } from "@/i18n/locales";
import { cookies } from "next/headers";
import { INTL_LOCALES } from "@/i18n/locales";

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

/**
 * Site-wide metadata: home title, description, `hreflang` links of the home
 * page, and the « · BrabusCars » template completing every section's title
 * (`sectionMetadata` in each section's `layout.tsx`).
 */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return {
    metadataBase: await siteOrigin(),
    title: { default: t.meta.siteTitle, template: TITLE_TEMPLATE },
    description: t.meta.siteDescription,
    other: { google: "notranslate" },
    alternates: localeAlternates(locale, ""),
    openGraph: {
      siteName: SITE_NAME,
      locale: INTL_LOCALES[locale].replace("-", "_"),
      type: "website",
    },
  };
}

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
    // translate="no" (+ the `google: notranslate` meta): the site has its own
    // fr / en / nl versions; browser translation rewrites the text React
    // manages, mixing languages and breaking the next updates of the page.
    <html
      lang={INTL_LOCALES[locale]}
      translate="no"
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
