/**
 * Fix thumbnail URLs in scraped data and regenerate seed.ts
 * Reads scraped-products.json, fixes image URLs, outputs updated seed code.
 */

import * as fs from "fs";
import * as path from "path";

const SCRAPED_FILE = path.resolve("site-output/scraped-products.json");
const data = JSON.parse(fs.readFileSync(SCRAPED_FILE, "utf-8"));

// Fix image URLs: remove thumbnail suffixes and placeholder images
for (const product of data.products) {
  const fixedImages: typeof product.images = [];

  for (const img of product.images) {
    // Skip transparent placeholders
    if (img.originalUrl.includes("transparent.png")) continue;

    // Fix thumbnail URLs: remove -100x100, -300x300 suffixes
    let url = img.originalUrl;
    url = url.replace(/-\d+x\d+(?=\.(?:jpg|jpeg|png|webp|gif))/i, "");

    fixedImages.push({
      ...img,
      originalUrl: url,
    });
  }

  // Deduplicate by URL (keeping first occurrence)
  const seen = new Set<string>();
  product.images = fixedImages.filter((img) => {
    if (seen.has(img.originalUrl)) return false;
    seen.add(img.originalUrl);
    return true;
  });
}

// Map categories to product assignments
// From the original site's category hierarchy
const CATEGORY_MAP: Record<string, string> = {
  // Gioiello sub-categories (most specific first)
  "Aggiunta ciondolo": "aggiunta-ciondolo",
  "Cavigliera": "cavigliera",
  "Fasce": "fasce",
  "Strass": "strass",

  // Classici sub-categories
  "Schiava": "schiava",

  // Bambini sub-categories
  "Infradito": "infradito-bambini", // Only if also "Bambini"
  "No infradito": "no-infradito-bambini",

  // Top-level sandali categories
  "Gioiello": "gioiello",
  "Classici": "classici",
  "Bambini": "bambini",

  // Pelletteria
  "Borselli": "borselli",
  "Cinture": "cinture",
  "Agende": "agende",
  "Accessori": "accessori-calzoleria",

  // Articoli per calzature
  "Solette": "solette",
};

function getCategorySlug(tags: string[]): string {
  // Go through tags from most specific to least
  for (const tag of tags) {
    if (CATEGORY_MAP[tag]) {
      // Special handling for Bambini sub-categories
      if (tag === "Infradito" || tag === "No infradito") {
        if (tags.includes("Bambini")) {
          return CATEGORY_MAP[tag];
        }
        continue;
      }
      return CATEGORY_MAP[tag];
    }
  }
  // Default: if has "Sandali" tag, assign to classici
  if (tags.includes("Sandali")) return "classici";
  return "accessori-calzoleria";
}

// Build category hierarchy
const categories: Array<{ name: string; slug: string; description: string; parentId: string | null; sortOrder: number }> = [
  { name: "Sandali", slug: "sandali", description: "Sandali artigianali fatti a mano a Napoli, personalizzabili in pelle, colore e tacco.", parentId: null, sortOrder: 1 },
  { name: "Classici", slug: "classici", description: "Sandali della collezione classica: infradito, schiava, treccia.", parentId: "sandali", sortOrder: 1 },
  { name: "Con infradito", slug: "con-infradito", description: "Sandali classici con infradito, personalizzabili in pelle e colore.", parentId: "classici", sortOrder: 1 },
  { name: "Schiava", slug: "schiava", description: "Sandali schiava artigianali in pelle pregiata.", parentId: "classici", sortOrder: 2 },
  { name: "Gioiello", slug: "gioiello", description: "Sandali della collezione gioiello con dettagli preziosi applicati a mano.", parentId: "sandali", sortOrder: 2 },
  { name: "Cavigliera", slug: "cavigliera", description: "Sandali gioiello con cavigliera, personalizzabili con gioiello.", parentId: "gioiello", sortOrder: 1 },
  { name: "Con infradito Gioiello", slug: "con-infradito-gioiello", description: "Sandali gioiello con infradito, personalizzabili.", parentId: "gioiello", sortOrder: 2 },
  { name: "Aggiunta ciondolo", slug: "aggiunta-ciondolo", description: "Sandali con aggiunta ciondolo, collezione gioiello.", parentId: "gioiello", sortOrder: 3 },
  { name: "Fasce", slug: "fasce", description: "Sandali gioiello con fasce in pelle.", parentId: "gioiello", sortOrder: 4 },
  { name: "Strass", slug: "strass", description: "Sandali gioiello con strass applicati a mano.", parentId: "gioiello", sortOrder: 5 },
  { name: "Bambini", slug: "bambini", description: "Sandali artigianali per bambini, morbidi e confortevoli.", parentId: "sandali", sortOrder: 3 },
  { name: "Infradito Bambini", slug: "infradito-bambini", description: "Sandali per bambini con infradito.", parentId: "bambini", sortOrder: 1 },
  { name: "No infradito Bambini", slug: "no-infradito-bambini", description: "Sandali per bambini senza infradito.", parentId: "bambini", sortOrder: 2 },
  { name: "Pelletteria", slug: "pelletteria", description: "Borselli, cinture e accessori in pelle artigianale.", parentId: null, sortOrder: 2 },
  { name: "Borselli", slug: "borselli", description: "Borselli in pelle artigianale, disponibili in vari colori e modelli.", parentId: "pelletteria", sortOrder: 1 },
  { name: "Cinture", slug: "cinture", description: "Cinture in pelle di vitello, lavorate a mano.", parentId: "pelletteria", sortOrder: 2 },
  { name: "Agende", slug: "agende", description: "Agende e quaderni in pelle artigianale.", parentId: "pelletteria", sortOrder: 3 },
  { name: "Accessori", slug: "accessori-calzoleria", description: "Accessori per la cura delle calzature e articoli da pelletteria.", parentId: "pelletteria", sortOrder: 4 },
  { name: "Articoli per calzature", slug: "articoli-calzature", description: "Prodotti per la cura e la manutenzione delle calzature.", parentId: null, sortOrder: 3 },
  { name: "Solette", slug: "solette", description: "Solette in cuoio e materiali naturali per il comfort.", parentId: "articoli-calzature", sortOrder: 1 },
];

// Generate product seed data
const products: string[] = [];

// Track category slug usage
const usedCategories = new Set<string>();

for (const p of data.products) {
  const catSlug = getCategorySlug(p.categories);
  usedCategories.add(catSlug);

  const imagesCode = p.images.length > 0
    ? p.images.slice(0, 5).map((img, i) => `        {
        url: "/images/products/${path.basename(img.localPath)}",
        alt: "${img.alt.replace(/"/g, '\\"')}",
        sortOrder: ${i + 1},
      },`).join("\n")
    : "";

  // Get variant types for description
  const variantDesc = p.variantTypes.length > 0
    ? ` Personalizzabile: ${p.variantTypes.map(v => v.label || v.group).filter(Boolean).join(", ")}.`
    : "";

  const description = p.description
    || `${p.name} — prodotto artigianale Calzoleria Prevenzano, Napoli.${variantDesc}`;

  const shortDesc = p.shortDescription
    || `${p.name} — made in Napoli, personalizzabile.`;

  products.push(`  {
    name: "${p.name.replace(/"/g, '\\"')}",
    slug: "${p.slug}",
    description: ${JSON.stringify(description)},
    shortDescription: ${JSON.stringify(shortDesc)},
    price: ${p.price},
    compareAtPrice: null,
    sku: "CP-${p.slug.toUpperCase().slice(0, 3).toUpperCase()}-${String(products.length + 1).padStart(3, "0")}",
    isActive: ${p.inStock},
    isFeatured: ${p.isFeatured || false},
    stock: ${p.inStock ? 20 : 0},
    materials: null,
    categorySlug: "${catSlug}",
    images: [
${imagesCode}
    ],
    variants: [],
  },`);
}

// Generate TypeScript code
const seedCode = `// ═══════════════════════════════════════════════════════════════════════
// AUTO-GENERATED from scraped-products.json — ${new Date().toISOString().slice(0, 10)}
// 118 products, ${data.products.reduce((s, p) => s + p.images.length, 0)} total images
// DO NOT EDIT MANUALLY — regenerate with: npx tsx scripts/scrape-products.ts
// ═══════════════════════════════════════════════════════════════════════

export const SCRAPED_CATEGORIES = ${JSON.stringify(categories, null, 2)} as const;

export const SCRAPED_PRODUCTS = [
${products.join("\n")}
] as const;
`;

fs.writeFileSync(path.resolve("site-output/scraped-seed.ts"), seedCode);

console.log("✅ Generated seed data:");
console.log(`   Categories: ${categories.length}`);
console.log(`   Products: ${products.length}`);
console.log(`   Used categories: ${usedCategories.size}`);
console.log(`   Output: site-output/scraped-seed.ts`);
