/**
 * Minimal typed HTTP client for the CHCars backend API.
 *
 * Authentication is cookie-based: the JWT lives in an httpOnly cookie the
 * browser attaches automatically (`credentials: "include"`). State-changing
 * requests carry the double-submit CSRF token, read from the readable
 * `chcars_csrf` cookie (or seeded from the login/register response).
 *
 * The frontend never talks to the database directly: every call goes through
 * this client to the backend REST API.
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const CSRF_COOKIE = "chcars_csrf";
const CSRF_HEADER = "X-CSRF-Token";
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export interface ApiErrorBody {
  message: string;
  details?: unknown;
}

/** In-memory copy of the CSRF token, primed by login/register responses. */
let csrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

function readCsrfCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${CSRF_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(CSRF_COOKIE.length + 1)) : null;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };
  // Let the browser set the multipart Content-Type (with its boundary).
  if (!isFormData) headers["Content-Type"] = "application/json";

  if (UNSAFE_METHODS.has(method)) {
    const token = csrfToken ?? readCsrfCookie();
    if (token) headers[CSRF_HEADER] = token;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method,
    credentials: "include",
    headers,
  });

  const hasJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const body: unknown = hasJson ? await response.json() : undefined;

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | undefined;
    throw new ApiClientError(
      errorBody?.message ?? `Request failed with status ${response.status}`,
      response.status,
      errorBody?.details,
    );
  }

  return body as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
  /** POST a `multipart/form-data` body (file upload). */
  postForm: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "POST", body: form }),
  put: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
