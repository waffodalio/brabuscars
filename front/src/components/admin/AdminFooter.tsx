"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { healthService } from "@/services/healthService";
import { ADMIN_ICONS as ICONS, AdminIcon as Icon } from "./AdminIcon";
import { INTL_LOCALES } from "@/i18n/locales";

/** How often the system status is refreshed. */
const HEALTH_POLL_MS = 60_000;

type SystemState = "checking" | "ok" | "degraded" | "down";

const SYSTEM_LABELS: Record<SystemState, string> = {
  checking: "Vérification…",
  ok: "Système opérationnel",
  degraded: "Base de données déconnectée",
  down: "API injoignable",
};

const ROLE_LABELS = { user: "Utilisateur", admin: "Admin", super_admin: "Super admin" };

/** Polls `/health` while the admin is open (paused when the tab is hidden). */
function useSystemState() {
  const [state, setState] = useState<SystemState>("checking");
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (document.visibilityState === "hidden") return;
      try {
        const health = await healthService.get();
        if (!cancelled) setState(health.database === "connected" ? "ok" : "degraded");
      } catch {
        if (!cancelled) setState("down");
      }
      if (!cancelled) setCheckedAt(new Date());
    }

    void check();
    const timer = window.setInterval(check, HEALTH_POLL_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  return { state, checkedAt };
}

/**
 * Footer of the back-office: live system status (API + database), shortcuts,
 * the signed-in account (role, 2FA) and a back-to-top button. Replaces the
 * public footer under `/admin` (see `MainLayout`); only rendered for admins.
 */
export function AdminFooter() {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { withLocale } = useLanguage();
  const { state, checkedAt } = useSystemState();

  if (!user || !isAdmin) return null;

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
  const shortcuts = [
    { href: withLocale("/admin/annonces/nouvelle"), label: "Nouvelle annonce", icon: ICONS.plus },
    { href: withLocale("/admin/messages"), label: "Messages", icon: ICONS.mail },
    ...(isSuperAdmin
      ? [{ href: withLocale("/admin/utilisateurs"), label: "Utilisateurs", icon: ICONS.shield }]
      : []),
  ];

  return (
    <footer className="chc-admin-footer mt-auto">
      <div className="container" style={{ maxWidth: 1140 }}>
        <div className="chc-admin-footer-main">
          <div className="d-flex flex-column gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="chc-brand fs-5">BrabusCars</span>
              <span className="chc-admin-footer-tag">Back-office</span>
            </div>
            <div
              className={`chc-admin-status chc-admin-status--${state}`}
              role="status"
              title={checkedAt ? `Vérifié à ${checkedAt.toLocaleTimeString(INTL_LOCALES.fr)}` : undefined}
            >
              <span className="chc-admin-status-dot" aria-hidden="true" />
              {SYSTEM_LABELS[state]}
            </div>
          </div>

          <nav aria-label="Raccourcis d'administration" className="chc-admin-footer-shortcuts">
            <a href={withLocale("/")} target="_blank" rel="noopener noreferrer">
              <Icon d={ICONS.external} />
              Voir le site
            </a>
            {shortcuts.map((shortcut) => (
              <Link key={shortcut.href} href={shortcut.href}>
                <Icon d={shortcut.icon} />
                {shortcut.label}
              </Link>
            ))}
          </nav>

          <div className="chc-admin-footer-account">
            <span className="chc-admin-avatar" aria-hidden="true">
              {initials}
            </span>
            <div className="lh-sm">
              <div className="fw-semibold text-body">
                {user.firstName} {user.lastName}
              </div>
              <div className="d-flex flex-wrap gap-1 mt-1">
                <span className="badge rounded-pill text-bg-primary">{ROLE_LABELS[user.role]}</span>
                <span className="badge rounded-pill text-bg-success d-inline-flex align-items-center gap-1">
                  <Icon d={ICONS.shield} />
                  2FA active
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="chc-admin-footer-bottom">
          <span>© {new Date().getFullYear()} BrabusCars · Espace d&apos;administration</span>
          <button
            type="button"
            className="chc-footer-top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <Icon d={ICONS.up} />
            Retour en haut
          </button>
        </div>
      </div>
    </footer>
  );
}
