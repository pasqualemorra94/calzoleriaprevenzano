/**
 * populate-and-cleanup-prod-images.ts
 *
 * 2-in-1 script per il DB Railway production:
 *   1. POPULATE: per ogni ProductImage con width/height NULL, legge il file fisico
 *      da public/<url> e popola le dimensioni reali (UPDATE su DB).
 *   2. CLEANUP: applica la stessa logica di cleanup-product-images.ts
 *      (elimina tiny <400 con regola keep-1).
 *
 * Necessario perché su production le righe ProductImage hanno width/height NULL
 * (mai popolato dal seed originale), quindi cleanup-product-images.ts da solo
 * marcherebbe TUTTO come "unknown" e applicherebbe keep-1 universalmente,
 * eliminando troppe foto buone.
 *
 * Uso (DATABASE_URL = Railway public):
 *   pnpm tsx scripts/populate-and-cleanup-prod-images.ts             # dry-run
 *   pnpm tsx scripts/populate-and-cleanup-prod-images.ts --execute   # esegue davvero
 *
 * Sicurezza:
 *   - --execute richiede flag esplicito.
 *   - Countdown 5s prima di mutate.
 *   - Solo righe DB cancellate; file fisici NON toccati.
 *   - Soglia hard-coded MIN_DIMENSION = 400.
 */

import { PrismaClient } from "@prisma/client";
import { imageSize } from "image-size";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const MIN_DIMENSION = 400;
const PUBLIC_DIR = join(process.cwd(), "public");

interface SizedImage {
  id: string;
  productId: string;
  url: string;
  sortOrder: number;
  width: number | null;
  height: number | null;
  fileExists: boolean;
  resolvedWidth: number | null;
  resolvedHeight: number | null;
}

function readDimensionsFromFile(url: string): { width: number | null; height: number | null; exists: boolean } {
  const filePath = join(PUBLIC_DIR, url.replace(/^\//, ""));
  if (!existsSync(filePath)) return { width: null, height: null, exists: false };
  try {
    const buf = readFileSync(filePath);
    const dim = imageSize(buf);
    return { width: dim.width ?? null, height: dim.height ?? null, exists: true };
  } catch {
    return { width: null, height: null, exists: true };
  }
}

async function loadAllImages(prisma: PrismaClient): Promise<SizedImage[]> {
  const all = await prisma.productImage.findMany({
    select: { id: true, productId: true, url: true, sortOrder: true, width: true, height: true },
  });

  // For each NULL width, try to read from disk. Cache per URL (multi-row dedup).
  const urlCache = new Map<string, { width: number | null; height: number | null; exists: boolean }>();
  const result: SizedImage[] = [];
  for (const img of all) {
    const needsResolve = img.width === null || img.height === null;
    let resolvedWidth: number | null = img.width;
    let resolvedHeight: number | null = img.height;
    let fileExists = true;
    if (needsResolve) {
      let cached = urlCache.get(img.url);
      if (!cached) {
        cached = readDimensionsFromFile(img.url);
        urlCache.set(img.url, cached);
      }
      resolvedWidth = cached.width;
      resolvedHeight = cached.height;
      fileExists = cached.exists;
    }
    result.push({ ...img, fileExists, resolvedWidth, resolvedHeight });
  }
  return result;
}

interface ProductGroup {
  productId: string;
  productName: string;
  total: number;
  bad: SizedImage[];
  good: SizedImage[];
  fileMissing: SizedImage[];
}

async function groupByProduct(prisma: PrismaClient, images: SizedImage[]): Promise<ProductGroup[]> {
  const productIds = [...new Set(images.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  const nameMap = new Map(products.map((p) => [p.id, p.name]));

  const byProduct = new Map<string, SizedImage[]>();
  for (const img of images) {
    const arr = byProduct.get(img.productId) ?? [];
    arr.push(img);
    byProduct.set(img.productId, arr);
  }

  const result: ProductGroup[] = [];
  for (const [pid, imgs] of byProduct.entries()) {
    const fileMissing = imgs.filter((i) => !i.fileExists);
    const sized = imgs.filter((i) => i.fileExists);
    const bad = sized.filter((i) =>
      i.resolvedWidth === null ||
      i.resolvedHeight === null ||
      i.resolvedWidth < MIN_DIMENSION ||
      i.resolvedHeight < MIN_DIMENSION,
    );
    const good = sized.filter((i) =>
      i.resolvedWidth !== null &&
      i.resolvedHeight !== null &&
      i.resolvedWidth >= MIN_DIMENSION &&
      i.resolvedHeight >= MIN_DIMENSION,
    );
    if (bad.length === 0 && fileMissing.length === 0) continue; // niente da fare
    result.push({
      productId: pid,
      productName: nameMap.get(pid) ?? "(unknown)",
      total: imgs.length,
      bad,
      good,
      fileMissing,
    });
  }
  return result.sort((a, b) => a.productName.localeCompare(b.productName));
}

interface ActionPlan {
  toUpdate: Array<{ id: string; width: number; height: number }>;
  toDelete: string[];
  productsKeep1: number;
  productsNormal: number;
}

function computeActions(groups: ProductGroup[], allImages: SizedImage[]): ActionPlan {
  // UPDATE: tutte le immagini su file presente con width/height ora noti, e DB era NULL
  const toUpdate: ActionPlan["toUpdate"] = [];
  for (const img of allImages) {
    if (
      img.fileExists &&
      img.resolvedWidth !== null &&
      img.resolvedHeight !== null &&
      (img.width === null || img.height === null)
    ) {
      toUpdate.push({ id: img.id, width: img.resolvedWidth, height: img.resolvedHeight });
    }
  }

  // DELETE: per ogni gruppo, eliminare bad. Se good vuoto applicare keep-1.
  const toDelete: string[] = [];
  let productsKeep1 = 0;
  let productsNormal = 0;
  for (const g of groups) {
    // file mancanti: eliminare sempre (DB orfano)
    for (const img of g.fileMissing) toDelete.push(img.id);

    if (g.good.length > 0) {
      productsNormal += 1;
      for (const img of g.bad) toDelete.push(img.id);
    } else if (g.bad.length > 0) {
      // keep-1: tieni la più grande per area, sortOrder asc
      productsKeep1 += 1;
      const sorted = [...g.bad].sort((a, b) => {
        const aA = (a.resolvedWidth ?? 0) * (a.resolvedHeight ?? 0);
        const aB = (b.resolvedWidth ?? 0) * (b.resolvedHeight ?? 0);
        if (aB !== aA) return aB - aA;
        return a.sortOrder - b.sortOrder;
      });
      for (const img of sorted.slice(1)) toDelete.push(img.id);
    }
  }
  return { toUpdate, toDelete, productsKeep1, productsNormal };
}

function printReport(groups: ProductGroup[], plan: ActionPlan, isDryRun: boolean): void {
  console.log("\n" + "═".repeat(70));
  console.log(`📋 ${isDryRun ? "DRY-RUN" : "EXECUTE"} — populate + cleanup ProductImage`);
  console.log("═".repeat(70));
  console.log(`Soglia "ridicola": width < ${MIN_DIMENSION} OR height < ${MIN_DIMENSION}`);
  console.log(`Prodotti impattati: ${groups.length}`);
  console.log(`  → con almeno 1 foto buona (eliminazione normale): ${plan.productsNormal}`);
  console.log(`  → con TUTTE foto ridicole (keep-1 rule): ${plan.productsKeep1}`);
  console.log(`UPDATE (popolare width/height): ${plan.toUpdate.length} righe`);
  console.log(`DELETE (eliminare ridicole/orfane): ${plan.toDelete.length} righe`);
  console.log("─".repeat(70));

  for (const g of groups) {
    const allBad = g.good.length === 0;
    console.log(
      `\n  ${g.productName}  (tot=${g.total}, bad=${g.bad.length}, good=${g.good.length}, missing=${g.fileMissing.length}${allBad && g.bad.length > 0 ? " → KEEP-1" : ""})`,
    );

    for (const img of g.fileMissing) {
      console.log(`    ❌ DROP-MISSING  ${img.url}`);
    }

    if (allBad && g.bad.length > 0) {
      const sorted = [...g.bad].sort((a, b) => {
        const aA = (a.resolvedWidth ?? 0) * (a.resolvedHeight ?? 0);
        const aB = (b.resolvedWidth ?? 0) * (b.resolvedHeight ?? 0);
        if (aB !== aA) return aB - aA;
        return a.sortOrder - b.sortOrder;
      });
      const keep = sorted[0];
      console.log(`    ✅ KEEP  ${keep.resolvedWidth}x${keep.resolvedHeight}  ${keep.url}`);
      for (const img of sorted.slice(1)) {
        console.log(`    ❌ DROP  ${img.resolvedWidth}x${img.resolvedHeight}  ${img.url}`);
      }
    } else if (g.bad.length > 0) {
      for (const img of g.bad) {
        console.log(`    ❌ DROP  ${img.resolvedWidth}x${img.resolvedHeight}  ${img.url}`);
      }
      const firstGood = g.good[0];
      console.log(
        `    ✅ KEEP  ${firstGood.resolvedWidth}x${firstGood.resolvedHeight}  ${firstGood.url}  (+ altri ${g.good.length - 1} good)`,
      );
    }
  }
  console.log("\n" + "═".repeat(70));
}

async function countdown(seconds: number): Promise<void> {
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(`\r⏳ Esecuzione in ${i}s... (Ctrl-C per annullare) `);
    await new Promise((r) => setTimeout(r, 1000));
  }
  process.stdout.write("\r🚀 Eseguo...                                       \n");
}

async function main(): Promise<void> {
  const argv = new Set(process.argv.slice(2));
  const isExecute = argv.has("--execute");

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL non settato.");
    process.exit(1);
  }
  if (!url.includes("railway") && !url.includes("rlwy")) {
    console.warn("⚠️  DATABASE_URL non sembra Railway. Verifica prima di --execute.");
  }

  const prisma = new PrismaClient();
  try {
    console.log("📂 Lettura ProductImage e dimensioni file fisici...");
    const allImages = await loadAllImages(prisma);
    console.log(`   ${allImages.length} righe ProductImage totali.`);

    const groups = await groupByProduct(prisma, allImages);
    const plan = computeActions(groups, allImages);
    printReport(groups, plan, !isExecute);

    if (!isExecute) {
      console.log("ℹ️  DRY-RUN — nessuna modifica al DB.");
      console.log("   Esegui con --execute per applicare.");
      return;
    }

    if (plan.toUpdate.length === 0 && plan.toDelete.length === 0) {
      console.log("✨ Niente da fare.");
      return;
    }

    await countdown(5);

    if (plan.toUpdate.length > 0) {
      console.log(`\n📝 UPDATE ${plan.toUpdate.length} righe (popolazione width/height)...`);
      // batch update via prisma — 1 update per riga (semplice + safe)
      let done = 0;
      for (const u of plan.toUpdate) {
        await prisma.productImage.update({
          where: { id: u.id },
          data: { width: u.width, height: u.height },
        });
        done += 1;
        if (done % 50 === 0) console.log(`   ${done}/${plan.toUpdate.length}`);
      }
      console.log(`✅ ${done} righe aggiornate.`);
    }

    if (plan.toDelete.length > 0) {
      console.log(`\n🗑  DELETE ${plan.toDelete.length} righe...`);
      const r = await prisma.productImage.deleteMany({ where: { id: { in: plan.toDelete } } });
      console.log(`✅ ${r.count} righe eliminate.`);
    }

    console.log("\nℹ️  File fisici in public/images/products/ NON sono stati toccati.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Errore:", err);
  process.exit(1);
});
