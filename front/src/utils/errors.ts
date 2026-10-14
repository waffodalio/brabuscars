import { ApiClientError, NETWORK_ERROR_STATUS } from "@/services/apiClient";

/**
 * Extracts a user-facing message from a caught value, for the (French-only)
 * back-office. `catch` blocks type their parameter `unknown`, so every call
 * site needs this same check before it can show the error — centralised here
 * instead of repeated at each of them. The API's own message is kept for
 * client errors (it names the conflict, the invalid field…); transport and
 * server failures get a readable French message instead.
 */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiClientError) {
    if (err.status === NETWORK_ERROR_STATUS) {
      return "Serveur injoignable : vérifiez votre connexion puis réessayez.";
    }
    if (err.status >= 500) {
      return `${fallback} : erreur du serveur, réessayez dans quelques instants.`;
    }
    if (err.status === 401) return "Session expirée : reconnectez-vous.";
    if (err.status === 429) {
      return "Trop de requêtes : patientez quelques minutes puis réessayez.";
    }
    return err.message;
  }
  return err instanceof Error ? err.message : fallback;
}

/** Translated messages for the public pages (`t.errors`). */
export interface ApiErrorMessages {
  network: string;
  server: string;
  tooManyRequests: string;
  sessionExpired: string;
  forbidden: string;
  notFound: string;
  validation: string;
}

/**
 * Public-page counterpart of {@link errorMessage}: the API's messages are
 * English and technical, so they are never shown to visitors — the HTTP
 * status picks a translated message instead. `overrides` lets a form give a
 * status its own meaning (e.g. 401 on the login form = wrong credentials).
 */
export function publicErrorMessage(
  err: unknown,
  messages: ApiErrorMessages,
  fallback: string,
  overrides: Partial<Record<number, string>> = {},
): string {
  if (!(err instanceof ApiClientError)) return fallback;

  const override = overrides[err.status];
  if (override) return override;

  if (err.status === NETWORK_ERROR_STATUS) return messages.network;
  if (err.status >= 500) return messages.server;
  switch (err.status) {
    case 400:
      return messages.validation;
    case 401:
      return messages.sessionExpired;
    case 403:
      return messages.forbidden;
    case 404:
      return messages.notFound;
    case 429:
      return messages.tooManyRequests;
    default:
      return fallback;
  }
}
