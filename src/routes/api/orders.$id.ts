/**
 * GET /api/orders/$id — Get single order detail (authenticated)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireUser } from "~/lib/sdk-auth.server";
import { getOrderDetail } from "~/lib/orders.server";

export const Route = createFileRoute("/api/orders/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        let user: { id: string };
        try {
          user = await requireUser(request);
        } catch {
          return apiError("UNAUTHORIZED", "Autenticazione richiesta", 401);
        }

        const order = await getOrderDetail(user.id, params.id);
        if (!order) {
          return apiError("NOT_FOUND", "Ordine non trovato", 404);
        }

        return apiSuccess(order);
      },
    },
  },
});
