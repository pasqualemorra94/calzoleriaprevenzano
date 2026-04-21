/**
 * POST /api/admin/ai/analyze-foot — Analyze foot image + recommend sandals
 *
 * Accepts JSON body: { image: string (base64, data URI or raw) }
 * Returns: { footProfile, suggestions, cost }
 *
 * Admin only — used on in-store tablet for AI Foot Advisor.
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { analyzeFootImage } from "~/lib/ai.server";
import { matchFootToProducts } from "~/lib/ai-advisor.server";
import { z } from "zod";

const analyzeFootSchema = z.object({
  image: z.string().min(100, "Immagine troppo piccola o non valida"),
});

export const Route = createFileRoute("/api/admin/ai/analyze-foot")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // ── Auth check ──
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        // ── Validate input ──
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return apiError("INVALID_REQUEST", "Richiesta non valida", 400);
        }

        const parsed = analyzeFootSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Immagine non valida", 422, parsed.error.issues.map((i) => ({
            field: String(i.path.join(".")),
            message: i.message,
          })));
        }

        // ── Extract base64 and MIME type ──
        const rawImage = parsed.data.image;
        let base64: string;
        let mimeType = "image/jpeg";

        if (rawImage.startsWith("data:")) {
          const matches = rawImage.match(/^data:(image\/\w+);base64,(.+)$/);
          if (!matches?.[1] || !matches?.[2]) {
            return apiError("VALIDATION_ERROR", "Formato immagine non valido", 422);
          }
          mimeType = matches[1];
          base64 = matches[2];
        } else {
          base64 = rawImage;
        }

        // ── Limit image size (~10MB base64 ≈ 7.5MB raw) ──
        if (base64.length > 15_000_000) {
          return apiError("VALIDATION_ERROR", "Immagine troppo grande (max 10MB)", 422);
        }

        // ── Analyze foot ──
        try {
          const footProfile = await analyzeFootImage(base64, mimeType);

          // ── Match against catalog ──
          const suggestions = await matchFootToProducts(footProfile);

          return apiSuccess({
            footProfile,
            suggestions,
            totalAnalyzed: suggestions.length,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Errore durante l'analisi del piede";
          return apiError("AI_ERROR", message, 500);
        }
      },
    },
  },
});
