/**
 * Auth Server Helpers — server-only
 *
 * Thin wrappers around auth.server for common patterns:
 * - requireUser: protect routes requiring login
 * - requireAdmin: protect admin routes
 * - getUser: optional auth (get user if logged in)
 * - logoutUser: clear session
 */

import {
  getSessionFromCookie,
  validateSession,
  deleteSession,
  buildClearSessionCookie,
} from "./auth.server";
import { redirect } from "@tanstack/react-router";

// ─── Types ──────────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
}

// ─── Public Helpers ─────────────────────────────────────────────────

/**
 * Require authenticated user — redirects to /auth/login if not logged in.
 */
export async function requireUser(request: Request): Promise<AuthUser> {
  const sessionToken = getSessionFromCookie(request.headers.get("cookie"));
  const user = await validateSession(sessionToken);

  if (!user) {
    throw redirect({ to: "/auth/login" } as never);
  }

  return user;
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
  const sessionToken = getSessionFromCookie(request.headers.get("cookie"));
  return (await validateSession(sessionToken)) ?? null;
}

/**
 * Logout current session — returns Set-Cookie header to clear the session.
 */
export async function logoutUser(request: Request): Promise<string | null> {
  const sessionToken = getSessionFromCookie(request.headers.get("cookie"));
  if (sessionToken) {
    try {
      await deleteSession(sessionToken);
    } catch {
      // Session may already be expired — that's fine
    }
    return buildClearSessionCookie();
  }
  return null;
}
