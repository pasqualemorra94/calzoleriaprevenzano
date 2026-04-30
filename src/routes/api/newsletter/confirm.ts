/**
 * POST /api/newsletter/confirm — Double opt-in confirmation endpoint
 *
 * Riceve { token }, trova NewsletterSubscription, transiziona pending → confirmed
 * + insert ConsentLog type=marketing granted=true (audit-by-presence: il consenso vale
 * SOLO dopo questa conferma).
 *
 * Idempotency:
 * - Token non trovato → 404 (esposto come "non valido o già usato")
 * - Già confirmed → 200 (idempotente, no nuova ConsentLog)
 * - Unsubscribed → 410 Gone (l'utente deve iscriversi di nuovo dal sito)
 *
 * Rate limit FORM (3/min per IP).
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { apiSuccess, apiError } from "~/lib/api-response";
import { prisma } from "~/lib/db.server";
import { getClientIp, checkRateLimit } from "~/lib/rate-limit.server";
import { createLogger } from "~/lib/logger.server";

const log = createLogger("newsletter-confirm");

const schema = z.object({ token: z.string().min(1) });

export const Route = createFileRoute("/api/newsletter/confirm")({
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
          if (sub.status === "confirmed") {
            return apiSuccess({ message: "Iscrizione già confermata" });
          }
          if (sub.status === "unsubscribed") {
            return apiError(
              "INVALID_STATE",
              "Subscription disiscritta. Iscriviti di nuovo dal sito.",
              410,
            );
          }

          await prisma.$transaction([
            prisma.newsletterSubscription.update({
              where: { id: sub.id },
              data: { status: "confirmed", confirmedAt: new Date() },
            }),
            // Audit-by-presence: il consenso marketing vale solo dopo conferma double opt-in
            prisma.consentLog.create({
              data: {
                userId: null, // newsletter può essere indipendente da account
                type: "marketing",
                granted: true,
                ip,
                userAgent: request.headers.get("user-agent"),
              },
            }),
          ]);

          return apiSuccess({ message: "Iscrizione confermata" });
        } catch (e: unknown) {
          log.error("Confirm failed", {
            error: e instanceof Error ? e.message : "unknown",
          });
          return apiError("INTERNAL_ERROR", "Errore conferma", 500);
        }
      },
    },
  },
});
