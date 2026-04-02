/**
 * GET /api/admin/stats — Dashboard statistics (admin only)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { getDashboardStats } from "~/lib/admin.server";

export const Route = createFileRoute("/api/admin/stats")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        try {
          const stats = await getDashboardStats();
          return apiSuccess(stats);
        } catch {
          return apiError("INTERNAL_ERROR", "Errore nel caricamento statistiche", 500);
        }
      },
    },
  },
});
