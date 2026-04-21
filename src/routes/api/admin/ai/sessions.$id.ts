/**
 * GET /api/admin/ai/sessions/$id — Get full session detail
 * PATCH /api/admin/ai/sessions/$id — Update session label
 * DELETE /api/admin/ai/sessions/$id — Delete session
 *
 * Admin only.
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { getSession, updateSessionLabel, deleteSession } from "~/lib/ai-sessions.server";
import { z } from "zod";

const updateLabelSchema = z.object({
  label: z.string().max(100).optional(),
});

export const Route = createFileRoute("/api/admin/ai/sessions/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const session = await getSession(params.id);
        if (!session) {
          return apiError("NOT_FOUND", "Sessione non trovata", 404);
        }

        return apiSuccess(session);
      },

      PATCH: async ({ request, params }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return apiError("INVALID_REQUEST", "Richiesta non valida", 400);
        }

        const parsed = updateLabelSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        if (!parsed.data.label) {
          return apiError("VALIDATION_ERROR", "Label richiesta", 422);
        }

        await updateSessionLabel(params.id, parsed.data.label);
        return apiSuccess({ updated: true });
      },

      DELETE: async ({ request, params }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const deleted = await deleteSession(params.id);
        if (!deleted) {
          return apiError("NOT_FOUND", "Sessione non trovata", 404);
        }

        return apiSuccess({ deleted: true });
      },
    },
  },
});
