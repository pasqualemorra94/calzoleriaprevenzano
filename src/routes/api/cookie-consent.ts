/**
 * POST /api/cookie-consent — Persistenza consenso cookie GDPR
 *
 * - Setta cookie `consent_preferences` (1y) tramite setConsentCookie
 * - Inserisce 1 row ConsentLog per ogni categoria opt-in (preferences/analytics/marketing)
 *   con userId opzionale (se sessione presente), ip, userAgent, granted=true
 * - Categorie rifiutate: nessuna row (l'assenza è l'audit, vedi spec § Wave 1)
 * - necessary non genera mai una row (consenso non revocabile per legge)
 * - Rate limit FORM (3/min per IP)
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { apiSuccess, apiError } from "~/lib/api-response";
import { checkRateLimit, getClientIp } from "~/lib/rate-limit.server";
import { setConsentCookie } from "~/lib/cookieConsent";
import { prisma } from "~/lib/db.server";
import { getUser } from "~/lib/sdk-auth.server";
import { createLogger } from "~/lib/logger.server";

const log = createLogger("cookie-consent");

const cookieConsentSchema = z.object({
  necessary: z.literal(true),
  preferences: z.boolean(),
  analytics: z.boolean(),
  marketing: z.boolean(),
  timestamp: z.number().int().positive(),
});

export const Route = createFileRoute("/api/cookie-consent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // ── Rate limit (FORM = 3/min per IP) ──
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

        // ── Parse + validate body ──
        const body = (await request.json()) as unknown;
        const parsed = cookieConsentSchema.safeParse(body);
        if (!parsed.success) {
          return apiError(
            "VALIDATION_ERROR",
            parsed.error.issues[0]?.message ?? "Payload non valido",
            422,
          );
        }
        const consent = parsed.data;

        // ── Optional auth: userId se sessione presente ──
        const user = await getUser(request).catch(() => null);
        const userId = user?.id ?? null;
        const userAgent = request.headers.get("user-agent");

        // ── Persistenza ConsentLog (1 row per categoria opt-in) ──
        const optIns: Array<"preferences" | "analytics" | "marketing"> = [];
        if (consent.preferences) optIns.push("preferences");
        if (consent.analytics) optIns.push("analytics");
        if (consent.marketing) optIns.push("marketing");

        try {
          if (optIns.length > 0) {
            await prisma.consentLog.createMany({
              data: optIns.map((type) => ({
                userId,
                type,
                granted: true,
                ip,
                userAgent,
              })),
            });
          }
        } catch (e: unknown) {
          log.error("ConsentLog insert failed", {
            error: e instanceof Error ? e.message : "unknown",
            ip: ip.slice(0, 20),
          });
          return apiError("INTERNAL_ERROR", "Errore durante il salvataggio del consenso", 500);
        }

        // ── Set-Cookie + success ──
        return apiSuccess(
          { saved: true },
          200,
          { "Set-Cookie": setConsentCookie(consent) },
        );
      },
    },
  },
});
