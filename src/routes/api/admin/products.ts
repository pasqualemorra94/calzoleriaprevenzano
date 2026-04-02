/**
 * GET /api/admin/products — List all products (admin, includes inactive/deleted)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { getAdminProducts } from "~/lib/admin.server";
import { listAdminProductsSchema } from "~/lib/validators/admin";

export const Route = createFileRoute("/api/admin/products")({
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

        const parsed = listAdminProductsSchema.safeParse(rawParams);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Parametri non validi", 400);
        }

        const result = await getAdminProducts(parsed.data);
        return apiSuccess(result);
      },
    },
  },
});
