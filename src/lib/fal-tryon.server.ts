/**
 * fal.ai virtual try-on wrappers
 *
 * Two alternative providers to Fashn tryon-max:
 *  1. GPT Image 2 edit — accepts multiple reference images, precise editing
 *  2. Nano Banana Pro edit — Google Gemini 3 Pro, multi-image, 4K, ultra-fast
 *
 * Both run on fal.ai using the existing FAL_KEY subscription.
 */

import { fal } from "@fal-ai/client";
import { createLogger } from "~/lib/logger.server";

const log = createLogger("fal-tryon");

function getConfig() {
  const key = process.env.FAL_KEY;
  if (!key) {
    throw new Error("FAL_KEY non configurata. Aggiungila al file .env");
  }
  return { key };
}

// ─── Types ─────────────────────────────────────────────────────────────

export interface FalTryOnResult {
  id: string;
  imageUrl: string;
  status: "completed" | "failed";
  creditsUsed: number;
  durationMs: number;
  provider: "gpt-image-2";
}

// ─── GPT Image 2 Edit ─────────────────────────────────────────────────

const GPT2_MODEL = "openai/gpt-image-2/edit";

/**
 * Generate a virtual try-on using GPT Image 2 edit on fal.ai.
 *
 * Key advantage: accepts MULTIPLE reference images (image_urls: [...]).
 * We pass BOTH the foot photo AND the sandal photo so the model
 * can see both and composite them naturally.
 *
 * Cost: ~$0.04-0.08 per generation (vs $0.15 for Fashn)
 */
export async function generateTryOnGPT2(params: {
  personImage: string;
  garmentImage: string;
  prompt: string;
  /** Whether the garment image includes composited swatch patches (from variant selection) */
  hasSwatchImages?: boolean;
}): Promise<FalTryOnResult> {
  const { key } = getConfig();
  const { personImage, garmentImage, prompt, hasSwatchImages } = params;
  const startTime = Date.now();

  log.info("GPT Image 2 try-on requested", { model: GPT2_MODEL, hasSwatchImages });

  fal.config({ credentials: key });

  try {
    // ── Upload both images to fal storage ──
    const [personUrl, garmentUrl] = await Promise.all([
      personImage.startsWith("data:") ? uploadToFalStorage(personImage, "person") : Promise.resolve(personImage),
      garmentImage.startsWith("data:") ? uploadToFalStorage(garmentImage, "garment") : Promise.resolve(garmentImage),
    ]);

    log.info("Both images uploaded to fal storage", {
      personUrl: personUrl.slice(0, 80),
      garmentUrl: garmentUrl.slice(0, 80),
    });

    // ── Build the try-on prompt for GPT Image 2 ──
    const gpt2Prompt = buildGPT2Prompt(prompt, hasSwatchImages);

    log.debug("GPT Image 2 prompt", { prompt: gpt2Prompt });

    // ── Call GPT Image 2 edit — pass BOTH images as references ──
    const result = await fal.subscribe(GPT2_MODEL, {
      input: {
        prompt: gpt2Prompt,
        image_urls: [personUrl, garmentUrl],
        image_size: "auto",
        quality: "high",
        num_images: 1,
        output_format: "jpeg",
      },
    });

    const durationMs = Date.now() - startTime;

    const images = result.data?.images as Array<{ url: string; width: number; height: number }> | undefined;
    if (!images?.[0]?.url) {
      log.error("GPT Image 2 returned no image", {
        result: JSON.stringify(result.data).slice(0, 500),
      });
      throw new Error("GPT Image 2 non ha restituito un'immagine");
    }

    log.info("GPT Image 2 try-on generated", {
      id: result.requestId ?? "unknown",
      durationMs,
      imageSize: `${images[0].width}x${images[0].height}`,
    });

    return {
      id: result.requestId ?? `gpt2-${Date.now()}`,
      imageUrl: images[0].url,
      status: "completed",
      creditsUsed: 1,
      durationMs,
      provider: "gpt-image-2",
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : "Errore durante la generazione GPT Image 2";
    log.error("GPT Image 2 try-on FAILED", { durationMs, error: message });
    throw new Error(message);
  }
}

/**
 * Build a prompt optimized for GPT Image 2 virtual try-on.
 *
 * GPT Image 2 is very good at understanding multi-image references
 * and performing precise compositing/editing.
 *
 * @param userPrompt - The prompt from buildTryOnPrompt (includes variant instructions)
 * @param hasSwatchImages - Whether the garment image has composited swatch patches
 */
function buildGPT2Prompt(userPrompt: string, hasSwatchImages = false): string {
  const parts: string[] = [];

  // Core instruction — GPT Image 2 understands complex editing
  parts.push(
    "Edit the first image (the person/foot photo) to make them appear to be wearing the sandal shown in the second image.",
  );
  parts.push(
    "The sandal should fit naturally on the foot with correct perspective, proper strap placement, and matching shadows and lighting.",
  );

  // If swatches are composited into the second image, tell GPT2 about them
  if (hasSwatchImages) {
    parts.push(
      "The second image also shows color/material swatch samples on the right side — apply those exact colors and materials to the sandal straps.",
    );
  }

  // Add variant-specific instructions from the user prompt
  // DO NOT strip variant instructions — they are critical for correct compositing
  if (userPrompt && userPrompt.length > 0) {
    const cleaned = userPrompt
      .replace(/Wear the sandal on the foot\.?/gi, "")
      .trim();
    if (cleaned.length > 0) {
      parts.push(cleaned);
    }
  }

  parts.push("Photorealistic result. Keep the person's body and background unchanged. Only modify the foot area.");

  return parts.join(" ");
}

// ─── Shared Helpers ────────────────────────────────────────────────────

/**
 * Upload a data URI to fal.ai storage.
 */
async function uploadToFalStorage(dataUri: string, label: string): Promise<string> {
  try {
    const base64Match = dataUri.match(/^data:[^;]+;base64,(.+)$/);
    if (!base64Match) {
      log.warn(`Cannot extract base64 from ${label} image, using as-is`);
      return dataUri;
    }

    const buffer = Buffer.from(base64Match[1], "base64");
    const ext = dataUri.includes("image/png") ? "png" : "jpg";
    const fileName = `${label}-${Date.now()}.${ext}`;

    const file = new File([buffer], fileName, {
      type: dataUri.includes("image/png") ? "image/png" : "image/jpeg",
    });

    const url = await fal.storage.upload(file);

    log.info(`Uploaded ${label} to fal storage`, {
      url,
      sizeKb: Math.round(buffer.length / 1024),
    });

    return url;
  } catch (err) {
    log.warn(`Failed to upload ${label} to fal storage, using original`, {
      error: err instanceof Error ? err.message : "unknown",
    });
    return dataUri;
  }
}
