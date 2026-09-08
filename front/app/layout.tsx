import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { MainLayout } from "@/layouts/MainLayout";

export const metadata: Metadata = {
  title: "CHCars",
  description: "Plateforme de consultation et de vente de véhicules",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body className="min-vh-100 d-flex flex-column bg-body-tertiary">
        <AuthProvider>
          <FavoritesProvider>
            <MainLayout>{children}</MainLayout>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
