/**
 * GET /api/admin/orders/$id — Get order detail (admin)
 * PATCH /api/admin/orders/$id — Update order status (admin)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { getAdminOrder, adminUpdateOrderStatus } from "~/lib/admin.server";
import { updateOrderStatusSchema } from "~/lib/validators/admin";

export const Route = createFileRoute("/api/admin/orders/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const order = await getAdminOrder(params.id);
        if (!order) {
          return apiError("NOT_FOUND", "Ordine non trovato", 404);
        }
        return apiSuccess(order);
      },

      PATCH: async ({ request, params }) => {
        let admin: { id: string };
        try {
          admin = await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const body = (await request.json()) as unknown;
        const parsed = updateOrderStatusSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        const order = await adminUpdateOrderStatus(params.id, parsed.data, admin.id);
        return apiSuccess({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          trackingNumber: order.trackingNumber,
        });
      },
    },
  },
});
