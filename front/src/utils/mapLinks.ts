/**
 * Google Maps URLs built straight from the dealership's postal address — no
 * API key, no stored coordinates: Google geocodes the free-text address on
 * its own side, so the only input needed (in `back/.env.<env>`) is the
 * address itself.
 */

interface Address {
  address: string;
  postalCode: string;
  city: string;
  country: string;
}

function fullAddress({ address, postalCode, city, country }: Address): string {
  return `${address}, ${postalCode} ${city}, ${country}`;
}

/** Embeddable iframe URL, centered on the address. */
export function googleMapsEmbedUrl(company: Address): string {
  const query = encodeURIComponent(fullAddress(company));
  return `https://www.google.com/maps?q=${query}&output=embed`;
}

/** "Get directions" link — official Google Maps URLs API, no key needed. */
export function googleMapsDirectionsUrl(company: Address): string {
  const destination = encodeURIComponent(fullAddress(company));
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}
