/**
 * GET /api/admin/orders — List all orders (admin, all users)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { getAdminOrders } from "~/lib/admin.server";
import { listAdminOrdersSchema } from "~/lib/validators/admin";

export const Route = createFileRoute("/api/admin/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const url = new URL(request.url);
        const rawParams: Record<string, string> = {};
        for (const [key, value] of url.searchParams) {
          rawParams[key] = value;
        }

        const parsed = listAdminOrdersSchema.safeParse(rawParams);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Parametri non validi", 400);
        }

        const result = await getAdminOrders(parsed.data);
        return apiSuccess(result);
      },
    },
  },
});
