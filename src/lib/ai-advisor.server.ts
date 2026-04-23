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
 * Classify a variant group into a semantic category for prompt building.
 *
 * The classification determines WHICH PART of the sandal the variant applies to:
 *  - "color"       → strap / upper color only (NOT sole, NOT lining)
 *  - "material"    → leather type for straps/upper (e.g. laminato, liscio)
 *  - "heel"        → heel height/type
 *  - "size"        → non-visual, skip entirely
 *  - "generic"     → unknown, describe generically
 *
 * Key insight: Color variants in this catalog only change the STRAPS,
 * never the sole or the inner lining. The prompt must be surgical.
 */
function classifyVariantGroup(groupLabel: string, groupId: string): "color" | "material" | "heel" | "size" | "generic" {
  const lower = `${groupLabel} ${groupId}`.toLowerCase();

  // Size is non-visual — always skip
  if (lower.includes("taglia") || lower.includes("size")) return "size";

  // Heel type/height
  if (lower.includes("tacco") || lower.includes("heel") || lower.includes("height")) return "heel";

  // Material/leather type — affects strap finish
  if (lower.includes("tipo di pelle") || lower.includes("materiale") || lower === "tipo") return "material";

  // Color groups — apply to straps only
  if (lower.includes("colore") || lower.includes("color")) return "color";

  // Named leather groups that are actually conditional color selectors
  // e.g. "Pelle Liscia" group contains color options like Arancione, Nero, etc.
  if (lower.includes("pelle liscia") || lower.includes("pelle laminato") || lower.includes("pelle pitonata")) return "color";

  // Generic fallback
  return "generic";
}

/**
 * Build a prompt for Fashn tryon-max.
 *
 * Fashn best practices (from official docs):
 *  - Use natural plain language, full sentences
 *  - Keep it short: 1-3 sentences
 *  - Don't say "realistic" or "photorealistic" — Fashn handles that
 *  - Focus on HOW the product should be worn
 *  - Most important info first
 *
 * When variant swatches are composited into the product image:
 *  - The swatches appear to the RIGHT of the sandal photo
 *  - The prompt tells Fashn to use the color from those swatches
 *  - The instruction is surgical: ONLY straps/upper, NOT sole/lining
 *
 * @param productSlug - Product to try on
 * @param selectedVariants - Variant selections from the UI (optional)
 * @param hasSwatchImages - Whether swatch images are composited into the garment image
 */
export async function buildTryOnPrompt(
  productSlug: string,
  selectedVariants?: readonly SelectedVariant[],
  hasSwatchImages = false,
): Promise<string> {
  const product = await prisma.product.findFirst({
    where: { slug: productSlug, isActive: true },
    select: { name: true, aiMetadata: true },
  });

  const sentences: string[] = [];

  // ── 1. Core instruction: wear the sandal on the foot ──
  // Fashn understands "wear" naturally — this handles placement
  sentences.push("Wear the sandal on the foot");

  // ── 2. Variant customizations (surgical, part-aware) ──
  if (selectedVariants && selectedVariants.length > 0) {
    const colorParts: string[] = [];
    let materialPart: string | null = null;
    let heelPart: string | null = null;

    for (const v of selectedVariants) {
      const category = classifyVariantGroup(v.groupLabel, v.groupId);

      switch (category) {
        case "color":
          colorParts.push(v.optionLabel.toLowerCase());
          break;

        case "material":
          // e.g. "laminato" → "laminated leather", "liscio" → "smooth leather"
          const materialMap: Record<string, string> = {
            "laminato": "laminated leather with a glossy finish",
            "liscio": "smooth natural leather with a matte finish",
            "pitonata": "python-embossed leather",
          };
          const materialKey = v.optionLabel.toLowerCase();
          materialPart = materialMap[materialKey] ?? `${v.optionLabel} leather`;
          break;

        case "heel":
          heelPart = v.optionLabel.toLowerCase();
          break;

        case "size":
          // Non-visual — skip
          break;

        default:
          break;
      }
    }

    // Build color sentence: surgical — ONLY straps, NOT sole/lining
    if (colorParts.length > 0) {
      const colorStr = colorParts.join(" ");
      if (hasSwatchImages) {
        // Swatches are composited into the image — tell Fashn to use them
        sentences.push(
          `Change ONLY the straps and upper to match the color swatch${colorParts.length > 1 ? "es" : ""} on the right side of the image. Keep the sole, lining and all other parts in their original colors.`,
        );
      } else {
        // No swatch image — describe color by name
        sentences.push(
          `Change ONLY the straps and upper to ${colorStr} color. Keep the sole, lining and all other parts in their original colors.`,
        );
      }
    }

    // Build material sentence
    if (materialPart) {
      sentences.push(
        `Use ${materialPart} for the straps and upper. Keep the sole and lining unchanged.`,
      );
    }

    // Build heel sentence
    if (heelPart) {
      sentences.push(`${heelPart} heel`);
    }
  }

  const prompt = sentences.join(". ").replace(/\.\./g, ".").trim();

  log.info("Built try-on prompt", {
    productSlug,
    productName: product?.name,
    variantCount: selectedVariants?.length ?? 0,
    variantLabels: selectedVariants?.map((v) => `${v.groupLabel}=${v.optionLabel}`),
    classifications: selectedVariants?.map((v) => ({
      label: v.groupLabel,
      classified: classifyVariantGroup(v.groupLabel, v.groupId),
    })),
    prompt,
    promptLength: prompt.length,
  });

  return prompt;
}

// ─── Image Resolution ──────────────────────────────────────────────────

/**
 * Composite the product image with variant swatch images into a single image.
 *
 * Fashn API only accepts ONE product_image, so when the user selects
 * color/material variants, we composite the sandal photo with the swatch
 * patches side-by-side. The prompt then tells Fashn to use the color
 * from the swatch patches.
 *
 * Layout: [sandal image (main)] [small gap] [swatch1] [swatch2] ...
 * The swatches are resized to ~200px height and placed to the right.
 *
 * @returns base64 data URI of the composite JPEG image, or the original product image if no swatches
 */
export async function compositeProductWithSwatches(
  productImageBase64: string,
  swatchImages: Array<{ label: string; base64: string }>,
): Promise<string> {
  if (swatchImages.length === 0) {
    return productImageBase64;
  }

  try {
    const sharp = await import("sharp");

    // Decode product image
    const productBuffer = decodeDataUri(productImageBase64);
    if (!productBuffer) {
      log.warn("Could not decode product image for compositing, using original");
      return productImageBase64;
    }

    const productMeta = await sharp.default(productBuffer).metadata();
    const productHeight = productMeta.height ?? 600;
    const productWidth = productMeta.width ?? 400;

    // Swatch size: proportional to product, max 200px tall
    const swatchHeight = Math.min(200, Math.round(productHeight * 0.3));
    const gap = 20; // px gap between product and swatches

    // Decode and resize all swatches
    const swatchBuffers: Buffer[] = [];
    let totalSwatchWidth = 0;
    for (const swatch of swatchImages) {
      const buf = decodeDataUri(swatch.base64);
      if (!buf) continue;
      const resized = await sharp.default(buf)
        .resize({ height: swatchHeight, withoutEnlargement: true })
        .jpeg({ quality: 95 })
        .toBuffer();
      const meta = await sharp.default(resized).metadata();
      swatchBuffers.push(resized);
      totalSwatchWidth += meta.width ?? 150;
    }

    if (swatchBuffers.length === 0) {
      return productImageBase64;
    }

    // Calculate composite dimensions
    const compositeWidth = productWidth + gap + totalSwatchWidth + (swatchBuffers.length - 1) * 10;
    const compositeHeight = Math.max(productHeight, swatchHeight);

    // Build composite: white background, product left, swatches right
    const composite = await sharp.default({
      create: {
        width: compositeWidth,
        height: compositeHeight,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .jpeg({ quality: 95 })
      .composite([
        {
          input: productBuffer,
          left: 0,
          top: Math.round((compositeHeight - productHeight) / 2),
        },
        // Add each swatch
        ...swatchBuffers.reduce<Array<{ input: Buffer; left: number; top: number }>>((acc, buf, i) => {
          const prevWidth = i === 0
            ? productWidth + gap
            : acc[i - 1].left + (acc[i - 1].input as unknown as { length: number }).length; // rough estimate
          // Calculate x position by summing previous swatch widths
          const sharpObj = sharp.default(buf);
          acc.push({
            input: buf,
            left: 0, // will be recalculated below
            top: Math.round((compositeHeight - swatchHeight) / 2),
          });
          return acc;
        }, []),
      ])
      .toBuffer();

    // We need to calculate x positions properly — rebuild with correct positions
    let xOffset = productWidth + gap;
    const composites: Array<{ input: Buffer; left: number; top: number }> = [
      {
        input: productBuffer,
        left: 0,
        top: Math.round((compositeHeight - productHeight) / 2),
      },
    ];

    for (const buf of swatchBuffers) {
      const meta = await sharp.default(buf).metadata();
      const swatchW = meta.width ?? 150;
      composites.push({
        input: buf,
        left: xOffset,
        top: Math.round((compositeHeight - swatchHeight) / 2),
      });
      xOffset += swatchW + 10; // 10px gap between swatches
    }

    const finalComposite = await sharp.default({
      create: {
        width: xOffset - 10, // remove last gap
        height: compositeHeight,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .jpeg({ quality: 95 })
      .composite(composites)
      .toBuffer();

    const base64 = finalComposite.toString("base64");
    log.info("Composite image created", {
      productSize: `${productWidth}x${productHeight}`,
      swatchCount: swatchBuffers.length,
      compositeSize: `${xOffset - 10}x${compositeHeight}`,
      sizeKb: Math.round(finalComposite.length / 1024),
    });

    return `data:image/jpeg;base64,${base64}`;
  } catch (err) {
    log.error("Failed to create composite image, using original product image", {
      swatchCount: swatchImages.length,
      error: err instanceof Error ? err.message : "unknown",
    });
    return productImageBase64;
  }
}

/**
 * Decode a data URI (data:image/...;base64,...) to a Buffer.
 * Returns null if not a valid data URI.
 */
function decodeDataUri(dataUri: string): Buffer | null {
  const match = dataUri.match(/^data:[^/]+\/[^;]+;base64,(.+)$/);
  if (!match) return null;
  return Buffer.from(match[1], "base64");
}

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
