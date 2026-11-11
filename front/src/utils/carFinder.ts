import type { Listing } from "@/types/listing";

/**
 * « Trouve ma voiture »: four answers turned into an affinity score (0–100)
 * for each published listing. Pure functions, tested on their own.
 */
export const BUDGETS = ["under10", "10to20", "20to30", "over30"] as const;
export type Budget = (typeof BUDGETS)[number];
export const USAGES = ["city", "family", "travel", "fun"] as const;
export type Usage = (typeof USAGES)[number];
export const GEARBOXES = ["manual", "automatic", "any"] as const;
export type GearboxChoice = (typeof GEARBOXES)[number];
export const ENERGIES = ["petrol", "diesel", "electrified", "any"] as const;
export type EnergyChoice = (typeof ENERGIES)[number];

export interface FinderAnswers {
  budget: Budget;
  usage: Usage;
  gearbox: GearboxChoice;
  energy: EnergyChoice;
}

/** Price bounds of each budget answer, in euros. */
export const BUDGET_RANGES: Record<Budget, [number, number]> = {
  under10: [0, 10_000],
  "10to20": [10_000, 20_000],
  "20to30": [20_000, 30_000],
  over30: [30_000, Number.POSITIVE_INFINITY],
};

type Scored = Pick<Listing, "price" | "transmission" | "fuelType" | "power" | "doors">;

/** Budget: the most important answer (40 points). */
function budgetPoints(price: number, budget: Budget): number {
  const [min, max] = BUDGET_RANGES[budget];
  if (price >= min && price <= max) return 40;
  if (price < min) return 30; // cheaper than planned: still a good match
  if (price <= max * 1.1) return 20; // just above: worth a look
  return 0;
}

function energyPoints(fuel: Listing["fuelType"], energy: EnergyChoice): number {
  if (energy === "any") return 20;
  if (energy === "electrified") return fuel === "hybrid" || fuel === "electric" ? 20 : 0;
  if (energy === "petrol") return fuel === "petrol" || fuel === "lpg" ? 20 : 0;
  return fuel === energy ? 20 : 0;
}

function usagePoints(listing: Scored, usage: Usage): number {
  const power = listing.power ?? 0;
  const electrified = listing.fuelType === "hybrid" || listing.fuelType === "electric";
  switch (usage) {
    case "city":
      return electrified || (power > 0 && power <= 130) ? 20 : 8;
    case "family":
      if (listing.doors === null) return 10;
      return listing.doors >= 5 ? 20 : 4;
    case "travel": {
      const frugal = listing.fuelType === "diesel" || electrified;
      const strong = power >= 110;
      return frugal && strong ? 20 : frugal || strong ? 12 : 4;
    }
    case "fun":
      return power >= 200 ? 20 : power >= 150 ? 14 : 4;
  }
}

/** Affinity of a listing with the answers, 0 to 100. */
export function finderScore(listing: Scored, answers: FinderAnswers): number {
  return (
    budgetPoints(listing.price, answers.budget) +
    (answers.gearbox === "any" || listing.transmission === answers.gearbox ? 20 : 0) +
    energyPoints(listing.fuelType, answers.energy) +
    usagePoints(listing, answers.usage)
  );
}

/** Below this score a listing is not suggested at all. */
export const MIN_SCORE = 50;

/** Best matches first (cheapest first on a tie), at most `limit`. */
export function rankListings<T extends Scored>(
  listings: T[],
  answers: FinderAnswers,
  limit = 6,
): { listing: T; score: number }[] {
  return listings
    .map((listing) => ({ listing, score: finderScore(listing, answers) }))
    .filter((match) => match.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score || a.listing.price - b.listing.price)
    .slice(0, limit);
}
