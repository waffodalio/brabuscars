"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { healthService } from "@/services/healthService";
import { ADMIN_ICONS as ICONS, AdminIcon as Icon } from "./AdminIcon";
import { INTL_LOCALES } from "@/i18n/locales";

/** How often the system status is refreshed. */
const HEALTH_POLL_MS = 60_000;

type SystemState = "checking" | "ok" | "degraded" | "down";
type Light = "checking" | "ok" | "ko" | "unknown";

const SYSTEM_LABELS: Record<SystemState, string> = {
  checking: "Vérification…",
  ok: "Tout fonctionne",
  degraded: "Base de données déconnectée",
  down: "API injoignable",
};

/** API and database lights for each overall state. */
const LIGHTS: Record<SystemState, { api: Light; database: Light }> = {
  checking: { api: "checking", database: "checking" },
  ok: { api: "ok", database: "ok" },
  degraded: { api: "ok", database: "ko" },
  down: { api: "ko", database: "unknown" },
};

const LIGHT_LABELS: Record<Light, string> = {
  checking: "…",
  ok: "En ligne",
  ko: "Hors service",
  unknown: "Inconnue",
};

const ROLE_LABELS = { user: "Utilisateur", admin: "Admin", super_admin: "Super admin" };

const REFRESH = "M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6";
const SERVER = "M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01";
const DATABASE = "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3";
const USER = "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z";

const timeFormat = new Intl.DateTimeFormat(INTL_LOCALES.fr, { hour: "2-digit", minute: "2-digit" });

/** Polls `/health` while the admin is open (paused when the tab is hidden). */
function useSystemState() {
  const [state, setState] = useState<SystemState>("checking");
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);

  const check = useCallback(async (force = false) => {
    if (!force && document.visibilityState === "hidden") return;
    setBusy(true);
    try {
      const health = await healthService.get();
      setState(health.database === "connected" ? "ok" : "degraded");
    } catch {
      setState("down");
    }
    setCheckedAt(new Date());
    setBusy(false);
  }, []);

  useEffect(() => {
    const run = () => void check();
    run();
    const timer = window.setInterval(run, HEALTH_POLL_MS);
    document.addEventListener("visibilitychange", run);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", run);
    };
  }, [check]);

  return { state, checkedAt, busy, refresh: () => void check(true) };
}

function StatusLight({ icon, label, light }: { icon: string; label: string; light: Light }) {
  return (
    <li className={`chc-admin-light chc-admin-light--${light}`}>
      <span className="chc-admin-light-icon">
        <Icon d={icon} size={14} />
      </span>
      <span className="flex-grow-1">{label}</span>
      <span className="chc-admin-light-state">
        <span className="chc-admin-status-dot" aria-hidden="true" />
        {LIGHT_LABELS[light]}
      </span>
    </li>
  );
}

/**
 * Footer of the back-office: live system status (API + database), shortcuts,
 * the signed-in account (role, 2FA) and a back-to-top button. Replaces the
 * public footer under `/admin` (see `MainLayout`, which places it in the
 * content column, next to the side menu); only rendered for admins.
 */
export function AdminFooter() {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { withLocale } = useLanguage();
  const { state, checkedAt, busy, refresh } = useSystemState();

  if (!user || !isAdmin) return null;

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
  const lights = LIGHTS[state];
  const shortcuts = [
    { href: withLocale("/admin/annonces/nouvelle"), label: "Nouvelle annonce", icon: ICONS.plus },
    { href: withLocale("/admin/reservations"), label: "Réservations", icon: ICONS.calendar },
    { href: withLocale("/admin/messages"), label: "Messages", icon: ICONS.mail },
    { href: withLocale("/admin/statistiques"), label: "Statistiques", icon: ICONS.stats },
    ...(isSuperAdmin
      ? [{ href: withLocale("/admin/utilisateurs"), label: "Utilisateurs", icon: ICONS.users }]
      : []),
  ];

  return (
    <footer className="chc-admin-footer">
      <div className="container" style={{ maxWidth: 1140 }}>
        <div className="chc-admin-footer-grid">
          {/* System status */}
          <section className="chc-admin-footer-card" aria-labelledby="chc-admin-status-title">
            <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
              <h2 id="chc-admin-status-title" className="chc-admin-footer-title">État du système</h2>
              <button
                type="button"
                className="chc-admin-icon-btn"
                onClick={refresh}
                disabled={busy}
                aria-label="Vérifier maintenant"
                title="Vérifier maintenant"
              >
                <span className={busy ? "chc-spin" : undefined}>
                  <Icon d={REFRESH} size={14} />
                </span>
              </button>
            </div>
            <div className={`chc-admin-status chc-admin-status--${state}`} role="status">
              <span className="chc-admin-status-dot" aria-hidden="true" />
              {SYSTEM_LABELS[state]}
            </div>
            <ul className="list-unstyled mb-0 mt-3">
              <StatusLight icon={SERVER} label="API" light={lights.api} />
              <StatusLight icon={DATABASE} label="Base de données" light={lights.database} />
            </ul>
            <div className="chc-admin-footer-meta">
              {checkedAt ? `Vérifié à ${timeFormat.format(checkedAt)} · toutes les minutes` : "Première vérification…"}
            </div>
          </section>

          {/* Shortcuts */}
          <nav className="chc-admin-footer-card" aria-labelledby="chc-admin-shortcuts-title">
            <h2 id="chc-admin-shortcuts-title" className="chc-admin-footer-title mb-2">Raccourcis</h2>
            <div className="chc-admin-shortcuts">
              {shortcuts.map((shortcut) => (
                <Link key={shortcut.href} href={shortcut.href} className="chc-admin-shortcut">
                  <span className="chc-admin-shortcut-icon">
                    <Icon d={shortcut.icon} size={16} />
                  </span>
                  {shortcut.label}
                </Link>
              ))}
            </div>
            <a
              href={withLocale("/")}
              target="_blank"
              rel="noopener noreferrer"
              className="chc-admin-footer-link"
            >
              <Icon d={ICONS.external} size={14} />
              Voir le site public
              <span className="visually-hidden"> (nouvel onglet)</span>
            </a>
          </nav>

          {/* Signed-in account */}
          <section className="chc-admin-footer-card" aria-labelledby="chc-admin-account-title">
            <h2 id="chc-admin-account-title" className="chc-admin-footer-title mb-3">Connecté en tant que</h2>
            <div className="d-flex align-items-center gap-3">
              <span className="chc-admin-avatar" aria-hidden="true">
                {initials}
              </span>
              <div className="lh-sm" style={{ minWidth: 0 }}>
                <div className="fw-semibold text-body text-truncate">
                  {user.firstName} {user.lastName}
                </div>
                <div className="small text-secondary text-truncate">{user.email}</div>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2 mt-3">
              <span className="chc-admin-pill chc-admin-pill--role">
                <Icon d={ICONS.shield} size={12} />
                {ROLE_LABELS[user.role]}
              </span>
              <span className="chc-admin-pill chc-admin-pill--ok">
                <span className="chc-admin-status-dot" aria-hidden="true" />
                Double authentification active
              </span>
            </div>
            <Link href={withLocale("/mon-compte")} className="chc-admin-footer-link">
              <Icon d={USER} size={14} />
              Mon compte
            </Link>
          </section>
        </div>

        <div className="chc-admin-footer-bottom">
          <span>
            <span className="chc-brand">BrabusCars</span>
            <span className="chc-admin-footer-tag ms-2">Back-office</span>
            <span className="ms-2">© {new Date().getFullYear()}</span>
          </span>
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
