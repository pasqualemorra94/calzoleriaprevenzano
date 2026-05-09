/**
 * seed-sandali-strass.ts
 *
 * Crea:
 * 1. VariantTemplate "strass-colore" (24 colori, foto reali scontornate)
 * 2. 11 prodotti sandali strass (10 misti config Chiara + 1 Elisabetta solo strass)
 * 3. Media + ProductImage records per le 50 foto prodotto
 *
 * Idempotente: upsert su slug. Skip se Media già esiste con stesso filename.
 *
 * Run: npx tsx scripts/seed-sandali-strass.ts
 */
import { PrismaClient } from "@prisma/client";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_ROOT = path.resolve(__dirname, "..", "public");
const PHOTOS_DIR = path.join(PUBLIC_ROOT, "uploads", "2026", "05", "sandali-strass");
const PHOTOS_URL_PREFIX = "/uploads/2026/05/sandali-strass";
const SWATCHES_URL_PREFIX = "/images/swatches/strass";

// ─── Strass colors (24) ───────────────────────────────────────────────────
// value: slug stable | label: italiano | file: nel filesystem | color: hex fallback

interface StrassOpt {
  value: string;
  label: string;
  file: string;
  color?: string;
}

const STRASS_OPTIONS: StrassOpt[] = [
  { value: "nero", label: "Nero", file: "Strass nero.webp", color: "#1a1a1a" },
  { value: "nero-2", label: "Nero 2", file: "Strass 2 nero.webp", color: "#2a2a2a" },
  { value: "argento", label: "Argento", file: "Strass argento.webp", color: "#c0c0c0" },
  { value: "argento-2", label: "Argento 2", file: "Strass 2 argento.webp", color: "#d3d3d3" },
  { value: "oro", label: "Oro", file: "Strass oro.webp", color: "#d4a843" },
  { value: "oro-2", label: "Oro 2", file: "Strass 2 oro.webp", color: "#c89a30" },
  { value: "oro-rosa", label: "Oro Rosa", file: "Strass oro rosa.webp", color: "#b76e79" },
  { value: "oro-rosa-2", label: "Oro Rosa 2", file: "Strass 2 oro rosa.webp", color: "#d29a9e" },
  { value: "ambra", label: "Ambra", file: "Strass ambra.webp", color: "#b27d3a" },
  { value: "ambra-2", label: "Ambra 2", file: "Strass 2 ambra.webp", color: "#a06d2c" },
  { value: "ambra-scuro", label: "Ambra scuro", file: "Strass ambra scuro.webp", color: "#6a4517" },
  { value: "rosso", label: "Rosso", file: "Strass rosso.webp", color: "#c0392b" },
  { value: "fucsia", label: "Fucsia", file: "Strass fucsia.webp", color: "#c2185b" },
  { value: "rosa", label: "Rosa", file: "Strass Rosa.webp", color: "#f48fb1" },
  { value: "arancione", label: "Arancione", file: "Strass arancione.webp", color: "#e67e22" },
  { value: "giallo", label: "Giallo", file: "Strass giallo.webp", color: "#f1c40f" },
  { value: "verde-chiaro", label: "Verde chiaro", file: "Strass verde chiaro.webp", color: "#7cb342" },
  { value: "verde-scuro", label: "Verde scuro", file: "Strass verde scuro.webp", color: "#2e7d32" },
  { value: "azzurro", label: "Azzurro", file: "Strass azzurro.webp", color: "#5dade2" },
  { value: "blu-royal", label: "Blu royal", file: "Strass blu royal.webp", color: "#1e3a8a" },
  { value: "blu-scuro", label: "Blu scuro", file: "Strass blu scuro.webp", color: "#0d1b40" },
  { value: "turchese", label: "Turchese", file: "Strass turchese.webp", color: "#16a085" },
  { value: "aurora-boreale", label: "Aurora boreale", file: "Strass aurora boreale.webp", color: "#d3d3d3" },
  { value: "arcobaleno", label: "Arcobaleno", file: "Strass arcobaleno.webp", color: "#ff5e87" },
];

function buildStrassGroup() {
  return {
    id: "strass-colore",
    type: "color-swatch",
    label: "Colore Strass",
    required: true,
    options: STRASS_OPTIONS.map((o) => ({
      value: o.value,
      label: o.label,
      ...(o.color ? { color: o.color } : {}),
      imageUrl: `${SWATCHES_URL_PREFIX}/${encodeURIComponent(o.file)}`,
      priceModifier: 0,
    })),
  };
}

// ─── Tacco + Taglia (per Elisabetta) ──────────────────────────────────────

const TACCO_GROUP = {
  id: "wcpa-image-group-1620830673963",
  type: "color-swatch",
  label: "Altezza tacco",
  required: true,
  options: [
    { value: "0", label: "Senza tacco", imageUrl: "/images/swatches/tacco0.jpg", priceModifier: 0 },
    { value: "1", label: "Tacco 2.5 cm", imageUrl: "/images/swatches/tacco25.jpg", priceModifier: 10 },
    { value: "2", label: "Tacco 5 cm", imageUrl: "/images/swatches/tacco5.jpg", priceModifier: 10 },
  ],
};

const TAGLIA_GROUP = {
  id: "wcpa-select-1620830673964",
  type: "button",
  label: "Taglia",
  required: true,
  options: ["32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42"].map((v) => ({
    value: v,
    label: v,
    priceModifier: 0,
  })),
};

// ─── Prodotti ─────────────────────────────────────────────────────────────

interface ProductDef {
  slug: string;
  name: string;
  price: number;
  type: "misto" | "solo-strass";
  /** prefix nel filename (lowercase, senza estensione) per matchare le foto */
  photoPrefix: string;
  description: string;
}

const PRODUCTS: ProductDef[] = [
  {
    slug: "elena-strass",
    name: "Elena",
    price: 95,
    type: "misto",
    photoPrefix: "elena 95€ strass",
    description: "Sandalo con cinturini in pelle e cinturini ricoperti di strass. Personalizzabile in tipo pelle, colore e colore strass.",
  },
  {
    slug: "elisa-argento-strass",
    name: "Elisa Argento",
    price: 90,
    type: "misto",
    photoPrefix: "elisa argento 90€ strass",
    description: "Sandalo infradito con cinturino strass argento e cinturino caviglia in pelle. Personalizzabile.",
  },
  {
    slug: "elisa-azzurro-strass",
    name: "Elisa Azzurro",
    price: 90,
    type: "misto",
    photoPrefix: "elisa azzurro 90€ strass",
    description: "Sandalo infradito con cinturino strass azzurro e cinturino caviglia in pelle. Personalizzabile.",
  },
  {
    slug: "elisa-black-strass",
    name: "Elisa Black",
    price: 90,
    type: "misto",
    photoPrefix: "elisa black 90€ strass",
    description: "Sandalo infradito con cinturino strass nero e cinturino caviglia in pelle. Personalizzabile.",
  },
  {
    slug: "elisa-oro-strass",
    name: "Elisa Oro",
    price: 90,
    type: "misto",
    photoPrefix: "elisa oro 90€ strass",
    description: "Sandalo infradito con cinturino strass oro e cinturino caviglia in pelle. Personalizzabile.",
  },
  {
    slug: "elisa-oro-rosa-strass",
    name: "Elisa Oro Rosa",
    price: 90,
    type: "misto",
    photoPrefix: "elisa oro rosa 90€ strass",
    description: "Sandalo infradito con cinturino strass oro rosa e cinturino caviglia in pelle. Personalizzabile.",
  },
  {
    slug: "elisa-verde-strass",
    name: "Elisa Verde",
    price: 90,
    type: "misto",
    photoPrefix: "elisa verde 90€ strass",
    description: "Sandalo infradito con cinturino strass verde e cinturino caviglia in pelle. Personalizzabile.",
  },
  {
    slug: "elisabetta-strass",
    name: "Elisabetta",
    price: 90,
    type: "solo-strass",
    photoPrefix: "elisabetta 90€ strass",
    description: "Sandalo interamente ricoperto di strass su tutti i cinturini. Personalizzabile in colore strass.",
  },
  {
    slug: "federica-strass",
    name: "Federica",
    price: 80,
    type: "misto",
    photoPrefix: "federica 80€ strass",
    description: "Sandalo con cinturini incrociati strass e pelle metallizzata. Personalizzabile.",
  },
  {
    slug: "fiona-strass",
    name: "Fiona",
    price: 95,
    type: "misto",
    photoPrefix: "fiona 95€ strass",
    description: "Sandalo con tre cinturini strass nell'avampiede e cinturino caviglia in pelle. Personalizzabile.",
  },
  {
    slug: "francy-strass",
    name: "Francy",
    price: 95,
    type: "misto",
    photoPrefix: "francy 95€ strass",
    description: "Sandalo con cinturini in pelle e dettagli strass sottili. Personalizzabile.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────

async function getOrCreateMedia(filename: string, urlPath: string, folder: string): Promise<string> {
  const fullPath = path.join(PHOTOS_DIR, filename);
  const stat = fs.statSync(fullPath);
  const existing = await prisma.media.findUnique({ where: { filename } });
  if (existing) return existing.id;
  const created = await prisma.media.create({
    data: {
      filename,
      originalName: filename,
      mimeType: "image/webp",
      size: stat.size,
      folder,
      url: urlPath,
    },
  });
  return created.id;
}

function findProductPhotos(prefix: string): string[] {
  const files = fs.readdirSync(PHOTOS_DIR);
  const lowerPrefix = prefix.toLowerCase();
  // Match files whose lowercase name starts with prefix
  return files
    .filter((f) => f.toLowerCase().startsWith(lowerPrefix))
    .sort((a, b) => {
      // Foto principale (senza parens) prima, poi (1), (2), ...
      const aHasParen = a.includes("(");
      const bHasParen = b.includes("(");
      if (aHasParen !== bHasParen) return aHasParen ? 1 : -1;
      return a.localeCompare(b);
    });
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Seed Sandali Strass ===\n");

  // 1. Carica config Chiara
  const chiara = await prisma.product.findUnique({
    where: { slug: "chiara" },
    select: { variantConfig: true },
  });
  if (!chiara?.variantConfig) {
    console.error("❌ Chiara non ha variantConfig. Lancia prima apply-variant-configs.ts.");
    process.exit(1);
  }
  const chiaraGroups = (chiara.variantConfig as { groups: unknown[] }).groups;

  // 2. Verifica categoria strass
  const strassCategory = await prisma.category.findUnique({ where: { slug: "strass" } });
  if (!strassCategory) {
    console.error("❌ Categoria 'strass' non trovata.");
    process.exit(1);
  }
  console.log(`✅ Categoria strass: ${strassCategory.name} (${strassCategory.id})`);

  // 3. Crea/upsert VariantTemplate strass-colore
  const strassGroup = buildStrassGroup();
  const strassTemplateConfig = { groups: [strassGroup] };
  const strassTemplate = await prisma.variantTemplate.upsert({
    where: { slug: "strass-colore" },
    update: {
      name: "Strass — Colore Filo",
      description: `Selezione colore strass per cinturini sandali. ${STRASS_OPTIONS.length} colori disponibili (foto reali scontornate).`,
      config: strassTemplateConfig as never,
    },
    create: {
      name: "Strass — Colore Filo",
      slug: "strass-colore",
      description: `Selezione colore strass per cinturini sandali. ${STRASS_OPTIONS.length} colori disponibili (foto reali scontornate).`,
      config: strassTemplateConfig as never,
    },
  });
  console.log(`✅ VariantTemplate: ${strassTemplate.name} (${STRASS_OPTIONS.length} opzioni)\n`);

  // 4. Per ogni prodotto: upsert + foto
  let createdCount = 0;
  let updatedCount = 0;
  let totalPhotos = 0;

  for (const def of PRODUCTS) {
    const photos = findProductPhotos(def.photoPrefix);
    if (photos.length === 0) {
      console.warn(`  ⚠️  ${def.slug}: nessuna foto trovata con prefix "${def.photoPrefix}"`);
      continue;
    }

    // Costruisci variantConfig
    let groups: unknown[];
    if (def.type === "solo-strass") {
      groups = [strassGroup, TACCO_GROUP, TAGLIA_GROUP];
    } else {
      groups = [...chiaraGroups, strassGroup];
    }
    const variantConfig = { groups };

    // Upsert Product
    const existing = await prisma.product.findUnique({ where: { slug: def.slug }, select: { id: true } });
    const product = await prisma.product.upsert({
      where: { slug: def.slug },
      update: {
        name: def.name,
        description: def.description,
        price: def.price,
        categoryId: strassCategory.id,
        variantConfig: variantConfig as never,
        isActive: true,
        stock: 999,
      },
      create: {
        slug: def.slug,
        name: def.name,
        description: def.description,
        price: def.price,
        categoryId: strassCategory.id,
        variantConfig: variantConfig as never,
        isActive: true,
        stock: 999,
      },
    });
    if (existing) updatedCount++; else createdCount++;

    // Crea Media + ProductImage per ogni foto
    // Prima cancello le ProductImage esistenti per evitare duplicati su re-run
    await prisma.productImage.deleteMany({ where: { productId: product.id } });

    for (let i = 0; i < photos.length; i++) {
      const filename = photos[i];
      const urlPath = `${PHOTOS_URL_PREFIX}/${filename}`;
      const mediaId = await getOrCreateMedia(filename, urlPath, "products/sandali-strass");
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: urlPath,
          alt: `${def.name} - foto ${i + 1}`,
          sortOrder: i,
          mediaId,
        },
      });
      totalPhotos++;
    }

    console.log(`  ${existing ? "🔄" : "✨"} ${def.name.padEnd(20)} ${def.type.padEnd(12)} €${def.price}  ${photos.length} foto  groups=${groups.length}`);
  }

  console.log(`\n✅ Prodotti: ${createdCount} creati, ${updatedCount} aggiornati`);
  console.log(`✅ Foto: ${totalPhotos} ProductImage totali`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
