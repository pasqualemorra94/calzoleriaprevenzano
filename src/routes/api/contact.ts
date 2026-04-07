/**
 * POST /api/contact — Submit contact form (public)
 * Sends email notification to admin and auto-reply to user.
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { contactSchema } from "~/lib/validators/products";
import { submitContact } from "~/lib/contact.server";
import { checkRateLimit, getClientIp } from "~/lib/rate-limit.server";

export const Route = createFileRoute("/api/contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // ── Rate limit ──
        const ip = getClientIp(request);
        const limit = checkRateLimit(ip, "FORM");
        if (!limit.success) {
          return apiError("RATE_LIMITED", "Troppe richieste. Riprova tra qualche minuto.", 429, undefined, {
            "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)),
          });
        }

        const body = await request.json() as unknown;
        const parsed = contactSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Compila tutti i campi correttamente", 422);
        }

        const ipAddress = request.headers.get("x-forwarded-for") ?? null;

        try {
          await submitContact(parsed.data, ipAddress);
        } catch {
          return apiError("INTERNAL_ERROR", "Errore nell'invio del messaggio. Riprova.", 500);
        }

        return apiSuccess({ message: "Messaggio inviato con successo" }, 201);
      },
    },
  },
});
