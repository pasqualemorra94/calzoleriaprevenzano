/**
 * GET /api/orders — List user's orders (authenticated)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireUser } from "~/lib/sdk-auth.server";
import { getUserOrders } from "~/lib/orders.server";
import { z } from "zod";

const listOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(10),
});

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
        const parsed = listOrdersSchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Parametri di paginazione non validi", 400);
        }

        const { page, perPage } = parsed.data;

        const result = await getUserOrders(user.id, page, perPage);
        return apiSuccess(result);
      },
    },
  },
});
