"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import type { Listing } from "@/types/listing";
import type { StockVehicle } from "@/types/stock";
import { formatEuros } from "@/utils/saleLabels";
import { STOCK_STATUS_LABELS, isInGarage, stockMatches } from "@/utils/stockLabels";

/** What the picker hands back: a stock car (with its listing, if any) or a bare listing. */
export type VehicleChoice =
  | { kind: "stock"; vehicle: StockVehicle }
  | { kind: "listing"; listing: Listing };

interface Option {
  key: string;
  group: "Stock du garage" | "Annonces";
  title: string;
  detail: string;
  price: number | null;
  badge: string;
  choice: VehicleChoice;
}

const fold = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function listingMatches(listing: Listing, query: string): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  const text = fold([listing.title, listing.model?.brand?.name, listing.model?.name, listing.year].filter(Boolean).join(" "));
  return words.every((word) => text.includes(word));
}

/** Shown as the current choice (closed state). */
export interface PickedVehicle {
  title: string;
  detail: string;
}

/**
 * One search box over the garage register and the listings: type a brand,
 * model, VIN, reference or year, pick with the mouse or ↑ ↓ Enter.
 * Cars still at the garage come first; sold / exited ones and listings
 * already carried by a stock car are left out.
 */
export function VehiclePicker({
  vehicles,
  listings,
  picked,
  onPick,
  onClear,
}: {
  vehicles: StockVehicle[];
  listings: Listing[];
  picked: PickedVehicle | null;
  onPick: (choice: VehicleChoice) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();

  const options = useMemo<Option[]>(() => {
    const linkedListings = new Set(vehicles.map((vehicle) => vehicle.listing?.id).filter(Boolean));
    const stock: Option[] = vehicles
      .filter((vehicle) => isInGarage(vehicle.status) && stockMatches(vehicle, query))
      .map((vehicle) => ({
        key: `stock-${vehicle.id}`,
        group: "Stock du garage",
        title: vehicle.label,
        detail: [vehicle.reference, String(vehicle.year), `${vehicle.mileage.toLocaleString("fr-BE")} km`]
          .filter(Boolean)
          .join(" · "),
        price: vehicle.targetPrice ?? vehicle.listing?.price ?? null,
        badge: STOCK_STATUS_LABELS[vehicle.status],
        choice: { kind: "stock", vehicle },
      }));
    const ads: Option[] = listings
      .filter((listing) => listing.status !== "sold" && !linkedListings.has(listing.id) && listingMatches(listing, query))
      .map((listing) => ({
        key: `listing-${listing.id}`,
        group: "Annonces",
        title: listing.title,
        detail: [String(listing.year), `${listing.mileage.toLocaleString("fr-BE")} km`].join(" · "),
        price: listing.price,
        badge: "Annonce",
        choice: { kind: "listing", listing },
      }));
    return [...stock, ...ads].slice(0, 12);
  }, [vehicles, listings, query]);

  const selected = Math.min(active, Math.max(0, options.length - 1));

  function choose(option: Option | undefined) {
    if (!option) return;
    onPick(option.choice);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActive((selected + (event.key === "ArrowDown" ? 1 : -1) + options.length) % Math.max(1, options.length));
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      choose(options[selected]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  if (picked && !open) {
    return (
      <div className="chc-picked">
        <span className="chc-picked-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 16v-4l2-5h14l2 5v4H3zM7 16a2 2 0 1 0 4 0M13 16a2 2 0 1 0 4 0" />
          </svg>
        </span>
        <span className="flex-grow-1" style={{ minWidth: 0 }}>
          <span className="d-block fw-semibold text-truncate">{picked.title}</span>
          <span className="d-block small text-secondary text-truncate">{picked.detail}</span>
        </span>
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setOpen(true)}>
          Changer
        </button>
        <button type="button" className="btn btn-sm btn-link text-secondary" onClick={onClear}>
          Retirer
        </button>
      </div>
    );
  }

  return (
    <div className="chc-picker">
      <div className="chc-picker-input">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35" />
        </svg>
        <input
          type="search"
          className="form-control"
          placeholder="Marque, modèle, VIN, n° de stock, année…"
          value={query}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label="Rechercher le véhicule vendu"
          autoFocus={picked !== null}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      {open && (
        <div className="chc-picker-menu" id={listId} role="listbox">
          {options.length === 0 ? (
            <div className="chc-picker-empty">
              {query ? `Aucun véhicule pour « ${query} ».` : "Aucun véhicule en stock ni annonce disponible."}
            </div>
          ) : (
            options.map((option, index) => (
              <div key={option.key}>
                {(index === 0 || options[index - 1].group !== option.group) && (
                  <div className="chc-picker-group">{option.group}</div>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={index === selected}
                  className={`chc-picker-option${index === selected ? " is-active" : ""}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseMove={() => index !== selected && setActive(index)}
                  onClick={() => choose(option)}
                >
                  <span className="flex-grow-1 text-start" style={{ minWidth: 0 }}>
                    <span className="d-block fw-semibold text-truncate">{option.title}</span>
                    <span className="d-block small text-secondary text-truncate">{option.detail}</span>
                  </span>
                  <span className="text-end">
                    {option.price !== null && <span className="d-block fw-semibold chc-num">{formatEuros(option.price)}</span>}
                    <span className={`chc-picker-badge${option.choice.kind === "stock" ? " is-stock" : ""}`}>{option.badge}</span>
                  </span>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
