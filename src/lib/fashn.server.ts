/**
 * Fashn.ai Client — server-only
 *
 * Virtual try-on API wrapper for Fashn.ai.
 * Supports both direct Fashn.ai API and fal.ai (same FASHN v1.6 model).
 * Switch between them via FASHN_API_BASE env var.
 *
 * Endpoints:
 *  - tryOn(personImage, garmentImage) → composite image + cost info
 *  - getCreditsBalance() → current credit balance
 *
 * Cost tracking:
 *  - Every operation logs credits_used (fal.ai) or credits (Fashn) to server logger
 *  - TryOnResult includes creditsUsed when available
 */

import { createLogger } from "~/lib/logger.server";

const log = createLogger("fashn");

// ─── Config ─────────────────────────────────────────────────────────────

function getConfig() {
  const key = process.env.FASHN_API_KEY;
  if (!key) {
    throw new Error("FASHN_API_KEY non configurata. Aggiungila al file .env");
  }

  // fal.ai and Fashn.ai share the same FASHN model but have different API base URLs.
  // fal.ai: https://queue.fal.run/fashn-ai/hygelac
  // Fashn.ai direct: https://api.fashn.ai/v1
  const apiBase = process.env.FASHN_API_BASE ?? "https://api.fashn.ai/v1";

  return { key, apiBase };
}

// ─── Types ─────────────────────────────────────────────────────────────

export interface TryOnRequest {
  /** URL or base64 (data:image/...) of the person/foot image */
  personImage: string;
  /** URL or base64 (data:image/...) of the sandal/garment image */
  garmentImage: string;
  /** Optional: category hint (default: "shoes") */
  category?: "shoes" | "clothing";
  /** Optional: resolution (default: "1k" — max 2000px, cheaper) */
  resolution?: "1k" | "2k" | "4k";
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
  /** Provider used: "fal" or "fashn" */
  provider: "fal" | "fashn";
}

interface FashnErrorResponse {
  error: string;
  message?: string;
  code?: string;
}

// ─── Pricing reference (approximate USD per resolution) ────────────────

const PRICING_USD: Record<string, number> = {
  "1k": 0.025,
  "2k": 0.05,
  "4k": 0.10,
};

// ─── Retry ─────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Public API ────────────────────────────────────────────────────────

/**
 * Generate a virtual try-on image.
 * Sends person image + garment image → returns composite image URL + cost.
 *
 * For Fashn.ai direct API: synchronous (returns image URL in response).
 * For fal.ai: may need polling (returns ID → poll for result).
 *
 * @param request - TryOnRequest with person and garment images
 */
export async function generateTryOn(request: TryOnRequest): Promise<TryOnResult> {
  const { key, apiBase } = getConfig();
  const { personImage, garmentImage, category = "shoes", resolution = "1k" } = request;
  const startTime = Date.now();

  const isFal = apiBase.includes("fal.run");
  log.info("Try-on requested", { provider: isFal ? "fal.ai" : "fashn.ai", category, resolution });

  let result: TryOnResult;

  if (isFal) {
    result = await generateTryOnFal(key, apiBase, personImage, garmentImage, category, resolution);
  } else {
    result = await generateTryOnFashn(key, apiBase, personImage, garmentImage, category, resolution);
  }

  const durationMs = Date.now() - startTime;

  // ── Cost summary log ──
  const estimatedUsd = PRICING_USD[resolution] ?? PRICING_USD["1k"];
  log.info("AI cost — try-on", {
    provider: result.provider,
    generationId: result.id,
    creditsUsed: result.creditsUsed ?? "N/A",
    resolution,
    durationMs,
    estimatedUsd,
  });

  return { ...result, durationMs };
}

/**
 * Fashn.ai direct API — POST /tryon
 * Uses Fashn REST API v1 with Bearer auth.
 */
async function generateTryOnFashn(
  key: string,
  apiBase: string,
  personImage: string,
  garmentImage: string,
  category: string,
  resolution: string,
): Promise<TryOnResult> {
  const response = await fetch(`${apiBase}/tryon`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model_image: garmentImage,
      person_image: personImage,
      category,
      resolution,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as FashnErrorResponse;
    log.error("Fashn API error", { status: response.status, error: errorData });
    throw new Error(`Fashn API error (${response.status}): ${errorData.message ?? errorData.error}`);
  }

  const data = await response.json() as {
    id: string;
    status: string;
    credits?: number;
    result?: { images?: Array<{ url: string }> };
  };

  // Fashn may return immediately or require polling
  if (data.status === "completed" && data.result?.images?.[0]) {
    log.info("Try-on generated (sync)", { id: data.id, credits: data.credits });
    return {
      id: data.id,
      status: "completed",
      imageUrl: data.result.images[0].url,
      creditsUsed: data.credits,
      provider: "fashn",
    };
  }

  // Poll for result (async generation)
  return pollFashnResult(key, apiBase, data.id);
}

/**
 * Poll Fashn API for async generation result.
 * Max 30 seconds polling with 2s intervals.
 */
async function pollFashnResult(
  key: string,
  apiBase: string,
  id: string,
  maxAttempts = 15,
  intervalMs = 2000,
): Promise<TryOnResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(intervalMs);

    const response = await fetch(`${apiBase}/tryon/${id}`, {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!response.ok) {
      log.warn(`Poll attempt ${attempt + 1} failed`, { id, status: response.status });
      continue;
    }

    const data = await response.json() as {
      id: string;
      status: string;
      credits?: number;
      result?: { images?: Array<{ url: string }> };
    };

    if (data.status === "completed" && data.result?.images?.[0]) {
      log.info("Try-on generated (polled)", { id, attempts: attempt + 1, credits: data.credits });
      return {
        id,
        status: "completed",
        imageUrl: data.result.images[0].url,
        creditsUsed: data.credits,
        provider: "fashn",
      };
    }

    if (data.status === "failed") {
      log.error("Try-on generation failed", { id });
      throw new Error(`Try-on generation failed for ${id}`);
    }
  }

  throw new Error(`Try-on generation timed out after ${maxAttempts * intervalMs / 1000}s for ${id}`);
}

/**
 * fal.ai API — POST via fal queue endpoint.
 * fal.ai uses a different API structure with queue.submit + queue.result.
 */
async function generateTryOnFal(
  key: string,
  apiBase: string,
  personImage: string,
  garmentImage: string,
  category: string,
  _resolution: string,
): Promise<TryOnResult> {
  // Submit to fal queue
  const submitResponse = await fetch(`${apiBase}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${key}`,
    },
    body: JSON.stringify({
      person_image: personImage,
      garment_image: garmentImage,
      category,
    }),
  });

  if (!submitResponse.ok) {
    const errorText = await submitResponse.text();
    log.error("fal.ai submit error", { status: submitResponse.status, error: errorText });
    throw new Error(`fal.ai submit error (${submitResponse.status}): ${errorText}`);
  }

  const submitData = await submitResponse.json() as {
    request_id: string;
    status: string;
    credits_used?: number;
  };

  // Poll for result
  const requestId = submitData.request_id;
  const resultUrl = apiBase.replace(/\/queue\/[^/]+$/, `/queue/result/${requestId}`);

  for (let attempt = 0; attempt < 15; attempt++) {
    await sleep(2000);

    const resultResponse = await fetch(resultUrl, {
      headers: { Authorization: `Key ${key}` },
    });

    if (!resultResponse.ok) {
      log.warn(`fal.ai poll attempt ${attempt + 1} failed`, { requestId, status: resultResponse.status });
      continue;
    }

    const resultData = await resultResponse.json() as {
      status: string;
      images?: Array<{ url: string }>;
      credits_used?: number;
    };

    if (resultData.status === "COMPLETED" && resultData.images?.[0]) {
      log.info("Try-on generated via fal.ai", {
        requestId,
        attempts: attempt + 1,
        creditsUsed: resultData.credits_used,
      });
      return {
        id: requestId,
        status: "completed",
        imageUrl: resultData.images[0].url,
        creditsUsed: resultData.credits_used ?? submitData.credits_used,
        provider: "fal",
      };
    }

    if (resultData.status === "FAILED") {
      log.error("fal.ai generation failed", { requestId });
      throw new Error(`fal.ai generation failed for ${requestId}`);
    }
  }

  throw new Error(`fal.ai generation timed out for ${requestId}`);
}

/**
 * Check Fashn API credits balance.
 */
export async function getCreditsBalance(): Promise<{ credits: number; currency: string }> {
  const { key, apiBase } = getConfig();

  if (apiBase.includes("fal.run")) {
    // fal.ai doesn't have a simple balance endpoint
    return { credits: -1, currency: "fal-credits" };
  }

  const response = await fetch(`${apiBase}/credits`, {
    headers: { Authorization: `Bearer ${key}` },
  });

  if (!response.ok) {
    log.warn("Failed to fetch credits balance", { status: response.status });
    return { credits: -1, currency: "unknown" };
  }

  const data = await response.json() as { credits: number };
  return { credits: data.credits, currency: "FASHN-credits" };
}
