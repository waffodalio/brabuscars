import type { Vehicle } from "@/types/vehicle";
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "@/utils/vehicleLabels";

/** Compact chip row of a vehicle's key characteristics. */
export function VehicleSpecs({
  vehicle,
  className,
}: {
  vehicle: Vehicle;
  className?: string;
}) {
  const chips = [
    String(vehicle.year),
    `${vehicle.mileage.toLocaleString("fr-FR")} km`,
    FUEL_TYPE_LABELS[vehicle.fuelType],
    TRANSMISSION_LABELS[vehicle.transmission],
  ];
  if (vehicle.power) chips.push(`${vehicle.power} ch`);

  return (
    <div className={`chc-specs${className ? ` ${className}` : ""}`}>
      {chips.map((chip) => (
        <span key={chip} className="chc-spec">
          {chip}
        </span>
      ))}
    </div>
  );
}
