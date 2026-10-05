import { useLanguage } from "@/context/LanguageContext";
import type { Listing } from "@/types/listing";

type Specs = Pick<
  Listing,
  "year" | "mileage" | "fuelType" | "transmission" | "power"
>;

/** Compact chip row of a listing's key technical characteristics. */
export function VehicleSpecs({
  listing,
  className,
}: {
  listing: Specs;
  className?: string;
}) {
  const { t } = useLanguage();
  const chips = [
    String(listing.year),
    `${listing.mileage.toLocaleString("fr-FR")} km`,
    t.vehicle.fuelType[listing.fuelType],
    t.vehicle.transmission[listing.transmission],
  ];
  if (listing.power) chips.push(`${listing.power} ${t.vehicle.powerUnit}`);

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
