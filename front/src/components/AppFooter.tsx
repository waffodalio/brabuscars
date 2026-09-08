import Link from "next/link";

/**
 * Application footer. Static, so it stays a server component.
 */
export function AppFooter() {
  return (
    <footer className="mt-auto border-top bg-white">
      <div
        className="container d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 py-4 small text-secondary"
        style={{ maxWidth: 1140 }}
      >
        <span>© {new Date().getFullYear()} CHCars</span>
        <nav className="d-flex gap-3">
          <Link href="/annonces" className="link-secondary">
            Annonces
          </Link>
          <Link href="/vehicules" className="link-secondary">
            Véhicules
          </Link>
          <Link href="/connexion" className="link-secondary">
            Espace vendeur
          </Link>
        </nav>
      </div>
    </footer>
  );
}
