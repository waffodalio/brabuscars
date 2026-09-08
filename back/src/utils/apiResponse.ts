/**
 * Consistent response envelopes used by every controller.
 *
 *   success: { success: true, data: <payload> }
 *   error:   { success: false, message: <string>, details?: <unknown> }
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  message: string;
  details?: unknown;
}

export function success<T>(data: T): SuccessResponse<T> {
  return { success: true, data };
}

export function error(message: string, details?: unknown): ErrorResponse {
  return details === undefined
    ? { success: false, message }
    : { success: false, message, details };
}
