/**
 * Where to send someone right after they sign in / sign up, when they were
 * sent to the login page from somewhere specific (e.g. "reserve this car").
 * Kept in `sessionStorage` rather than in the URL: it survives the Google
 * round trip (which always lands on the home page) and can't be abused as an
 * open redirect. Only same-site paths are accepted.
 */
const KEY = "chcars_return_path";

const isSafePath = (path: string) => path.startsWith("/") && !path.startsWith("//");

export function setReturnPath(path: string): void {
  if (!isSafePath(path)) return;
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // Storage unavailable (private mode…): the user simply lands on the home page.
  }
}

/** The stored path (removed on read), or `null`. */
export function takeReturnPath(): string | null {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return path && isSafePath(path) ? path : null;
  } catch {
    return null;
  }
}
