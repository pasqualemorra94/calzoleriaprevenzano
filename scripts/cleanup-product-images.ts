/**
 * cleanup-product-images.ts
 *
 * CLI per cancellare le ProductImage di qualità "ridicola" dal DB Railway.
 * Definizione "ridicola": width < 400 OR height < 400 OR width IS NULL OR height IS NULL.
 *
 * Regola keep-1: se un prodotto ha SOLO foto ridicole, ne mantiene 1
 * (la più grande per area = width*height; in subordine sortOrder asc).
 *
 * Uso (in locale, con DATABASE_URL puntato al DB Railway):
 *   pnpm tsx scripts/cleanup-product-images.ts             # dry-run (default)
 *   pnpm tsx scripts/cleanup-product-images.ts --execute   # cancellazione reale
 *   pnpm tsx scripts/cleanup-product-images.ts --help      # stampa istruzioni
 *
 * Sicurezza:
 *   - Soglia hard-coded (MIN_DIMENSION = 400), mai da argv.
 *   - --execute richiede flag esplicito (default = dry-run).
 *   - DATABASE_URL deve essere settato (exit 1 altrimenti).
 *   - Warning loud se DATABASE_URL non contiene "railway" o "prevenzano".
 *   - Countdown 5s prima della cancellazione, abortable con Ctrl-C.
 *   - Solo righe DB cancellate. File fisici in public/images/products/ restano
 *     (cleanup file orfani = step manuale separato se desiderato).
 */

import { PrismaClient } from "@prisma/client";

// ─── Config hard-coded ─────────────────────────────────────────────────────
const MIN_DIMENSION = 400; // pixel — sotto a questo è "ridicolo"

// ─── Help text ────────────────────────────────────────────────────────────
const HELP_TEXT = `
cleanup-product-images.ts — Pulizia ProductImage di qualità ridicola

USO:
  pnpm tsx scripts/cleanup-product-images.ts [opzioni]

OPZIONI:
  (nessuna)      Esegue una dry-run: stampa l'anteprima senza cancellare.
  --execute      Esegue la cancellazione reale (con countdown di 5 secondi).
  --dry-run      Esplicito (equivalente al default).
  --help, -h     Stampa questo messaggio ed esce.

CRITERIO "RIDICOLA" (hard-coded):
  width < ${MIN_DIMENSION} OR height < ${MIN_DIMENSION} OR width IS NULL OR height IS NULL

REGOLA KEEP-1:
  Se TUTTE le foto di un prodotto sono ridicole, ne tiene 1 (la più grande
  per area = width*height; subordine: sortOrder asc).

PRE-REQUISITI:
  - DATABASE_URL puntato al DB su cui operare.
  - Eseguire da una rete sicura.
`;

// ─── Argv parsing ─────────────────────────────────────────────────────────
function parseArgs(argv: string[]): { execute: boolean; help: boolean } {
  const set = new Set(argv.slice(2));
  return {
    execute: set.has("--execute"),
    help: set.has("--help") || set.has("-h"),
  };
}

// ─── Safety checks ────────────────────────────────────────────────────────
function assertDatabaseUrl(): void {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL non settato. Esporta la variabile e riprova.");
    process.exit(1);
  }
  if (!url.toLowerCase().includes("railway") && !url.toLowerCase().includes("prevenzano")) {
    console.warn(
      "⚠️  Attenzione: DATABASE_URL non contiene 'railway' o 'prevenzano'.\n" +
        "   Assicurati di puntare al DB corretto prima di --execute.",
    );
  }
}

async function countdown(seconds: number): Promise<void> {
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(`\r⏳ Cancellazione in ${i}s... (Ctrl-C per annullare) `);
    await new Promise((r) => setTimeout(r, 1000));
  }
  process.stdout.write("\r🚀 Eseguo...                                          \n");
}

// ─── Core logic ───────────────────────────────────────────────────────────
interface ProductBucket {
  productId: string;
  productName: string;
  total: number;
  bad: Array<{ id: string; url: string; width: number | null; height: number | null; sortOrder: number }>;
  good: Array<{ id: string; url: string; width: number | null; height: number | null }>;
}

async function buildBuckets(prisma: PrismaClient): Promise<ProductBucket[]> {
  // Recupera tutti i prodotti con almeno 1 immagine ridicola, con tutte le loro immagini
  const productIds = await prisma.$queryRaw<Array<{ productId: string }>>`
    SELECT DISTINCT "productId"
    FROM "ProductImage"
    WHERE width IS NULL OR height IS NULL OR width < ${MIN_DIMENSION} OR height < ${MIN_DIMENSION}
  `;
  if (productIds.length === 0) return [];

  const ids = productIds.map((r) => r.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      images: {
        select: { id: true, url: true, width: true, height: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return products.map((p) => {
    const bad = p.images.filter(
      (img) => img.width === null || img.height === null || img.width < MIN_DIMENSION || img.height < MIN_DIMENSION,
    );
    const good = p.images.filter(
      (img) =>
        img.width !== null &&
        img.height !== null &&
        img.width >= MIN_DIMENSION &&
        img.height >= MIN_DIMENSION,
    );
    return {
      productId: p.id,
      productName: p.name,
      total: p.images.length,
      bad,
      good,
    };
  });
}

interface DeletionPlan {
  toDelete: string[]; // ProductImage IDs
  productsKeep1: Array<{ name: string; keptImage: { url: string; width: number | null; height: number | null } }>;
  productsNormal: number; // prodotti che restano con almeno 1 good
  imagesDeleted: number;
  imagesKept: number;
}

function computePlan(buckets: ProductBucket[]): DeletionPlan {
  const toDelete: string[] = [];
  const productsKeep1: DeletionPlan["productsKeep1"] = [];
  let productsNormal = 0;

  for (const b of buckets) {
    if (b.good.length > 0) {
      // ALMENO 1 good → elimina TUTTE le bad
      productsNormal += 1;
      for (const img of b.bad) toDelete.push(img.id);
    } else {
      // TUTTE bad → keep-1 rule: tieni la più grande per area, poi sortOrder asc
      const sorted = [...b.bad].sort((a, b) => {
        const areaA = (a.width ?? 0) * (a.height ?? 0);
        const areaB = (b.width ?? 0) * (b.height ?? 0);
        if (areaB !== areaA) return areaB - areaA;
        return a.sortOrder - b.sortOrder;
      });
      const keep = sorted[0];
      const drop = sorted.slice(1);
      productsKeep1.push({
        name: b.productName,
        keptImage: { url: keep.url, width: keep.width, height: keep.height },
      });
      for (const img of drop) toDelete.push(img.id);
    }
  }

  return {
    toDelete,
    productsKeep1,
    productsNormal,
    imagesDeleted: toDelete.length,
    imagesKept: buckets.length - productsKeep1.length + productsKeep1.length, // 1 per prodotto + good
  };
}

function printReport(buckets: ProductBucket[], plan: DeletionPlan, isDryRun: boolean): void {
  console.log("\n" + "═".repeat(70));
  console.log(`📋 ${isDryRun ? "DRY-RUN" : "EXECUTE"} — ProductImage cleanup report`);
  console.log("═".repeat(70));
  console.log(`Soglia "ridicola": width < ${MIN_DIMENSION} OR height < ${MIN_DIMENSION} OR NULL`);
  console.log(`Prodotti con foto ridicole: ${buckets.length}`);
  console.log(`  → con almeno 1 foto buona (eliminazione normale): ${plan.productsNormal}`);
  console.log(`  → con TUTTE foto ridicole (keep-1 rule): ${plan.productsKeep1.length}`);
  console.log(`Immagini totali da eliminare: ${plan.imagesDeleted}`);
  console.log("─".repeat(70));

  for (const b of buckets) {
    const allBad = b.good.length === 0;
    console.log(`\n  ${b.productName}  (${b.total} foto totali, ${b.bad.length} ridicole${allBad ? " → KEEP-1" : ""})`);

    if (allBad) {
      // Mostra cosa tiene e cosa elimina
      const sorted = [...b.bad].sort((a, b) => {
        const areaA = (a.width ?? 0) * (a.height ?? 0);
        const areaB = (b.width ?? 0) * (b.height ?? 0);
        if (areaB !== areaA) return areaB - areaA;
        return a.sortOrder - b.sortOrder;
      });
      const keep = sorted[0];
      console.log(`    ✅ KEEP  ${keep.width ?? "?"}x${keep.height ?? "?"}  ${keep.url}`);
      for (const img of sorted.slice(1)) {
        console.log(`    ❌ DROP  ${img.width ?? "?"}x${img.height ?? "?"}  ${img.url}`);
      }
    } else {
      for (const img of b.bad) {
        console.log(`    ❌ DROP  ${img.width ?? "?"}x${img.height ?? "?"}  ${img.url}`);
      }
      for (const img of b.good.slice(0, 1)) {
        console.log(`    ✅ KEEP  ${img.width ?? "?"}x${img.height ?? "?"}  ${img.url}  (+ altri ${b.good.length - 1} good)`);
      }
    }
  }
  console.log("\n" + "═".repeat(70));
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(HELP_TEXT);
    return;
  }

  assertDatabaseUrl();

  const prisma = new PrismaClient();
  try {
    const buckets = await buildBuckets(prisma);
    if (buckets.length === 0) {
      console.log("✨ Nessuna immagine ridicola trovata. Niente da fare.");
      return;
    }

    const plan = computePlan(buckets);
    printReport(buckets, plan, !args.execute);

    if (!args.execute) {
      console.log("ℹ️  DRY-RUN — nessuna cancellazione eseguita.");
      console.log("   Esegui con --execute per cancellare davvero.");
      return;
    }

    if (plan.toDelete.length === 0) {
      console.log("✨ Niente da cancellare (tutte le foto ridicole sono protette dalla regola keep-1).");
      return;
    }

    await countdown(5);
    const result = await prisma.productImage.deleteMany({
      where: { id: { in: plan.toDelete } },
    });
    console.log(`✅ Cancellate ${result.count} righe ProductImage.`);
    console.log("ℹ️  I file fisici in public/images/products/ NON sono stati toccati.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Errore:", err);
  process.exit(1);
});
