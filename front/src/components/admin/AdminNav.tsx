"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Nav from "react-bootstrap/Nav";

const LINKS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/marques", label: "Marques" },
  { href: "/admin/modeles", label: "Modèles" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/vehicules", label: "Véhicules" },
  { href: "/admin/annonces", label: "Annonces" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <Nav variant="pills" className="mb-4 flex-wrap gap-1">
      {LINKS.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);
        return (
          <Nav.Item key={link.href}>
            <Nav.Link as={Link} href={link.href} active={active}>
              {link.label}
            </Nav.Link>
          </Nav.Item>
        );
      })}
    </Nav>
  );
}
