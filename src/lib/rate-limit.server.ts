/**
 * In-Memory Rate Limiter — server-only
 *
 * Sliding window rate limiting using an in-memory Map.
 * Suitable for single-process deployments (dev, small VPS).
 * For multi-process production, replace with Redis-backed implementation
 * (see security.md — rate-limit.redis.server.ts template).
 *
 * Auto-cleanup prevents memory leaks by pruning expired entries.
 */

import { createLogger } from "~/lib/logger.server";

const log = createLogger("rate-limit");

interface RateLimitEntry {
  timestamps: number[];
}

/** Rate limit presets per endpoint type */
export const RATE_LIMITS = {
  /** Auth endpoints: 5 req/15min (brute force protection) */
  AUTH: { maxRequests: 5, windowSeconds: 900 },
  /** Contact/newsletter forms: 3 req/min */
  FORM: { maxRequests: 3, windowSeconds: 60 },
  /** General API: 60 req/min */
  API: { maxRequests: 60, windowSeconds: 60 },
  /** Webhook endpoints: 100 req/min (Stripe burst tolerance) */
  WEBHOOK: { maxRequests: 100, windowSeconds: 60 },
} as const satisfies Record<string, { maxRequests: number; windowSeconds: number }>;

type RateLimitPreset = keyof typeof RATE_LIMITS;

const store = new Map<string, RateLimitEntry>();

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start periodic cleanup of expired rate limit entries.
 * Runs every 5 minutes to prune stale entries.
 */
function ensureCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      const windowMs = Math.max(...entry.timestamps) + 60000;
      if (now > windowMs + 60000) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Check rate limit for a given identifier.
 *
 * @returns Object with `success` flag and `retryAfterMs` (only when throttled).
 */
export function checkRateLimit(
  identifier: string,
  preset: RateLimitPreset,
): { success: boolean; retryAfterMs: number } {
  ensureCleanup();

  const config = RATE_LIMITS[preset];
  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;
  const key = `${preset}:${identifier}`;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Prune expired timestamps
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (entry.timestamps.length >= config.maxRequests) {
    // Calculate when the oldest request expires
    const oldest = Math.min(...entry.timestamps);
    const retryAfterMs = Math.max(oldest + config.windowSeconds * 1000 - now, 1000);
    log.warn("Rate limit exceeded", {
      preset,
      identifier: identifier.slice(0, 20),
      retryAfterMs,
    });
    return { success: false, retryAfterMs };
  }

  entry.timestamps.push(now);
  return { success: true, retryAfterMs: 0 };
}

/**
 * Get the client IP from a Request object.
 */
export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
