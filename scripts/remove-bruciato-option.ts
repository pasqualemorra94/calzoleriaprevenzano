/**
 * remove-bruciato-option.ts
 *
 * Rimuove l'opzione di variante colore "Bruciato" da:
 *   - Product.variantConfig  (Json?, nullable)
 *   - VariantTemplate.config (Json, non nullable)
 * Match ESATTO su label === "bruciato" (case-insensitive): NON tocca "marrone bruciato".
 * Dry-run di default (nessuna scrittura). Flag --execute per applicare.
 * Idempotente: una seconda esecuzione rimuove 0 opzioni.
 *
 * NON tocca OrderItem/CartItem.selectedOptions (dati storici).
 *
 * Uso LOCALE (legge DATABASE_URL dal .env):
 *   npx tsx scripts/remove-bruciato-option.ts            # dry-run
 *   npx tsx scripts/remove-bruciato-option.ts --execute  # applica
 *
 * Uso RAILWAY:
 *   railway run --service Postgres -- bash -c 'DATABASE_URL=$DATABASE_PUBLIC_URL npx tsx scripts/remove-bruciato-option.ts'
 *   railway run --service Postgres -- bash -c 'DATABASE_URL=$DATABASE_PUBLIC_URL npx tsx scripts/remove-bruciato-option.ts --execute'
 */

import { PrismaClient } from "@prisma/client";

// ─── Tipi locali ────────────────────────────────────────────────────────
// Gli script in scripts/ NON importano da src/ né dall'alias "~/": tsx non
// risolve i path alias del tsconfig. Ridefiniamo qui la forma minima dei
// tipi variante (mirror di src/lib/types/variant-config.ts).

interface VariantOption {
  value: string;
  label: string;
  color?: string;
  priceModifier?: number;
  imageUrl?: string;
}

interface VariantGroup {
  id: string;
  label: string;
  type: "button" | "select" | "color-swatch";
  required: boolean;
  options: VariantOption[];
  dependsOn?: { groupId: string; optionValue: string };
}

interface VariantConfig {
  groups: VariantGroup[];
}

// Label target da rimuovere (confronto case-insensitive sul trim).
const TARGET_LABEL = "bruciato";

const prisma = new PrismaClient();

// ─── Type guard difensivo ──────────────────────────────────────────────
// Verifica runtime che il valore JSON abbia la forma minima di VariantConfig
// (groups: array, ogni group.options: array). Nessun cast cieco: si parte da
// `unknown` e si restringe progressivamente con controlli espliciti.
function isVariantConfig(value: unknown): value is VariantConfig {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as { groups?: unknown };
  if (!Array.isArray(obj.groups)) return false;
  for (const group of obj.groups) {
    if (typeof group !== "object" || group === null) return false;
    const g = group as { options?: unknown };
    if (!Array.isArray(g.options)) return false;
  }
  return true;
}

// ─── Funzione pura: rimozione dell'opzione "bruciato" ───────────────────
// NON muta l'input. Ritorna un nuovo VariantConfig con le options filtrate,
// più metadati di reportistica.
interface StripResult {
  config: VariantConfig;
  removed: number;
  affectedGroups: string[];
  emptiedGroups: string[];
}

function stripBruciato(config: VariantConfig): StripResult {
  let removed = 0;
  const affectedGroups: string[] = [];
  const emptiedGroups: string[] = [];

  const newGroups: VariantGroup[] = config.groups.map((group) => {
    const beforeCount = group.options.length;
    // Tieni le opzioni la cui label NON è esattamente "bruciato" (case-insensitive).
    // "marrone bruciato".trim().toLowerCase() !== "bruciato" → resta.
    const filteredOptions = group.options.filter((option) => {
      const label: unknown = option.label;
      const isTarget =
        typeof label === "string" && label.trim().toLowerCase() === TARGET_LABEL;
      return !isTarget;
    });

    const removedHere = beforeCount - filteredOptions.length;
    if (removedHere > 0) {
      removed += removedHere;
      affectedGroups.push(group.label || group.id);
      // Gruppo svuotato dopo il filtro: NON eliminarlo, solo segnalarlo.
      if (filteredOptions.length === 0) {
        emptiedGroups.push(group.label || group.id);
      }
    }

    return { ...group, options: filteredOptions };
  });

  return { config: { groups: newGroups }, removed, affectedGroups, emptiedGroups };
}

// ─── Helper: maschera l'host del DB ─────────────────────────────────────
// Estrae solo l'hostname dall'URL per stamparlo senza esporre user/password.
function maskDbHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch (e: unknown) {
    return "(host non parsabile)";
  }
}

async function main(): Promise<void> {
  const isExecute = new Set(process.argv.slice(2)).has("--execute");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL non settato.");
    process.exit(1);
  }

  console.log("═".repeat(70));
  console.log(
    `🧹 remove-bruciato-option — ${
      isExecute ? "EXECUTE (scritture attive)" : "DRY-RUN (nessuna scrittura)"
    }`,
  );
  console.log(`DB host: ${maskDbHost(dbUrl)}`);
  console.log(`Label target: "${TARGET_LABEL}" (case-insensitive, esclude "marrone bruciato")`);
  console.log("═".repeat(70));

  // Contatori aggregati per il riepilogo finale.
  let productsAffected = 0;
  let templatesAffected = 0;
  let totalRemoved = 0;
  const allEmptiedGroups: string[] = [];

  try {
    // ─── PRODOTTI (variantConfig nullable) ──────────────────────────────
    const products = await prisma.product.findMany({
      where: { variantConfig: { not: null } },
      select: { id: true, slug: true, variantConfig: true },
    });
    console.log(`\n📦 Prodotti con variantConfig: ${products.length}`);

    for (const product of products) {
      if (!isVariantConfig(product.variantConfig)) {
        console.warn(`  ⚠️  SKIP prodotto ${product.slug}: variantConfig in forma inattesa.`);
        continue;
      }

      const result = stripBruciato(product.variantConfig);
      if (result.removed === 0) continue;

      productsAffected += 1;
      totalRemoved += result.removed;
      console.log(
        `  • ${product.slug}: rimosse ${result.removed} opzioni in [${result.affectedGroups.join(", ")}]`,
      );
      for (const eg of result.emptiedGroups) {
        allEmptiedGroups.push(`prodotto:${product.slug}/${eg}`);
        console.warn(`    ⚠️  gruppo svuotato: "${eg}" (lasciato con options vuoto)`);
      }

      if (isExecute) {
        await prisma.product.update({
          where: { id: product.id },
          // JSON.parse(JSON.stringify(...)) produce un valore compatibile con
          // Prisma.InputJsonValue (stesso pattern di fix-elisa-no-variants.ts).
          data: { variantConfig: JSON.parse(JSON.stringify(result.config)) },
        });
      }
    }

    // ─── VARIANT TEMPLATE (config NON nullable) ─────────────────────────
    const templates = await prisma.variantTemplate.findMany({
      select: { id: true, slug: true, config: true },
    });
    console.log(`\n🧩 Variant template totali: ${templates.length}`);

    for (const template of templates) {
      if (!isVariantConfig(template.config)) {
        console.warn(`  ⚠️  SKIP template ${template.slug}: config in forma inattesa.`);
        continue;
      }

      const result = stripBruciato(template.config);
      if (result.removed === 0) continue;

      templatesAffected += 1;
      totalRemoved += result.removed;
      console.log(
        `  • ${template.slug}: rimosse ${result.removed} opzioni in [${result.affectedGroups.join(", ")}]`,
      );
      for (const eg of result.emptiedGroups) {
        allEmptiedGroups.push(`template:${template.slug}/${eg}`);
        console.warn(`    ⚠️  gruppo svuotato: "${eg}" (lasciato con options vuoto)`);
      }

      if (isExecute) {
        await prisma.variantTemplate.update({
          where: { id: template.id },
          data: { config: JSON.parse(JSON.stringify(result.config)) },
        });
      }
    }

    // ─── Riepilogo ──────────────────────────────────────────────────────
    console.log("\n" + "─".repeat(70));
    console.log("📋 Riepilogo");
    console.log(`  Prodotti interessati:  ${productsAffected}`);
    console.log(`  Template interessati:  ${templatesAffected}`);
    console.log(`  Opzioni totali rimosse: ${totalRemoved}`);
    if (allEmptiedGroups.length > 0) {
      console.warn(`  ⚠️  Gruppi rimasti senza opzioni (${allEmptiedGroups.length}):`);
      for (const eg of allEmptiedGroups) console.warn(`     - ${eg}`);
    }
    console.log("─".repeat(70));

    if (!isExecute) {
      console.log("ℹ️  Rilancia con --execute per applicare.");
    } else {
      console.log("✅ Modifiche applicate.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Errore:", err);
  process.exit(1);
});
