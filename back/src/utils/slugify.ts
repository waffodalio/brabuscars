/**
 * Turns an arbitrary label into a URL-friendly, kebab-case slug:
 * lower-cased, accents stripped, non-alphanumeric runs collapsed to a dash.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
