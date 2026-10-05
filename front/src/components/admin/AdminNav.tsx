"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Nav from "react-bootstrap/Nav";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const BASE_LINKS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/marques", label: "Marques" },
  { href: "/admin/modeles", label: "Modèles" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/annonces", label: "Annonces" },
];

const ADMIN_LINKS = [{ href: "/admin/messages", label: "Messages" }];

const SUPER_ADMIN_LINKS = [
  { href: "/admin/utilisateurs", label: "Utilisateurs" },
];

export function AdminNav() {
  const pathname = usePathname();
  const { isSuperAdmin } = useAuth();
  const { withLocale } = useLanguage();
  const links = [
    ...BASE_LINKS,
    ...ADMIN_LINKS,
    ...(isSuperAdmin ? SUPER_ADMIN_LINKS : []),
  ];

  return (
    <Nav variant="pills" className="mb-4 flex-wrap gap-1">
      {links.map((link) => {
        const href = withLocale(link.href);
        const active =
          link.href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Nav.Item key={link.href}>
            <Nav.Link as={Link} href={href} active={active}>
              {link.label}
            </Nav.Link>
          </Nav.Item>
        );
      })}
    </Nav>
  );
}
