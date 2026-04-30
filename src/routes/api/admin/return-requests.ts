/**
 * GET /api/admin/return-requests — List return requests (admin)
 *
 * Query params parsed via listReturnRequestsSchema (page/perPage/status/createdFrom/createdTo).
 * Auth via requireAdmin → 403 se non admin.
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { listReturnRequests } from "~/lib/admin/admin-returns.server";
import { listReturnRequestsSchema } from "~/lib/validators/admin";

export const Route = createFileRoute("/api/admin/return-requests")({
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

        const parsed = listReturnRequestsSchema.safeParse(rawParams);
        if (!parsed.success) {
          return apiError(
            "VALIDATION_ERROR",
            parsed.error.issues[0]?.message ?? "Parametri non validi",
            400,
          );
        }

        const result = await listReturnRequests(parsed.data);
        return apiSuccess(result);
      },
    },
  },
});
