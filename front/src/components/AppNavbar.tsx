"use client";

import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";

const NAV_ICONS = {
  listings: "M3 16v-4l2-5h14l2 5v4H3zM7 16a2 2 0 1 0 4 0M13 16a2 2 0 1 0 4 0",
  contact: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm17 2-9 6-9-6",
  login: "M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l4-4-4-4M14 12H4",
  register: "M15 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M8.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19 8v6M22 11h-6",
};

/** Small leading icon of a navbar link (decorative: the label names the link). */
function NavIcon({ d }: { d: string }) {
  return (
    <svg
      className="chc-nav-icon"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/**
 * Primary navigation bar. Client component: it reads the auth state and
 * relies on Bootstrap's responsive collapse behaviour.
 */
export function AppNavbar() {
  const { user, initializing } = useAuth();
  const { t, withLocale } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Navbar
      expand="lg"
      sticky="top"
      className={`chc-navbar py-2${scrolled ? " chc-navbar--scrolled" : ""}`}
      collapseOnSelect
    >
      <Container style={{ maxWidth: 1140 }}>
        <Navbar.Brand href={withLocale("/")} aria-label="BrabusCars">
          <BrandLogo />
        </Navbar.Brand>
        {/* Always visible (outside the collapse) so the account menu, language
            and theme never require opening the mobile menu. Placed before the
            collapse so it stays on the brand's row on mobile (the collapse
            opens below), moved to the far right on desktop by `order-lg-last`. */}
        <div className="position-relative d-flex align-items-center gap-1 gap-sm-2 order-lg-last ms-auto ms-lg-3">
          {!initializing && user && <UserMenu />}
          <LanguageSwitcher />
          <ThemeToggle />
          <Navbar.Toggle aria-controls="main-navbar" label={t.nav.toggle} />
        </div>
        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            <Nav.Link href={withLocale("/annonces")}>
              <NavIcon d={NAV_ICONS.listings} />
              {t.nav.listings}
            </Nav.Link>
            <Nav.Link href={withLocale("/contact")}>
              <NavIcon d={NAV_ICONS.contact} />
              {t.nav.contact}
            </Nav.Link>
          </Nav>

          {!initializing && !user && (
            <Nav className="align-items-lg-center gap-lg-1">
              <Nav.Link href={withLocale("/connexion")}>
                <NavIcon d={NAV_ICONS.login} />
                {t.nav.login}
              </Nav.Link>
              <Button
                size="sm"
                href={withLocale("/inscription")}
                className="ms-lg-2 mt-2 mt-lg-0 d-inline-flex align-items-center justify-content-center gap-2"
              >
                <NavIcon d={NAV_ICONS.register} />
                {t.nav.register}
              </Button>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
