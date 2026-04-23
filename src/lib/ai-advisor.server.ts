/**
 * AI Advisor Server — Business logic
 *
 * Handles product matching between foot profile and catalog,
 * and orchestrates the full analysis + recommendation flow.
 */

import { prisma } from "~/lib/db.server";
import type { AIFootAnalysisResult } from "~/lib/ai.server";
import type { ProductAIMetadata } from "~/lib/ai.server";
import { createLogger } from "~/lib/logger.server";

const log = createLogger("ai-advisor");

// ─── Types ─────────────────────────────────────────────────────────────

export interface ProductMatch {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  score: number;
  reasons: string[];
  metadata?: ProductAIMetadata | null;
}

export interface AnalysisResponse {
  footProfile: AIFootAnalysisResult;
  suggestions: ProductMatch[];
  totalAnalyzed: number;
}

/** Selected variant from the UI, passed to try-on for prompt building */
export interface SelectedVariant {
  groupId: string;
  groupLabel: string;
  optionId: string;
  optionLabel: string;
  optionColor?: string;
  optionImageUrl?: string;
}

// ─── Scoring ───────────────────────────────────────────────────────────

/**
 * Match foot profile against all products with aiMetadata.
 * Returns sorted list of best matches with score and reasons.
 */
export async function matchFootToProducts(
  footProfile: AIFootAnalysisResult,
  limit = 8,
): Promise<ProductMatch[]> {
  // Fetch all active sandals with aiMetadata
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      // @ts-expect-error — Prisma JsonValue null filter requires explicit cast
      aiMetadata: { not: null },
      // Only sandals — category slug contains "sandali" or subcategories
      category: {
        OR: [
          { slug: "sandali" },
          { parent: { slug: "sandali" } },
          { parent: { parent: { slug: "sandali" } } },
        ],
      },
    },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
    },
  }) as unknown as Array<{
    id: string;
    name: string;
    slug: string;
    price: { toNumber: () => number };
    aiMetadata: unknown;
    images: Array<{ url: string }>;
  }>;

  log.info("Matching foot to products", {
    footProfile: `${footProfile.arch}-${footProfile.width}-${footProfile.shape}`,
    productsFound: products.length,
  });

  // Build foot profile tags for matching
  const footTags = buildFootTags(footProfile);

  // Score each product
  const scored: ProductMatch[] = [];
  for (const product of products) {
    const metadata = product.aiMetadata as ProductAIMetadata | null;
    if (!metadata) continue;

    const { score, reasons } = calculateMatchScore(footTags, metadata, footProfile);
    const imageUrl = product.images[0]?.url ?? "";

    scored.push({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      imageUrl,
      score,
      reasons,
      metadata,
    });
  }

  // Sort by score desc, take top N
  return scored
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Build a set of tags from the foot profile for matching.
 */
function buildFootTags(profile: AIFootAnalysisResult): Set<string> {
  const tags = new Set<string>();

  // Arch
  tags.add(`${profile.arch}-arch`);

  // Width
  tags.add(`${profile.width}-width`);

  // Shape
  tags.add(`${profile.shape}-shape`);

  // Instep
  tags.add(`${profile.instep}-instep`);

  // Derived tags
  if (profile.arch === "flat" || profile.arch === "low") {
    tags.add("needs-arch-support");
  }
  if (profile.width === "wide" || profile.width === "extra-wide") {
    tags.add("needs-wide-fit");
  }
  if (profile.instep === "high") {
    tags.add("needs-adjustable");
  }

  return tags;
}

/**
 * Calculate match score between foot tags and product metadata.
 * Score: 0 (no match) to 100 (perfect match).
 */
function calculateMatchScore(
  footTags: Set<string>,
  metadata: ProductAIMetadata,
  footProfile: AIFootAnalysisResult,
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Check avoid list — penalize heavily
  const avoidLower = new Set(metadata.footProfileAvoid.map((t) => t.toLowerCase()));
  for (const tag of footTags) {
    if (avoidLower.has(tag.toLowerCase())) {
      score -= 30;
      reasons.push(`⚠️ Non ideale per il tuo tipo di piede`);
    }
  }

  // Check best list — add score
  const bestLower = new Set(metadata.footProfileBest.map((t) => t.toLowerCase()));
  let bestMatches = 0;
  for (const tag of footTags) {
    if (bestLower.has(tag.toLowerCase())) {
      score += 15;
      bestMatches++;
    }
  }

  if (bestMatches >= 2) {
    reasons.push(`✅ Progettato per il tuo tipo di piede`);
  }

  // Width compatibility
  const widthCompatibility: Record<string, Record<string, number>> = {
    narrow: { "narrow-fit": 10, standard: 5, "wide-fit": -10, adjustable: 8 },
    normal: { "narrow-fit": -5, standard: 10, "wide-fit": 0, adjustable: 10 },
    wide: { "narrow-fit": -20, standard: -5, "wide-fit": 15, adjustable: 12 },
    "extra-wide": { "narrow-fit": -25, standard: -10, "wide-fit": 20, adjustable: 15 },
  };
  const widthScore = widthCompatibility[footProfile.width]?.[metadata.widthFit] ?? 0;
  score += widthScore;
  if (widthScore >= 10) reasons.push("Larghezza adatta al tuo piede");

  // Arch support for flat/low arch
  if ((footProfile.arch === "flat" || footProfile.arch === "low") && metadata.archSupport === "firm") {
    score += 10;
    reasons.push("Buon supporto per l'arco plantare");
  }
  if (footProfile.arch === "high" && (metadata.archSupport === "minimal" || metadata.archSupport === "light")) {
    score += 5;
    reasons.push("Non troppo rigido per arco alto");
  }

  // Flexibility
  if (footProfile.arch === "flat" && metadata.flexibility === "flexible") {
    score += 5;
  }
  if (footProfile.instep === "high" && metadata.flexibility !== "rigid") {
    score += 5;
  }

  // Toe coverage for long toes
  if (footProfile.toes === "long" && metadata.toeCoverage === "closed-toe") {
    score += 5;
    reasons.push("Protezione per dita lunghe");
  }
  if (footProfile.toes === "short" && metadata.toeCoverage === "open-full") {
    score += 3;
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Generate generic reason if none
  if (reasons.length === 0 && score > 0) {
    reasons.push("Buona compatibilità generale");
  }

  return { score, reasons };
}

// ─── Catalog for Advisor ───────────────────────────────────────────────

export interface AdvisorProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  categoryName: string;
  variantConfig: unknown;
  aiMetadata: unknown;
}

/**
 * Get all sandals for the advisor catalog (with images and variantConfig).
 */
export async function getAdvisorCatalog(): Promise<AdvisorProduct[]> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      category: {
        OR: [
          { slug: "sandali" },
          { parent: { slug: "sandali" } },
          { parent: { parent: { slug: "sandali" } } },
        ],
      },
    },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
      category: {
        select: { name: true },
      },
    },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    imageUrl: (p.images as Array<{ url: string }>)[0]?.url ?? "",
    categoryName: p.category?.name ?? "",
    variantConfig: p.variantConfig,
    aiMetadata: p.aiMetadata,
  }));
}

/**
 * Get a single product with full details for try-on.
 */
export async function getProductForTryOn(slug: string): Promise<AdvisorProduct | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
      category: {
        select: { name: true },
      },
    },
  });

  if (!product || !product.isActive) return null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.price),
    imageUrl: (product.images as Array<{ url: string }>)[0]?.url ?? "",
    categoryName: product.category?.name ?? "",
    variantConfig: product.variantConfig,
    aiMetadata: product.aiMetadata,
  };
}

/**
 * Get the best product image for try-on (highest quality).
 * Returns a public URL or a base64 data URI.
 *
 * Images in the DB are relative paths (e.g. /images/products/sandalo.jpg)
 * stored under the public/ directory. Fashn API (external server) cannot
 * reach localhost URLs, so we:
 *  1. If the image is already a public URL (https://...) → return as-is
 *  2. If it's a relative path → read the file from disk and return as base64 data URI
 */
export async function getProductImageForTryOn(slug: string): Promise<string | null> {
  const images = await prisma.productImage.findMany({
    where: { product: { slug, isActive: true } },
    orderBy: { sortOrder: "asc" },
    take: 3,
  });

  if (images.length === 0) return null;

  const imagePath = images[0].url;

  // Already a public URL — pass through
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // Relative path → resolve to file on disk and convert to base64
  return resolveImageToBase64(imagePath);
}

// ─── Prompt Builder ────────────────────────────────────────────────────

/**
 * Detect the variant "category" from group label or id for smart prompt building.
 * Returns: "color" | "material" | "heel" | "size" | "generic"
 */
function classifyVariantGroup(groupLabel: string, groupId: string): "color" | "material" | "heel" | "size" | "generic" {
  const lower = `${groupLabel} ${groupId}`.toLowerCase();

  if (lower.includes("colore") || lower.includes("color")) return "color";
  if (lower.includes("pelle") || lower.includes("materiale") || lower.includes("tipo")) return "material";
  if (lower.includes("tacco") || lower.includes("heel") || lower.includes("height")) return "heel";
  if (lower.includes("taglia") || lower.includes("size")) return "size";

  return "generic";
}

/**
 * Build an optimized prompt for Fashn Try-On Max.
 *
 * Strategy: Fashn works best with short, direct instructions.
 * We focus on:
 *  1. Preserving the original foot exactly (no morphing, no added/removed toes)
 *  2. Preserving the sandal product shape and structure
 *  3. When variants are selected, intelligently applying them:
 *     - Color: "render in [color name] color"
 *     - Material: "use [material] leather with natural texture"
 *     - Heel: "maintain [height] heel"
 *  4. Natural, physically plausible placement on the foot
 *
 * Without variants → preserve original product appearance.
 * With variants → override color/material/heel as specified.
 *
 * @param productSlug - Product to try on
 * @param selectedVariants - Variant selections from the UI (optional)
 */
export async function buildTryOnPrompt(
  productSlug: string,
  selectedVariants?: readonly SelectedVariant[],
): Promise<string> {
  const product = await prisma.product.findFirst({
    where: { slug: productSlug, isActive: true },
    select: { name: true, aiMetadata: true },
  });

  // ── Base directives (always present) ──
  const baseParts: string[] = [
    "keep the exact original foot shape, skin tone and toe appearance without any alteration",
    "place the sandal naturally on the foot with realistic contact",
    "natural lighting and shadows",
    "photorealistic output",
  ];

  // ── Style hint from product AI metadata ──
  let styleHint = "";
  if (product?.aiMetadata) {
    const meta = product.aiMetadata as unknown as ProductAIMetadata | null;
    if (meta?.version === 1) {
      const hints: string[] = [];
      if (meta.closureType && meta.closureType !== "N/A") hints.push(meta.closureType.toLowerCase());
      if (meta.strapStyle && meta.strapStyle !== "N/A") hints.push(meta.strapStyle.toLowerCase());
      if (hints.length > 0) {
        styleHint = ` ${hints.join(", ")} sandals`;
      }
    }
  }

  // ── Variant-specific prompt parts ──
  const variantParts: string[] = [];

  if (selectedVariants && selectedVariants.length > 0) {
    for (const v of selectedVariants) {
      const category = classifyVariantGroup(v.groupLabel, v.groupId);

      switch (category) {
        case "color":
          variantParts.push(`render the sandal in ${v.optionLabel} color`);
          if (v.optionColor) {
            variantParts.push(`exact hex color ${v.optionColor}`);
          }
          break;

        case "material":
          variantParts.push(`use ${v.optionLabel} leather with its natural texture, grain and finish`);
          break;

        case "heel":
          variantParts.push(`maintain the ${v.optionLabel} heel`);
          break;

        case "size":
          // Size doesn't affect visual rendering — skip
          break;

        default:
          variantParts.push(`${v.groupLabel}: ${v.optionLabel}`);
          break;
      }
    }
  }

  // ── Compose final prompt ──
  const parts: string[] = [];

  if (variantParts.length > 0) {
    // With variants: apply them, don't preserve original product appearance
    parts.push(`apply the following customizations to the sandal: ${variantParts.join(", ")}`);
    parts.push("preserve the sandal shape, straps structure and overall design");
  } else {
    // Without variants: preserve original product as-is
    parts.push("preserve the exact product color, material texture and details");
  }

  parts.push(...baseParts);

  if (styleHint) {
    parts.push(`style:${styleHint}`);
  }

  const prompt = parts.join(", ");

  log.info("Built try-on prompt", {
    productSlug,
    productName: product?.name,
    variantCount: selectedVariants?.length ?? 0,
    variantLabels: selectedVariants?.map((v) => `${v.groupLabel}=${v.optionLabel}`),
    prompt,
  });

  return prompt;
}

// ─── Image Resolution ──────────────────────────────────────────────────

/**
 * Resolve an image path to a usable format for external APIs.
 *
 * - If public URL (https://...) → return as-is
 * - If relative path (e.g. /images/swatches/nero.jpg) → read from disk, convert to base64 data URI
 *
 * TODO: In production, all images should be served from a public CDN/URL.
 * The base64 conversion is a workaround for local development where external
 * APIs cannot reach localhost relative paths.
 */
export async function resolveImageToBase64(imagePath: string): Promise<string | null> {
  // Already a public URL — pass through (no conversion needed)
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  return resolveLocalImageToBase64(imagePath);
}

/**
 * Read a local image file from disk and return as base64 data URI.
 * Path is relative to the public/ directory.
 */
async function resolveLocalImageToBase64(relativePath: string): Promise<string | null> {
  const nodePath = await import("node:path");
  const nodeFs = await import("node:fs");

  // Build absolute path to the file under public/
  const publicDir = nodePath.join(process.cwd(), "public");
  const absolutePath = nodePath.join(
    publicDir,
    relativePath.startsWith("/") ? relativePath.slice(1) : relativePath,
  );

  try {
    if (!nodeFs.existsSync(absolutePath)) {
      log.error("Image file not found on disk", { relativePath, absolutePath });
      return null;
    }

    const buffer = nodeFs.readFileSync(absolutePath);

    // Determine MIME type from extension
    const ext = nodePath.extname(absolutePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
    };
    const mimeType = mimeMap[ext] ?? "image/jpeg";

    const base64 = buffer.toString("base64");
    log.info("Local image converted to base64", {
      relativePath,
      sizeKb: Math.round(buffer.length / 1024),
      mimeType,
      base64Length: base64.length,
    });

    return `data:${mimeType};base64,${base64}`;
  } catch (err) {
    log.error("Failed to read local image", {
      relativePath,
      absolutePath,
      error: err instanceof Error ? err.message : "unknown",
    });
    return null;
  }
}
