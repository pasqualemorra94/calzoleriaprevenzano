/**
 * AI Client — server-only
 *
 * OpenAI wrapper for foot analysis and image generation.
 * Pattern from lauritano-ai: gpt-4.1-mini, zodResponseFormat,
 * retry with exponential backoff, per-token cost tracking.
 *
 * Two capabilities:
 *  1. analyzeFootImage — Vision: classify foot shape from photo
 *  2. generateVariantImage — Image: generate product variant preview
 */

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { createLogger } from "~/lib/logger.server";

const log = createLogger("ai");

// ─── Config ─────────────────────────────────────────────────────────────

const AI_MODEL = "gpt-4.1-mini";

const PRICING = {
  [AI_MODEL]: {
    inputPerMtok: 0.4,
    outputPerMtok: 1.6,
    visionInputPerMtok: 1.6,
  },
} as const;

function getClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY non configurata. Aggiungila al file .env");
  }
  return new OpenAI({ apiKey: key });
}

// ─── Types ─────────────────────────────────────────────────────────────

export interface AIFootAnalysisResult {
  arch: "high" | "medium" | "low" | "flat";
  width: "narrow" | "normal" | "wide" | "extra-wide";
  shape: "greek" | "egyptian" | "roman" | "square" | "tapered";
  instep: "high" | "normal" | "low";
  toes: "long" | "average" | "short";
  recommendation: string;
  bestSandalFeatures: string[];
  avoidFeatures: string[];
  confidence: number;
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface AIVariantGenerationResult {
  imageUrl: string;
  revisedPrompt: string;
  costUsd: number;
  model: string;
}

// ─── Zod Schemas ───────────────────────────────────────────────────────

const footAnalysisSchema = z.object({
  arch: z.enum(["high", "medium", "low", "flat"]),
  width: z.enum(["narrow", "normal", "wide", "extra-wide"]),
  shape: z.enum(["greek", "egyptian", "roman", "square", "tapered"]),
  instep: z.enum(["high", "normal", "low"]),
  toes: z.enum(["long", "average", "short"]),
  recommendation: z.string().max(500),
  bestSandalFeatures: z.array(z.string()).max(10),
  avoidFeatures: z.array(z.string()).max(10),
  confidence: z.number().min(0).max(1),
});

// ─── Retry ─────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, context: string): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (error instanceof OpenAI.APIError) {
        const status = error.status;

        if (status === 401) {
          log.error("Autenticazione OpenAI fallita (401). Verifica OPENAI_API_KEY.");
          throw error;
        }

        if (status === 429) {
          if (attempt >= 3) {
            log.warn(`Rate limit persistente dopo 3 tentativi per ${context}`);
            throw error;
          }
          const delay = 2 ** attempt * 1000;
          log.warn(`Rate limit (429) per ${context}, retry tra ${delay}ms (${attempt + 1}/3)`);
          await sleep(delay);
          continue;
        }

        if (status !== undefined && status >= 500) {
          if (attempt >= 1) {
            log.warn(`Errore server (${status}) persistente per ${context}`);
            throw error;
          }
          log.warn(`Errore server (${status}) per ${context}, retry tra 2s`);
          await sleep(2000);
          continue;
        }
      }

      if (
        error instanceof Error &&
        (error.message.includes("fetch") ||
          error.message.includes("network") ||
          error.message.includes("timeout") ||
          error.message.includes("ECONNREFUSED"))
      ) {
        if (attempt >= 1) {
          log.warn(`Errore di rete persistente per ${context}: ${error.message}`);
          throw error;
        }
        log.warn(`Errore di rete per ${context}, retry tra 2s: ${error.message}`);
        await sleep(2000);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

// ─── Cost tracking ─────────────────────────────────────────────────────

function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  isVision: boolean,
): number {
  const pricing = PRICING[model as keyof typeof PRICING];
  if (!pricing) return 0;

  const inputCost = isVision
    ? (inputTokens / 1_000_000) * pricing.visionInputPerMtok
    : (inputTokens / 1_000_000) * pricing.inputPerMtok;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMtok;

  return inputCost + outputCost;
}

// ─── System Prompts ────────────────────────────────────────────────────

const FOOT_ANALYSIS_SYSTEM = `Sei un esperto calzolaio napoletano specializzato nell'analisi della forma del piede per consigliare sandali artigianali fatti a mano.

Il tuo compito è analizzare una foto di un piede e classificare:

1. **Arco plantare** (arch): high | medium | low | flat
   - high: arco visibilmente rialzato, spazio netto sotto il piede
   - medium: arco moderato, la forma naturale più comune
   - low: arco quasi piatto, poca curva
   - flat: piede piatto, nessun arco visibile

2. **Larghezza** (width): narrow | normal | wide | extra-wide
   - narrow: piede affilato, proporzionato
   - normal: proporzioni standard
   - wide: piede visibilmente largo, dita raggruppate
   - extra-wide: molto largo, quasi quadrato

3. **Forma generale** (shape): greek | egyptian | roman | square | tapered
   - greek: secondo dito più lungo dell'alluce
   - egyptian: alluce dominante, piede scendente
   - roman: tutti i dita simili, forma arrotondata
   - square: dita tutte simili, punta quadrata
   - tapered: piede che si restringe verso le dita

4. **Collo del piede** (instep): high | normal | low
   - high: collo alto, visibilmente rialzato
   - normal: proporzione standard
   - low: collo basso, quasi piatto

5. **Lunghezza dita** (toes): long | average | short

Restituisci anche:
- recommendation: consiglio in italiano (max 500 caratteri) su quali tipi di sandalo sono più adatti
- bestSandalFeatures: lista di caratteristiche del sandalo ideali (es. "cinturino alla caviglia", "suola morbida", "tacco basso")
- avoidFeatures: caratteristiche da evitare
- confidence: 0.0-1.0 sulla qualità della foto e affidabilità dell'analisi

Regole:
- Se la foto è sfocata, scattata da angolazione sbagliata, o il piede non è chiaramente visibile, usa confidence bassa (< 0.5) e segnalalo nella raccomandazione
- Preferisci false positivi su false negativi — se non sei sicuro, usa "normal"/"medium" come default
- Le raccomandazioni devono essere pratiche per sandali artigianali italiani`;

// ─── Public API ────────────────────────────────────────────────────────

/**
 * Analyze a foot image using GPT-4.1-mini vision.
 * Returns structured foot profile with sandal recommendations.
 *
 * @param base64Image - JPEG image as base64 string (no data URI prefix)
 * @param mimeType - Image MIME type (default: image/jpeg)
 */
export async function analyzeFootImage(
  base64Image: string,
  mimeType = "image/jpeg",
): Promise<AIFootAnalysisResult> {
  const client = getClient();

  const systemMessage: OpenAI.Chat.ChatCompletionMessageParam = {
    role: "system",
    content: FOOT_ANALYSIS_SYSTEM,
  };

  const userMessage: OpenAI.Chat.ChatCompletionUserMessageParam = {
    role: "user",
    content: [
      {
        type: "text",
        text: "Analizza questo piede e restituisci il profilo completo con le raccomandazioni per sandali artigianali.",
      },
      {
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64Image}`,
          detail: "high", // High detail for accurate foot shape analysis
        },
      },
    ],
  };

  const result = await withRetry(async () => {
    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [systemMessage, userMessage],
      response_format: zodResponseFormat(footAnalysisSchema, "foot_analysis"),
    });

    const content = response.choices[0]?.message.content;
    if (!content) {
      throw new Error(
        `Risposta vuota dall'AI. ${JSON.stringify(response.choices[0]?.message)}`,
      );
    }

    const parsed = footAnalysisSchema.parse(JSON.parse(content));

    return {
      parsed,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    };
  }, "analyzeFootImage");

  const costUsd = calculateCost(
    AI_MODEL,
    result.inputTokens,
    result.outputTokens,
    true, // vision
  );

  log.info("Foot analysis completed", {
    costUsd: costUsd.toFixed(6),
    tokens: { in: result.inputTokens, out: result.outputTokens },
  });

  return {
    arch: result.parsed.arch,
    width: result.parsed.width,
    shape: result.parsed.shape,
    instep: result.parsed.instep,
    toes: result.parsed.toes,
    recommendation: result.parsed.recommendation,
    bestSandalFeatures: result.parsed.bestSandalFeatures,
    avoidFeatures: result.parsed.avoidFeatures,
    confidence: result.parsed.confidence,
    costUsd,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    model: AI_MODEL,
  };
}

// ─── Product AI Metadata Type ──────────────────────────────────────────

/** aiMetadata stored in Product.aiMetadata JSON field */
export interface ProductAIMetadata {
  version: 1;
  closureType: string;
  heelHeight: string;
  archSupport: string;
  flexibility: string;
  strapStyle: string;
  toeCoverage: string;
  widthFit: string;
  footProfileBest: string[];
  footProfileAvoid: string[];
  taggedAt: string;
  taggedBy: string;
}
