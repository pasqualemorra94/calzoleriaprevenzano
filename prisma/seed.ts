/**
 * Calzoleria Prevenzano — Database Seed
 *
 * AUTO-GENERATED from scraped-products.json — 2026-04-03
 * 118 products, 775 images, 20 categories
 * Source: calzoleriaprevenzano.it (complete catalog)
 */

import { PrismaClient } from "@prisma/client";
import { auth } from "../src/lib/auth";

const prisma = new PrismaClient();

// ─── Categories ──────────────────────────────────────────────────────────

interface CategorySeed {
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  parentId: string | null;
}

const categories: CategorySeed[] = [
  // ── Sandali (root) ─────────────────────────────────
  { name: "Sandali", slug: "sandali", description: "Sandali artigianali fatti a mano a Napoli, personalizzabili in pelle, colore e tacco.", sortOrder: 1, parentId: null },

  // ── Classici ─────────────────────────────────────────
  { name: "Classici", slug: "classici", description: "Sandali della collezione classica: infradito, schiava, treccia.", sortOrder: 1, parentId: "sandali" },
  { name: "Con infradito", slug: "con-infradito", description: "Sandali classici con infradito, personalizzabili in pelle e colore.", sortOrder: 1, parentId: "classici" },
  { name: "Schiava", slug: "schiava", description: "Sandali schiava artigianali in pelle pregiata.", sortOrder: 2, parentId: "classici" },

  // ── Gioiello ────────────────────────────────────────
  { name: "Gioiello", slug: "gioiello", description: "Sandali della collezione gioiello con dettagli preziosi applicati a mano.", sortOrder: 2, parentId: "sandali" },
  { name: "Cavigliera", slug: "cavigliera", description: "Sandali gioiello con cavigliera, personalizzabili con gioiello.", sortOrder: 1, parentId: "gioiello" },
  { name: "Con infradito Gioiello", slug: "con-infradito-gioiello", description: "Sandali gioiello con infradito.", sortOrder: 2, parentId: "gioiello" },
  { name: "Aggiunta ciondolo", slug: "aggiunta-ciondolo", description: "Sandali con aggiunta ciondolo, collezione gioiello.", sortOrder: 3, parentId: "gioiello" },
  { name: "Fasce", slug: "fasce", description: "Sandali gioiello con fasce in pelle.", sortOrder: 4, parentId: "gioiello" },
  { name: "Strass", slug: "strass", description: "Sandali gioiello con strass applicati a mano.", sortOrder: 5, parentId: "gioiello" },

  // ── Bambini ────────────────────────────────────────
  { name: "Bambini", slug: "bambini", description: "Sandali artigianali per bambini, morbidi e confortevoli.", sortOrder: 3, parentId: "sandali" },
  { name: "Infradito Bambini", slug: "infradito-bambini", description: "Sandali per bambini con infradito.", sortOrder: 1, parentId: "bambini" },
  { name: "No infradito Bambini", slug: "no-infradito-bambini", description: "Sandali per bambini senza infradito.", sortOrder: 2, parentId: "bambini" },

  // ── Pelletteria (root) ─────────────────────────────
  { name: "Pelletteria", slug: "pelletteria", description: "Borselli, cinture e accessori in pelle artigianale.", sortOrder: 2, parentId: null },
  { name: "Borselli", slug: "borselli", description: "Borselli in pelle artigianale.", sortOrder: 1, parentId: "pelletteria" },
  { name: "Cinture", slug: "cinture", description: "Cinture in pelle di vitello, lavorate a mano.", sortOrder: 2, parentId: "pelletteria" },
  { name: "Agende", slug: "agende", description: "Agende e quaderni in pelle artigianale.", sortOrder: 3, parentId: "pelletteria" },
  { name: "Accessori", slug: "accessori-calzoleria", description: "Accessori per la cura delle calzature.", sortOrder: 4, parentId: "pelletteria" },

  // ── Articoli per calzature (root) ─────────────────
  { name: "Articoli per calzature", slug: "articoli-calzature", description: "Prodotti per la cura e la manutenzione delle calzature.", sortOrder: 3, parentId: null },
  { name: "Solette", slug: "solette", description: "Solette in cuoio e materiali naturali.", sortOrder: 1, parentId: "articoli-calzature" },
];

// ─── Products ────────────────────────────────────────────────────────────
// Generated from site-output/scraped-products.json (118 products)

interface ProductSeed {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number | null;
  sku: string;
  isActive: boolean;
  isFeatured: boolean;
  stock: number;
  materials: string | null;
  categorySlug: string;
  images: Array<{ url: string; alt: string; sortOrder: number }>;
  variants: Array<{
    name: string;
    color: string | null;
    size: string | null;
    price: number | null;
    stock: number;
    sortOrder: number;
  }>;
}

// Tacco variants for sandali
const TACCO_VARIANTS = [
  { name: "No tacco", color: null, size: "No tacco", price: 0, stock: 20, sortOrder: 1 },
  { name: "Tacco 2.5 cm", color: null, size: "Tacco 2.5 cm", price: 10, stock: 20, sortOrder: 2 },
  { name: "Tacco 5 cm", color: null, size: "Tacco 5 cm", price: 10, stock: 20, sortOrder: 3 },
];

// Check if product is a sandalo (has tacco variant type)
function isSandalo(categories: string[]): boolean {
  const sandaloCats = ["Classici", "Gioiello", "Bambini", "Con infradito", "Schiava", "Cavigliera", "Fasce", "Strass", "Aggiunta ciondolo"];
  return categories.some((c) => sandaloCats.includes(c));
}

// Import scraped data
import scrapedData from "../site-output/scraped-products.json" with { type: "json" };

const scraped = scrapedData as {
  products: Array<{
    name: string; slug: string; price: number; originalUrl: string;
    description: string; shortDescription: string; categories: string[];
    images: Array<{ originalUrl: string; localPath: string; alt: string }>;
    variantTypes: Array<{ group: string; label: string; options: string[] }>;
    isFeatured: boolean; inStock: boolean;
  }>;
};

// Category mapping: tag → most specific category slug
const CATEGORY_PRIORITY: Array<{ tag: string; slug: string }> = [
  { tag: "Aggiunta ciondolo", slug: "aggiunta-ciondolo" },
  { tag: "Cavigliera", slug: "cavigliera" },
  { tag: "Fasce", slug: "fasce" },
  { tag: "Strass", slug: "strass" },
  { tag: "Schiava", slug: "schiava" },
  { tag: "Classici", slug: "con-infradito" },
  { tag: "Gioiello", slug: "con-infradito-gioiello" },
  { tag: "Bambini", slug: "infradito-bambini" },
  { tag: "Infradito", slug: "infradito-bambini" },
  { tag: "No infradito", slug: "no-infradito-bambini" },
  { tag: "Borselli", slug: "borselli" },
  { tag: "Cinture", slug: "cinture" },
  { tag: "Agende", slug: "agende" },
  { tag: "Accessori", slug: "accessori-calzoleria" },
  { tag: "Solette", slug: "solette" },
];

function getCategorySlug(tags: string[]): string {
  for (const { tag, slug } of CATEGORY_PRIORITY) {
    if (tags.includes(tag)) return slug;
  }
  if (tags.includes("Sandali")) return "con-infradito";
  return "accessori-calzoleria";
}

// Build products array
const products: ProductSeed[] = scraped.products.map((p, idx) => {
  // Filter out transparent placeholder images
  const images = p.images
    .filter((img) => !img.originalUrl.includes("transparent.png"))
    .map((img) => ({
      url: `/images/products/${img.localPath.replace(/^\/images\/products\//, "")}`,
      alt: img.alt || p.name,
      sortOrder: img.localPath === p.images[0]?.localPath ? 1 : 2,
    }));

  const catSlug = getCategorySlug(p.categories);
  const isSandaloType = isSandalo(p.categories);

  const description = p.description || `${p.name} — prodotto artigianale Calzoleria Prevenzano, Napoli. Realizzato a mano con pellami pregiati italiani.`;
  const shortDescription = p.shortDescription || `${p.name} — made in Napoli.`;

  return {
    name: p.name,
    slug: p.slug,
    description,
    shortDescription,
    price: p.price,
    compareAtPrice: null,
    sku: `CP-${p.slug.toUpperCase().slice(0, 3)}-${String(idx + 1).padStart(3, "0")}`,
    isActive: p.inStock,
    isFeatured: p.isFeatured,
    stock: p.inStock ? 20 : 0,
    materials: null,
    categorySlug: catSlug,
    images: images.length > 0 ? images.slice(0, 5) : [],
    variants: isSandaloType ? TACCO_VARIANTS : [],
  };
});

// ─── Discount Codes ────────────────────────────────────────────────────

interface DiscountSeed { code: string; type: string; value: number; minOrder: number | null; maxUses: number | null; startsAt: Date; expiresAt: Date; }

const discountCodes: DiscountSeed[] = [
  { code: "BENVENUTO10", type: "percentage", value: 10, minOrder: null, maxUses: 500, startsAt: new Date("2025-01-01"), expiresAt: new Date("2027-12-31") },
  { code: "ESTATE2026", type: "percentage", value: 15, minOrder: 100, maxUses: 200, startsAt: new Date("2026-06-01"), expiresAt: new Date("2026-09-30") },
];

// ─── Reviews ─────────────────────────────────────────────────────────────

interface ReviewSeed { productSlug: string; authorEmail: string; authorName: string; rating: number; title: string; content: string; }

const reviews: ReviewSeed[] = [
  { productSlug: "noemi", authorEmail: "maria.rossi@email.it", authorName: "Maria Rossi", rating: 5, title: "Comodi e bellissimi!", content: "Ho comprato i sandali Noemi per le vacanze estive e sono rimasta incantata. La pelle è morbidissima, sembrano fatti su misura." },
  { productSlug: "noemi", authorEmail: "giulia.bianchi@email.it", authorName: "Giulia Bianchi", rating: 5, title: "Qualità artigianale eccellente", content: "Il tacco 2.5 cm è perfetto. Le cuciture sono impeccabili!" },
  { productSlug: "borsello-cuoio", authorEmail: "alessandro.conti@email.it", authorName: "Alessandro Conti", rating: 5, title: "Lavorazione impeccabile", content: "Le cuciture a mano sono evidenti e curate. La pelle si sta patinando magnificamente." },
  { productSlug: "medaglia", authorEmail: "francesca.verdi@email.it", authorName: "Francesca Verdi", rating: 5, title: "Un vero gioiello", content: "I dettagli gioiello fanno la differenza. Indossati a un matrimonio e ho ricevuto tantissimi complimenti!" },
  { productSlug: "margherita", authorEmail: "elena.ferrari@email.it", authorName: "Elena Ferrari", rating: 4, title: "Bellissimo design", content: "Il design è bellissimo. La personalizzazione è un valore aggiunto unico." },
  { productSlug: "samantha", authorEmail: "luca.moretti@email.it", authorName: "Luca Moretti", rating: 5, title: "Perfetto", content: "Sandalo semplice ma elegante. Perfetto per tutti i giorni." },
  { productSlug: "borsello-porta-telefono-cocco", authorEmail: "elena.ferrari@email.it", authorName: "Elena Ferrari", rating: 4, title: "Pratico e originale", content: "La finitura stampata cocco è bellissima e particolare." },
];

// ─── Seed Execution ─────────────────────────────────────────────────────

async function cleanExistingData(): Promise<void> {
  console.log("🧹 Cleaning existing data...");
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  console.log("   ✅ Cleaned");
}

async function seedCategories(): Promise<Map<string, string>> {
  console.log("📦 Seeding categories...");
  const categoryMap = new Map<string, string>();

  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder, parentId: cat.parentId ? categoryMap.get(cat.parentId) ?? null : null },
      create: { name: cat.name, slug: cat.slug, description: cat.description, sortOrder: cat.sortOrder, parentId: cat.parentId ? categoryMap.get(cat.parentId) ?? null : null },
    });
    categoryMap.set(cat.slug, created.id);
  }

  console.log(`   ✅ ${categoryMap.size} categories created`);
  return categoryMap;
}

async function seedProducts(categoryMap: Map<string, string>): Promise<number> {
  console.log("📦 Seeding products...");
  let count = 0;

  // Process in batches to avoid timeouts
  const BATCH_SIZE = 20;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map((prod) => {
        const categoryId = categoryMap.get(prod.categorySlug) ?? null;
        return prisma.product.upsert({
          where: { slug: prod.slug },
          update: {
            name: prod.name,
            description: prod.description,
            shortDescription: prod.shortDescription,
            price: prod.price,
            compareAtPrice: prod.compareAtPrice,
            sku: prod.sku,
            isActive: prod.isActive,
            isFeatured: prod.isFeatured,
            stock: prod.stock,
            materials: prod.materials,
            categoryId,
          },
          create: {
            name: prod.name,
            slug: prod.slug,
            description: prod.description,
            shortDescription: prod.shortDescription,
            price: prod.price,
            compareAtPrice: prod.compareAtPrice,
            sku: prod.sku,
            isActive: prod.isActive,
            isFeatured: prod.isFeatured,
            stock: prod.stock,
            materials: prod.materials,
            categoryId,
            images: {
              create: prod.images.map((img) => ({ url: img.url, alt: img.alt, sortOrder: img.sortOrder })),
            },
            variants: {
              create: prod.variants.map((v) => ({
                name: v.name,
                color: v.color,
                size: v.size,
                price: v.price,
                stock: v.stock,
                sortOrder: v.sortOrder,
              })),
            },
          },
        });
      }),
    );

    count += batch.length;
    console.log(`   ... ${Math.min(i + BATCH_SIZE, products.length)}/${products.length} products seeded`);
    await new Promise((r) => setTimeout(r, 100)); // Small delay between batches
  }

  console.log(`   ✅ ${count} products created`);
  return count;
}

async function seedReviews(): Promise<number> {
  console.log("📦 Seeding reviews...");
  let count = 0;

  for (const rev of reviews) {
    const product = await prisma.product.findUnique({ where: { slug: rev.productSlug } });
    if (!product) continue;

    let user = await prisma.user.findUnique({ where: { email: rev.authorEmail } });
    if (!user) {
      await auth.api.signUpEmail({ body: { email: rev.authorEmail, password: "ReviewUser123!", name: rev.authorName } });
      user = await prisma.user.findUnique({ where: { email: rev.authorEmail } });
    }

    if (!user) continue;

    await prisma.review.create({
      data: {
        productId: product.id,
        userId: user.id,
        rating: rev.rating,
        title: rev.title,
        content: rev.content,
        isApproved: true,
      },
    });
    count++;
  }

  console.log(`   ✅ ${count} reviews created`);
  return count;
}

async function seedDiscountCodes(): Promise<number> {
  console.log("📦 Seeding discount codes...");
  let count = 0;

  for (const dc of discountCodes) {
    await prisma.discountCode.upsert({
      where: { code: dc.code },
      update: {},
      create: dc,
    });
    count++;
  }

  console.log(`   ✅ ${count} discount codes created`);
  return count;
}

async function seedAdminUser(): Promise<void> {
  console.log("👤 Seeding admin user...");
  const ADMIN_EMAIL = "admin@calzoleriaprevenzano.it";
  const ADMIN_PASSWORD = "Admin123!";
  const ADMIN_NAME = "Nunzio Prevenzano";

  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!existing) {
    await auth.api.signUpEmail({ body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: ADMIN_NAME } });
    await prisma.user.update({ where: { email: ADMIN_EMAIL }, data: { role: "admin", emailVerified: true } });
    console.log(`   ✅ Admin user created (${ADMIN_EMAIL})`);
  } else {
    await prisma.user.update({ where: { email: ADMIN_EMAIL }, data: { role: "admin", emailVerified: true, name: ADMIN_NAME } });
    console.log(`   ✅ Admin user updated (${ADMIN_EMAIL})`);
  }
}

async function main() {
  console.log("🌱 Starting database seed — Calzoleria Prevenzano");
  console.log("=".repeat(55));

  await cleanExistingData();
  const categoryMap = await seedCategories();
  const productCount = await seedProducts(categoryMap);
  await seedReviews();
  await seedDiscountCodes();
  await seedAdminUser();

  console.log("=".repeat(55));
  console.log("✅ Seed complete");
  console.log(`   Categories: ${categoryMap.size}`);
  console.log(`   Products: ${productCount}`);
  console.log(`   Images: ${products.reduce((sum, p) => sum + p.images.length, 0)}`);
}

main()
  .catch((e: unknown) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
