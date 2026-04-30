/**
 * POST /api/newsletter/unsubscribe — Token-based unsubscribe endpoint
 *
 * Riceve { token }, trova NewsletterSubscription, transiziona qualsiasi stato
 * → unsubscribed + insert ConsentLog type=marketing granted=false.
 *
 * ECCEZIONE audit-by-presence: per newsletter unsubscribe inseriamo granted=false
 * (è una revoca esplicita di consenso pregresso, va tracciata per audit GDPR).
 *
 * Idempotency:
 * - Token non trovato → 404
 * - Già unsubscribed → 200 (idempotente, no nuova ConsentLog)
 *
 * Rate limit FORM (3/min per IP).
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { apiSuccess, apiError } from "~/lib/api-response";
import { prisma } from "~/lib/db.server";
import { getClientIp, checkRateLimit } from "~/lib/rate-limit.server";
import { createLogger } from "~/lib/logger.server";

const log = createLogger("newsletter-unsubscribe");

const schema = z.object({ token: z.string().min(1) });

export const Route = createFileRoute("/api/newsletter/unsubscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = getClientIp(request);
        const limit = checkRateLimit(ip, "FORM");
        if (!limit.success) {
          return apiError(
            "RATE_LIMITED",
            "Troppe richieste. Riprova tra qualche minuto.",
            429,
            undefined,
            { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) },
          );
        }

        const body = (await request.json().catch(() => null)) as unknown;
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Token mancante", 422);
        }

        try {
          const sub = await prisma.newsletterSubscription.findUnique({
            where: { token: parsed.data.token },
          });
          if (!sub) {
            return apiError("NOT_FOUND", "Token non valido o già usato", 404);
          }
          if (sub.status === "unsubscribed") {
            return apiSuccess({ message: "Già disiscritto" });
          }

          await prisma.$transaction([
            prisma.newsletterSubscription.update({
              where: { id: sub.id },
              data: { status: "unsubscribed" },
            }),
            // Eccezione audit-by-presence: revoca esplicita va tracciata
            prisma.consentLog.create({
              data: {
                userId: null,
                type: "marketing",
                granted: false,
                ip,
                userAgent: request.headers.get("user-agent"),
              },
            }),
          ]);

          return apiSuccess({ message: "Disiscrizione completata" });
        } catch (e: unknown) {
          log.error("Unsubscribe failed", {
            error: e instanceof Error ? e.message : "unknown",
          });
          return apiError("INTERNAL_ERROR", "Errore disiscrizione", 500);
        }
      },
    },
  },
});
