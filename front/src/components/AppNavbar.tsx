"use client";

import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { useAuth } from "@/context/AuthContext";

/**
 * Primary navigation bar. Client component: it reads the auth state and
 * relies on Bootstrap's responsive collapse behaviour.
 */
export function AppNavbar() {
  const { user, initializing, isAdmin, logout } = useAuth();

  return (
    <Navbar
      expand="lg"
      sticky="top"
      className="chc-navbar py-2"
      collapseOnSelect
    >
      <Container style={{ maxWidth: 1140 }}>
        <Navbar.Brand href="/" className="chc-brand">
          CHCars
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            <Nav.Link href="/annonces">Annonces</Nav.Link>
            <Nav.Link href="/vehicules">Véhicules</Nav.Link>
            <Nav.Link href="/marques">Marques</Nav.Link>
            <Nav.Link href="/modeles">Modèles</Nav.Link>
            <Nav.Link href="/categories">Catégories</Nav.Link>
          </Nav>

          {!initializing && (
            <Nav className="align-items-lg-center gap-lg-1">
              {user ? (
                <>
                  <Nav.Link href="/favoris">Favoris</Nav.Link>
                  {isAdmin && (
                    <Nav.Link href="/admin">Administration</Nav.Link>
                  )}
                  <span className="text-secondary small mx-lg-2 d-none d-lg-inline">
                    {user.firstName}
                  </span>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => {
                      void logout();
                    }}
                  >
                    Déconnexion
                  </Button>
                </>
              ) : (
                <>
                  <Nav.Link href="/connexion">Connexion</Nav.Link>
                  <Button
                    size="sm"
                    href="/inscription"
                    className="ms-lg-2 mt-2 mt-lg-0"
                  >
                    Créer un compte
                  </Button>
                </>
              )}
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
