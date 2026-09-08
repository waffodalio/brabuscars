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
  const { user, initializing, logout } = useAuth();

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="/">CHCars</Navbar.Brand>
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
            <Nav className="align-items-lg-center">
              {user ? (
                <>
                  <Nav.Link href="/favoris">Favoris</Nav.Link>
                  {user.role === "admin" && (
                    <Nav.Link href="/admin">Administration</Nav.Link>
                  )}
                  <Navbar.Text className="mx-lg-3">
                    Bonjour, {user.firstName}
                  </Navbar.Text>
                  <Button size="sm" variant="outline-light" onClick={logout}>
                    Déconnexion
                  </Button>
                </>
              ) : (
                <>
                  <Nav.Link href="/connexion">Connexion</Nav.Link>
                  <Nav.Link href="/inscription">Inscription</Nav.Link>
                </>
              )}
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
