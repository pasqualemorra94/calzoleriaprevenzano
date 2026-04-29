/**
 * POST /api/admin/products/$id/duplicate — Duplicate product (admin)
 *
 * Crea una copia inattiva del prodotto sorgente con slug/SKU auto-suffissati,
 * tutte le images e tutte le variants (con sku=null per evitare conflitti
 * sull'unique globale di ProductVariant.sku).
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { adminDuplicateProduct } from "~/lib/admin.server";

export const Route = createFileRoute("/api/admin/products/$id/duplicate")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        try {
          const result = await adminDuplicateProduct(params.id);
          return apiSuccess(result, 201);
        } catch (e: unknown) {
          if (e instanceof Error) {
            if (e.message === "Prodotto non trovato") {
              return apiError("NOT_FOUND", "Prodotto non trovato", 404);
            }
            if (e.message === "SLUG_COLLISION_LIMIT") {
              return apiError(
                "CONFLICT",
                "Impossibile generare uno slug univoco — rinominare prima il prodotto sorgente",
                409,
              );
            }
            // Prisma P2002 fallback (race condition microscopica fra findMany e create)
            if ("code" in e && (e as { code?: string }).code === "P2002") {
              return apiError("CONFLICT", "Slug o SKU già esistenti", 409);
            }
          }
          console.error("[api/admin/products/duplicate] unhandled", e);
          return apiError("INTERNAL_ERROR", "Errore durante la duplicazione", 500);
        }
      },
    },
  },
});
