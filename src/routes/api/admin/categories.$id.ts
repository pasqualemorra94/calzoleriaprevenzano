/**
 * PUT /api/admin/categories/$id — Update category (admin)
 * DELETE /api/admin/categories/$id — Delete category (admin)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError, apiNoContent } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { adminUpdateCategory, adminDeleteCategory } from "~/lib/admin.server";
import { updateCategorySchema } from "~/lib/validators/admin";

export const Route = createFileRoute("/api/admin/categories/$id")({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const body = (await request.json()) as unknown;
        const parsed = updateCategorySchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        const category = await adminUpdateCategory(params.id, parsed.data);
        return apiSuccess(category);
      },

      DELETE: async ({ request, params }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const result = await adminDeleteCategory(params.id);
        if ("error" in result && result.error) {
          return apiError("BAD_REQUEST", result.error, 400);
        }
        return apiNoContent();
      },
    },
  },
});
