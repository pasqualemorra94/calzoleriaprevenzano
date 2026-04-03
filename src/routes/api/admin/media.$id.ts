/**
 * GET /api/admin/media/$id — Get single media detail (admin only)
 * PUT /api/admin/media/$id — Update media metadata (admin only)
 * DELETE /api/admin/media/$id — Delete media file + record (admin only)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError, apiNoContent } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { getMedia, updateMedia, deleteMedia } from "~/lib/media.server";
import { updateMediaSchema } from "~/lib/validators/media";

export const Route = createFileRoute("/api/admin/media/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        // ── Auth check ──
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const media = await getMedia(params.id);
        if (!media) {
          return apiError("NOT_FOUND", "Media non trovato", 404);
        }

        return apiSuccess(media);
      },

      PUT: async ({ request, params }) => {
        // ── Auth check ──
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        // ── Validate body ──
        const body = (await request.json()) as unknown;
        const parsed = updateMediaSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        try {
          const media = await updateMedia(params.id, parsed.data);
          return apiSuccess(media);
        } catch (err) {
          return apiError(
            "NOT_FOUND",
            err instanceof Error ? err.message : "Media non trovato",
            404,
          );
        }
      },

      DELETE: async ({ request, params }) => {
        // ── Auth check ──
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        try {
          await deleteMedia(params.id);
          return apiNoContent();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Errore durante l'eliminazione";
          return apiError("DELETE_ERROR", message, 400);
        }
      },
    },
  },
});
