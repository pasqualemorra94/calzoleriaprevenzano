/**
 * POST /api/admin/ai/tryon — Generate virtual try-on image
 *
 * Accepts JSON body: {
 *   personImage: string (base64, data URI or URL),
 *   productSlug: string,
 *   sessionId?: string (optional — saves result to session),
 *   imageUrl?: string (override product image),
 *   selectedVariants?: Array<{ groupId, groupLabel, optionId, optionLabel, optionColor?, optionImageUrl? }>
 * }
 *
 * When selectedVariants are provided:
 *  - Variant swatch images are resolved to base64 for reference
 *  - An intelligent prompt is built that describes how to apply the selected
 *    color/material/heel to the sandal
 *
 * Returns: { id, imageUrl, status, cost, sessionId }
 *
 * Admin only — used on in-store tablet for AI Foot Advisor.
 * If sessionId is provided, saves the try-on result to the session.
 * Logs AI cost (credits + estimated USD) and wall-clock timing.
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { generateTryOn } from "~/lib/fashn.server";
import { getProductImageForTryOn, buildTryOnPrompt, resolveImageToBase64 } from "~/lib/ai-advisor.server";
import type { SelectedVariant } from "~/lib/ai-advisor.server";
import { updateSessionTryOn } from "~/lib/ai-sessions.server";
import { createLogger } from "~/lib/logger.server";
import { z } from "zod";

const log = createLogger("ai-tryon");

const selectedVariantSchema = z.object({
  groupId: z.string(),
  groupLabel: z.string(),
  optionId: z.string(),
  optionLabel: z.string(),
  optionColor: z.string().optional(),
  optionImageUrl: z.string().optional(),
});

const tryOnSchema = z.object({
  personImage: z.string().min(50, "Immagine piede non valida"),
  productSlug: z.string().min(1, "Slug prodotto richiesto"),
  sessionId: z.string().min(1).optional(),
  imageUrl: z.string().url().optional(),
  selectedVariants: z.array(selectedVariantSchema).optional(),
});

// Approximate USD per credits for fal.ai FASHN model
const USD_PER_CREDIT = 0.005;

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

        const {
          personImage: rawPersonImage,
          productSlug,
          sessionId,
          imageUrl: overrideImageUrl,
          selectedVariants,
        } = parsed.data;

        // ── Resolve person image (base64 or URL) ──
        // Must be either a public URL (https://...) or a full data URI (data:image/...;base64,...)
        const personImage = rawPersonImage;

        // ── Resolve garment image (product photo) ──
        // getProductImageForTryOn returns either a public URL or a base64 data URI
        // (local images are converted to base64 so Fashn can use them even from localhost)
        const garmentImage = overrideImageUrl ?? await getProductImageForTryOn(productSlug);

        if (!garmentImage) {
          return apiError("NOT_FOUND", "Nessuna immagine trovata per il prodotto selezionato", 404);
        }

        // ── Resolve variant swatch images to base64 ──
        // TODO: In production, variant images should be served from a public CDN.
        // The base64 conversion is a workaround for local development.
        const resolvedVariants: SelectedVariant[] = [];
        if (selectedVariants && selectedVariants.length > 0) {
          for (const v of selectedVariants) {
            const resolved: SelectedVariant = { ...v };
            if (v.optionImageUrl) {
              const base64 = await resolveImageToBase64(v.optionImageUrl);
              // Store resolved image on the variant for potential future use
              // Currently Fashn API only accepts one garment image,
              // so we use the metadata in the prompt instead
              if (base64) {
                log.info("Variant swatch resolved to base64", {
                  group: v.groupLabel,
                  option: v.optionLabel,
                  originalUrl: v.optionImageUrl,
                  resolvedType: base64.startsWith("data:") ? "base64" : "url",
                });
              }
            }
            resolvedVariants.push(resolved);
          }
        }

        // ── Debug log image formats ──
        log.info("Try-on images resolved", {
          productSlug,
          personImagePrefix: personImage.slice(0, 80),
          personImageLength: personImage.length,
          personImageType: personImage.startsWith("data:") ? "base64-data-uri" : personImage.startsWith("http") ? "url" : "unknown-format",
          garmentImagePrefix: garmentImage.slice(0, 80),
          variantCount: resolvedVariants.length,
          variantLabels: resolvedVariants.map((v) => `${v.groupLabel}=${v.optionLabel}`),
        });

        // ── Validate person image format ──
        if (!personImage.startsWith("data:image/") && !personImage.startsWith("http")) {
          log.error("Invalid personImage format", {
            prefix: personImage.slice(0, 100),
            length: personImage.length,
          });
          return apiError("VALIDATION_ERROR", "Formato immagine piede non valido. Richiesto data:image/... o URL https://...", 422);
        }

        // ── Generate try-on ──
        try {
          // Build an intelligent prompt from product AI metadata + selected variants
          const prompt = await buildTryOnPrompt(
            productSlug,
            resolvedVariants.length > 0 ? resolvedVariants : undefined,
          );

          const result = await generateTryOn({
            personImage,
            garmentImage,
            prompt,
            resolution: "1k",
            generationMode: "balanced",
          });

          const totalDurationMs = Date.now() - startTime;
          const estimatedUsd = result.creditsUsed
            ? Number((result.creditsUsed * USD_PER_CREDIT).toFixed(4))
            : null;

          // ── Save to session if provided ──
          if (sessionId) {
            try {
              await updateSessionTryOn({
                id: sessionId,
                imageUrl: result.imageUrl,
                productId: productSlug,
                creditsUsed: result.creditsUsed ?? undefined,
                costUsd: estimatedUsd ?? undefined,
              });
            } catch (err) {
              log.warn("Failed to save try-on to session", {
                sessionId,
                error: err instanceof Error ? err.message : "unknown",
              });
            }
          }

          // ── Cost log ──
          log.info("AI cost — try-on complete", {
            provider: result.provider,
            generationId: result.id,
            productSlug,
            sessionId: sessionId ?? "none",
            creditsUsed: result.creditsUsed ?? "N/A",
            estimatedUsd: estimatedUsd ?? "N/A",
            generationDurationMs: result.durationMs ?? "N/A",
            totalDurationMs,
            variantsApplied: resolvedVariants.length > 0
              ? resolvedVariants.map((v) => `${v.groupLabel}=${v.optionLabel}`)
              : "none",
          });

          return apiSuccess({
            id: result.id,
            imageUrl: result.imageUrl,
            status: result.status,
            sessionId: sessionId ?? null,
            cost: {
              creditsUsed: result.creditsUsed ?? null,
              durationMs: result.durationMs ?? null,
              estimatedUsd,
              provider: result.provider,
            },
          });
        } catch (err) {
          const durationMs = Date.now() - startTime;
          const message = err instanceof Error ? err.message : "Errore durante la generazione del try-on";
          log.error("AI cost — try-on FAILED", { productSlug, sessionId: sessionId ?? "none", durationMs, error: message });
          return apiError("AI_ERROR", message, 500);
        }
      },
    },
  },
});
