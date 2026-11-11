import { ADMIN_ICONS } from "./AdminIcon";

/** Back-office pages, grouped by domain: the side menu and the Ctrl + K palette. */
export type NavItem = { href: string; label: string; icon: string };
export type NavGroup = { title: string; items: NavItem[] };

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    title: "Général",
    items: [
      { href: "/admin", label: "Tableau de bord", icon: ADMIN_ICONS.dashboard },
      { href: "/admin/statistiques", label: "Statistiques", icon: ADMIN_ICONS.stats },
      { href: "/admin/systeme", label: "Système", icon: ADMIN_ICONS.server },
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
      { href: "/admin/stock", label: "Stock du garage", icon: ADMIN_ICONS.garage },
      { href: "/admin/annonces", label: "Annonces", icon: ADMIN_ICONS.listing },
      { href: "/admin/annonces/nouvelle", label: "Nouvelle annonce", icon: ADMIN_ICONS.plus },
      { href: "/admin/ventes", label: "Facturation", icon: ADMIN_ICONS.invoice },
    ],
  },
  {
    title: "Relation client",
    items: [
      { href: "/admin/reservations", label: "Réservations", icon: ADMIN_ICONS.calendar },
      { href: "/admin/messages", label: "Messages", icon: ADMIN_ICONS.mail },
    ],
  },
];

export const SUPER_ADMIN_NAV_GROUP: NavGroup = {
  title: "Comptes",
  items: [{ href: "/admin/utilisateurs", label: "Utilisateurs", icon: ADMIN_ICONS.users }],
};
