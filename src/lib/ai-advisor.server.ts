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
        where: { sortOrder: 0 },
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
 * Get the best product image URL for try-on (highest quality).
 * Falls back to the first image if no full-size variant exists.
 */
export async function getProductImageUrlForTryOn(slug: string): Promise<string | null> {
  const images = await prisma.productImage.findMany({
    where: { product: { slug, isActive: true } },
    orderBy: { sortOrder: "asc" },
    take: 3,
  });

  if (images.length === 0) return null;

  // Prefer images that look like full product shots (not swatches)
  // Use the first image (sortOrder 0) which is typically the main product photo
  return images[0].url;
}
