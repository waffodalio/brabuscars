/**
 * Counts the client-side navigations made inside the app since this page was
 * loaded. While it is 0, the browser's previous entry (if any) is another
 * site or a fresh tab, so "Back" must not leave the app.
 */
let navigations = 0;

export function recordNavigation(): void {
  navigations += 1;
}

export function hasInAppHistory(): boolean {
  return navigations > 0;
}

/** Navigations so far (to tell later whether the user went any further). */
export function navigationCount(): number {
  return navigations;
}
