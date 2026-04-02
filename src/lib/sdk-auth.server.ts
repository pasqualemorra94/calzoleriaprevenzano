/**
 * Auth Server Helpers — server-only
 *
 * Thin wrappers around secure-auth-sdk for common patterns:
 * - requireUser: protect routes requiring login
 * - requireAdmin: protect admin routes
 * - getUser: optional auth (get user if logged in)
 * - logoutUser: clear session
 */

import { auth } from "./auth.server";
import { redirect } from "@tanstack/react-router";
/**
 * Require authenticated user — redirects to /auth if not logged in.
 * Throws AuthError if session is invalid.
 */
export async function requireUser(request: Request): Promise<AuthUser> {
  const cookieHeader = request.headers.get("cookie");
  const user = await auth.getUser(cookieHeader);
  if (!user) {
    throw redirect({ to: "/auth/login" } as never);
  }
  return user as unknown as AuthUser;
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
  const cookieHeader = request.headers.get("cookie");
  const user = await auth.getUser(cookieHeader);
  return (user as unknown as AuthUser) ?? null;
}

/**
 * Logout current session — returns Set-Cookie header to clear the session.
 */
export async function logoutUser(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get("cookie");
  try {
    const session = await auth.getUserSession(cookieHeader);
    if (session) {
      const result = await auth.logout(session.session.id);
      return result.cookie;
    }
  } catch {
    // Session may already be expired — that's fine
  }
  return null;
}

// ─── Minimal type for auth user returned by SDK ─────────────────────

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
}
