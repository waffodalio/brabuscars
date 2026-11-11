"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { SYSTEM_LABELS, useSystemState } from "@/hooks/useSystemState";
import { ADMIN_ICONS as ICONS, AdminIcon as Icon } from "./AdminIcon";

/**
 * Slim footer of the back-office: brand, a live status pill (API + database,
 * links to `/admin/systeme` for the details), the public site and a
 * back-to-top button. Replaces the public footer under `/admin` (see
 * `MainLayout`, which places it in the content column, next to the side
 * menu); only rendered for admins.
 */
export function AdminFooter() {
  const { user, isAdmin } = useAuth();
  const { withLocale } = useLanguage();
  const { state } = useSystemState();

  if (!user || !isAdmin) return null;

  return (
    <footer className="chc-admin-footer">
      <div className="container chc-admin-footer-bar" style={{ maxWidth: 1140 }}>
        <span className="d-inline-flex align-items-center gap-2">
          <span className="chc-brand">BrabusCars</span>
          <span className="chc-admin-footer-tag">Back-office</span>
          <span>© {new Date().getFullYear()}</span>
        </span>

        <Link
          href={withLocale("/admin/systeme")}
          className={`chc-admin-footer-status chc-admin-status--${state}`}
          title="Détails de l'état du système"
        >
          <span className="chc-admin-status-dot" aria-hidden="true" />
          {SYSTEM_LABELS[state]}
        </Link>

        <span className="d-inline-flex align-items-center gap-3 ms-md-auto">
          <a href={withLocale("/")} target="_blank" rel="noopener noreferrer" className="chc-admin-footer-action">
            <Icon d={ICONS.external} size={14} />
            Voir le site
            <span className="visually-hidden"> (nouvel onglet)</span>
          </a>
          <button
            type="button"
            className="chc-admin-footer-action"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <Icon d={ICONS.up} size={14} />
            Haut de page
          </button>
        </span>
      </div>
    </footer>
  );
}
