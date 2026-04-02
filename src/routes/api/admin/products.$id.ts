/**
 * GET /api/admin/products/$id — Get product for editing (admin)
 * PUT /api/admin/products/$id — Update product (admin)
 * DELETE /api/admin/products/$id — Soft-delete product (admin)
 * POST /api/admin/products/$id/restore — Restore soft-deleted product (admin)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError, apiNoContent } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import {
  getAdminProduct,
  adminUpdateProduct,
  adminDeleteProduct,
} from "~/lib/admin.server";
import { updateProductSchema } from "~/lib/validators/products";

export const Route = createFileRoute("/api/admin/products/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const product = await getAdminProduct(params.id);
        if (!product) {
          return apiError("NOT_FOUND", "Prodotto non trovato", 404);
        }
        return apiSuccess(product);
      },

      PUT: async ({ request, params }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const body = (await request.json()) as unknown;
        const parsed = updateProductSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        const product = await adminUpdateProduct(params.id, parsed.data);
        return apiSuccess(product);
      },

      DELETE: async ({ request, params }) => {
        let adminId: string;
        try {
          adminId = (await requireAdmin(request)).id;
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        await adminDeleteProduct(params.id, adminId);
        return apiNoContent();
      },
    },
  },
});
