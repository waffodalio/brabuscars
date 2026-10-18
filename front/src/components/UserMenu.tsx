"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Dropdown from "react-bootstrap/Dropdown";
import type { UserRole } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const ICONS = {
  crown: "M3 18h18l-1.5-10-4.5 4-3-6-3 6-4.5-4L3 18Z",
  shield: "M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z",
  person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z",
  dashboard: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  users:
    "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-2a4 4 0 0 0-3-3.87M16 2.13a4 4 0 0 1 0 7.75",
  stats: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  logout: "M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10",
};

const ROLE_ICON: Record<UserRole, string> = {
  super_admin: ICONS.crown,
  admin: ICONS.shield,
  user: ICONS.person,
};

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/**
 * Signed-in identity in the navbar: initials avatar in the app's gradient
 * (crown for the super admin) and full name, opening the account menu — role,
 * the shortcuts the role gives access to, and log out.
 */
export function UserMenu() {
  const { user, isAdmin, isSuperAdmin, logout } = useAuth();
  const { t, withLocale } = useLanguage();
  const router = useRouter();
  if (!user) return null;

  const role = t.nav.roles[user.role];
  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  const links = [
    { href: "/favoris", label: t.nav.favorites, icon: ICONS.heart, show: true },
    { href: "/admin", label: t.nav.admin, icon: ICONS.dashboard, show: isAdmin },
    { href: "/admin/statistiques", label: t.nav.stats, icon: ICONS.stats, show: isAdmin },
    { href: "/admin/utilisateurs", label: t.nav.users, icon: ICONS.users, show: isSuperAdmin },
  ].filter((link) => link.show);

  async function handleLogout() {
    await logout();
    router.push(withLocale("/"));
  }

  return (
    <Dropdown align="end" className="chc-account">
      <Dropdown.Toggle
        variant=""
        className="chc-account-toggle"
        aria-label={`${t.nav.account} — ${fullName}, ${role}`}
        title={`${fullName} · ${role}`}
      >
        <span className="chc-account-ring">
          <span className="chc-account-avatar">{initials}</span>
          {user.role === "super_admin" && (
            <span className="chc-account-crown" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d={ICONS.crown} />
              </svg>
            </span>
          )}
        </span>
        <span className="chc-account-name">
          {user.firstName}
          <span className="chc-account-last"> {user.lastName}</span>
        </span>
      </Dropdown.Toggle>

      <Dropdown.Menu className="chc-account-menu">
        <div className="chc-account-head">
          <div className="fw-semibold text-truncate">{fullName}</div>
          <div className="small text-secondary text-truncate">{user.email}</div>
          <span className="chc-account-role">
            <Icon d={ROLE_ICON[user.role]} size={11} />
            {role}
          </span>
        </div>
        <Dropdown.Divider />
        {links.map((link) => (
          <Dropdown.Item
            key={link.href}
            as={Link}
            href={withLocale(link.href)}
            className="chc-account-item"
          >
            <Icon d={link.icon} />
            {link.label}
          </Dropdown.Item>
        ))}
        <Dropdown.Divider />
        <Dropdown.Item
          as="button"
          className="chc-account-item text-danger"
          onClick={() => {
            void handleLogout();
          }}
        >
          <Icon d={ICONS.logout} />
          {t.nav.logout}
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
