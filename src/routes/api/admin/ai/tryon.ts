/**
 * POST /api/admin/ai/tryon — Generate virtual try-on image
 *
 * Accepts JSON body: {
 *   personImage: string (base64, data URI or URL),
 *   productSlug: string,
 *   imageUrl?: string (override product image)
 * }
 *
 * Returns: { id, imageUrl, status, cost }
 *
 * Admin only — used on in-store tablet for AI Foot Advisor.
 * Logs AI cost (credits + estimated USD) and wall-clock timing.
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { generateTryOn } from "~/lib/fashn.server";
import { getProductImageUrlForTryOn } from "~/lib/ai-advisor.server";
import { createLogger } from "~/lib/logger.server";
import { z } from "zod";

const log = createLogger("ai-tryon");

const tryOnSchema = z.object({
  personImage: z.string().min(50, "Immagine piede non valida"),
  productSlug: z.string().min(1, "Slug prodotto richiesto"),
  imageUrl: z.string().url().optional(),
});

export const Route = createFileRoute("/api/admin/ai/tryon")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const startTime = Date.now();

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

        const parsed = tryOnSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422, parsed.error.issues.map((i) => ({
            field: String(i.path.join(".")),
            message: i.message,
          })));
        }

        const { personImage: rawPersonImage, productSlug, imageUrl: overrideImageUrl } = parsed.data;

        // ── Resolve person image (base64 or URL) ──
        const personImage = rawPersonImage.startsWith("http")
          ? rawPersonImage
          : rawPersonImage;

        // ── Resolve garment image (product photo) ──
        const garmentImage = overrideImageUrl ?? await getProductImageUrlForTryOn(productSlug);

        if (!garmentImage) {
          return apiError("NOT_FOUND", "Nessuna immagine trovata per il prodotto selezionato", 404);
        }

        // ── Generate try-on ──
        try {
          const result = await generateTryOn({
            personImage,
            garmentImage,
            category: "shoes",
            resolution: "1k",
          });

          const totalDurationMs = Date.now() - startTime;

          // ── Cost log ──
          log.info("AI cost — try-on complete", {
            provider: result.provider,
            generationId: result.id,
            productSlug,
            creditsUsed: result.creditsUsed ?? "N/A",
            generationDurationMs: result.durationMs ?? "N/A",
            totalDurationMs,
          });

          return apiSuccess({
            id: result.id,
            imageUrl: result.imageUrl,
            status: result.status,
            cost: {
              creditsUsed: result.creditsUsed ?? null,
              durationMs: result.durationMs ?? null,
              provider: result.provider,
            },
          });
        } catch (err) {
          const durationMs = Date.now() - startTime;
          const message = err instanceof Error ? err.message : "Errore durante la generazione del try-on";
          log.error("AI cost — try-on FAILED", { productSlug, durationMs, error: message });
          return apiError("AI_ERROR", message, 500);
        }
      },
    },
  },
});
