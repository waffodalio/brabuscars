"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Modal from "react-bootstrap/Modal";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { listingService } from "@/services/listingService";
import { saleService } from "@/services/saleService";
import type { Listing } from "@/types/listing";
import type { Sale } from "@/types/sale";
import { LISTING_STATUS_LABELS, formatPrice } from "@/utils/listingLabels";
import { listingPath } from "@/utils/listingPath";
import { SALE_STATUS_LABELS, saleReference } from "@/utils/saleLabels";
import { ADMIN_ICONS, AdminIcon } from "./AdminIcon";
import { ADMIN_NAV_GROUPS, SUPER_ADMIN_NAV_GROUP } from "./adminNav";

/** Window event that opens the palette (the side menu's search button). */
export const OPEN_PALETTE_EVENT = "chc:open-palette";

const SEARCH = "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35";
/** Results shown per group: the palette stays a short list. */
const PER_GROUP = 6;

interface Entry {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: string;
  href: string;
}

/** Lowercase, without accents: « Élodie » is found with « elodie ». */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const subscribeNever = () => () => {};

/** « ⌘K » on a Mac, « Ctrl K » elsewhere (server render: « Ctrl K »). */
export function useShortcutLabel(): string {
  const mac = useSyncExternalStore(
    subscribeNever,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => false,
  );
  return mac ? "⌘K" : "Ctrl K";
}

/**
 * Back-office quick search (Ctrl / ⌘ + K, or the side menu's search
 * button): jump to an admin page, a listing or a sale file by typing a few
 * letters; arrows to move, Enter to open. Listings and sales are loaded the
 * first time it opens. Admins only; renders nothing otherwise.
 */
export function CommandPalette() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const { withLocale } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [sales, setSales] = useState<Sale[] | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const show = () => {
      setQuery("");
      setActive(0);
      setOpen(true);
      // Fresh each time it opens (cached reads make it instant).
      listingService.list().then(setListings).catch(() => setListings([]));
      saleService.list().then(setSales).catch(() => setSales([]));
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      // `key` can be missing (browser autofill fires keydown without one).
      if (event.key?.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, show);
    };
  }, [isAdmin]);

  const entries = useMemo<Entry[]>(() => {
    const groups = isSuperAdmin ? [...ADMIN_NAV_GROUPS, SUPER_ADMIN_NAV_GROUP] : ADMIN_NAV_GROUPS;
    const pages: Entry[] = [
      ...groups.flatMap((group) =>
        group.items.map((item) => ({
          id: `page:${item.href}`,
          group: "Pages",
          label: item.label,
          hint: group.title,
          icon: item.icon,
          href: withLocale(item.href),
        })),
      ),
      {
        id: "page:/admin/ventes/nouvelle",
        group: "Pages",
        label: "Nouveau dossier de vente",
        hint: "Ventes",
        icon: ADMIN_ICONS.plus,
        href: withLocale("/admin/ventes/nouvelle"),
      },
    ];
    const listingEntries: Entry[] = (listings ?? []).map((listing) => ({
      id: `listing:${listing.id}`,
      group: "Annonces",
      label: listing.title,
      hint: `${LISTING_STATUS_LABELS[listing.status]} · ${formatPrice(listing.price)}`,
      icon: ADMIN_ICONS.listing,
      href: withLocale(listingPath(listing)),
    }));
    const saleEntries: Entry[] = (sales ?? []).map((sale) => ({
      id: `sale:${sale.id}`,
      group: "Facturation",
      label: `${saleReference(sale) ?? "Brouillon"} · ${sale.buyer.name}`,
      hint: [sale.lines[0]?.description, SALE_STATUS_LABELS[sale.status]].filter(Boolean).join(" · "),
      icon: ADMIN_ICONS.invoice,
      href: withLocale(`/admin/ventes/${sale.id}`),
    }));
    return [...pages, ...listingEntries, ...saleEntries];
  }, [isSuperAdmin, listings, sales, withLocale]);

  const results = useMemo(() => {
    const tokens = normalize(query).split(/\s+/).filter(Boolean);
    const matching = entries.filter((entry) => {
      const text = normalize(`${entry.label} ${entry.hint ?? ""} ${entry.group}`);
      return tokens.every((token) => text.includes(token));
    });
    // Empty query: the pages, plus a few listings to start from.
    const perGroup = new Map<string, number>();
    return matching.filter((entry) => {
      const limit = tokens.length === 0 && entry.group !== "Pages" ? 3 : tokens.length === 0 ? 99 : PER_GROUP;
      const count = perGroup.get(entry.group) ?? 0;
      perGroup.set(entry.group, count + 1);
      return count < limit;
    });
  }, [entries, query]);

  const shortcut = useShortcutLabel();
  if (!isAdmin) return null;

  const selected = Math.min(active, Math.max(0, results.length - 1));

  function go(entry: Entry | undefined) {
    if (!entry) return;
    setOpen(false);
    router.push(entry.href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = (selected + (event.key === "ArrowDown" ? 1 : -1) + results.length) % Math.max(1, results.length);
      setActive(next);
      listRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[selected]);
    }
  }

  return (
    <Modal
      show={open}
      onHide={() => setOpen(false)}
      dialogClassName="chc-cmdk"
      aria-label="Recherche rapide"
    >
      <div className="chc-cmdk-search">
        <AdminIcon d={SEARCH} size={18} />
        <input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Aller à une page, une annonce, un dossier…"
          aria-label="Rechercher"
          role="combobox"
          aria-expanded="true"
          aria-controls="chc-cmdk-results"
          aria-activedescendant={results[selected] ? `chc-cmdk-${results[selected].id}` : undefined}
        />
        <kbd>Esc</kbd>
      </div>

      <div className="chc-cmdk-results" id="chc-cmdk-results" role="listbox" ref={listRef}>
        {results.length === 0 ? (
          <p className="chc-cmdk-empty">Aucun résultat pour « {query} ».</p>
        ) : (
          results.map((entry, index) => (
            <div key={entry.id}>
              {(index === 0 || results[index - 1].group !== entry.group) && (
                <div className="chc-cmdk-group">{entry.group}</div>
              )}
              <button
                type="button"
                id={`chc-cmdk-${entry.id}`}
                data-index={index}
                role="option"
                aria-selected={index === selected}
                className={`chc-cmdk-item${index === selected ? " is-active" : ""}`}
                onMouseMove={() => index !== selected && setActive(index)}
                onClick={() => go(entry)}
              >
                <span className="chc-cmdk-icon">
                  <AdminIcon d={entry.icon} size={16} />
                </span>
                <span className="chc-cmdk-label">{entry.label}</span>
                {entry.hint && <span className="chc-cmdk-hint">{entry.hint}</span>}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="chc-cmdk-footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span>
        <span><kbd>↵</kbd> ouvrir</span>
        <span className="ms-auto"><kbd>{shortcut}</kbd> recherche rapide</span>
      </div>
    </Modal>
  );
}
