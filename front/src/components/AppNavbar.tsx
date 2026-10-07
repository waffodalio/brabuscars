"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Primary navigation bar. Client component: it reads the auth state and
 * relies on Bootstrap's responsive collapse behaviour.
 */
export function AppNavbar() {
  const { user, initializing, isAdmin, logout } = useAuth();
  const { t, withLocale } = useLanguage();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleLogout() {
    await logout();
    router.push(withLocale("/"));
  }

  return (
    <Navbar
      expand="lg"
      sticky="top"
      className={`chc-navbar py-2${scrolled ? " chc-navbar--scrolled" : ""}`}
      collapseOnSelect
    >
      <Container style={{ maxWidth: 1140 }}>
        <Navbar.Brand href={withLocale("/")} className="chc-brand">
          BrabusCars
        </Navbar.Brand>
        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            <Nav.Link href={withLocale("/annonces")}>{t.nav.listings}</Nav.Link>
            <Nav.Link href={withLocale("/contact")}>{t.nav.contact}</Nav.Link>
          </Nav>

          {!initializing && (
            <Nav className="align-items-lg-center gap-lg-1">
              {user ? (
                <>
                  <Nav.Link href={withLocale("/favoris")}>
                    {t.nav.favorites}
                  </Nav.Link>
                  {isAdmin && (
                    <Nav.Link href={withLocale("/admin")}>
                      {t.nav.admin}
                    </Nav.Link>
                  )}
                  <span className="text-secondary small mx-lg-2 d-none d-lg-inline">
                    {user.firstName}
                  </span>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => {
                      void handleLogout();
                    }}
                  >
                    {t.nav.logout}
                  </Button>
                </>
              ) : (
                <>
                  <Nav.Link href={withLocale("/connexion")}>
                    {t.nav.login}
                  </Nav.Link>
                  <Button
                    size="sm"
                    href={withLocale("/inscription")}
                    className="ms-lg-2 mt-2 mt-lg-0"
                  >
                    {t.nav.register}
                  </Button>
                </>
              )}
            </Nav>
          )}
        </Navbar.Collapse>
        {/* Always visible (outside the collapse) so switching language or
            theme never requires opening the mobile menu; placed after the
            collapse so it lands at the far right on desktop too. */}
        <div className="d-flex align-items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Navbar.Toggle aria-controls="main-navbar" label={t.nav.toggle} />
        </div>
      </Container>
    </Navbar>
  );
}
