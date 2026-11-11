"use client";

import type { ReactNode } from "react";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { fr } from "@/i18n/dictionaries";
import {
  EQUIPMENT_GROUPS,
  EURO_NORMS,
  euroNormLabel,
  type Equipment,
  type EquipmentGroup,
  type EuroNorm,
} from "@/types/listingDetails";

/** Adds the value if absent, removes it if present. */
export function toggled<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** Pill-shaped toggle (multi-select lists: equipment, covered parts). */
export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`chc-chip${active ? " is-active" : ""}`} aria-pressed={active} onClick={onClick}>
      <span className="chc-chip-check" aria-hidden="true">
        {active ? "✓" : "+"}
      </span>
      {children}
    </button>
  );
}

/**
 * A car's options (grouped chips) and papers (Euro norm, CO₂, Car-Pass):
 * entered on the garage-register car, or on a listing without one.
 */
export function EquipmentFields({
  idPrefix,
  equipment,
  euroNorm,
  co2,
  hasCarPass,
  onEquipment,
  onEuroNorm,
  onCo2,
  onCarPass,
}: {
  idPrefix: string;
  equipment: Equipment[];
  euroNorm: EuroNorm | "";
  co2: string;
  hasCarPass: boolean;
  onEquipment: (equipment: Equipment[]) => void;
  onEuroNorm: (euroNorm: EuroNorm | "") => void;
  onCo2: (co2: string) => void;
  onCarPass: (hasCarPass: boolean) => void;
}) {
  return (
    <>
      <section className="chc-form-section">
        <h3 className="chc-form-section-title">
          Équipements et options
          {equipment.length > 0 && <span className="chc-form-section-count">{equipment.length}</span>}
        </h3>
        {(Object.keys(EQUIPMENT_GROUPS) as EquipmentGroup[]).map((group) => (
          <div key={group} className="mb-3">
            <div className="small fw-semibold text-secondary mb-2">{fr.details.equipmentGroups[group]}</div>
            <div className="chc-chips">
              {EQUIPMENT_GROUPS[group].map((item) => (
                <Chip key={item} active={equipment.includes(item)} onClick={() => onEquipment(toggled(equipment, item))}>
                  {fr.details.equipment[item]}
                </Chip>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="chc-form-section">
        <h3 className="chc-form-section-title">Environnement et documents</h3>
        <Row className="g-3 align-items-end">
          <Col sm={4}>
            <Form.Group controlId={`${idPrefix}-euro`}>
              <Form.Label>Norme Euro</Form.Label>
              <Form.Select value={euroNorm} onChange={(event) => onEuroNorm(event.target.value as EuroNorm | "")}>
                <option value="">—</option>
                {EURO_NORMS.map((norm) => (
                  <option key={norm} value={norm}>
                    {euroNormLabel(norm)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col sm={4}>
            <Form.Group controlId={`${idPrefix}-co2`}>
              <Form.Label>CO₂ (g/km)</Form.Label>
              <Form.Control type="number" min={0} max={999} value={co2} onChange={(event) => onCo2(event.target.value)} />
            </Form.Group>
          </Col>
          <Col sm={4}>
            <Form.Check
              type="switch"
              id={`${idPrefix}-car-pass`}
              className="mb-2"
              label="Car-Pass disponible"
              checked={hasCarPass}
              onChange={(event) => onCarPass(event.target.checked)}
            />
          </Col>
        </Row>
      </section>
    </>
  );
}
