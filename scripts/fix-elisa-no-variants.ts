/**
 * fix-elisa-no-variants.ts
 *
 * I sandali "Elisa" (argento/azzurro/black/oro/oro rosa/verde) sono prodotti fissi:
 * il colore è già definito dal nome, non personalizzabile. Rimuove dalla variantConfig
 * tipo pelle / colore / strass — lascia solo Tacco + Taglia.
 *
 * Run: DATABASE_URL=<url> npx tsx scripts/fix-elisa-no-variants.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

const ELISA_SLUGS = [
  "elisa-argento-strass",
  "elisa-azzurro-strass",
  "elisa-black-strass",
  "elisa-oro-strass",
  "elisa-oro-rosa-strass",
  "elisa-verde-strass",
];

async function main() {
  const config = { groups: [TACCO_GROUP, TAGLIA_GROUP] };
  for (const slug of ELISA_SLUGS) {
    const r = await prisma.product.updateMany({
      where: { slug },
      data: { variantConfig: JSON.parse(JSON.stringify(config)) },
    });
    console.log(`  ${slug}: ${r.count > 0 ? "aggiornato" : "NON TROVATO"}`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
