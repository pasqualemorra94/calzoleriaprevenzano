/**
 * Better Auth — server instance
 *
 * Central auth configuration with:
 * - Prisma adapter (PostgreSQL)
 * - Email/password authentication
 * - Admin plugin (role-based access, ban, impersonation)
 * - TanStack Start cookie plugin
 * - Audit logging via database hooks
 * - Custom email sending for verification & password reset
 */

import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { prisma } from "./db.server";
import { sendAuthEmail } from "./auth-email.server";

// ─── Startup Validation ─────────────────────────────────────────────

if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32) {
  throw new Error(
    "[auth] BETTER_AUTH_SECRET must be set and at least 32 characters long. " +
      "Generate one with: openssl rand -base64 32",
  );
}

if (!process.env.BETTER_AUTH_URL) {
  throw new Error(
    "[auth] BETTER_AUTH_URL must be set (e.g. http://localhost:3000). " +
      "Required for email verification links and password reset URLs.",
  );
}

// ─── Auth Instance ──────────────────────────────────────────────────

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, token }) => {
      await sendAuthEmail("reset", {
        email: user.email,
        name: user.name,
        url: `${process.env.BETTER_AUTH_URL}/auth/reset-password?token=${token}`,
      });
    },
  },

  // Admin plugin — role-based access, ban, impersonation
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    tanstackStartCookies(),
  ],

  // Audit logging via database hooks
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              event: "user.created",
              metadata: { email: user.email, name: user.name },
            },
          }).catch(() => {});
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          await prisma.auditLog.create({
            data: {
              userId: session.userId,
              event: "session.created",
              metadata: { sessionId: session.id },
            },
          }).catch(() => {});
        },
      },
      delete: {
        before: async (session) => {
          await prisma.auditLog.create({
            data: {
              userId: session.userId,
              event: "session.deleted",
              metadata: { sessionId: session.id },
            },
          }).catch(() => {});
        },
      },
    },
  },

  // Session configuration
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
    updateAge: 24 * 60 * 60,      // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache session for 5 minutes
    },
  },
});
