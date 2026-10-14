import { useLanguage } from "@/context/LanguageContext";
import { formatMileage } from "@/utils/listingLabels";
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
  const { t, locale } = useLanguage();
  const chips = [
    String(listing.year),
    formatMileage(listing.mileage, locale),
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
