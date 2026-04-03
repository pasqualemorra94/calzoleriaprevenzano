/**
 * GET /api/admin/variant-templates/$id — Get template (admin)
 * PUT /api/admin/variant-templates/$id — Update template (admin)
 * DELETE /api/admin/variant-templates/$id — Delete template (admin)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError, apiNoContent } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { getTemplate, updateTemplate, deleteTemplate } from "~/lib/variant-templates.server";
import { VariantConfigSchema } from "~/lib/types/variant-config";

export const Route = createFileRoute("/api/admin/variant-templates/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const template = await getTemplate(params.id);
        if (!template) {
          return apiError("NOT_FOUND", "Template non trovato", 404);
        }
        return apiSuccess(template);
      },

      PUT: async ({ request, params }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const body = (await request.json()) as Record<string, unknown>;

        // Validate config if provided
        if (body.config !== undefined) {
          const configResult = VariantConfigSchema.safeParse(body.config);
          if (!configResult.success) {
            return apiError("VALIDATION_ERROR", "Configurazione non valida", 422);
          }
          body.config = configResult.data as unknown as Record<string, unknown>;
        }

        const template = await updateTemplate(params.id, body);
        if (!template) {
          return apiError("NOT_FOUND", "Template non trovato", 404);
        }
        return apiSuccess(template);
      },

      DELETE: async ({ request, params }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const deleted = await deleteTemplate(params.id);
        if (!deleted) {
          return apiError("NOT_FOUND", "Template non trovato", 404);
        }
        return apiNoContent();
      },
    },
  },
});
