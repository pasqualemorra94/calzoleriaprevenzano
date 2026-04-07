/**
 * PUT /api/addresses/$id — Update address (authenticated)
 * DELETE /api/addresses/$id — Delete address (authenticated)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireUser } from "~/lib/sdk-auth.server";
import { updateAddress, deleteAddress } from "~/lib/address.server";
import { z } from "zod";

const updateAddressSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  address1: z.string().min(1).max(200).optional(),
  address2: z.string().max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  province: z.string().min(2).max(2).optional(),
  postalCode: z.string().regex(/^\d{5}$/).optional(),
  country: z.string().optional(),
  phone: z.string().max(20).optional(),
  isDefault: z.boolean().optional(),
});

export const Route = createFileRoute("/api/addresses/$id")({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
        let user: { id: string };
        try {
          user = await requireUser(request);
        } catch {
          return apiError("UNAUTHORIZED", "Autenticazione richiesta", 401);
        }

        const body = await request.json() as unknown;
        const parsed = updateAddressSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        try {
          const address = await updateAddress(params.id, user.id, parsed.data);
          return apiSuccess(address);
        } catch {
          return apiError("NOT_FOUND", "Indirizzo non trovato", 404);
        }
      },

      DELETE: async ({ request, params }) => {
        let user: { id: string };
        try {
          user = await requireUser(request);
        } catch {
          return apiError("UNAUTHORIZED", "Autenticazione richiesta", 401);
        }

        try {
          await deleteAddress(params.id, user.id);
          return apiNoContent();
        } catch {
          return apiError("NOT_FOUND", "Indirizzo non trovato", 404);
        }
      },
    },
  },
});

import { apiNoContent } from "~/lib/api-response";
