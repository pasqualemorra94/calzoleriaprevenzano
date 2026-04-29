/**
 * cleanup-e2e-orders.ts
 *
 * CLI per cancellare gli ordini creati dai test E2E sul DB Railway.
 * Identifica gli ordini di test tramite il pattern email guest hard-coded:
 * "e2e+%@test.calzoleriaprevenzano.it" (LIKE su Order.guestEmail).
 *
 * Uso (in locale, con DATABASE_URL puntato al DB Railway):
 *   pnpm tsx scripts/cleanup-e2e-orders.ts             # dry-run (default)
 *   pnpm tsx scripts/cleanup-e2e-orders.ts --execute   # cancellazione reale
 *   pnpm tsx scripts/cleanup-e2e-orders.ts --help      # stampa istruzioni
 *
 * Schema FK (verificato in prisma/schema.prisma):
 *   - Order → OrderItem : onDelete: Cascade  (auto)
 *   - Order → Payment   : onDelete: Cascade  (auto)
 *   - OrderItem → Address: NO cascade        (Address rimane, safe)
 * Quindi è sufficiente cancellare gli Order: gli OrderItem e i Payment
 * vengono rimossi automaticamente. Gli Address NON vengono toccati.
 *
 * Sicurezza:
 *   - Marker email è una const al top del file, MAI da argv.
 *   - --execute richiede flag esplicito (default è dry-run).
 *   - DATABASE_URL deve essere settato (exit 1 altrimenti).
 *   - Warning loud se DATABASE_URL non contiene "railway" o "prevenzano".
 *   - Countdown 5s prima della cancellazione, abortable con Ctrl-C.
 */

import { PrismaClient } from "@prisma/client";

// ─── Config hard-coded ─────────────────────────────────────────────────────
// Pattern Postgres LIKE: '%' come wildcard.
// NON accettare mai un pattern arbitrario da CLI (sicurezza).
const E2E_EMAIL_MARKER = "e2e+%@test.calzoleriaprevenzano.it";

// ─── Help text ────────────────────────────────────────────────────────────
const HELP_TEXT = `
cleanup-e2e-orders.ts — Pulizia ordini E2E

USO:
  pnpm tsx scripts/cleanup-e2e-orders.ts [opzioni]

OPZIONI:
  (nessuna)      Esegue una dry-run: stampa l'anteprima senza cancellare.
  --execute      Esegue la cancellazione reale (con countdown di 5 secondi).
  --dry-run      Esplicito (equivalente al default).
  --help, -h     Stampa questo messaggio ed esce.

PATTERN MARKER (hard-coded):
  ${E2E_EMAIL_MARKER}

PREREQUISITI:
  - process.env.DATABASE_URL deve essere settato.
  - Per il DB Railway: esporta temporaneamente la URL del progetto Railway
    prima di eseguire lo script (es. tramite "railway variables" o copia
    manuale dalla dashboard).

ESEMPIO TIPICO:
  export DATABASE_URL="postgres://...railway..."
  pnpm tsx scripts/cleanup-e2e-orders.ts             # prima la dry-run
  pnpm tsx scripts/cleanup-e2e-orders.ts --execute   # poi cancella

EXIT CODES:
  0 — successo (anche dry-run con zero match).
  1 — errore (DATABASE_URL mancante, errore Prisma, ecc.).
`.trim();

// ─── Utility ───────────────────────────────────────────────────────────────
function parseArgs(argv: readonly string[]): {
  help: boolean;
  execute: boolean;
} {
  return {
    help: argv.includes("--help") || argv.includes("-h"),
    execute: argv.includes("--execute"),
  };
}

function fail(message: string): never {
  // biome-ignore lint/suspicious/noConsole: CLI tool
  console.error(`\n[ERRORE] ${message}\n`);
  process.exit(1);
}

function info(message: string): void {
  // biome-ignore lint/suspicious/noConsole: CLI tool
  console.log(message);
}

function warn(message: string): void {
  // biome-ignore lint/suspicious/noConsole: CLI tool
  console.warn(message);
}

function formatDate(d: Date): string {
  return d.toISOString().replace("T", " ").slice(0, 19);
}

function decimalToString(value: unknown): string {
  // Prisma.Decimal espone .toString(); fallback per number/null.
  if (value === null || value === undefined) return "0";
  if (typeof value === "object" && value !== null && "toString" in value) {
    return (value as { toString: () => string }).toString();
  }
  return String(value);
}

async function countdown(seconds: number): Promise<void> {
  for (let i = seconds; i > 0; i--) {
    info(`  ${i}…  (Premi Ctrl-C entro ${i}s per annullare)`);
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    info(HELP_TEXT);
    process.exit(0);
  }

  // Pre-flight: DATABASE_URL obbligatorio
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.trim().length === 0) {
    fail(
      "DATABASE_URL non è settato. Esporta la URL del DB Railway prima di eseguire:\n" +
        '  export DATABASE_URL="postgres://...railway..."',
    );
  }

  // Sanity warning: se la URL non sembra Railway/Prevenzano, segnala
  const urlLower = dbUrl.toLowerCase();
  if (!urlLower.includes("railway") && !urlLower.includes("prevenzano")) {
    warn(
      "\n[WARN] DATABASE_URL non contiene 'railway' né 'prevenzano'.\n" +
        "       Verifica di star puntando al DB corretto prima di proseguire.\n",
    );
  }

  const mode = args.execute ? "EXECUTE" : "DRY-RUN";
  info(`\n━━━ cleanup-e2e-orders [${mode}] ━━━`);
  info(`Marker email (LIKE): ${E2E_EMAIL_MARKER}`);
  info("");

  const prisma = new PrismaClient();

  try {
    // ── Trova gli ordini di test ─────────────────────────────────────────
    // Pattern hard-coded: "e2e+%@test.calzoleriaprevenzano.it"
    // Prisma non ha un `like` raw in JS-mode, quindi simuliamo con
    // startsWith("e2e+") AND endsWith("@test.calzoleriaprevenzano.it").
    const matched = await prisma.order.findMany({
      where: {
        AND: [
          {
            guestEmail: {
              startsWith: "e2e+",
              mode: "insensitive",
            },
          },
          {
            guestEmail: {
              endsWith: "@test.calzoleriaprevenzano.it",
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        orderNumber: true,
        guestEmail: true,
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const count = matched.length;

    // ── Idempotenza: zero match = no-op ─────────────────────────────────
    if (count === 0) {
      info("Nessun ordine di test trovato. Niente da fare.");
      process.exit(0);
    }

    // ── Anteprima ────────────────────────────────────────────────────────
    const totalSum = matched.reduce<number>((acc, o) => {
      const n = Number(decimalToString(o.total));
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);

    const oldest = matched[0];
    const newest = matched[matched.length - 1];
    if (!oldest || !newest) {
      // Difensivo: matched.length > 0 garantito sopra, ma TS narrow.
      info("Nessun ordine di test trovato. Niente da fare.");
      process.exit(0);
    }

    info(`Ordini di test trovati: ${count}`);
    info(`Importo totale (somma di order.total): € ${totalSum.toFixed(2)}`);
    info(
      `Più vecchio: ${oldest.orderNumber} — ${formatDate(oldest.createdAt)}`,
    );
    info(
      `Più recente: ${newest.orderNumber} — ${formatDate(newest.createdAt)}`,
    );
    info("");
    info("Campione (primi 10 orderNumber):");
    const sample = matched.slice(0, 10);
    for (const o of sample) {
      info(
        `  - ${o.orderNumber}  (${o.guestEmail ?? "—"})  ${formatDate(o.createdAt)}`,
      );
    }
    if (count > sample.length) {
      info(`  …e altri ${count - sample.length} ordini.`);
    }
    info("");

    // ── Dry-run: stop qui ────────────────────────────────────────────────
    if (!args.execute) {
      info("[DRY-RUN] Nessuna modifica al DB.");
      info(
        "Per cancellare davvero, ri-esegui con --execute (avrai 5s per annullare).",
      );
      process.exit(0);
    }

    // ── Execute: countdown poi delete ────────────────────────────────────
    info("[EXECUTE] Sto per cancellare gli ordini sopra elencati.");
    info(
      "Cascade: gli OrderItem e i Payment associati verranno rimossi automaticamente.",
    );
    info("Gli Address NON vengono cancellati (potrebbero essere riutilizzati).");
    info("");
    await countdown(5);
    info("");

    const idsToDelete = matched.map((o) => o.id);

    // deleteMany con cascade (FK a livello DB):
    //   - OrderItem.orderId  : onDelete: Cascade
    //   - Payment.orderId    : onDelete: Cascade
    const result = await prisma.order.deleteMany({
      where: { id: { in: idsToDelete } },
    });

    info(`Cancellazione completata: ${result.count} ordini rimossi.`);
    if (result.count !== count) {
      warn(
        `[WARN] Mismatch: trovati ${count} ma cancellati ${result.count}. ` +
          "Possibile concorrenza: ricontrolla manualmente.",
      );
    }
    process.exit(0);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    fail(`Errore durante l'esecuzione: ${msg}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
