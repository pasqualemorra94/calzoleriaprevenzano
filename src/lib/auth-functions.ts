/**
 * Auth Server Functions — createServerFn pattern
 *
 * Uses createServerFn from @tanstack/react-start (virtual module).
 * Server-side only — runs on the server during SSR and as RPC from the client.
 */

import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { auth } from "./auth";

/**
 * Get current authenticated user.
 * Returns null if not authenticated.
 * Forwards Set-Cookie headers for session/cache refresh.
 */
export const $getUser = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();

  const session = await auth.api.getSession({
    headers: request.headers,
    returnHeaders: true,
  });

  // Forward any Set-Cookie headers to the client (session/cache refresh)
  const cookies = session.headers?.getSetCookie();
  if (cookies?.length) {
    setResponseHeader("Set-Cookie", cookies);
  }

  return session.response?.user ?? null;
});

/**
 * Sign out current user — server-side.
 * Clears the session cookie via Better Auth.
 */
export const $signOut = createServerFn({ method: "POST" }).handler(async () => {
  const request = getRequest();

  const result = await auth.api.signOut({
    headers: request.headers,
  });

  // Forward Set-Cookie headers if present (session cleared)
  const headers = result as { headers?: { getSetCookie?: () => string[] } };
  const cookies = headers.headers?.getSetCookie?.();
  if (cookies?.length) {
    setResponseHeader("Set-Cookie", cookies);
  }
});
