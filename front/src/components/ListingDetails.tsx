"use client";

import Card from "react-bootstrap/Card";
import { useLanguage } from "@/context/LanguageContext";
import type { Listing } from "@/types/listing";
import { EQUIPMENT_GROUPS, euroNormLabel, type EquipmentGroup } from "@/types/listingDetails";

const CHECK = "M5 12.5l4.5 4.5L19 7.5";
const SHIELD = "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3zm-3 9 2 2 4-4";
const DOC = "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 15l2 2 4-4";
const LEAF = "M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 12-4 16-9 16zM4 20c4-4 7-6 10-7";

const GROUP_ICONS: Record<EquipmentGroup, string> = {
  comfort: "M4 18v-6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6M4 18h16M6 9V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3",
  multimedia: "M4 5h16v11H4zM8 20h8M12 16v4",
  safety: SHIELD,
  exterior: "M3 16v-4l2-5h14l2 5v4H3zM7 16a2 2 0 1 0 4 0M13 16a2 2 0 1 0 4 0",
};

function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/** Selling-point badges under the price: warranty, Car-Pass, Euro norm. */
export function ListingPerks({ listing }: { listing: Listing }) {
  const { t } = useLanguage();
  const perks = [
    listing.warrantyMonths ? { key: "warranty", icon: SHIELD, label: t.details.warrantyBadge(listing.warrantyMonths), tone: "ok" } : null,
    listing.hasCarPass ? { key: "carpass", icon: DOC, label: t.details.carPass, tone: "ok" } : null,
    listing.euroNorm ? { key: "euro", icon: LEAF, label: euroNormLabel(listing.euroNorm), tone: "info" } : null,
  ].filter((perk): perk is NonNullable<typeof perk> => perk !== null);
  if (perks.length === 0) return null;

  return (
    <div className="chc-perks mb-3">
      {perks.map((perk) => (
        <span key={perk.key} className={`chc-perk chc-perk--${perk.tone}`}>
          <Icon d={perk.icon} size={14} />
          {perk.label}
        </span>
      ))}
    </div>
  );
}

/** « Équipements »: the ticked equipment, grouped, with an icon per group. */
export function ListingEquipment({ listing, className }: { listing: Pick<Listing, "equipment">; className?: string }) {
  const { t } = useLanguage();
  const groups = (Object.keys(EQUIPMENT_GROUPS) as EquipmentGroup[])
    .map((group) => ({
      group,
      items: EQUIPMENT_GROUPS[group].filter((item) => listing.equipment.includes(item)),
    }))
    .filter((entry) => entry.items.length > 0);
  if (groups.length === 0) return null;

  return (
    <Card className={`chc-animate-in${className ? ` ${className}` : " mt-4"}`}>
      <Card.Body className="p-3 p-md-4">
        <h2 className="h6 mb-3">
          {t.details.equipmentTitle} <span className="text-secondary fw-normal">· {listing.equipment.length}</span>
        </h2>
        <div className="chc-equipment">
          {groups.map(({ group, items }) => (
            <div key={group} className="chc-equipment-group">
              <div className="chc-equipment-heading">
                <span className="chc-equipment-icon">
                  <Icon d={GROUP_ICONS[group]} />
                </span>
                {t.details.equipmentGroups[group]}
              </div>
              <ul className="list-unstyled mb-0">
                {items.map((item) => (
                  <li key={item}>
                    <Icon d={CHECK} size={14} />
                    {t.details.equipment[item]}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
}

/** « Garantie »: length, type, covered parts and conditions. */
export function ListingWarranty({ listing }: { listing: Listing }) {
  const { t } = useLanguage();
  if (!listing.warrantyMonths) return null;

  return (
    <Card className="chc-animate-in mt-4 chc-warranty-card">
      <Card.Body className="p-3 p-md-4">
        <div className="d-flex align-items-center gap-3 mb-3">
          <span className="chc-warranty-seal">
            <Icon d={SHIELD} size={22} />
          </span>
          <div>
            <h2 className="h6 mb-0">{t.details.warrantyTitle}</h2>
            <div className="fw-bold fs-5">{t.details.warrantyLength(listing.warrantyMonths)}</div>
            {listing.warrantyKind && (
              <div className="small text-secondary">{t.details.warrantyKinds[listing.warrantyKind]}</div>
            )}
          </div>
        </div>
        {(listing.warrantyCoverage.length > 0 || (listing.warrantyCustom ?? []).length > 0) && (
          <>
            <div className="small fw-semibold text-secondary mb-2">{t.details.warrantyCovers}</div>
            <ul className="chc-coverage list-unstyled">
              {listing.warrantyCoverage.map((part) => (
                <li key={part}>
                  <Icon d={CHECK} size={14} />
                  {t.details.coverage[part]}
                </li>
              ))}
              {(listing.warrantyCustom ?? []).map((label) => (
                <li key={`custom-${label}`}>
                  <Icon d={CHECK} size={14} />
                  {label}
                </li>
              ))}
            </ul>
          </>
        )}
        {listing.warrantyNotes && (
          <p className="small text-secondary mb-0 mt-2" style={{ whiteSpace: "pre-line" }}>
            {listing.warrantyNotes}
          </p>
        )}
      </Card.Body>
    </Card>
  );
}
