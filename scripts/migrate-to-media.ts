/**
 * Migrate existing images to Media Library
 *
 * Scans public/images/ directories, creates Media records for all found files,
 * and links existing ProductImage records to their corresponding Media entries.
 *
 * Files stay in their current location — only DB records are created.
 * The script is idempotent: safe to run multiple times.
 *
 * Usage: npx tsx scripts/migrate-to-media.ts
 */

import { PrismaClient } from "@prisma/client";
import { readdir, stat, readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const prisma = new PrismaClient();

const BATCH_SIZE = 100;

// ─── MIME type mapping ───────────────────────────────────────────────

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
};

// ─── Types ───────────────────────────────────────────────────────────

interface FileEntry {
  path: string;
  url: string;
  filename: string;     // unique identifier: "products/foo.png"
  originalName: string; // original filename: "foo.png"
  mimeType: string;
  folder: string;
  size: number;
}

// ─── Directory scanning ──────────────────────────────────────────────

async function scanDirectory(
  dir: string,
  folder: string,
  baseUrl: string,
): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];

  try {
    const files = await readdir(dir);

    for (const file of files) {
      const fullPath = join(dir, file);
      const fileStat = await stat(fullPath);
      if (!fileStat.isFile()) continue;

      const ext = extname(file).toLowerCase();
      const mimeType = MIME_TYPES[ext];
      if (!mimeType) continue;

      entries.push({
        path: fullPath,
        url: `${baseUrl}/${file}`,
        filename: `${folder}/${file}`,
        originalName: file,
        mimeType,
        folder,
        size: fileStat.size,
      });
    }
  } catch (err) {
    console.error(`  ⚠ Error scanning ${dir}:`, err instanceof Error ? err.message : err);
  }

  return entries;
}

// ─── Image dimension parsing ────────────────────────────────────────

async function getImageDimensions(
  buffer: Buffer,
  mimeType: string,
): Promise<{ width: number; height: number } | null> {
  if (mimeType === "image/svg+xml") return null;

  try {
    if (
      mimeType === "image/png" &&
      buffer.length >= 24 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50
    ) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      if (width > 0 && height > 0) return { width, height };
    }

    if (mimeType === "image/jpeg") {
      return parseJpegDimensions(buffer);
    }

    if (mimeType === "image/webp" && buffer.length >= 30) {
      if (
        buffer[12] === 0x56 &&
        buffer[13] === 0x50 &&
        buffer[14] === 0x38 &&
        buffer[15] === 0x58
      ) {
        const width = buffer.readUIntLE(24, 3) + 1;
        const height = buffer.readUIntLE(27, 3) + 1;
        if (width > 0 && height > 0) return { width, height };
      }
    }
  } catch {
    // Ignore dimension parsing errors
  }

  return null;
}

function parseJpegDimensions(
  buffer: Buffer,
): { width: number; height: number } | null {
  let offset = 2;

  while (offset < buffer.length - 1) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];

    if (marker === 0xc0 || marker === 0xc2) {
      if (offset + 8 < buffer.length) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        if (width > 0 && height > 0) return { width, height };
      }
      break;
    }

    const rstMarkers = [0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0x01];
    if (rstMarkers.includes(marker)) {
      offset += 2;
      continue;
    }

    if (offset + 3 < buffer.length) {
      const segLength = buffer.readUInt16BE(offset + 2);
      offset += 2 + segLength;
    } else {
      break;
    }
  }

  return null;
}

// ─── Main migration ─────────────────────────────────────────────────

async function migrateImages() {
  console.log("🔄 Media Library Migration — Starting...\n");

  // ── 1. Scan all image directories ──
  console.log("📁 Scanning directories...");

  const [productImages, swatchImages] = await Promise.all([
    scanDirectory("public/images/products", "products", "/images/products"),
    scanDirectory("public/images/swatches", "swatches", "/images/swatches"),
  ]);

  // Template SVGs (decorative images used in site sections)
  const templateFiles = [
    { path: "public/images/hero-bottega.svg", filename: "hero-bottega.svg" },
    { path: "public/images/bottega-laboratorio.svg", filename: "bottega-laboratorio.svg" },
    { path: "public/images/bottega-interna.svg", filename: "bottega-interna.svg" },
  ];

  const templateEntries: FileEntry[] = [];
  for (const tf of templateFiles) {
    try {
      const s = await stat(tf.path);
      templateEntries.push({
        path: tf.path,
        url: `/images/${tf.filename}`,
        filename: `templates/${tf.filename}`,
        originalName: tf.filename,
        mimeType: "image/svg+xml",
        folder: "templates",
        size: s.size,
      });
    } catch {
      console.warn(`  ⚠ Template file not found: ${tf.path}`);
    }
  }

  const allEntries = [...productImages, ...swatchImages, ...templateEntries].filter(
    (e) => e.size > 0,
  );

  console.log(`  ✅ Products:  ${productImages.length} files`);
  console.log(`  ✅ Swatches: ${swatchImages.length} files`);
  console.log(`  ✅ Templates: ${templateEntries.length} files`);
  console.log(`  📊 Total:    ${allEntries.length} files\n`);

  // ── 2. Idempotency: find existing Media records by URL ──
  console.log("🔍 Checking existing Media records...");
  const existingMedia = await prisma.media.findMany({
    select: { url: true, filename: true },
  });
  const existingUrls = new Set(existingMedia.map((m: { url: string }) => m.url));
  const existingFilenames = new Set(existingMedia.map((m: { filename: string }) => m.filename));

  const toCreate = allEntries.filter(
    (e) => !existingUrls.has(e.url) && !existingFilenames.has(e.filename),
  );
  const skipped = allEntries.length - toCreate.length;

  if (skipped > 0) {
    console.log(`  ⏭ Skipping ${skipped} already-migrated files`);
  }

  if (toCreate.length === 0) {
    console.log("\n✅ All images already in Media Library!\n");
  } else {
    console.log(`  📝 Need to create ${toCreate.length} Media records\n`);

    // ── 3. Create Media records ──
    let created = 0;
    let errors = 0;

    for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
      const batch = toCreate.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (entry) => {
          try {
            let width: number | null = null;
            let height: number | null = null;

            // Read file for dimensions (skip for SVGs)
            if (!entry.mimeType.includes("svg")) {
              const buffer = Buffer.from(await readFile(entry.path));
              const dims = await getImageDimensions(buffer, entry.mimeType);
              if (dims) {
                width = dims.width;
                height = dims.height;
              }
            }

            await prisma.media.create({
              data: {
                filename: entry.filename,
                originalName: entry.originalName,
                mimeType: entry.mimeType,
                size: entry.size,
                width,
                height,
                alt: null,
                folder: entry.folder,
                url: entry.url,
              },
            });

            created++;
          } catch (err) {
            errors++;
            console.error(
              `  ❌ Error: ${entry.url}:`,
              err instanceof Error ? err.message : err,
            );
          }
        }),
      );

      const progress = Math.min(i + BATCH_SIZE, toCreate.length);
      process.stdout.write(`\r  ... ${progress}/${toCreate.length} done`);
    }

    console.log(`\n\n  ✅ Created ${created} Media records`);
    if (errors > 0) {
      console.log(`  ❌ ${errors} errors`);
    }
  }

  // ── 4. Link ProductImage → Media ──
  console.log("\n🔗 Linking ProductImage records to Media...");

  const allMediaByUrl = new Map(
    (
      await prisma.media.findMany({ select: { id: true, url: true } })
    ).map((m: { id: string; url: string }) => [m.url, m.id] as const),
  );

  const unlinkedImages = await prisma.productImage.findMany({
    where: { mediaId: null },
    select: { id: true, url: true },
  });

  let linked = 0;
  for (const img of unlinkedImages) {
    const mediaId = allMediaByUrl.get(img.url);
    if (mediaId) {
      await prisma.productImage.update({
        where: { id: img.id },
        data: { mediaId },
      });
      linked++;
    }
  }

  console.log(`  ✅ Linked ${linked} ProductImage records`);

  const stillUnlinked = unlinkedImages.length - linked;
  if (stillUnlinked > 0) {
    console.log(
      `  ⚠ ${stillUnlinked} ProductImage records have no matching Media (possibly external or deleted)`,
    );
  }

  // ── Summary ──
  const finalCount = await prisma.media.count();
  const linkedCount = await prisma.productImage.count({ where: { mediaId: { not: null } } });
  const totalProductImages = await prisma.productImage.count();

  console.log("\n" + "═".repeat(52));
  console.log("📊 Migration Complete — Summary");
  console.log("═".repeat(52));
  console.log(`  Media records in library:  ${finalCount}`);
  console.log(`  ProductImages linked:      ${linkedCount} / ${totalProductImages}`);
  console.log(`  Files tracked:             ${allEntries.length}`);
  console.log("═".repeat(52));
  console.log("\n✅ Done! All images are now managed from the Media Library.\n");
}

migrateImages()
  .catch((err) => {
    console.error("\n❌ Migration failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
