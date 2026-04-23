/**
 * Fashn.ai Client — server-only
 *
 * Virtual try-on API wrapper for Fashn.ai.
 * Uses the FASHN universal API v1 (/v1/run + /v1/status/{id}).
 *
 * Model: tryon-max — supports shoes, hats, jewelry, bags, clothing.
 * Docs: https://docs.fashn.ai/api-reference/tryon-max
 *
 * Endpoints:
 *  - tryOn(personImage, garmentImage) → composite image + cost info
 *  - getCreditsBalance() → current credit balance
 *
 * Cost tracking:
 *  - Every operation logs credits used (from x-fashn-credits-used header) to server logger
 *  - TryOnResult includes creditsUsed when available
 */

import { createLogger } from "~/lib/logger.server";

const log = createLogger("fashn");

// ─── Config ─────────────────────────────────────────────────────────────

const FASHN_API_BASE = "https://api.fashn.ai";

function getConfig() {
  const key = process.env.FASHN_API_KEY;
  if (!key) {
    throw new Error("FASHN_API_KEY non configurata. Aggiungila al file .env");
  }

  return { key, apiBase: FASHN_API_BASE };
}

// ─── Types ─────────────────────────────────────────────────────────────

export interface TryOnRequest {
  /** URL or base64 (data:image/...) of the person/foot image */
  personImage: string;
  /** URL or base64 (data:image/...) of the sandal/garment image */
  garmentImage: string;
  /** Optional: prompt for custom styling (e.g. "remove scarf") */
  prompt?: string;
  /** Optional: resolution (default: "1k") */
  resolution?: "1k" | "2k" | "4k";
  /** Optional: generation mode (default: "balanced") */
  generationMode?: "balanced" | "quality";
}

export interface TryOnResult {
  /** URL of the generated try-on image */
  imageUrl: string;
  /** Generation ID for polling/status checks */
  id: string;
  /** Generation status */
  status: "completed" | "failed" | "pending";
  /** Credits consumed by this generation (if available from provider) */
  creditsUsed?: number;
  /** Wall-clock time in ms from submit to completed result */
  durationMs?: number;
  /** Provider used: "fashn" */
  provider: "fashn";
}

/** Shape of the initial /v1/run response */
interface FashnRunResponse {
  id: string;
  error: string | null;
}

/** Shape of the /v1/status/{id} response */
interface FashnStatusResponse {
  id: string;
  status: "starting" | "in_queue" | "processing" | "completed" | "failed";
  output?: string[];
  error: {
    name: string;
    message: string;
  } | null;
}

/** Shape of API-level error responses (non-200 from /v1/run) */
interface FashnApiError {
  error: string;
  message?: string;
  code?: string;
}

// ─── Pricing reference (credits per resolution × generation_mode) ──────
// balanced: 1k=2, 2k=3, 4k=4 credits
// quality:  1k=3, 2k=4, 4k=5 credits

const CREDITS_PER_OUTPUT: Record<string, Record<string, number>> = {
  balanced: { "1k": 2, "2k": 3, "4k": 4 },
  quality: { "1k": 3, "2k": 4, "4k": 5 },
};

// Approximate USD per credit (varies by plan, this is a rough estimate)
const USD_PER_CREDIT = 0.005;

// ─── Retry ─────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Public API ────────────────────────────────────────────────────────

/**
 * Generate a virtual try-on image using Fashn tryon-max model.
 *
 * Flow:
 *  1. POST /v1/run with model_name="tryon-max" → get prediction ID
 *  2. GET /v1/status/{id} → poll until completed (max 120s)
 *  3. Return output image URL
 *
 * @param request - TryOnRequest with person and garment images
 */
export async function generateTryOn(request: TryOnRequest): Promise<TryOnResult> {
  const { key, apiBase } = getConfig();
  const {
    personImage,
    garmentImage,
    prompt = "",
    resolution = "1k",
    generationMode = "balanced",
  } = request;
  const startTime = Date.now();

  log.info("Try-on requested", {
    provider: "fashn.ai",
    model: "tryon-max",
    resolution,
    generationMode,
    hasPrompt: prompt.length > 0,
  });

  // ── Step 1: Submit generation request ──
  const predictionId = await submitGeneration(key, apiBase, {
    personImage,
    garmentImage,
    prompt,
    resolution,
    generationMode,
  });

  // ── Step 2: Poll for result ──
  const result = await pollResult(key, apiBase, predictionId);

  const durationMs = Date.now() - startTime;
  const creditsUsed = result.creditsUsed ?? CREDITS_PER_OUTPUT[generationMode]?.[resolution];
  const estimatedUsd = creditsUsed != null ? creditsUsed * USD_PER_CREDIT : null;

  log.info("AI cost — try-on", {
    provider: "fashn.ai",
    model: "tryon-max",
    generationId: predictionId,
    creditsUsed,
    resolution,
    generationMode,
    durationMs,
    estimatedUsd: estimatedUsd != null ? Number(estimatedUsd.toFixed(4)) : null,
  });

  return {
    id: predictionId,
    status: result.status,
    imageUrl: result.imageUrl,
    creditsUsed,
    durationMs,
    provider: "fashn",
  };
}

// ─── Internal: Normalize image input ──────────────────────────────────

/**
 * Ensure image is in a format Fashn API accepts:
 *  - If it starts with "data:" → already a valid data URI, pass through
 *  - If it starts with "http" → already a valid URL, pass through
 *  - If it's a bare base64 string (no prefix) → prepend data:image/jpeg;base64,
 *
 * Fashn rejects bare base64 without the data URI prefix.
 */
function normalizeImageInput(image: string, fieldName: string): string {
  if (image.startsWith("data:") || image.startsWith("http")) {
    return image;
  }

  // Looks like bare base64 — add prefix
  log.warn(`Image for ${fieldName} looks like bare base64 without data: prefix, adding default JPEG prefix`);
  return `data:image/jpeg;base64,${image}`;
}

// ─── Internal: Submit generation ───────────────────────────────────────

async function submitGeneration(
  key: string,
  apiBase: string,
  params: {
    personImage: string;
    garmentImage: string;
    prompt: string;
    resolution: string;
    generationMode: string;
  },
): Promise<string> {
  const { personImage: rawPersonImage, garmentImage: rawGarmentImage, prompt, resolution, generationMode } = params;

  // ── Normalize images: bare base64 without data: prefix is rejected by Fashn ──
  const personImage = normalizeImageInput(rawPersonImage, "model_image");
  const garmentImage = normalizeImageInput(rawGarmentImage, "product_image");

  log.debug("Normalized images", {
    modelImagePrefix: personImage.slice(0, 60),
    modelImageLen: personImage.length,
    productImage: garmentImage,
  });

  const body: Record<string, unknown> = {
    model_name: "tryon-max",
    inputs: {
      model_image: personImage,
      product_image: garmentImage,
      resolution,
      generation_mode: generationMode,
    },
  };

  // Only include prompt if non-empty (optimization: smaller payload)
  if (prompt.length > 0) {
    (body.inputs as Record<string, unknown>).prompt = prompt;
  }

  const response = await fetch(`${apiBase}/v1/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as FashnApiError;
    log.error("Fashn API submit error", { status: response.status, error: errorData });
    throw new Error(
      `Fashn API error (${response.status}): ${errorData.message ?? errorData.error ?? "Unknown error"}`,
    );
  }

  const data = await response.json() as FashnRunResponse;

  if (data.error) {
    log.error("Fashn API returned error in body", { id: data.id, error: data.error });
    throw new Error(`Fashn API error: ${data.error}`);
  }

  if (!data.id) {
    log.error("Fashn API returned no prediction ID", { data });
    throw new Error("Fashn API: no prediction ID returned");
  }

  log.info("Try-on submitted", { id: data.id });
  return data.id;
}

// ─── Internal: Poll for result ─────────────────────────────────────────

/**
 * Poll Fashn /v1/status/{id} until completed, failed, or timeout.
 * tryon-max can take 20-120s depending on resolution + mode.
 * We use generous limits: 60 attempts × 3s = 180s max.
 */
async function pollResult(
  key: string,
  apiBase: string,
  id: string,
  maxAttempts = 60,
  intervalMs = 3000,
): Promise<Pick<TryOnResult, "status" | "imageUrl" | "creditsUsed">> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(intervalMs);

    const response = await fetch(`${apiBase}/v1/status/${id}`, {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!response.ok) {
      log.warn(`Poll attempt ${attempt + 1} failed`, { id, status: response.status });
      continue;
    }

    // Extract credits from response header if available
    const creditsHeader = response.headers.get("x-fashn-credits-used");
    const creditsUsed = creditsHeader != null ? parseInt(creditsHeader, 10) : undefined;

    const data = await response.json() as FashnStatusResponse;

    log.debug(`Poll attempt ${attempt + 1}`, {
      id,
      status: data.status,
      hasOutput: Array.isArray(data.output) && data.output.length > 0,
    });

    if (data.status === "completed" && data.output?.[0]) {
      log.info("Try-on generated", { id, attempts: attempt + 1, creditsUsed });
      return {
        status: "completed",
        imageUrl: data.output[0],
        creditsUsed,
      };
    }

    if (data.status === "failed") {
      const errorMsg = data.error
        ? `${data.error.name}: ${data.error.message}`
        : "Unknown failure";
      log.error("Try-on generation failed", { id, error: errorMsg });
      throw new Error(`Try-on generation failed for ${id}: ${errorMsg}`);
    }
  }

  throw new Error(
    `Try-on generation timed out after ${(maxAttempts * intervalMs) / 1000}s for ${id}`,
  );
}

// ─── Credits Balance ───────────────────────────────────────────────────

/**
 * Check Fashn API credits balance.
 * Endpoint: GET /v1/credits
 */
export async function getCreditsBalance(): Promise<{ credits: number; currency: string }> {
  const { key, apiBase } = getConfig();

  const response = await fetch(`${apiBase}/v1/credits`, {
    headers: { Authorization: `Bearer ${key}` },
  });

  if (!response.ok) {
    log.warn("Failed to fetch credits balance", { status: response.status });
    return { credits: -1, currency: "unknown" };
  }

  const data = await response.json() as { credits: number };
  return { credits: data.credits, currency: "FASHN-credits" };
}
