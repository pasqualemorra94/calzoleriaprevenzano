/**
 * POST /api/admin/orders/bulk — Bulk order action (admin)
 *
 * Endpoint unificato che dispatcha 3 azioni sul bulk di ordini selezionati:
 * - "soft-delete":  sposta nel cestino (set deletedAt + deletedBy)
 * - "restore":      ripristina dal cestino (clear deletedAt + deletedBy)
 * - "hard-delete":  elimina definitivamente (cascade su OrderItem + Payment)
 *
 * Body: { action, ids } -> bulkOrderActionSchema
 * Response: { count } (numero di righe affette)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { bulkOrderActionSchema } from "~/lib/validators/admin";
import {
  softDeleteOrders,
  restoreOrders,
  hardDeleteOrders,
} from "~/lib/admin.server";

export const Route = createFileRoute("/api/admin/orders/bulk")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Auth gate
        let adminId: string;
        try {
          adminId = (await requireAdmin(request)).id;
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        // 2. Parse JSON body
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return apiError("BAD_REQUEST", "Body JSON non valido", 400);
        }

        // 3. Zod validate
        const parsed = bulkOrderActionSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        // 4. Dispatch sull'azione
        try {
          const { action, ids } = parsed.data;
          let result: { count: number };
          if (action === "soft-delete") {
            result = await softDeleteOrders(ids, adminId);
          } else if (action === "restore") {
            result = await restoreOrders(ids);
          } else {
            result = await hardDeleteOrders(ids);
          }
          return apiSuccess({ count: result.count });
        } catch (e: unknown) {
          // Log con context, no stack trace exposure
          console.error(
            "[api/admin/orders/bulk]",
            e instanceof Error ? e.message : String(e),
          );
          return apiError("INTERNAL_ERROR", "Errore interno", 500);
        }
      },
    },
  },
});
