/**
 * Re-download full-resolution product images
 * 
 * Strips WooCommerce thumbnail suffixes (-NNNxNNN) from URLs
 * and downloads the full-resolution versions.
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

const SCRAPED_DATA_PATH = "./site-output/scraped-products.json";
const OUTPUT_DIR = "./public/images/products";

interface ScrapedImage {
  originalUrl?: string;
  localPath?: string;
  alt?: string;
  isGallery?: boolean;
  colorName?: string;
}

interface ScrapedProduct {
  slug: string;
  name: string;
  images?: ScrapedImage[];
}

function downloadFile(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const dir = path.dirname(destPath);
    fs.mkdirSync(dir, { recursive: true });

    const file = fs.createWriteStream(destPath);
    const proto = url.startsWith("https") ? https : http;

    const request = proto.get(url, { timeout: 15000 }, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve(true);
        });
      } else {
        file.close();
        fs.unlinkSync(destPath);
        resolve(false);
      }
    });

    request.on("timeout", () => {
      request.destroy();
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      resolve(false);
    });

    request.on("error", () => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      resolve(false);
    });
  });
}

function stripThumbnailSuffix(url: string): string | null {
  // Match patterns like -100x100, -150x150, -300x300 before the file extension
  const match = url.match(/(-\d+x\d+)\.(\w+)$/);
  if (!match) return null;
  return url.replace(match[1], "");
}

function getLocalPathFromUrl(url: string): string {
  const urlObj = new URL(url);
  const filename = path.basename(urlObj.pathname);
  return path.join(OUTPUT_DIR, filename);
}

async function main() {
  const rawData = fs.readFileSync(SCRAPED_DATA_PATH, "utf-8");
  const allProducts: ScrapedProduct[] = Array.isArray(rawData)
    ? JSON.parse(rawData)
    : (JSON.parse(rawData).products || Object.values(JSON.parse(rawData)));

  const tasks: Array<{ slug: string; thumbUrl: string; fullUrl: string; localPath: string }> = [];

  for (const product of allProducts) {
    for (const img of product.images || []) {
      if (!img.originalUrl) continue;
      const fullUrl = stripThumbnailSuffix(img.originalUrl);
      if (!fullUrl) continue;

      const localPath = getLocalPathFromUrl(fullUrl);
      tasks.push({
        slug: product.slug,
        thumbUrl: img.originalUrl,
        fullUrl,
        localPath,
      });
    }
  }

  // Deduplicate by fullUrl (same image might appear for multiple products/colors)
  const seen = new Set<string>();
  const uniqueTasks = tasks.filter((t) => {
    if (seen.has(t.fullUrl)) return false;
    seen.add(t.fullUrl);
    return true;
  });

  console.log(`Found ${uniqueTasks.length} unique thumbnail images to re-download as full-res`);
  console.log("---");

  let success = 0;
  let failed = 0;
  let skipped = 0;
  const failedUrls: string[] = [];

  for (let i = 0; i < uniqueTasks.length; i++) {
    const task = uniqueTasks[i];

    // Check if we already have a full-res version (file exists and is bigger than 5KB)
    if (fs.existsSync(task.localPath)) {
      const stats = fs.statSync(task.localPath);
      if (stats.size > 5000) {
        skipped++;
        continue;
      }
    }

    process.stdout.write(`[${i + 1}/${uniqueTasks.length}] ${path.basename(task.localPath)} ... `);

    const ok = await downloadFile(task.fullUrl, task.localPath);
    if (ok) {
      const stats = fs.statSync(task.localPath);
      success++;
      console.log(`✓ ${Math.round(stats.size / 1024)}KB`);
    } else {
      failed++;
      failedUrls.push(task.fullUrl);
      console.log("✗");
    }

    // Rate limit: 200ms between requests
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("\n---");
  console.log(`Success: ${success}`);
  console.log(`Skipped (already full-res): ${skipped}`);
  console.log(`Failed: ${failed}`);
  if (failedUrls.length > 0) {
    console.log("\nFailed URLs:");
    failedUrls.slice(0, 10).forEach((u) => console.log("  ", u));
    if (failedUrls.length > 10) console.log(`  ... and ${failedUrls.length - 10} more`);
  }
}

main().catch(console.error);
