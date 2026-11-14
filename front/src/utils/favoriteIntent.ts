/**
 * The listing a visitor starred before being sent to log in: added to their
 * favourites as soon as they are signed in (`FavoritesProvider`), whichever
 * page they come back to. Per tab (`sessionStorage`).
 */
const KEY = "chcars_favorite_intent";

export function setFavoriteIntent(listingId: number): void {
  try {
    sessionStorage.setItem(KEY, String(listingId));
  } catch {
    // Storage unavailable: the visitor stars it again after signing in.
  }
}

/** The listing to add (removed on read), or `null`. */
export function takeFavoriteIntent(): number | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    const id = Number(raw);
    return raw && Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}
