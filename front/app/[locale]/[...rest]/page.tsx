import { notFound } from "next/navigation";

/**
 * Catches every URL under a locale that matches no page, so it gets the
 * translated `[locale]/not-found.tsx` (with navbar and footer) rather than
 * Next's bare default 404. Real routes are more specific and always win.
 */
export default function UnknownPage() {
  notFound();
}
