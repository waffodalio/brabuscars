import type { ObjectLiteral, SelectQueryBuilder } from "typeorm";

export interface DayCount {
  /** `YYYY-MM-DD`, as stored (same convention as the page-view series). */
  day: string;
  count: number;
}

/**
 * Rows of `query` counted per day of `column` (a `datetime` column name,
 * alias included, e.g. `"favorite.created_at"`). Days without rows are
 * absent — see `fillDays`.
 */
export async function countPerDay<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  column: string,
): Promise<DayCount[]> {
  const rows = await query
    .select(`DATE_FORMAT(${column}, '%Y-%m-%d')`, "day")
    .addSelect("COUNT(*)", "count")
    .groupBy("day")
    .orderBy("day", "ASC")
    .getRawMany<{ day: string; count: string }>();
  return rows.map((row) => ({ day: row.day, count: Number(row.count) }));
}
