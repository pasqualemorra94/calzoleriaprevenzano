/**
 * POST /api/newsletter — Subscribe to newsletter (public)
 * Validates email and records subscription intent.
 * In production, this should integrate with a newsletter service (Mailchimp, Brevo, etc.).
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { z } from "zod";
import { createLogger } from "~/lib/logger.server";

const log = createLogger("newsletter");

const newsletterSchema = z.object({
  email: z.string().min(1, "L'email è obbligatoria").email("Inserisci un indirizzo email valido"),
});

export const Route = createFileRoute("/api/newsletter")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json() as unknown;
        const parsed = newsletterSchema.safeParse(body);

        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Email non valida", 422);
        }

        // TODO: Integrate with newsletter service (Mailchimp, Brevo, Klaviyo, etc.)
        // For now, log and return success
        log.info("New subscription", { email: parsed.data.email });

        return apiSuccess({ message: "Iscrizione avvenuta con successo" }, 201);
      },
    },
  },
});
