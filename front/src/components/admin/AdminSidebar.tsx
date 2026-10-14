"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Offcanvas from "react-bootstrap/Offcanvas";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { ADMIN_ICONS, AdminIcon } from "./AdminIcon";

type NavItem = { href: string; label: string; icon: string };
type NavGroup = { title: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    title: "Général",
    items: [
      { href: "/admin", label: "Tableau de bord", icon: ADMIN_ICONS.dashboard },
      { href: "/admin/statistiques", label: "Statistiques", icon: ADMIN_ICONS.stats },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/admin/marques", label: "Marques", icon: ADMIN_ICONS.brand },
      { href: "/admin/modeles", label: "Modèles", icon: ADMIN_ICONS.model },
      { href: "/admin/categories", label: "Catégories", icon: ADMIN_ICONS.category },
    ],
  },
  {
    title: "Ventes",
    items: [
      { href: "/admin/annonces", label: "Annonces", icon: ADMIN_ICONS.listing },
      { href: "/admin/annonces/nouvelle", label: "Nouvelle annonce", icon: ADMIN_ICONS.plus },
    ],
  },
  {
    title: "Relation client",
    items: [{ href: "/admin/messages", label: "Messages", icon: ADMIN_ICONS.mail }],
  },
];

const SUPER_ADMIN_GROUP: NavGroup = {
  title: "Comptes",
  items: [{ href: "/admin/utilisateurs", label: "Utilisateurs", icon: ADMIN_ICONS.users }],
};

const ROLE_LABELS = { user: "Utilisateur", admin: "Admin", super_admin: "Super admin" };

/** The most specific link matching the current path (so « Nouvelle annonce » wins over « Annonces »). */
function activeHrefOf(pathname: string, hrefs: string[]): string | undefined {
  return hrefs
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
}

/**
 * Back-office side menu, grouped by domain. Bootstrap responsive offcanvas:
 * a fixed column on the left from `lg` up, and below that a drawer opened by
 * the « Menu d'administration » button that slides in from the left.
 * Rendered by `MainLayout` outside the per-page keyed container, so it is not
 * remounted (nor re-animated) on every admin navigation.
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { withLocale } = useLanguage();
  const [show, setShow] = useState(false);

  if (!user || !isAdmin) return null;

  const groups = isSuperAdmin ? [...GROUPS, SUPER_ADMIN_GROUP] : GROUPS;
  const activeHref = activeHrefOf(
    pathname,
    groups.flatMap((group) => group.items.map((item) => withLocale(item.href))),
  );
  const close = () => setShow(false);

  return (
    <>
      <div className="container d-lg-none pt-3">
        <Button
          variant="outline-secondary"
          size="sm"
          className="d-inline-flex align-items-center gap-2"
          aria-controls="admin-sidebar"
          onClick={() => setShow(true)}
        >
          <AdminIcon d={ADMIN_ICONS.menu} />
          Menu d&apos;administration
        </Button>
      </div>

      <aside className="chc-admin-sidebar">
        <Offcanvas
          id="admin-sidebar"
          show={show}
          onHide={close}
          placement="start"
          responsive="lg"
          aria-labelledby="admin-sidebar-title"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="admin-sidebar-title">Administration</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="flex-column">
            <nav aria-label="Menu d'administration">
              {groups.map((group) => (
                <div key={group.title} className="chc-admin-sidebar-group">
                  <div className="chc-admin-sidebar-heading">{group.title}</div>
                  {group.items.map((item) => {
                    const href = withLocale(item.href);
                    const active = href === activeHref;
                    return (
                      <Link
                        key={item.href}
                        href={href}
                        onClick={close}
                        className={`chc-admin-sidebar-link${active ? " active" : ""}`}
                        aria-current={active ? "page" : undefined}
                      >
                        <AdminIcon d={item.icon} size={17} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
              <div className="chc-admin-sidebar-group">
                <a
                  href={withLocale("/")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chc-admin-sidebar-link"
                >
                  <AdminIcon d={ADMIN_ICONS.external} size={17} />
                  Voir le site
                </a>
              </div>
            </nav>

            <div className="chc-admin-sidebar-account">
              <span className="chc-admin-avatar" aria-hidden="true">
                {`${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()}
              </span>
              <div className="lh-sm">
                <div className="fw-semibold text-body">
                  {user.firstName} {user.lastName}
                </div>
                <span className="badge rounded-pill text-bg-primary mt-1">
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            </div>
          </Offcanvas.Body>
        </Offcanvas>
      </aside>
    </>
  );
}
