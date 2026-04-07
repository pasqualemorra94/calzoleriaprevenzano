/**
 * GET /api/addresses — List user's addresses (authenticated)
 * POST /api/addresses — Create new address (authenticated)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireUser } from "~/lib/sdk-auth.server";
import { getAddresses, createAddress } from "~/lib/address.server";
import { z } from "zod";

const addressBodySchema = z.object({
  firstName: z.string().min(1, "Il nome è obbligatorio").max(100),
  lastName: z.string().min(1, "Il cognome è obbligatorio").max(100),
  address1: z.string().min(1, "L'indirizzo è obbligatorio").max(200),
  address2: z.string().max(200).optional(),
  city: z.string().min(1, "La città è obbligatoria").max(100),
  province: z.string().min(2, "La provincia è obbligatoria").max(2),
  postalCode: z.string().regex(/^\d{5}$/, "Il CAP deve avere 5 cifre"),
  country: z.string().default("IT"),
  phone: z.string().max(20).optional(),
  isDefault: z.boolean().default(false),
});

export const Route = createFileRoute("/api/addresses")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        let user: { id: string };
        try {
          user = await requireUser(request);
        } catch {
          return apiError("UNAUTHORIZED", "Autenticazione richiesta", 401);
        }

        try {
          const addresses = await getAddresses(user.id);
          return apiSuccess(addresses);
        } catch {
          return apiError("INTERNAL_ERROR", "Errore nel caricamento degli indirizzi", 500);
        }
      },

      POST: async ({ request }) => {
        let user: { id: string };
        try {
          user = await requireUser(request);
        } catch {
          return apiError("UNAUTHORIZED", "Autenticazione richiesta", 401);
        }

        const body = await request.json() as unknown;
        const parsed = addressBodySchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        try {
          const address = await createAddress(user.id, parsed.data);
          return apiSuccess(address, 201);
        } catch {
          return apiError("INTERNAL_ERROR", "Errore nel salvataggio dell'indirizzo", 500);
        }
      },
    },
  },
});
