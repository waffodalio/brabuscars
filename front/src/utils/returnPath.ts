import { navigationCount } from "./navigationHistory";

/**
 * Where to send someone right after they sign in / sign up, when they were
 * sent to the login page from somewhere specific (e.g. "reserve this car").
 * Kept in `sessionStorage` rather than in the URL: it survives the Google
 * round trip (which always lands on the home page) and can't be abused as an
 * open redirect. Only same-site paths are accepted.
 */
const KEY = "chcars_return_path";

const isSafePath = (path: string) => path.startsWith("/") && !path.startsWith("//");

interface Stored {
  path: string;
  /** In-app navigations when it was stored (just before going to the login page). */
  at: number;
}

/** Remember `path`; call it right before navigating to the login page. */
export function setReturnPath(path: string): void {
  if (!isSafePath(path)) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ path, at: navigationCount() } satisfies Stored));
  } catch {
    // Storage unavailable (private mode…): the user simply lands on the home page.
  }
}

/**
 * The stored return (removed on read), or `null`. `previous` is true when the
 * page to return to is the one right before in the browser history (the user
 * went straight from it to the login page and signed in there): going *back*
 * then avoids leaving the page twice in the history.
 */
export function takeReturn(): { path: string; previous: boolean } | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Partial<Stored>;
    if (typeof stored.path !== "string" || !isSafePath(stored.path)) return null;
    return { path: stored.path, previous: stored.at !== undefined && navigationCount() === stored.at + 1 };
  } catch {
    return null;
  }
}

/** The stored path only (Google return, which reloads the app). */
export function takeReturnPath(): string | null {
  return takeReturn()?.path ?? null;
}
