/**
 * Standardized API Response Helpers
 *
 * Every API route uses these helpers to ensure consistent response format.
 * Responses follow the ApiResponse<T> envelope from types/api.ts.
 */

import type { ApiErrorResponse, ApiSuccessResponse } from "~/lib/types/api";

/** Success response with data envelope */
export function apiSuccess<T>(data: T, status = 200): Response {
  return Response.json(
    { ok: true, data } satisfies ApiSuccessResponse<T>,
    { status },
  );
}

/** Error response with code + message envelope */
export function apiError(code: string, message: string, status: number): Response {
  return Response.json(
    { ok: false, error: { code, message } } satisfies ApiErrorResponse,
    { status },
  );
}

/** No content response (204) — for DELETE operations */
export function apiNoContent(): Response {
  return new Response(null, { status: 204 });
}
