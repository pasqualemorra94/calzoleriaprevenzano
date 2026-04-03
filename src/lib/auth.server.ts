/**
 * Auth Server — Better Auth wrapper (server-only)
 *
 * This module is a thin wrapper around Better Auth for backward compatibility.
 * All session validation, user lookup, and password management is now handled
 * by Better Auth (src/lib/auth.ts).
 *
 * RE-EXPORTS: The Better Auth instance from auth.ts for direct server API access.
 * AUDIT LOG: Lightweight audit log helper using the AuditLog model.
 */

import { auth } from "./auth";
import { prisma } from "./db.server";

// ─── Re-export Better Auth instance ─────────────────────────────────

export { auth };

// ─── Audit Log Helper ───────────────────────────────────────────────

/**
 * Write an audit log entry. Failures are silently caught — audit logging
 * should never block the main flow.
 */
export async function auditLog(data: {
  userId?: string;
  event: string;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: unknown;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: data.userId ?? null,
      event: data.event,
      ip: data.ip ?? null,
      userAgent: data.userAgent ?? null,
      metadata: data.metadata ?? undefined,
    },
  }).catch(() => {
    // Audit log failure should not block the flow
  });
}
