/**
 * GET   /api/admin/return-requests/$id — Get return request detail (admin)
 * PATCH /api/admin/return-requests/$id — Update status + adminNotes (admin)
 *
 * Side-effect PATCH: AuditLog event "return_request_status_changed" con metadata
 * { id, oldStatus, newStatus, adminNotes } — best-effort try/catch (non blocca update).
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { prisma } from "~/lib/db.server";
import {
  getReturnRequest,
  updateReturnRequest,
} from "~/lib/admin/admin-returns.server";
import { updateReturnRequestSchema } from "~/lib/validators/admin";
import { createLogger } from "~/lib/logger.server";
import { getClientIp } from "~/lib/rate-limit.server";

const log = createLogger("admin-return-requests");

export const Route = createFileRoute("/api/admin/return-requests/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const rr = await getReturnRequest(params.id);
        if (!rr) {
          return apiError("NOT_FOUND", "Richiesta non trovata", 404);
        }
        return apiSuccess(rr);
      },

      PATCH: async ({ request, params }) => {
        let admin: { id: string };
        try {
          admin = await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const body = (await request.json().catch(() => null)) as unknown;
        const parsed = updateReturnRequestSchema.safeParse(body);
        if (!parsed.success) {
          return apiError(
            "VALIDATION_ERROR",
            parsed.error.issues[0]?.message ?? "Dati non validi",
            422,
          );
        }

        let result;
        try {
          result = await updateReturnRequest(params.id, parsed.data);
        } catch (e: unknown) {
          if (e instanceof Error && e.message === "ReturnRequest not found") {
            return apiError("NOT_FOUND", "Richiesta non trovata", 404);
          }
          log.error("updateReturnRequest failed", {
            error: e instanceof Error ? e.message : "unknown",
            id: params.id,
          });
          return apiError(
            "INTERNAL_ERROR",
            "Errore durante l'aggiornamento",
            500,
          );
        }

        // ── AuditLog best-effort (non blocca update) ──
        try {
          await prisma.auditLog.create({
            data: {
              userId: admin.id,
              event: "return_request_status_changed",
              ip: getClientIp(request),
              userAgent: request.headers.get("user-agent"),
              metadata: {
                id: result.id,
                oldStatus: result.oldStatus,
                newStatus: result.status,
                adminNotes: parsed.data.adminNotes,
              },
            },
          });
        } catch (e: unknown) {
          log.warn("AuditLog insert failed (non-blocking)", {
            error: e instanceof Error ? e.message : "unknown",
            id: result.id,
          });
        }

        return apiSuccess({ id: result.id, status: result.status });
      },
    },
  },
});
