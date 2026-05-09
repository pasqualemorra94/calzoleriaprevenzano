/**
 * seed-strass-prod.ts
 *
 * Seed completo dei sandali strass su PROD via DB tunnel + API admin.
 *
 * Step:
 *  1. Crea una session admin temporanea direttamente nel DB (firmata con BETTER_AUTH_SECRET)
 *  2. Per ogni foto in public/uploads/2026/05/sandali-strass/: POST /api/upload con cookie
 *  3. Ottiene URL fal-style e memorizza mapping
 *  4. Crea VariantTemplate strass-colore + 11 prodotti via Prisma con gli URL ricevuti
 *  5. Cancella la session admin temporanea
 *
 * Env required:
 *   DATABASE_URL (DATABASE_PUBLIC_URL del DB Railway)
 *   BETTER_AUTH_SECRET (Better Auth secret di prod)
 *   APP_URL (default: https://calzoleria-prevenzano-production.up.railway.app)
 *
 * Run: railway run --service Postgres -- bash -c 'BETTER_AUTH_SECRET=... APP_URL=... DATABASE_URL=$DATABASE_PUBLIC_URL npx tsx scripts/seed-strass-prod.ts'
 */
import { PrismaClient } from "@prisma/client";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const PHOTOS_DIR = path.join(PROJECT_ROOT, "public", "uploads", "2026", "05", "sandali-strass");
const SWATCHES_URL_PREFIX = "/images/swatches/strass";

const APP_URL = (process.env.APP_URL || "https://calzoleria-prevenzano-production.up.railway.app").replace(/\/$/, "");
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
if (!BETTER_AUTH_SECRET) {
  console.error("❌ BETTER_AUTH_SECRET non impostato");
  process.exit(1);
}

const prisma = new PrismaClient();

// ─── Strass options (24) ──────────────────────────────────────────────────

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

interface ProductDef {
  slug: string;
  name: string;
  price: number;
  type: "misto" | "solo-strass";
  photoPrefix: string;
  description: string;
}

const PRODUCTS: ProductDef[] = [
  { slug: "elena-strass", name: "Elena", price: 95, type: "misto", photoPrefix: "elena 95€ strass", description: "Sandalo con cinturini in pelle e cinturini ricoperti di strass. Personalizzabile." },
  { slug: "elisa-argento-strass", name: "Elisa Argento", price: 90, type: "misto", photoPrefix: "elisa argento 90€ strass", description: "Sandalo infradito con cinturino strass argento e caviglia in pelle." },
  { slug: "elisa-azzurro-strass", name: "Elisa Azzurro", price: 90, type: "misto", photoPrefix: "elisa azzurro 90€ strass", description: "Sandalo infradito con cinturino strass azzurro e caviglia in pelle." },
  { slug: "elisa-black-strass", name: "Elisa Black", price: 90, type: "misto", photoPrefix: "elisa black 90€ strass", description: "Sandalo infradito con cinturino strass nero e caviglia in pelle." },
  { slug: "elisa-oro-strass", name: "Elisa Oro", price: 90, type: "misto", photoPrefix: "elisa oro 90€ strass", description: "Sandalo infradito con cinturino strass oro e caviglia in pelle." },
  { slug: "elisa-oro-rosa-strass", name: "Elisa Oro Rosa", price: 90, type: "misto", photoPrefix: "elisa oro rosa 90€ strass", description: "Sandalo infradito con cinturino strass oro rosa e caviglia in pelle." },
  { slug: "elisa-verde-strass", name: "Elisa Verde", price: 90, type: "misto", photoPrefix: "elisa verde 90€ strass", description: "Sandalo infradito con cinturino strass verde e caviglia in pelle." },
  { slug: "elisabetta-strass", name: "Elisabetta", price: 90, type: "solo-strass", photoPrefix: "elisabetta 90€ strass", description: "Sandalo interamente ricoperto di strass su tutti i cinturini." },
  { slug: "federica-strass", name: "Federica", price: 80, type: "misto", photoPrefix: "federica 80€ strass", description: "Sandalo con cinturini incrociati strass e pelle metallizzata." },
  { slug: "fiona-strass", name: "Fiona", price: 95, type: "misto", photoPrefix: "fiona 95€ strass", description: "Sandalo con tre cinturini strass nell'avampiede e caviglia in pelle." },
  { slug: "francy-strass", name: "Francy", price: 95, type: "misto", photoPrefix: "francy 95€ strass", description: "Sandalo con cinturini in pelle e dettagli strass sottili." },
];

// ─── Helpers ─────────────────────────────────────────────────────────────

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

function findProductPhotos(prefix: string): string[] {
  const files = fs.readdirSync(PHOTOS_DIR);
  const lowerPrefix = prefix.toLowerCase();
  return files
    .filter((f) => f.toLowerCase().startsWith(lowerPrefix))
    .sort((a, b) => {
      const aHasParen = a.includes("(");
      const bHasParen = b.includes("(");
      if (aHasParen !== bHasParen) return aHasParen ? 1 : -1;
      return a.localeCompare(b);
    });
}

function hashPasswordScrypt(password: string): string {
  // Replica @better-auth/utils: scrypt N=16384, r=16, p=1, dkLen=64, salt 16 bytes hex
  const salt = crypto.randomBytes(16).toString("hex");
  const key = crypto.scryptSync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${key.toString("hex")}`;
}

async function loginAsAdmin(): Promise<{ cookieHeader: string; restorePassword: () => Promise<void> }> {
  const admin = await prisma.user.findFirst({
    where: { OR: [{ role: "admin" }, { role: "ADMIN" }] },
    include: { accounts: { where: { providerId: "credential" } } },
  });
  if (!admin || admin.accounts.length === 0) throw new Error("Nessun admin con credential");
  const credAccount = admin.accounts[0];
  console.log(`🔑 Admin: ${admin.email}`);

  const originalPassword = credAccount.password!;
  const tempPassword = `seed_temp_${crypto.randomBytes(8).toString("hex")}`;
  const tempHash = hashPasswordScrypt(tempPassword);

  await prisma.account.update({ where: { id: credAccount.id }, data: { password: tempHash } });
  console.log(`✅ Password temporanea impostata`);

  const restorePassword = async () => {
    await prisma.account.update({ where: { id: credAccount.id }, data: { password: originalPassword } });
    console.log(`🔒 Password originale ripristinata`);
  };

  // Sign-in via better-auth API (richiede Origin per CSRF)
  const signInResp = await fetch(`${APP_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: APP_URL,
      Referer: `${APP_URL}/auth/login`,
    },
    body: JSON.stringify({ email: admin.email, password: tempPassword }),
  });
  if (!signInResp.ok) {
    await restorePassword();
    throw new Error(`sign-in HTTP ${signInResp.status}: ${(await signInResp.text()).slice(0, 200)}`);
  }
  const setCookies = signInResp.headers.getSetCookie ? signInResp.headers.getSetCookie() : [signInResp.headers.get("set-cookie") || ""];
  const sessionCookie = setCookies.find((c) => c.includes("better-auth.session_token="));
  if (!sessionCookie) {
    await restorePassword();
    throw new Error(`no session cookie in response: ${setCookies.join(", ").slice(0, 200)}`);
  }
  const cookieValue = sessionCookie.split(";")[0]; // "better-auth.session_token=...."
  console.log(`✅ Login ok, cookie ricevuto (${cookieValue.length} chars)`);

  return { cookieHeader: cookieValue, restorePassword };
}

async function uploadPhoto(localPath: string, filename: string, cookieHeader: string): Promise<string> {
  const buffer = fs.readFileSync(localPath);
  const blob = new Blob([buffer], { type: "image/webp" });
  const formData = new FormData();
  formData.append("files", blob, filename);
  formData.append("folder", "products/sandali-strass");

  const resp = await fetch(`${APP_URL}/api/upload`, {
    method: "POST",
    headers: { Cookie: cookieHeader, Origin: APP_URL, Referer: `${APP_URL}/admin/prodotti` },
    body: formData,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`upload ${filename} HTTP ${resp.status}: ${text.slice(0, 200)}`);
  }
  const json = (await resp.json()) as { data?: { uploaded?: Array<{ url: string }> } };
  const url = json.data?.uploaded?.[0]?.url;
  if (!url) throw new Error(`upload ${filename}: nessun URL ritornato. Resp: ${JSON.stringify(json).slice(0, 300)}`);
  return url;
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Seed Sandali Strass su PROD ===\n");
  console.log(`APP_URL: ${APP_URL}`);

  // Verifica preconditions
  const chiara = await prisma.product.findUnique({ where: { slug: "chiara" }, select: { variantConfig: true } });
  if (!chiara?.variantConfig) throw new Error("Chiara non trovata su prod");
  const chiaraGroups = (chiara.variantConfig as { groups: unknown[] }).groups;

  const strassCategory = await prisma.category.findUnique({ where: { slug: "strass" } });
  if (!strassCategory) throw new Error("Categoria strass non trovata");
  console.log(`✅ Categoria strass: ${strassCategory.id}`);

  // 1. Login admin (cambia password temp + sign-in)
  const { cookieHeader, restorePassword } = await loginAsAdmin();

  try {
    // 2. Upload tutte le foto e costruisci mapping
    const allFiles = fs.readdirSync(PHOTOS_DIR).filter((f) => f.endsWith(".webp"));
    console.log(`\n📸 Upload ${allFiles.length} foto via /api/upload...`);
    const photoUrls: Record<string, string> = {};
    for (let i = 0; i < allFiles.length; i++) {
      const f = allFiles[i];
      const url = await uploadPhoto(path.join(PHOTOS_DIR, f), f, cookieHeader);
      photoUrls[f] = url;
      console.log(`  [${i + 1}/${allFiles.length}] ${f}  →  ${url}`);
    }

    // 3. VariantTemplate strass-colore
    const strassGroup = buildStrassGroup();
    const tpl = await prisma.variantTemplate.upsert({
      where: { slug: "strass-colore" },
      update: {
        name: "Strass — Colore Filo",
        description: `${STRASS_OPTIONS.length} colori strass per cinturini sandali (foto reali scontornate)`,
        config: { groups: [strassGroup] } as never,
      },
      create: {
        slug: "strass-colore",
        name: "Strass — Colore Filo",
        description: `${STRASS_OPTIONS.length} colori strass per cinturini sandali (foto reali scontornate)`,
        config: { groups: [strassGroup] } as never,
      },
    });
    console.log(`\n✅ VariantTemplate: ${tpl.name}`);

    // 4. Crea/upsert prodotti
    let created = 0;
    let updated = 0;
    let totalPhotos = 0;
    for (const def of PRODUCTS) {
      const photos = findProductPhotos(def.photoPrefix);
      if (photos.length === 0) {
        console.warn(`  ⚠️  ${def.slug}: nessuna foto trovata`);
        continue;
      }

      const groups = def.type === "solo-strass" ? [strassGroup, TACCO_GROUP, TAGLIA_GROUP] : [...chiaraGroups, strassGroup];
      const variantConfig = { groups };

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
      if (existing) updated++; else created++;

      // Cleanup vecchie ProductImage e crea nuove
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      for (let i = 0; i < photos.length; i++) {
        const url = photoUrls[photos[i]];
        if (!url) {
          console.warn(`  ⚠️  Foto non uploadata: ${photos[i]}`);
          continue;
        }
        await prisma.productImage.create({
          data: { productId: product.id, url, alt: `${def.name} - foto ${i + 1}`, sortOrder: i },
        });
        totalPhotos++;
      }
      console.log(`  ${existing ? "🔄" : "✨"} ${def.name.padEnd(20)} ${def.type.padEnd(12)} €${def.price}  ${photos.length} foto`);
    }
    console.log(`\n✅ Prodotti: ${created} creati, ${updated} aggiornati`);
    console.log(`✅ ProductImage: ${totalPhotos} totali`);
  } finally {
    // Ripristina password originale
    await restorePassword();
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
