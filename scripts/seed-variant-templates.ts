/**
 * seed-variant-templates.ts
 *
 * Creates the 9 VariantTemplate records in the DB,
 * each extracted from a representative product.
 * Also assigns templates to categories.
 *
 * Run: npx tsx scripts/seed-variant-templates.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TemplateDef {
  name: string;
  slug: string;
  description: string;
  productSlug: string; // extract config from this product
  categorySlugs: string[]; // assign to these categories
}

const TEMPLATES: TemplateDef[] = [
  {
    name: "Sandali 4 Pelli (Classica/Camoscio/Pitonato/Laminato)",
    slug: "sandali-4-pelli",
    description: "Tipo di Pelle + colori condizionali per ciascuna pelle + Tacco + Taglia. Per Vittoria, Irene, Paola, Mia, Giulia.",
    productSlug: "vittoria",
    categorySlugs: ["sandali", "classici"],
  },
  {
    name: "Sandali 3 Pelli (Laminato/Liscio/Pitonato)",
    slug: "sandali-3-pelli",
    description: "Tipo di Pelle a 3 opzioni + colori condizionali + Tacco + Taglia. Per Strass, Pompei, ecc.",
    productSlug: "irene",
    categorySlugs: ["strass", "schiava"],
  },
  {
    name: "Sandali 2 Pelli (Laminato/Liscio)",
    slug: "sandali-2-pelli",
    description: "Tipo di Pelle Laminato/Liscio + colori condizionali + Tacco + Taglia. Per Samantha, Alessandra.",
    productSlug: "samantha",
    categorySlugs: [],
  },
  {
    name: "Gioiello / Colore Diretto",
    slug: "gioiello-colore-diretto",
    description: "Colore diretto (no condizionale) con immagine + Tacco + Taglia. Per Sole, Ghiaccio, Rosellina, Sandra, ecc.",
    productSlug: "sole",
    categorySlugs: ["gioiello", "cavigliera", "fasce", "aggiunta-ciondolo"],
  },
  {
    name: "Tacco + Taglia",
    slug: "tacco-taglia",
    description: "Solo scelta tacco e taglia, nessun colore. Per Creta, Giunone, Flor.",
    productSlug: "creta",
    categorySlugs: ["con-infradito"],
  },
  {
    name: "Taglia unica",
    slug: "taglia-sola",
    description: "Solo scelta taglia (36-46). Per solette e plantari.",
    productSlug: "soletta-pelle-pregiata-prestige",
    categorySlugs: ["solette", "articoli-calzature"],
  },
  {
    name: "Bambini (Fondo + Taglia)",
    slug: "bambini-fondo-taglia",
    description: "Tipo di fondo (Gomma/Cuoio +€15) + taglia 28-33. Per sandali bambini.",
    productSlug: "giusy",
    categorySlugs: ["bambini", "infradito-bambini", "no-infradito-bambini"],
  },
  {
    name: "Noemi (Multi-radio 3 pelli)",
    slug: "noemi-multi-radio",
    description: "3 gruppi Tipo di Pelle indipendenti, ciascuno con colori condizionali Laminato/Pitone/Liscio + Tacco + Taglia.",
    productSlug: "noemi",
    categorySlugs: [],
  },
  {
    name: "Treccina (Multi-radio)",
    slug: "treccina-multi-radio",
    description: "4 gruppi Tipo di Pelle indipendenti con colori condizionali + Tacco + Taglia.",
    productSlug: "treccina",
    categorySlugs: [],
  },
];

async function main() {
  console.log("Seeding variant templates...\n");

  for (const tpl of TEMPLATES) {
    // Get config from representative product
    const product = await prisma.product.findUnique({
      where: { slug: tpl.productSlug },
      select: { variantConfig: true },
    });

    if (!product?.variantConfig) {
      console.log(`  ⚠️  ${tpl.slug}: product ${tpl.productSlug} has no variantConfig, skipping`);
      continue;
    }

    // Create template (upsert by slug)
    const template = await prisma.variantTemplate.upsert({
      where: { slug: tpl.slug },
      update: {
        name: tpl.name,
        description: tpl.description,
        config: product.variantConfig as never,
      },
      create: {
        name: tpl.name,
        slug: tpl.slug,
        description: tpl.description,
        config: product.variantConfig as never,
      },
    });

    console.log(`  ✅ ${template.name}`);
    console.log(`     ID: ${template.id}`);
    console.log(`     Gruppi: ${extractGroupCount(template.config)}`);

    // Assign to categories
    for (const catSlug of tpl.categorySlugs) {
      const cat = await prisma.category.findUnique({ where: { slug: catSlug } });
      if (cat) {
        await prisma.category.update({
          where: { id: cat.id },
          data: { variantConfig: product.variantConfig as never },
        });
        console.log(`     → Categoria: ${cat.name}`);
      } else {
        console.log(`     → Categoria ${catSlug}: NON TROVATA`);
      }
    }
  }

  console.log("\nDone!");

  // Summary
  const allTemplates = await prisma.variantTemplate.findMany({ orderBy: { name: "asc" } });
  console.log(`\nTotale template nel DB: ${allTemplates.length}`);

  const catsWithConfig = await prisma.category.findMany({
    where: { variantConfig: { not: null } },
    select: { name: true },
  });
  console.log(`Categorie con variantConfig: ${catsWithConfig.length}`);

  await prisma.$disconnect();
}

function extractGroupCount(config: unknown): number {
  if (!config || typeof config !== "object") return 0;
  const c = config as { groups?: unknown[] };
  return Array.isArray(c.groups) ? c.groups.length : 0;
}

main();
