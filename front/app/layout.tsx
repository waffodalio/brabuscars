import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CompanyProvider } from "@/context/CompanyContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { MainLayout } from "@/layouts/MainLayout";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "CHCars — véhicules d'occasion",
  description: "Plateforme de consultation et de vente de véhicules",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={manrope.variable}>
      <body className="min-vh-100 d-flex flex-column">
        <CompanyProvider>
          <AuthProvider>
            <FavoritesProvider>
              <MainLayout>{children}</MainLayout>
            </FavoritesProvider>
          </AuthProvider>
        </CompanyProvider>
      </body>
    </html>
  );
}
