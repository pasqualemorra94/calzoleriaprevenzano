/**
 * Cart Session — server & client helpers
 *
 * Generates and manages the `cart_session_id` cookie for anonymous users.
 * The server auto-creates this cookie on first cart interaction,
 * so the frontend doesn't need any special setup.
 */

import { APP_CONFIG } from "~/lib/constants/app";

const COOKIE_NAME = "cart_session_id";
const SESSION_MAX_AGE = APP_CONFIG.auth.sessionMaxAge; // 30 days, same as auth

/** Generate a cryptographically random session ID */
export function generateSessionId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b: number) => b.toString(16).padStart(2, "0")).join("");
}

/** Extract cart_session_id from request cookies */
export function getSessionId(request: Request): string | null {
  const cookies = request.headers.get("cookie") ?? "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  return match?.[1] ?? null;
}

/** Build a Set-Cookie header value for the cart session */
export function buildSessionCookie(sessionId: string): string {
  const isProduction = process.env.NODE_ENV === "production";
  return [
    `${COOKIE_NAME}=${sessionId}`,
    `Max-Age=${SESSION_MAX_AGE}`,
    `Path=/`,
    "SameSite=Lax",
    isProduction ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}
