/**
 * GET /api/admin/variant-templates — List all templates (admin)
 * POST /api/admin/variant-templates — Create template (admin)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { getTemplateList, createTemplate } from "~/lib/variant-templates.server";
import { VariantConfigSchema } from "~/lib/types/variant-config";

export const Route = createFileRoute("/api/admin/variant-templates")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const templates = await getTemplateList();
        return apiSuccess(templates);
      },

      POST: async ({ request }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const body = (await request.json()) as Record<string, unknown>;

        if (!body.name || typeof body.name !== "string" || body.name.trim().length < 1) {
          return apiError("VALIDATION_ERROR", "Il nome è obbligatorio", 422);
        }

        if (!body.slug || typeof body.slug !== "string") {
          return apiError("VALIDATION_ERROR", "Lo slug è obbligatorio", 422);
        }

        if (!body.config || typeof body.config !== "object") {
          return apiError("VALIDATION_ERROR", "La configurazione è obbligatoria", 422);
        }

        // Validate config structure
        const configResult = VariantConfigSchema.safeParse(body.config);
        if (!configResult.success) {
          return apiError("VALIDATION_ERROR", "Configurazione varianti non valida", 422);
        }

        const template = await createTemplate({
          name: body.name,
          slug: body.slug,
          description: typeof body.description === "string" ? body.description : undefined,
          config: configResult.data as unknown as Record<string, unknown>,
          sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : undefined,
        });

        return apiSuccess(template);
      },
    },
  },
});
