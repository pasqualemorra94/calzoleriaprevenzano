/**
 * add-mignon-swatches.ts
 *
 * Aggiunge i nuovi colori "mignon" (cutout WebP) ai variantConfig dei prodotti,
 * nel gruppo colore corretto per famiglia di pelle. IDEMPOTENTE: se un colore
 * (per label normalizzata) è già presente in un gruppo, lo salta.
 *
 * DRY-RUN di default. Applica solo con `--execute`.
 * Legge i colori da scripts/_swatch-src/_processed.json (prodotto da _tmp-process-swatches.ts).
 *
 * Scope (deciso col titolare):
 *  - Pitone/Pitonato (9): SOLO prodotti con tipo pelle "Pitone Stampato" (3 opzioni),
 *    esclusi i premium "Classica". Aggiunge al gruppo dependsOn=pitone-stampato.
 *  - Liscio (3): OVUNQUE esista un gruppo liscio (dependsOn in {pelle-liscia, liscio}).
 *  - Laminato antracite (1): OVUNQUE esista un gruppo dependsOn=laminato.
 *  - Salta i prodotti disattivati (isActive=false).
 *  - Prodotti multi-gruppo (es. Noemi x3): aggiorna TUTTI i gruppi corrispondenti.
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();
const EXECUTE = process.argv.includes("--execute");

interface Opt { value: string; label: string; color?: string; imageUrl?: string; priceModifier?: number }
interface Group { id: string; label: string; type: string; required?: boolean; options: Opt[]; dependsOn?: { groupId: string; optionValue: string } }
interface Cfg { groups: Group[] }
interface NewColor { label: string; group: "pitone" | "liscio" | "laminato"; imageUrl: string; color: string }

const PITONE_KEYS = ["pitone-stampato", "pitonato"];
const LISCIO_KEYS = ["pelle-liscia", "liscio"];
const LAMINATO_KEYS = ["laminato"];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
const normLabel = (g: Group) => norm(g.label);

function nextIndex(opts: Opt[]): number {
  let max = -1;
  for (const o of opts) {
    const n = parseInt(o.value, 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return max >= 0 ? max + 1 : opts.length;
}

/** Aggiunge le nuove opzioni a un gruppo (in place), idempotente per label. Ritorna i label aggiunti. */
function addToGroup(group: Group, colors: NewColor[]): string[] {
  const existing = new Set(group.options.map((o) => norm(o.label)));
  let idx = nextIndex(group.options);
  const added: string[] = [];
  for (const c of colors) {
    if (existing.has(norm(c.label))) continue;
    group.options.push({ value: String(idx++), label: c.label, color: c.color, imageUrl: c.imageUrl, priceModifier: 0 });
    added.push(c.label);
  }
  return added;
}

async function main() {
  const dbUrl = process.env.DATABASE_URL ?? "";
  const host = dbUrl.replace(/:\/\/[^@]*@/, "://***@").match(/@([^/]+)/)?.[1] ?? "?";
  if (!dbUrl) { console.error("DATABASE_URL mancante"); process.exit(1); }
  console.log(`\nDB host: ${host}`);
  console.log(`Modalità: ${EXECUTE ? "🔴 EXECUTE (scrittura)" : "🟢 DRY-RUN (nessuna scrittura)"}\n`);

  const all: NewColor[] = JSON.parse(fs.readFileSync("scripts/_swatch-src/_processed.json", "utf-8"));
  const PITONE = all.filter((c) => c.group === "pitone");
  const LISCIO = all.filter((c) => c.group === "liscio");
  const LAMINATO = all.filter((c) => c.group === "laminato");

  const products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, isActive: true, variantConfig: true },
    orderBy: { name: "asc" },
  });

  let touched = 0, skippedInactive = 0, addedOptionsTotal = 0;
  const changeLog: string[] = [];

  for (const p of products) {
    if (!p.variantConfig) continue;
    const cfg = p.variantConfig as unknown as Cfg;
    if (!cfg.groups) continue;
    const tipo = cfg.groups.find((g) => normLabel(g).includes("tipodipelle"));
    if (!tipo) continue;

    if (!p.isActive) { skippedInactive++; continue; }

    const hasPitoneStampato = tipo.options.some((o) => norm(o.label).includes("pitonestampato"));

    const perProduct: string[] = [];

    for (const g of cfg.groups) {
      if (g.type !== "color-swatch" || !g.dependsOn) continue;
      const key = g.dependsOn.optionValue;

      // PITONE: solo famiglia "Pitone Stampato", gruppo pitone-stampato
      if (hasPitoneStampato && key === "pitone-stampato") {
        const added = addToGroup(g, PITONE);
        if (added.length) perProduct.push(`  pitone-stampato: +${added.length} (${added.join(", ")})`);
      }
      // LISCIO: ovunque
      if (LISCIO_KEYS.includes(key)) {
        const added = addToGroup(g, LISCIO);
        if (added.length) perProduct.push(`  ${key}: +${added.length} (${added.join(", ")})`);
      }
      // LAMINATO: ovunque
      if (LAMINATO_KEYS.includes(key)) {
        const added = addToGroup(g, LAMINATO);
        if (added.length) perProduct.push(`  laminato: +${added.length} (${added.join(", ")})`);
      }
    }

    if (perProduct.length) {
      touched++;
      const cnt = perProduct.reduce((s, l) => s + Number(l.match(/\+(\d+)/)?.[1] ?? 0), 0);
      addedOptionsTotal += cnt;
      changeLog.push(`\n• ${p.name} [${p.slug}]\n${perProduct.join("\n")}`);
      if (EXECUTE) {
        await prisma.product.update({ where: { id: p.id }, data: { variantConfig: JSON.parse(JSON.stringify(cfg)) } });
      }
    }
  }

  console.log(changeLog.join("\n"));
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Prodotti modificati: ${touched}`);
  console.log(`Opzioni-colore aggiunte (totale): ${addedOptionsTotal}`);
  console.log(`Prodotti disattivati saltati: ${skippedInactive}`);
  console.log(EXECUTE ? "\n✅ Scrittura completata." : "\n🟢 DRY-RUN: nessuna scrittura. Rilancia con --execute per applicare.");
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
