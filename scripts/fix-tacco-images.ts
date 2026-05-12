/**
 * fix-tacco-images.ts
 *
 * Uniforma tutti i gruppi "tacco" nel variantConfig dei prodotti:
 *  - type → "color-swatch" (così le immagini vengono mostrate come swatch)
 *  - aggiunge imageUrl alle opzioni che ne sono prive (mappa per value/label)
 *
 * Non tocca value, label, priceModifier né altri gruppi. Idempotente.
 *
 * Run: DATABASE_URL=<url> npx tsx scripts/fix-tacco-images.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TACCO_IMAGES = {
  none: "/images/swatches/tacco0.jpg",
  h25: "/images/swatches/tacco25.jpg",
  h5: "/images/swatches/tacco5.jpg",
};

function resolveTaccoImage(value: string, label: string): string | undefined {
  const v = (value || "").toLowerCase();
  const l = (label || "").toLowerCase();
  // "No tacco" / "Senza tacco" / value "0" / "no-tacco"
  if (v === "0" || v === "no-tacco" || /senza tacco|no tacco/.test(l)) return TACCO_IMAGES.none;
  // "Tacco 2.5 cm" / value "1" / "tacco-2-5"
  if (v === "1" || v === "tacco-2-5" || /2[.,]5\s*cm/.test(l)) return TACCO_IMAGES.h25;
  // "Tacco 5 cm" / value "2" / "tacco-5"
  if (v === "2" || v === "tacco-5" || /(?<!2[.,])\b5\s*cm/.test(l)) return TACCO_IMAGES.h5;
  return undefined;
}

function isTaccoGroup(g: { label?: string; id?: string }): boolean {
  return /tacco/i.test(g.label || "") || /tacco/i.test(g.id || "");
}

async function main() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, variantConfig: { not: undefined } },
    select: { id: true, slug: true, variantConfig: true },
  });

  let touched = 0;
  let skipped = 0;
  for (const p of products) {
    const config = p.variantConfig as { groups?: Array<Record<string, unknown>> } | null;
    if (!config?.groups) continue;
    let changed = false;

    for (const g of config.groups) {
      if (!isTaccoGroup(g as { label?: string; id?: string })) continue;
      // type → color-swatch
      if (g.type !== "color-swatch") {
        g.type = "color-swatch";
        changed = true;
      }
      // imageUrl sulle opzioni
      const opts = (g.options as Array<Record<string, unknown>>) || [];
      for (const o of opts) {
        if (!o.imageUrl) {
          const img = resolveTaccoImage(String(o.value ?? ""), String(o.label ?? ""));
          if (img) {
            o.imageUrl = img;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      await prisma.product.update({
        where: { id: p.id },
        data: { variantConfig: JSON.parse(JSON.stringify(config)) },
      });
      touched++;
    } else {
      skipped++;
    }
  }

  console.log(`✅ Prodotti aggiornati: ${touched}`);
  console.log(`   Già a posto / senza tacco: ${skipped}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
