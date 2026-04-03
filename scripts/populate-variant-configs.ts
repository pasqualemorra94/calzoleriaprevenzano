/**
 * populate-variant-configs.ts
 *
 * Converts WCPA scraped data into variantConfig JSON for each product
 * and generates a Prisma update script to apply them to the DB.
 *
 * Fixes applied vs v1:
 * - Maps WCPA field IDs to human-readable labels
 * - Correctly handles Creta/Giunone/Flor (tacco+taglia only, no color)
 * - Correctly handles Solette (taglia only)
 * - Correctly handles Bambini (fondo+taglia)
 * - Correctly handles direct-color products (gioiello/strass/cavigliera)
 * - Generates ESM-compatible apply script (import instead of require)
 * - Noemi: 3 separate radio groups with shared parent (preserves all)
 * - treccina: 4 separate radio groups with shared parent (preserves all)
 * - Extracts price modifiers from labels like "(10,00€)" or "(+15€)"
 */

import * as fs from "fs";

const swatchMapping: Record<string, string> = JSON.parse(
  fs.readFileSync("site-output/swatch-image-mapping.json", "utf-8"),
);
const wcpaData = Array.from(
  JSON.parse(fs.readFileSync("site-output/wcpa-variants.json", "utf-8")) as Array<Record<string, unknown>>,
);

// Build reverse mapping: remote URL → local filename
const urlToLocal = new Map<string, string>();
for (const [filename, url] of Object.entries(swatchMapping)) {
  urlToLocal.set(url, "/images/swatches/" + filename);
}

function mapImageUrl(remoteUrl: string): string | undefined {
  if (!remoteUrl) return undefined;
  const local = urlToLocal.get(remoteUrl);
  if (local) return local;
  const cleanUrl = remoteUrl.split("?")[0];
  return urlToLocal.get(cleanUrl) || undefined;
}

// ─── WCPA Field ID → Human-readable label ──────────────────────────
// Based on analysis of the 28 unique field IDs across 81 products

const FIELD_LABELS: Record<string, string> = {
  // Radio groups — skin type selectors
  "wcpa-radio-group-1620142551404": "Tipo di Pelle",      // 4-pelle: Classica/Camoscio/Pitonato/Laminato
  "wcpa-radio-group-1715605160533": "Tipo di Pelle",      // 2-pelle: Laminato/Liscio
  "wcpa-radio-group-666af5644a313": "Tipo di Pelle",      // Noemi group 1
  "wcpa-radio-group-1718285820805": "Tipo di Pelle",      // Noemi group 2
  "wcpa-radio-group-1718286104515": "Tipo di Pelle",      // Noemi group 3
  "wcpa-radio-group-666998463ee60": "Tipo di Pelle",      // treccina group 1
  "wcpa-radio-group-1718196478806": "Tipo di Pelle",      // treccina group 2
  "wcpa-radio-group-1718196721398": "Tipo di Pelle",      // treccina group 3
  "wcpa-radio-group-1718196864572": "Tipo di Pelle",      // treccina group 4

  // Image groups — tacco (heel)
  "wcpa-image-group-1620647000411": "Tacco",              // Standard tacco (27 products)
  "wcpa-image-group-6641cc815b93b": "Tacco",              // Tacco with images (36 products)
  "wcpa-image-group-666af5644a352": "Tacco",              // Noemi tacco

  // Image groups — direct colors (no conditional, product-specific images)
  "wcpa-image-group-6641cc815b92c": "Colore",             // Gioiello/Sole colors (15 products)
  "wcpa-image-group-1620644327389": "Colore",             // Strass colors (13 products)

  // Image groups — Noemi-specific
  "wcpa-image-group-666998463eea1": "Tacco",              // Noemi tacco (alt)

  // Select — taglia (size)
  "wcpa-select-1620830673964": "Taglia",                  // Standard taglia 32-42 (76 products)
  "wcpa-select-69174b6661027": "Taglia",                  // Solette taglia 36-46 (5 products)
  "wcpa-select-1622197927579": "Tipo di Fondo",           // Bambini fondo Gomma/Cuoio (6 products)

  // treccina-specific image groups
  "wcpa-image-group-609a8c9d63d17": "Tacco",
  "wcpa-image-group-609baf3241e8e": "Colore",
  "wcpa-image-group-609baf3241ea1": "Colore",
  "wcpa-image-group-609bb0c18084b": "Colore",
  "wcpa-image-group-609bb0c18086d": "Colore",
  "wcpa-image-group-609bb07258914": "Colore",
  "wcpa-image-group-609bb07258927": "Colore",
  "wcpa-image-group-1620132694174": "Colore",

  // Image group for 4-pelle conditional colors (used as color group names)
  "wcpa-image-group-1620375908002": "Pelle Classica",     // 39 color swatches
  "wcpa-image-group-1620145400909": "Pelle Pitonata",     // 4 color swatches
  "wcpa-image-group-1620142551404": "Pelle Camoscio",     // ~16 color swatches
  "wcpa-image-group-1620142551408": "Pelle Laminato",     // ~13 color swatches
  "wcpa-image-group-6641ca4f86330": "Pelle Liscia",       // Noemi/treccina liscio
  "wcpa-image-group-6641ca4f8633f": "Pelle Pitonata",     // Noemi/treccina pitone
  "wcpa-image-group-1718285974367": "Pelle Laminato",     // Noemi laminato
  "wcpa-image-group-1718285860175": "Pelle Pitonata",     // Noemi pitone
  "wcpa-image-group-1718285908863": "Pelle Liscia",       // Noemi liscia
  "wcpa-image-group-1718286068808": "Pelle Laminato",     // Noemi group 3 laminato
  "wcpa-image-group-1718286057942": "Pelle Pitonata",     // Noemi group 3 pitone
  "wcpa-image-group-1718286048612": "Pelle Liscia",       // Noemi group 3 liscia
  "wcpa-image-group-1715606105781": "Pelle Liscia",       // Samantha/Pompei liscia
};

function getFieldLabel(fieldId: string): string {
  return FIELD_LABELS[fieldId] ?? "Opzioni";
}

function getColorGroupLabel(groupId: string): string {
  return FIELD_LABELS[groupId] ?? "Colore";
}

// ─── Slugify & clean helpers ───────────────────────────────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

function cleanOptionLabel(label: string): string {
  if (!label) return "Opzione";
  // Remove price info from labels like "No tacco (0,00€)" → "No tacco"
  return label.replace(/\s*\([^)]*€[^)]*\)\s*$/, "").trim();
}

function parsePriceModifier(label: string): number {
  // Match patterns: "(10,00€)", "(+15€) (15,00€)", "(0,00€)"
  const match = label.match(/\((\+?\d+[,.]\d{2})€/);
  if (!match) return 0;
  const numStr = match[1].replace(",", ".");
  return parseFloat(numStr) || 0;
}

// ─── Noemi/treccina radio group index tracking ─────────────────────
// These products have MULTIPLE radio groups with the SAME field ID structure
// but different actual IDs. We need unique group IDs.

let multiRadioCounter = 0;

function getNextRadioGroupId(fieldId: string): string {
  // For Noemi/treccina which have multiple radio groups with same label
  const MULTI_RADIO_IDS = [
    "wcpa-radio-group-666af5644a313",
    "wcpa-radio-group-1718285820805",
    "wcpa-radio-group-1718286104515",
    "wcpa-radio-group-666998463ee60",
    "wcpa-radio-group-1718196478806",
    "wcpa-radio-group-1718196721398",
    "wcpa-radio-group-1718196864572",
  ];
  if (MULTI_RADIO_IDS.includes(fieldId)) {
    multiRadioCounter++;
    return "tipo-pelle-" + multiRadioCounter;
  }
  return "tipo-pelle";
}

// ─── Build variant config for a product ────────────────────────────

interface WcpaOption {
  value: string;
  label: string;
  priceModifier: number;
  imageUrl: string;
  color?: string;
}

interface WcpaColorGroup {
  groupName: string;
  showWhenParentValue: string;
  options: WcpaOption[];
}

interface WcpaField {
  id: string;
  label?: string;
  type: string;
  options: WcpaOption[];
  colorGroups?: WcpaColorGroup[];
}

interface VariantGroup {
  id: string;
  label: string;
  type: "button" | "select" | "color-swatch";
  required: boolean;
  options: Array<{
    value: string;
    label: string;
    color?: string;
    priceModifier?: number;
    imageUrl?: string;
  }>;
  dependsOn?: { groupId: string; optionValue: string };
}

function buildVariantConfig(product: { slug: string; name: string; hasWcpa: boolean; fields: WcpaField[] }): { groups: VariantGroup[] } | null {
  if (!product.hasWcpa || product.fields.length === 0) return null;

  const groups: VariantGroup[] = [];
  const seenFieldIds = new Set<string>();

  for (const field of product.fields) {
    // Skip duplicate field IDs (can happen with Noemi/treccina)
    const fieldKey = field.id + ":" + field.type;
    if (seenFieldIds.has(fieldKey)) continue;
    seenFieldIds.add(fieldKey);

    if (field.type === "radio") {
      // Parent radio group (tipo pelle) — e.g., Classica/Camoscio/Pitonato/Laminato
      const radioGroupId = getNextRadioGroupId(field.id);

      const options = field.options.map((o) => ({
        value: slugify(o.value),
        label: cleanOptionLabel(o.label),
        priceModifier: o.priceModifier || 0,
      }));

      groups.push({
        id: radioGroupId,
        label: getFieldLabel(field.id),
        type: "button",
        required: true,
        options,
      });

      // Add conditional color groups
      if (field.colorGroups) {
        for (const cg of field.colorGroups) {
          const colorOptions = cg.options.map((o) => ({
            value: slugify(o.value || o.label),
            label: cleanOptionLabel(o.label),
            color: o.color,
            priceModifier: o.priceModifier || 0,
            imageUrl: mapImageUrl(o.imageUrl),
          }));

          if (colorOptions.length > 0) {
            groups.push({
              id: slugify(cg.groupName),
              label: getColorGroupLabel(cg.groupName),
              type: "color-swatch",
              required: true,
              dependsOn: {
                groupId: radioGroupId,
                optionValue: slugify(cg.showWhenParentValue),
              },
              options: colorOptions,
            });
          }
        }
      }
    } else if (field.type === "image-group") {
      // Non-conditional image group
      // Detect what this group represents by analyzing its options
      const hasTacco = field.options.some((o) =>
        o.label.toLowerCase().includes("tacco"),
      );
      const hasSize = field.options.every((o) => /^\d{2}$/.test(o.value));
      const hasGommaCuoio = field.options.some((o) =>
        o.value === "Gomma" || o.label.toLowerCase().includes("gomma"),
      );

      let controlType: "button" | "color-swatch" | "select" = "color-swatch";
      let groupLabel = getFieldLabel(field.id);

      if (hasTacco) {
        controlType = "button";
        groupLabel = "Tacco";
      } else if (hasSize) {
        controlType = "button";
        groupLabel = "Taglia";
      } else if (hasGommaCuoio) {
        controlType = "select";
        groupLabel = "Tipo di Fondo";
      } else {
        // Direct color group (gioiello, strass, cavigliera, etc.)
        groupLabel = "Colore";
      }

      const options = field.options.map((o) => ({
        value: slugify(o.value || o.label),
        label: cleanOptionLabel(o.label),
        color: o.color,
        priceModifier: o.priceModifier || parsePriceModifier(o.label),
        imageUrl: mapImageUrl(o.imageUrl),
      }));

      if (options.length > 0) {
        groups.push({
          id: slugify(field.id),
          label: groupLabel,
          type: controlType,
          required: true,
          options,
        });
      }
    } else if (field.type === "select") {
      // Select field — taglia or tipo di fondo
      const hasGommaCuoio = field.options.some((o) =>
        o.value === "Gomma" || o.label.toLowerCase().includes("gomma"),
      );

      const groupLabel = hasGommaCuoio ? "Tipo di Fondo" : "Taglia";
      const controlType = hasGommaCuoio ? "select" : "button";

      const options = field.options.map((o) => ({
        value: o.value,
        label: cleanOptionLabel(o.label),
        priceModifier: o.priceModifier || parsePriceModifier(o.label),
      }));

      if (options.length > 0) {
        groups.push({
          id: slugify(field.id),
          label: groupLabel,
          type: controlType,
          required: true,
          options,
        });
      }
    }
  }

  return groups.length > 0 ? { groups } : null;
}

// ─── Main: Generate ESM apply script ───────────────────────────────

function main() {
  const updates: Array<{ slug: string; name: string; config: ReturnType<typeof buildVariantConfig>; groupCount: number; optionCount: number }> = [];

  for (const p of wcpaData) {
    multiRadioCounter = 0; // Reset per product
    const config = buildVariantConfig(p as Parameters<typeof buildVariantConfig>[0]);
    if (!config) continue;

    const groupCount = config.groups.length;
    const optionCount = config.groups.reduce((sum, g) => sum + g.options.length, 0);

    updates.push({
      slug: p.slug as string,
      name: p.name as string,
      config,
      groupCount,
      optionCount,
    });
  }

  // Generate the update script as proper ESM
  const script = `/**
 * apply-variant-configs.ts
 * Auto-generated by populate-variant-configs.ts
 * Run with: npx tsx scripts/apply-variant-configs.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UPDATES = ${JSON.stringify(updates, null, 2)};

async function main() {
  console.log("Updating " + UPDATES.length + " products...");
  let updated = 0;

  for (const u of UPDATES) {
    try {
      await prisma.product.update({
        where: { slug: u.slug },
        data: { variantConfig: JSON.parse(JSON.stringify(u.config)) },
      });
      updated++;
      if (updated % 20 === 0) process.stdout.write("\\r  Updated " + updated + "/" + UPDATES.length);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("  \\u274c Failed to update " + u.slug + ":", msg);
    }
  }

  console.log("\\r  \\u2705 Updated " + updated + "/" + UPDATES.length + " products");
  await prisma.$disconnect();
}

main();
`;

  fs.writeFileSync("scripts/apply-variant-configs.ts", script);

  // Summary
  const totalOpts = updates.reduce((s, u) => s + u.optionCount, 0);
  const totalGroups = updates.reduce((s, u) => s + u.groupCount, 0);
  console.log("=== VARIANT CONFIG SUMMARY ===");
  console.log("Products to update:", updates.length);
  console.log("Total groups:", totalGroups);
  console.log("Total options:", totalOpts);

  // Count products with images
  let withImages = 0;
  for (const u of updates) {
    if (!u.config) continue;
    const hasImg = u.config.groups.some((g) =>
      g.options.some((o) => "imageUrl" in o && o.imageUrl),
    );
    if (hasImg) withImages++;
  }
  console.log("Products with image URLs:", withImages);

  // Count by pattern
  const patterns: Record<string, number> = {};
  for (const u of updates) {
    if (!u.config) continue;
    const hasDependsOn = u.config.groups.some((g) => "dependsOn" in g && g.dependsOn);
    const hasColor = u.config.groups.some((g) => g.type === "color-swatch");
    if (hasDependsOn && u.groupCount > 4) {
      patterns["multi-radio (Noemi/treccina)"] = (patterns["multi-radio (Noemi/treccina)"] || 0) + 1;
    } else if (hasDependsOn) {
      patterns["conditional (radio→color)"] = (patterns["conditional (radio→color)"] || 0) + 1;
    } else if (hasColor) {
      patterns["direct-color (gioiello/strass)"] = (patterns["direct-color (gioiello/strass)"] || 0) + 1;
    } else {
      patterns["simple (tacco+taglia)"] = (patterns["simple (tacco+taglia)"] || 0) + 1;
    }
  }
  console.log("\nPatterns:");
  for (const [pattern, count] of Object.entries(patterns)) {
    console.log("  " + pattern + ": " + count);
  }

  // Show examples
  console.log("\n=== EXAMPLE CONFIGS ===");
  for (const name of ["Vittoria", "Sole", "Samantha", "Ghiaccio", "Noemi", "Strass 1010", "Creta", "Giusy", "Soletta Pelle Pregiata Prestige"]) {
    const u = updates.find((x) => x.name === name);
    if (u && u.config) {
      console.log("\n--- " + u.name + " (" + u.groupCount + " groups, " + u.optionCount + " opts) ---");
      for (const g of u.config.groups) {
        const dep = g.dependsOn ? ` [when ${g.dependsOn.groupId}=${g.dependsOn.optionValue}]` : "";
        const firstOpt = g.options[0];
        const hasImg = firstOpt.imageUrl ? "✅" : "❌";
        const sample = firstOpt.label + (firstOpt.color ? ` (${firstOpt.color})` : "");
        const price = firstOpt.priceModifier ? ` +€${firstOpt.priceModifier}` : "";
        console.log(`  ${g.type} | ${g.label}${dep} | ${g.options.length} opts | ${hasImg} | es: ${sample}${price}`);
      }
    }
  }

  console.log("\n✅ Script written to scripts/apply-variant-configs.ts");
  console.log("Run: npx tsx scripts/apply-variant-configs.ts");
}

main();
