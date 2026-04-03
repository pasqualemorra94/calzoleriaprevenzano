/**
 * POST /api/upload — Upload file(s) to media library (admin only)
 *
 * Accepts multipart/form-data with:
 *   - files: File[] (multiple files)
 *   - folder: string (optional virtual folder name)
 *
 * Returns: created MediaListItem[] for each uploaded file.
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { uploadMedia } from "~/lib/media.server";

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // ── Auth check ──
        let adminUser: { id: string };
        try {
          adminUser = await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        // ── Parse multipart form ──
        let formData: FormData;
        try {
          formData = await request.formData();
        } catch {
          return apiError("INVALID_REQUEST", "Richiesta non valida", 400);
        }

        // ── Extract folder (optional) ──
        const folder = formData.get("folder") as string | null ?? "";

        // ── Extract files ──
        const fileEntries = formData.getAll("files");
        if (fileEntries.length === 0) {
          return apiError("VALIDATION_ERROR", "Nessun file fornito", 422);
        }

        const files = fileEntries.filter(
          (entry): entry is File => entry instanceof File && entry.size > 0,
        );

        if (files.length === 0) {
          return apiError("VALIDATION_ERROR", "Nessun file valido fornito", 422);
        }

        // ── Limit batch uploads to prevent abuse ──
        const MAX_BATCH = 20;
        if (files.length > MAX_BATCH) {
          return apiError(
            "VALIDATION_ERROR",
            `Massimo ${MAX_BATCH} file per upload. Ne hai selezionati ${files.length}.`,
            422,
          );
        }

        // ── Upload each file ──
        const results: Array<{ media: unknown; error?: string }> = [];
        const errors: string[] = [];

        for (const file of files) {
          try {
            const media = await uploadMedia(file, adminUser.id, folder);
            results.push({ media });
          } catch (err) {
            const message = err instanceof Error ? err.message : "Errore durante l'upload";
            errors.push(`${file.name}: ${message}`);
            results.push({ media: null, error: message });
          }
        }

        // ── Response ──
        if (results.every((r) => r.error)) {
          // All uploads failed
          return apiError("UPLOAD_ERROR", errors[0], 400);
        }

        const uploaded = results
          .filter((r): r is { media: NonNullable<typeof r.media> } => r.media !== null)
          .map((r) => r.media);

        return apiSuccess({
          uploaded,
          errors: errors.length > 0 ? errors : undefined,
          total: files.length,
          succeeded: uploaded.length,
          failed: errors.length,
        });
      },
    },
  },
});
