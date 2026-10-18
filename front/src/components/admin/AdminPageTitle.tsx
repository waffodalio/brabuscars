"use client";

import { usePathname } from "next/navigation";

/** Heading per admin list page; pages with their own heading (forms, stats) are absent. */
const TITLES: Record<string, string> = {
  "": "Administration",
  annonces: "Annonces",
  marques: "Marques",
  modeles: "Modèles",
  categories: "Catégories",
  messages: "Messages",
  utilisateurs: "Utilisateurs",
};

/** `<h1>` of the current admin page, derived from `/<locale>/admin/<section>`. */
export function AdminPageTitle() {
  const section = usePathname().split("/").slice(3).join("/");
  const title = TITLES[section];
  return title ? <h1 className="h3 mb-3">{title}</h1> : null;
}
