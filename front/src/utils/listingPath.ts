/**
 * Public address of a listing: its id followed by its title, e.g.
 * `/annonces/5-mercedes-benz-glc-300e-amg-line`. Only the id is used to load
 * it; the words make the link readable and help search engines. An address
 * with the old or a wrong text (or the bare id) is redirected to this one.
 */

/** "Mercedes-Benz GLC 300e « AMG »" → "mercedes-benz-glc-300e-amg". */
export function slugify(text: string, maxLength = 80): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

/** `/annonces/<id>-<slug>` (locale prefix not included). */
export function listingPath(listing: { id: number; title: string }): string {
  const slug = slugify(listing.title);
  return `/annonces/${listing.id}${slug ? `-${slug}` : ""}`;
}

/** The id at the start of the `[id]` segment (`"5-mercedes…"` → 5), or `null`. */
export function listingIdFromParam(param: string): number | null {
  const match = /^(\d+)(?:-|$)/.exec(param);
  return match ? Number(match[1]) : null;
}

/**
 * The same path with a listing's words dropped (`…/annonces/5-xyz` →
 * `…/annonces/5`): fixing the words in the address must not count as moving
 * to another page.
 */
export function pageKey(pathname: string): string {
  return pathname.replace(/(\/annonces\/\d+)-[^/]*/, "$1");
}
