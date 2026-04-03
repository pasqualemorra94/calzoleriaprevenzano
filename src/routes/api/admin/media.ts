/**
 * GET /api/admin/media — List media files (admin only)
 *
 * Query params: page, perPage, query, type (image|all), folder, sort (newest|oldest|name|size)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { listMedia, getMediaStats } from "~/lib/media.server";
import { listMediaSchema } from "~/lib/validators/media";

export const Route = createFileRoute("/api/admin/media")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // ── Auth check ──
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        // ── Parse query params ──
        const url = new URL(request.url);
        const parsed = listMediaSchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Parametri non validi", 422);
        }

        // ── Fetch data ──
        const [items, stats] = await Promise.all([
          listMedia(parsed.data),
          getMediaStats(),
        ]);

        return apiSuccess({ ...items, stats });
      },
    },
  },
});
