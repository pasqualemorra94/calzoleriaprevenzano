/**
 * download-swatch-images.ts
 * 
 * Downloads all WCPA swatch images (full-size) to public/images/swatches/
 * Uses the product color name as local filename.
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

const OUTPUT_DIR = "public/images/swatches";
const CONCURRENCY = 3;

interface ImageToDownload {
  url: string;
  filename: string;
}

function fetchFile(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" }
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchFile(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", reject);
  });
}

async function downloadOne(img: ImageToDownload): Promise<boolean> {
  const filePath = path.join(OUTPUT_DIR, img.filename);
  if (fs.existsSync(filePath)) return true; // skip existing

  try {
    const buf = await fetchFile(img.url);
    fs.writeFileSync(filePath, buf);
    return true;
  } catch (err) {
    console.error(`  ❌ ${img.filename}: ${err instanceof Error ? err.message : "Error"}`);
    return false;
  }
}

async function main() {
  const data = JSON.parse(fs.readFileSync("site-output/wcpa-variants.json", "utf-8"));
  const withWcpa = data.filter((p: { hasWcpa: boolean }) => p.hasWcpa);

  // Collect all unique images (prefer full-size over thumbnail)
  const seen = new Map<string, string>(); // filename → url
  const toDownload: ImageToDownload[] = [];

  for (const p of withWcpa) {
    const collectOptions = (opts: Array<{ imageUrl?: string; thumbnailUrl?: string; label: string }>) => {
      for (const o of opts) {
        // Prefer full-size image, fallback to thumbnail
        const imgUrl = o.imageUrl || o.thumbnailUrl;
        if (!imgUrl) continue;
        // Skip thumbnails if we have the full version
        if (imgUrl.includes("-100x100") && o.imageUrl && !o.imageUrl.includes("-100x100")) continue;

        // Generate filename: sanitize the path and use product slug prefix
        const urlObj = new URL(imgUrl);
        const ext = path.extname(urlObj.pathname) || ".jpg";
        const baseName = path.basename(urlObj.pathname, ext);
        const sanitizedBase = baseName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
        const filename = sanitizedBase + ext.toLowerCase();

        if (!seen.has(filename)) {
          seen.set(filename, imgUrl);
          toDownload.push({ url: imgUrl, filename });
        }
      }
    };

    for (const f of p.fields) {
      collectOptions(f.options);
      if (f.colorGroups) {
        for (const g of f.colorGroups) collectOptions(g.options);
      }
    }
  }

  console.log(`📁 Images to download: ${toDownload.length}`);
  console.log(`   Already exist: ${seen.size - toDownload.length}`);

  // Create output dir
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Download with concurrency limit
  let downloaded = 0;
  let failed = 0;
  const total = toDownload.length;

  for (let i = 0; i < total; i += CONCURRENCY) {
    const batch = toDownload.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(img => downloadOne(img)));

    for (let j = 0; j < results.length; j++) {
      if (results[j]) downloaded++;
      else failed++;
    }

    if ((i + CONCURRENCY) % 30 === 0 || i + CONCURRENCY >= total) {
      process.stdout.write(`\r  [${Math.min(i + CONCURRENCY, total)}/${total}] ✅ ${downloaded} downloaded, ❌ ${failed} failed`);
    }
  }

  // Save mapping file
  const mapping: Record<string, string> = {};
  for (const [filename, url] of seen) mapping[filename] = url;
  fs.writeFileSync("site-output/swatch-image-mapping.json", JSON.stringify(mapping, null, 2));

  console.log(`\n✅ Done! Downloaded: ${downloaded}, Failed: ${failed}`);
  console.log(`   Mapping saved to site-output/swatch-image-mapping.json`);
}

main().catch(console.error);
