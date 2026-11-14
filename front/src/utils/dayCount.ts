/**
 * Day counts shown in the back-office, without « 0 j »: a count that is
 * really a date (« at the garage since… », « online since… ») reads
 * « aujourd'hui » / « hier », an average reads « < 1 j ».
 */

const number = new Intl.NumberFormat("fr-BE");

/** « aujourd'hui », « hier », « 12 j » — after « depuis ». */
export function sinceDays(days: number): string {
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  return `${number.format(days)} j`;
}

/** « < 1 j », « 1 j », « 12 j » — an average or a length, not a date. */
export function durationDays(days: number): string {
  return days < 1 ? "< 1 j" : `${number.format(Math.round(days))} j`;
}

/** « 1 jour », « 12 jours ». */
export const daysWord = (days: number): string => (days > 1 ? "jours" : "jour");
