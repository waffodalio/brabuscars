"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import type { StockVehicle } from "@/types/stock";
import { euroNormLabel } from "@/types/listingDetails";
import { formatEuros } from "@/utils/saleLabels";
import { STOCK_STATUS_LABELS } from "@/utils/stockLabels";
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "@/utils/vehicleLabels";

/**
 * The garage-register car a listing describes: its technical data (the
 * reference, edited in the stock), with links to change car / edit it.
 */
export function StockVehicleSummary({ vehicle, onChange }: { vehicle: StockVehicle; onChange?: () => void }) {
  const { withLocale } = useLanguage();
  const facts = [
    String(vehicle.year),
    `${vehicle.mileage.toLocaleString("fr-BE")} km`,
    FUEL_TYPE_LABELS[vehicle.fuelType],
    TRANSMISSION_LABELS[vehicle.transmission],
    vehicle.power ? `${vehicle.power} ch` : null,
    vehicle.doors ? `${vehicle.doors} portes` : null,
    vehicle.color,
    vehicle.euroNorm ? euroNormLabel(vehicle.euroNorm) : null,
    vehicle.co2 !== null ? `${vehicle.co2} g/km CO₂` : null,
    vehicle.hasCarPass ? "Car-Pass" : null,
    vehicle.equipment.length > 0 ? `${vehicle.equipment.length} option${vehicle.equipment.length > 1 ? "s" : ""}` : null,
    `${vehicle.images.length} photo${vehicle.images.length > 1 ? "s" : ""}`,
  ].filter(Boolean);

  return (
    <div className="chc-vehicle-summary">
      {vehicle.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={vehicle.images[0].thumbnailUrl} alt="" className="chc-vehicle-summary-photo" />
      ) : (
        <span className="chc-picked-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 16v-4l2-5h14l2 5v4H3zM7 16a2 2 0 1 0 4 0M13 16a2 2 0 1 0 4 0" />
          </svg>
        </span>
      )}
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <div className="small text-secondary">
          Véhicule du stock · {vehicle.reference}
          {vehicle.vin ? ` · VIN ${vehicle.vin}` : ""} · {STOCK_STATUS_LABELS[vehicle.status]}
        </div>
        <div className="fw-bold fs-5">{vehicle.label}</div>
        <div className="chc-vehicle-summary-facts">
          {facts.map((fact) => (
            <span key={fact}>{fact}</span>
          ))}
        </div>
        <div className="small text-secondary mt-2">
          Caractéristiques, options et documents repris du stock (la référence) : modifiez-les depuis la fiche du véhicule.
          {vehicle.targetPrice !== null && <> Prix visé : {formatEuros(vehicle.targetPrice)}.</>}
        </div>
      </div>
      <div className="d-flex flex-column gap-2 align-items-stretch">
        {onChange && (
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={onChange}>
            Changer de véhicule
          </button>
        )}
        <Link href={withLocale(`/admin/stock/${vehicle.id}`)} className="btn btn-sm btn-link text-secondary">
          Fiche du stock
        </Link>
      </div>
    </div>
  );
}
