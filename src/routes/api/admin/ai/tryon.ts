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
import { getProductImageForTryOn, buildTryOnPrompt, resolveImageToBase64, compositeProductWithSwatches, resizeAndCompress, uploadToTempHost } from "~/lib/ai-advisor.server";
import type { SelectedVariant } from "~/lib/ai-advisor.server";
import { appendTryOnToSession } from "~/lib/ai-sessions.server";
import type { TryOnHistoryEntry } from "~/lib/ai-sessions.server";
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
        let garmentImage = overrideImageUrl ?? await getProductImageForTryOn(productSlug);

        if (!garmentImage) {
          return apiError("NOT_FOUND", "Nessuna immagine trovata per il prodotto selezionato", 404);
        }

        // ── Resolve variant swatch images and composite them into the garment image ──
        // Fashn API only accepts ONE product_image. When the user selects color/material
        // variants, we composite the sandal photo with the swatch patches side by side.
        // The prompt then tells Fashn to use the color from the visible swatches.
        //
        // TODO: In production, variant images should be served from a public CDN.
        // The base64 conversion is a workaround for local development.
        const resolvedVariants: SelectedVariant[] = [];
        const swatchImagesForComposite: Array<{ label: string; base64: string }> = [];

        if (selectedVariants && selectedVariants.length > 0) {
          for (const v of selectedVariants) {
            const resolved: SelectedVariant = { ...v };
            if (v.optionImageUrl) {
              const base64 = await resolveImageToBase64(v.optionImageUrl);
              if (base64) {
                log.info("Variant swatch resolved", {
                  group: v.groupLabel,
                  option: v.optionLabel,
                  resolvedType: base64.startsWith("data:") ? "base64" : "url",
                });

                // Only composite visual swatches (color/material groups), not heel/size
                const lower = `${v.groupLabel} ${v.groupId}`.toLowerCase();
                const isVisual = !lower.includes("taglia") && !lower.includes("size")
                  && !lower.includes("tacco") && !lower.includes("heel");
                if (isVisual && base64.startsWith("data:")) {
                  swatchImagesForComposite.push({ label: `${v.groupLabel}: ${v.optionLabel}`, base64 });
                }

                resolved.optionImageUrl = base64;
              }
            }
            resolvedVariants.push(resolved);
          }
        }

        // Composite product image + swatches into a single image for Fashn
        let hasSwatchImages = false;
        if (swatchImagesForComposite.length > 0 && garmentImage.startsWith("data:")) {
          garmentImage = await compositeProductWithSwatches(garmentImage, swatchImagesForComposite);
          hasSwatchImages = true;
          log.info("Garment image composited with swatches", {
            swatchCount: swatchImagesForComposite.length,
            swatchLabels: swatchImagesForComposite.map((s) => s.label),
          });
        }

        // ── Resize & compress images to save credits ──
        // External APIs charge by image tokens (proportional to pixel count).
        // Reducing to 1024px max + JPEG 85% can save 5-10x in size and credits.
        if (personImage.startsWith("data:")) {
          const resized = await resizeAndCompress(personImage);
          if (typeof resized === "string") personImage = resized;
        }
        if (garmentImage.startsWith("data:")) {
          const resized = await resizeAndCompress(garmentImage);
          if (typeof resized === "string") garmentImage = resized;
        }

        // ── Upload to temp host if IMGBB_API_KEY is set (localhost convenience) ──
        // In production, images should be served from a CDN.
        // For local dev, imgbb provides temporary public URLs so we don't
        // need to send huge base64 payloads to the API.
        if (personImage.startsWith("data:")) {
          personImage = await uploadToTempHost(personImage);
        }
        if (garmentImage.startsWith("data:")) {
          garmentImage = await uploadToTempHost(garmentImage);
        }

        // ── Debug log image formats ──
        log.info("Try-on images prepared", {
          productSlug,
          personImageType: personImage.startsWith("data:") ? "base64" : personImage.startsWith("http") ? "url" : "unknown",
          personImageLength: personImage.length,
          garmentImageType: garmentImage.startsWith("data:") ? "base64" : garmentImage.startsWith("http") ? "url" : "unknown",
          garmentImageLength: garmentImage.length,
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
            hasSwatchImages,
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

          // ── Save to session if provided (APPEND to history, don't overwrite) ──
          let tryonHistory: TryOnHistoryEntry[] = [];
          if (sessionId) {
            try {
              // Look up product name from catalog for the history entry
              const { getAdvisorCatalog } = await import("~/lib/ai-advisor.server");
              const catalog = await getAdvisorCatalog();
              const productInfo = catalog.find((p) => p.slug === productSlug);

              tryonHistory = await appendTryOnToSession({
                id: sessionId,
                imageUrl: result.imageUrl,
                productId: productSlug,
                productName: productInfo?.name ?? productSlug,
                creditsUsed: result.creditsUsed ?? undefined,
                costUsd: estimatedUsd ?? undefined,
                selectedVariants: resolvedVariants.length > 0
                  ? resolvedVariants.map((v) => ({
                      groupLabel: v.groupLabel,
                      optionLabel: v.optionLabel,
                      optionColor: v.optionColor,
                      optionImageUrl: v.optionImageUrl,
                    }))
                  : undefined,
              });
            } catch (err) {
              log.warn("Failed to save try-on to session history", {
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
            tryonHistory: tryonHistory.length > 0 ? tryonHistory : undefined,
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
