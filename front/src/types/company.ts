export interface Company {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  hours: string;
  /** Social pages (footer) — `null` when not configured. */
  instagramUrl: string | null;
  facebookUrl: string | null;
}
