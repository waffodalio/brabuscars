import type { Listing } from "@/types/listing";

type Comparable = Pick<Listing, "id" | "price" | "fuelType" | "model" | "categoryId" | "status">;

/** How close another listing is to this one (higher = more similar). */
export function similarityScore(base: Comparable, other: Comparable): number {
  let score = 0;
  if (base.model?.brand?.id && base.model.brand.id === other.model?.brand?.id) score += 3;
  if (base.categoryId !== null && base.categoryId === other.categoryId) score += 2;
  if (Math.abs(other.price - base.price) <= base.price * 0.25) score += 2;
  if (base.fuelType === other.fuelType) score += 1;
  return score;
}

/**
 * Other published listings worth suggesting below a listing: same brand,
 * same category, a close price or the same fuel — best matches first, the
 * closest price on a tie. Nothing in common at all: not suggested.
 */
export function similarListings<T extends Comparable>(base: Comparable, all: T[], limit = 3): T[] {
  return all
    .filter((other) => other.id !== base.id && other.status === "published")
    .map((other) => ({ other, score: similarityScore(base, other) }))
    .filter((match) => match.score >= 2)
    .sort(
      (a, b) =>
        b.score - a.score || Math.abs(a.other.price - base.price) - Math.abs(b.other.price - base.price),
    )
    .slice(0, limit)
    .map((match) => match.other);
}
