// @ts-expect-error - PrismaClient is generated at build time
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface VariantGroup {
  label: string;
  type: string;
  options?: unknown[];
}

interface VariantConfig {
  groups: VariantGroup[];
}

function fingerprint(config: VariantConfig): string {
  return config.groups
    .map((g) => `${g.label}:${g.type}`)
    .sort()
    .join("|");
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const products = await prisma.product.findMany({
    where: { variantConfig: { not: null } },
    select: { id: true, name: true, slug: true, variantConfig: true },
  });

  console.log(`Found ${products.length} products with variantConfig\n`);

  const groups = new Map<string, { fingerprint: string; config: VariantConfig; productNames: string[] }>();

  for (const p of products) {
    const config = p.variantConfig as unknown as VariantConfig;
    if (!config?.groups) continue;

    const fp = fingerprint(config);
    const entry = groups.get(fp);
    if (entry) {
      entry.productNames.push(p.name);
    } else {
      groups.set(fp, { fingerprint: fp, config, productNames: [p.name] });
    }
  }

  console.log(`Identified ${groups.size} unique patterns\n`);

  let created = 0;
  let skipped = 0;

  for (const [fp, data] of groups) {
    const groups = data.config.groups;

    const parts = groups.map((g) => {
      const optCount = g.options?.length ?? 0;
      return `${g.label}${optCount > 0 ? ` (${optCount} opz.)` : ""}`;
    });
    const description = parts.join(" + ");

    const groupName = groups.map((g) => g.label).join(" + ");
    const name = `${groupName} — ${data.productNames.length} prodotti`;

    const slug = slugify(name);

    const existing = await prisma.variantTemplate.findUnique({ where: { slug } });
    if (existing) {
      console.log(`  SKIP  ${slug} (already exists)`);
      skipped++;
      continue;
    }

    await prisma.variantTemplate.create({
      data: {
        name,
        slug,
        description,
        config: data.config as never,
        sortOrder: 0,
      },
    });

    console.log(`  CREATE  ${slug} — ${data.productNames.length} prodotti`);
    created++;
  }

  const total = await prisma.variantTemplate.count();
  console.log(`\n--- Summary ---`);
  console.log(`  New templates created: ${created}`);
  console.log(`  Skipped (existing):   ${skipped}`);
  console.log(`  Total templates in DB: ${total}`);

  await prisma.$disconnect();
}

main();
