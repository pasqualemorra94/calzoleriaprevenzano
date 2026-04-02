/**
 * Auth SDK Instance — server-only
 *
 * Centralized secure-auth-sdk configuration.
 * Uses createPrismaAdapter for database integration.
 *
 * IMPORTANT: secure-auth-sdk must be installed:
 *   pnpm add git+https://github.com/Mischio95/secure-auth-sdk.git
 * Requires SSH key configured for GitHub.
 */

import { prisma } from "./db.server";

// ─── Startup Validation ─────────────────────────────────────────────
// Fail fast if secrets are not configured.
// Better to crash at deploy than to fail silently at runtime after login.

if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
  throw new Error(
    "[secure-auth-sdk] AUTH_SECRET must be set and at least 32 characters long. " +
      'Generate one with: openssl rand -base64 32',
  );
}

if (!process.env.APP_URL) {
  throw new Error(
    "[secure-auth-sdk] APP_URL must be set (e.g. https://example.com). " +
      "Required for email verification links and password reset URLs.",
  );
}

// ─── Dynamic import for SDK ─────────────────────────────────────────
// The SDK is loaded dynamically to allow the project to build even
// if the SDK package is not yet installed (private repo access).

type CreateAuthFn = typeof import("secure-auth-sdk").createAuth;
type CreatePrismaAdapterFn = typeof import("secure-auth-sdk/adapters/prisma").createPrismaAdapter;
type AuthInstance = ReturnType<CreateAuthFn>;

let _auth: AuthInstance | undefined;

async function getAuth(): Promise<AuthInstance> {
  if (_auth) return _auth;

  const { createAuth } = (await import("secure-auth-sdk")) as { createAuth: CreateAuthFn };
  const { createPrismaAdapter } = (await import(
    "secure-auth-sdk/adapters/prisma"
  )) as { createPrismaAdapter: CreatePrismaAdapterFn };

  _auth = createAuth({
    adapter: createPrismaAdapter(prisma),
    secret: process.env.AUTH_SECRET!,
    baseUrl: process.env.APP_URL!,

    session: {
      cookieName: "sid",
      expiresInDays: 30,
      maxConcurrentSessions: 5,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        path: "/",
      },
    },

    password: {
      minLength: 12,
      minStrengthScore: 3,
      checkBreached: true,
    },

    rateLimit: {
      maxFailedAttempts: 5,
      lockoutDurationMs: 900000, // 15 minutes
      permanentLockoutThreshold: 20,
    },

    email: {
      requireVerification: true,
      verificationExpiryMs: 86400000, // 24h
      passwordResetExpiryMs: 3600000, // 1h
    },
  });

  return _auth;
}

/**
 * Returns the auth SDK instance. Lazily loaded on first call.
 * Server-only — never import from client code.
 */
export const auth: AuthInstance = new Proxy({} as AuthInstance, {
  get(_target, prop: string | symbol) {
    return (...args: unknown[]) => getAuth().then((instance) => {
      const value = (instance as Record<string | symbol, unknown>)[prop];
      if (typeof value === "function") {
        return value.apply(instance, args);
      }
      return value;
    });
  },
});
