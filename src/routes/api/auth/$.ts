/**
 * POST/GET /api/auth/* — Better Auth catch-all handler
 *
 * All auth requests (login, register, forgot-password, reset-password,
 * sign-out, get-session, etc.) are handled by Better Auth's built-in handler.
 */

import { createFileRoute } from "@tanstack/react-router";
import { auth } from "~/lib/auth";
import { checkRateLimit, getClientIp } from "~/lib/rate-limit.server";
import { createLogger } from "~/lib/logger.server";

const log = createLogger("auth-handler");

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        return auth.handler(request);
      },
      POST: async ({ request }: { request: Request }) => {
        // ── Rate limit on auth mutations ──
        const ip = getClientIp(request);
        const limit = checkRateLimit(ip, "AUTH");
        if (!limit.success) {
          log.warn("Auth rate limit exceeded", { ip: ip.slice(0, 20) });
          return new Response(
            JSON.stringify({ ok: false, error: { code: "RATE_LIMITED", message: "Troppe tentativi. Riprova tra 15 minuti." } }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)),
              },
            },
          );
        }

        return auth.handler(request);
      },
    },
  },
});
