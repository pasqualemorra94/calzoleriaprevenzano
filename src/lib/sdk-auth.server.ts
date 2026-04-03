/**
 * Auth Server Helpers — server-only
 *
 * Thin wrappers around Better Auth for common patterns.
 * Public API is IDENTICAL to the previous implementation —
 * all 16 consumer routes work without changes.
 *
 * - requireUser: protect routes requiring login
 * - requireAdmin: protect admin routes (throws 403)
 * - getUser: optional auth (get user if logged in, null otherwise)
 * - logoutUser: clear session
 */

import { auth } from "./auth";
import { redirect } from "@tanstack/react-router";

// ─── Types ──────────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
}

/**
 * Extract a stable AuthUser shape from a Better Auth session.
 * Better Auth may return `name` as `string | null`; we default to empty string.
 */
function toAuthUser(session: {
  session: { userId: string };
  user: { id: string; email: string; name: string | null; role?: string | null; emailVerified: boolean };
}): AuthUser {
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? "",
    role: session.user.role ?? "user",
    emailVerified: session.user.emailVerified,
  };
}

// ─── Public Helpers ─────────────────────────────────────────────────

/**
 * Require authenticated user — redirects to /auth/login if not logged in.
 */
export async function requireUser(request: Request): Promise<AuthUser> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw redirect({ to: "/auth/login" } as never);
  }

  return toAuthUser(session);
}

/**
 * Require admin user — throws 403 if not ADMIN role.
 * First ensures user is authenticated.
 */
export async function requireAdmin(request: Request): Promise<AuthUser> {
  const user = await requireUser(request);
  if (user.role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }
  return user;
}

/**
 * Optional auth — returns user or null without redirecting.
 * Use in loaders where the page works for both logged-in and anonymous users.
 */
export async function getUser(request: Request): Promise<AuthUser | null> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) return null;
  return toAuthUser(session);
}

/**
 * Logout current session.
 * Better Auth handles cookie clearing via tanstackStartCookies plugin.
 */
export async function logoutUser(request: Request): Promise<void> {
  await auth.api.signOut({
    headers: request.headers,
  });
}
