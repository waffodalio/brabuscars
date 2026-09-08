/**
 * Application footer. Static, so it stays a server component.
 */
export function AppFooter() {
  return (
    <footer className="bg-dark text-white-50 py-3 mt-auto">
      <div className="container small">
        © {new Date().getFullYear()} CHCars
      </div>
    </footer>
  );
}
