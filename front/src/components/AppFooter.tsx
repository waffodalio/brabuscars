"use client";

import Link from "next/link";
import { useCompany } from "@/context/CompanyContext";

/** Application footer. */
export function AppFooter() {
  const company = useCompany();

  return (
    <footer className="mt-auto border-top bg-white">
      <div
        className="container d-flex flex-column flex-md-row justify-content-between gap-3 py-4 small text-secondary"
        style={{ maxWidth: 1140 }}
      >
        <div>
          <div className="fw-semibold text-body">
            {company?.name ?? "CHCars"}
          </div>
          {company && (
            <div>
              {company.address}, {company.postalCode} {company.city} ·{" "}
              {company.phone}
            </div>
          )}
          <div>© {new Date().getFullYear()} CHCars</div>
        </div>
        <nav className="d-flex gap-3 align-items-start">
          <Link href="/annonces" className="link-secondary">
            Annonces
          </Link>
          <Link href="/vehicules" className="link-secondary">
            Véhicules
          </Link>
          <Link href="/contact" className="link-secondary">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}
