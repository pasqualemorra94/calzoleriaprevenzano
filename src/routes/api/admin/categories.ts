/**
 * GET /api/admin/categories — List all categories including inactive (admin)
 * POST /api/admin/categories — Create category (admin)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import {
  getAdminCategories,
  adminCreateCategory,
} from "~/lib/admin.server";
import { createCategorySchema } from "~/lib/validators/admin";

export const Route = createFileRoute("/api/admin/categories")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const categories = await getAdminCategories();
        return apiSuccess(categories);
      },

      POST: async ({ request }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const body = (await request.json()) as unknown;
        const parsed = createCategorySchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        const category = await adminCreateCategory(parsed.data);
        return apiSuccess(category, 201);
      },
    },
  },
});
