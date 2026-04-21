/**
 * GET /api/admin/ai/sessions — List AI analysis sessions
 * POST /api/admin/ai/sessions — Create session manually (optional, usually via analyze-foot)
 *
 * Admin only.
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { listSessions, getTotalCost } from "~/lib/ai-sessions.server";

export const Route = createFileRoute("/api/admin/ai/sessions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        try {
          const [sessions, cost] = await Promise.all([
            listSessions(50),
            getTotalCost(),
          ]);

          return apiSuccess({ sessions, totalCost: cost });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Errore nel recupero delle sessioni";
          return apiError("SERVER_ERROR", message, 500);
        }
      },
    },
  },
});
