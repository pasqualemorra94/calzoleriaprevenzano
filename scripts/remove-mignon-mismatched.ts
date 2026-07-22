/**
 * remove-mignon-mismatched.ts
 *
 * Rimuove le opzioni-colore "mignon" dai gruppi le cui immagini PREESISTENTI
 * NON sono in stile "composizione" (file *-dimensioni-grandi*), cioè dai gruppi
 * con swatch "quadratini" (*_pelle-quadrata*) o altri stili, dove i cutout stonano.
 *
 * Criterio: per ogni gruppo color-swatch che contiene opzioni mignon, guarda le
 * opzioni NON-mignon; se lo stile dominante non è "grandi", rimuove i mignon.
 *
 * IDEMPOTENTE. DRY-RUN di default; applica con --execute.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const EXECUTE = process.argv.includes("--execute");

interface Opt { value: string; label: string; color?: string; imageUrl?: string; priceModifier?: number }
interface Group { id: string; label: string; type: string; options: Opt[]; dependsOn?: { groupId: string; optionValue: string } }
interface Cfg { groups: Group[] }
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
const isMignon = (o: Opt) => (o.imageUrl ?? "").includes("-mignon");
function style(url: string | undefined): string {
  if (!url) return "no-img";
  if (url.includes("dimensioni-grandi")) return "grandi";
  return "altro";
}

async function main() {
  const dbUrl = process.env.DATABASE_URL ?? "";
  const host = dbUrl.match(/@([^/]+)/)?.[1] ?? "?";
  if (!dbUrl) { console.error("DATABASE_URL mancante"); process.exit(1); }
  console.log(`\nDB host: ${host}`);
  console.log(`Modalità: ${EXECUTE ? "🔴 EXECUTE" : "🟢 DRY-RUN"}\n`);

  const products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, variantConfig: true },
    orderBy: { name: "asc" },
  });

  let touched = 0, removedTotal = 0;
  for (const p of products) {
    if (!p.variantConfig) continue;
    const cfg = p.variantConfig as unknown as Cfg;
    if (!cfg.groups) continue;

    const removedHere: string[] = [];
    for (const g of cfg.groups) {
      if (g.type !== "color-swatch") continue;
      const mignon = g.options.filter(isMignon);
      if (mignon.length === 0) continue;
      const pre = g.options.filter((o) => !isMignon(o));
      const grandi = pre.filter((o) => style(o.imageUrl) === "grandi").length;
      const dominantGrandi = pre.length > 0 && grandi > pre.length / 2;
      if (dominantGrandi) continue; // stile coerente → tieni
      // stile NON coerente → rimuovi i mignon
      const before = g.options.length;
      g.options = g.options.filter((o) => !isMignon(o));
      const removed = before - g.options.length;
      removedHere.push(`${g.dependsOn?.optionValue ?? g.label}: -${removed} (${mignon.map((m) => m.label).join(", ")})`);
      removedTotal += removed;
    }

    if (removedHere.length) {
      touched++;
      console.log(`• ${p.name} [${p.slug}]\n    ${removedHere.join("\n    ")}`);
      if (EXECUTE) {
        await prisma.product.update({ where: { id: p.id }, data: { variantConfig: JSON.parse(JSON.stringify(cfg)) } });
      }
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Prodotti modificati: ${touched}`);
  console.log(`Opzioni mignon rimosse: ${removedTotal}`);
  console.log(EXECUTE ? "\n✅ Rimozione completata." : "\n🟢 DRY-RUN: nessuna scrittura. Rilancia con --execute.");
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
