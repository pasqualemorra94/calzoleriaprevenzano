/**
 * GET /api/orders — List user's orders (authenticated)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireUser } from "~/lib/sdk-auth.server";
import { getUserOrders } from "~/lib/orders.server";

export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        let user: { id: string };
        try {
          user = await requireUser(request);
        } catch {
          return apiError("UNAUTHORIZED", "Autenticazione richiesta", 401);
        }

        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page") ?? 1);
        const perPage = Number(url.searchParams.get("perPage") ?? 10);

        const result = await getUserOrders(user.id, page, perPage);
        return apiSuccess(result);
      },
    },
  },
});
