"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Nav from "react-bootstrap/Nav";
import { useAuth } from "@/context/AuthContext";

const BASE_LINKS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/marques", label: "Marques" },
  { href: "/admin/modeles", label: "Modèles" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/vehicules", label: "Véhicules" },
  { href: "/admin/annonces", label: "Annonces" },
];

const SUPER_ADMIN_LINKS = [
  { href: "/admin/utilisateurs", label: "Utilisateurs" },
];

export function AdminNav() {
  const pathname = usePathname();
  const { isSuperAdmin } = useAuth();
  const links = isSuperAdmin
    ? [...BASE_LINKS, ...SUPER_ADMIN_LINKS]
    : BASE_LINKS;

  return (
    <Nav variant="pills" className="mb-4 flex-wrap gap-1">
      {links.map((link) => {
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
