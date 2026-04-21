/**
 * AI Metadata Seed — Deterministic product tagging for AI Foot Advisor.
 *
 * Zero API calls — uses category rules + variantConfig analysis
 * to generate aiMetadata for all sandals.
 *
 * Run: npx tsx prisma/seed-ai-metadata.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Category-based rules ──────────────────────────────────────────────

/**
 * Map sandal subcategory slug → AI metadata profile.
 * Based on the physical characteristics of each sandal type
 * as made by Calzoleria Prevenzano.
 */
const CATEGORY_PROFILES: Record<string, {
  closureType: string;
  archSupport: string;
  flexibility: string;
  strapStyle: string;
  toeCoverage: string;
  widthFit: string;
  footProfileBest: string[];
  footProfileAvoid: string[];
}> = {
  "con-infradito": {
    closureType: "infradito",
    archSupport: "light",
    flexibility: "flexible",
    strapStyle: "thin",
    toeCoverage: "open-full",
    widthFit: "adjustable",
    footProfileBest: ["medium-arch", "normal-width", "standard-instep", "narrow-width", "wide-width", "high-instep"],
    footProfileAvoid: ["extra-wide-width"],
  },
  "con-infradito-gioiello": {
    closureType: "infradito",
    archSupport: "light",
    flexibility: "flexible",
    strapStyle: "thin",
    toeCoverage: "open-full",
    widthFit: "adjustable",
    footProfileBest: ["medium-arch", "normal-width", "standard-instep", "narrow-width"],
    footProfileAvoid: ["extra-wide-width", "flat-arch"],
  },
  "infradito-bambini": {
    closureType: "infradito",
    archSupport: "light",
    flexibility: "very-flexible",
    strapStyle: "thin",
    toeCoverage: "open-full",
    widthFit: "adjustable",
    footProfileBest: ["medium-arch", "normal-width", "standard-instep"],
    footProfileAvoid: ["extra-wide-width"],
  },
  "cavigliera": {
    closureType: "sandalo-chiuso",
    archSupport: "medium",
    flexibility: "semi-flexible",
    strapStyle: "multi-strap",
    toeCoverage: "open-partial",
    widthFit: "adjustable",
    footProfileBest: ["medium-arch", "normal-width", "wide-width", "roman-shape", "high-instep"],
    footProfileAvoid: ["extra-wide-width"],
  },
  "schiava": {
    closureType: "schiava",
    archSupport: "medium",
    flexibility: "semi-flexible",
    strapStyle: "woven",
    toeCoverage: "open-partial",
    widthFit: "adjustable",
    footProfileBest: ["medium-arch", "normal-width", "wide-width", "roman-shape", "egyptian-shape", "high-instep"],
    footProfileAvoid: ["extra-wide-width", "narrow-width"],
  },
  "fasce": {
    closureType: "slide",
    archSupport: "medium",
    flexibility: "flexible",
    strapStyle: "wide",
    toeCoverage: "open-partial",
    widthFit: "standard",
    footProfileBest: ["medium-arch", "normal-width", "low-arch", "flat-arch"],
    footProfileAvoid: ["extra-wide-width", "high-instep"],
  },
  "aggiunta-ciondolo": {
    closureType: "infradito",
    archSupport: "light",
    flexibility: "flexible",
    strapStyle: "thin",
    toeCoverage: "open-full",
    widthFit: "adjustable",
    footProfileBest: ["medium-arch", "normal-width", "narrow-width", "wide-width"],
    footProfileAvoid: ["extra-wide-width"],
  },
  "strass": {
    closureType: "infradito",
    archSupport: "light",
    flexibility: "flexible",
    strapStyle: "thin",
    toeCoverage: "open-full",
    widthFit: "adjustable",
    footProfileBest: ["medium-arch", "normal-width", "narrow-width"],
    footProfileAvoid: ["extra-wide-width", "wide-width"],
  },
};

// ─── Heel height from variantConfig ────────────────────────────────────

/**
 * Determine heel height from the "Tacco" variant group options.
 * Returns the highest available heel option (since all heights are configurable).
 */
function extractHeelHeight(variantConfig: unknown): string {
  if (!variantConfig || typeof variantConfig !== "object") return "medium";

  const cfg = variantConfig as Record<string, unknown>;
  const groups = cfg.groups;

  if (!Array.isArray(groups)) return "medium";

  const taccoGroup = groups.find(
    (g: Record<string, unknown>) =>
      typeof g.label === "string" && g.label.toLowerCase().includes("tacco"),
  );

  if (!taccoGroup || !Array.isArray(taccoGroup.options)) return "medium";

  const options = taccoGroup.options.map((o: Record<string, unknown>) => String(o.label ?? ""));

  // If has "Tacco 5 cm" → can be high
  if (options.some((o: string) => /5\s*cm/i.test(o))) return "high";
  // If has "Tacco 2.5 cm" → can be low/medium
  if (options.some((o: string) => /2\.5\s*cm/i.test(o))) return "medium";
  // If only "No tacco" → flat
  if (options.every((o: string) => /no\s*tacco/i.test(o) || /piatto/i.test(o))) return "flat";

  return "medium";
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log("🏷️  AI Metadata Seed — Tagging sandals for AI Foot Advisor\n");

  // Get all sandals
  const sandali = await prisma.category.findUnique({
    where: { slug: "sandali" },
    include: { children: { include: { children: true } } },
  });

  if (!sandali) {
    console.error("❌ Category 'sandali' not found");
    return;
  }

  // Collect all category IDs in the sandali tree
  const catIds = new Set([sandali.id]);
  for (const ch of sandali.children) {
    catIds.add(ch.id);
    for (const ch2 of ch.children) catIds.add(ch2.id);
  }

  const products = await prisma.product.findMany({
    where: { isActive: true, categoryId: { in: [...catIds] } },
    include: { category: { select: { slug: true, name: true } } },
    orderBy: { name: "asc" },
  });

  console.log(`Found ${products.length} active sandals\n`);

  let tagged = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const product of products) {
    const catSlug = product.category?.slug ?? "";

    const profile = CATEGORY_PROFILES[catSlug];
    if (!profile) {
      console.log(`  ⏭️  ${product.name.padEnd(25)} — no profile for category "${catSlug}"`);
      skipped++;
      continue;
    }

    const heelHeight = extractHeelHeight(product.variantConfig);

    const metadata = {
      version: 1,
      closureType: profile.closureType,
      heelHeight,
      archSupport: profile.archSupport,
      flexibility: profile.flexibility,
      strapStyle: profile.strapStyle,
      toeCoverage: profile.toeCoverage,
      widthFit: profile.widthFit,
      footProfileBest: profile.footProfileBest,
      footProfileAvoid: profile.footProfileAvoid,
      taggedAt: new Date().toISOString(),
      taggedBy: "seed-deterministic",
    };

    try {
      await prisma.product.update({
        where: { id: product.id },
        data: { aiMetadata: metadata },
      });
      console.log(`  ✅ ${product.name.padEnd(25)} → ${catSlug.padEnd(25)} heel:${heelHeight}`);
      tagged++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${product.name}: ${msg}`);
      console.log(`  ❌ ${product.name.padEnd(25)} — ${msg}`);
    }
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Tagged: ${tagged} | Skipped: ${skipped} | Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log("\nErrors:");
    for (const e of errors) console.log(`  • ${e}`);
  }

  console.log("\n✨ Done!");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
