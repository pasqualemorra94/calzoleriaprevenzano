/**
 * Scraper for calzoleriaprevenzano.it
 * Scrapes ALL products (118), their images, variants, and categories.
 * Downloads images to public/images/products/
 * Outputs JSON data for seed generation.
 *
 * Usage: npx tsx scripts/scrape-products.ts
 */

import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "https://calzoleriaprevenzano.it";
const SHOP_URL = `${BASE_URL}/shop/`;
const PRODUCTS_DIR = path.resolve("public/images/products");
const OUTPUT_FILE = path.resolve("site-output/scraped-products.json");
const SITE_OUTPUT_DIR = path.resolve("site-output");

// ─── Helpers ──────────────────────────────────────────────────────────

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 80);
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      console.error(`  ❌ HTTP ${res.status} for ${url}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.error(`  ❌ Fetch error for ${url}:`, err);
    return null;
  }
}

async function downloadImage(url: string, filepath: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
    });
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filepath, buffer);
    return true;
  } catch {
    return false;
  }
}

// ─── Interfaces ───────────────────────────────────────────────────────

interface ScrapedProduct {
  name: string;
  slug: string;
  price: number;
  originalUrl: string;
  description: string;
  shortDescription: string;
  categories: string[];
  images: Array<{ originalUrl: string; localPath: string; alt: string }>;
  variantTypes: Array<{
    group: string;
    label: string;
    options: string[];
    priceModifier?: number;
  }>;
  isFeatured: boolean;
  inStock: boolean;
}

// ─── Phase 1: Scrape shop pages for product URLs ─────────────────────

async function getProductUrls(): Promise<Array<{ name: string; slug: string; url: string; price: number }>> {
  console.log("\n📋 Phase 1: Scanning shop pages for product URLs...");
  const products: Array<{ name: string; slug: string; url: string; price: number }> = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = page === 1 ? SHOP_URL : `${SHOP_URL}page/${page}/`;
    console.log(`  📄 Page ${page}: ${url}`);
    const html = await fetchPage(url);
    if (!html) { hasMore = false; break; }

    const $ = cheerio.load(html);
    let foundOnPage = 0;

    // Find product links - WooCommerce uses <a> with product permalinks
    $("a[href*='/prodotto/']").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      const slug = href.replace(/\/$/, "").split("/").pop();
      if (!slug) return;

      // Extract name from the link's heading or text
      const name = $(el).find("h3, .woocommerce-loop-product__title, .product-title").first().text().trim()
        || $(el).find("img").first().attr("alt")?.trim()
        || slug;

      // Extract price
      const priceText = $(el).find(".price, .woocommerce-Price-amount").first().text().trim();
      const priceMatch = priceText.match(/[\d.,]+/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(".", "").replace(",", ".")) : 0;

      // Avoid duplicates
      if (!products.some((p) => p.slug === slug)) {
        products.push({ name, slug, url: href, price });
        foundOnPage++;
      }
    });

    // Alternative: look for product cards in a different WooCommerce structure
    if (foundOnPage === 0) {
      $(".product, .type-product").each((_, el) => {
        const link = $(el).find("a").first().attr("href");
        if (!link || !link.includes("/prodotto/")) return;
        const slug = link.replace(/\/$/, "").split("/").pop();
        if (!slug || products.some((p) => p.slug === slug)) return;

        const name = $(el).find("h2, h3, .woocommerce-loop-product__title").first().text().trim() || slug;
        const priceText = $(el).find(".price").first().text().trim();
        const priceMatch = priceText.match(/[\d.,]+/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace(".", "").replace(",", ".")) : 0;

        products.push({ name, slug, url: link, price });
        foundOnPage++;
      });
    }

    console.log(`     Found ${foundOnPage} products on page ${page} (total: ${products.length})`);
    page++;

    // Check if there's a next page
    const nextLink = $("a.next, .page-numbers.next").attr("href");
    if (!nextLink || page > 15) hasMore = false;

    await sleep(800); // Be respectful
  }

  console.log(`  ✅ Total products found: ${products.length}`);
  return products;
}

// ─── Phase 2: Scrape each product detail page ───────────────────────

async function scrapeProductDetail(
  productInfo: { name: string; slug: string; url: string; price: number }
): Promise<ScrapedProduct | null> {
  console.log(`  🔍 ${productInfo.name}`);
  const html = await fetchPage(productInfo.url);
  if (!html) return null;

  const $ = cheerio.load(html);

  // Extract product name
  const name = $("h1.product_title, h1.entry-title, .product-title").first().text().trim() || productInfo.name;

  // Extract price
  const priceText = $("p.price .woocommerce-Price-amount, .summary p.price").first().text().trim();
  const priceMatch = priceText.match(/[\d.,]+/);
  const price = priceMatch ? parseFloat(priceMatch[0].replace(".", "").replace(",", ".")) : productInfo.price;

  // Extract description
  const description = $(".woocommerce-product-details__short-description, .short-description, div[itemprop='description']")
    .first().text().trim() || "";
  const fullDescription = $(".woocommerce-tabs .tab-content, #tab-description, .product-details__tab-content")
    .first().text().trim() || description;

  // Extract categories/tags
  const categories: string[] = [];
  $(".posted_in a, .product_meta .posted_in a").each((_, el) => {
    const cat = $(el).text().trim();
    if (cat) categories.push(cat);
  });
  $("span.tagged_as a, .product_meta .tagged_as a").each((_, el) => {
    const tag = $(el).text().trim();
    if (tag) categories.push(tag);
  });

  // Extract stock status
  const stockText = $(".stock, p.stock").first().text().trim();
  const inStock = !stockText.includes("Esaurito") && !stockText.includes("Out of stock");

  // Extract featured status
  const isFeatured = $(".featured").length > 0 || $(".onsale").length > 0;

  // Extract images
  const images: Array<{ originalUrl: string; localPath: string; alt: string }> = [];
  let imgIndex = 0;

  // Main product image
  const mainImg = $(".woocommerce-main-image img, .wp-post-image, div[data-thumb] img, figure.woocommerce-product-gallery__wrapper img").first();
  if (mainImg.length) {
    const src = mainImg.attr("src") || mainImg.attr("data-src") || mainImg.attr("data-large_image") || "";
    const alt = mainImg.attr("alt") || name;
    if (src && !src.includes("placeholder")) {
      const ext = path.extname(new URL(src, BASE_URL).pathname) || ".jpg";
      const localPath = `/images/products/${sanitizeFilename(productInfo.slug)}${imgIndex > 0 ? `-${imgIndex}` : ""}${ext}`;
      images.push({ originalUrl: src, localPath, alt });
      imgIndex++;
    }
  }

  // Gallery images
  $(".woocommerce-product-gallery__image img, .flex-control-thumbs img, [data-thumb]").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-large_image") || $(el).attr("data-thumb") || "";
    const alt = $(el).attr("alt") || name;
    if (src && !src.includes("placeholder") && !images.some((i) => i.originalUrl === src)) {
      const ext = path.extname(new URL(src, BASE_URL).pathname) || ".jpg";
      const localPath = `/images/products/${sanitizeFilename(productInfo.slug)}-${imgIndex}${ext}`;
      images.push({ originalUrl: src, localPath, alt });
      imgIndex++;
    }
  });

  // Also try data attributes on gallery wrapper
  $(".woocommerce-product-gallery__wrapper").each((_, el) => {
    const dataImages = $(el).attr("data-images");
    if (dataImages) {
      try {
        const parsed = JSON.parse(dataImages);
        for (const img of parsed) {
          if (img.src && !images.some((i) => i.originalUrl === img.src)) {
            const ext = path.extname(new URL(img.src, BASE_URL).pathname) || ".jpg";
            const localPath = `/images/products/${sanitizeFilename(productInfo.slug)}-${imgIndex}${ext}`;
            images.push({ originalUrl: img.src, localPath, alt: img.alt || name });
            imgIndex++;
          }
        }
      } catch { /* ignore */ }
    }
  });

  // Extract variant types from the form
  const variantTypes: Array<{ group: string; label: string; options: string[]; priceModifier?: number }> = [];

  // Look for variation form fields
  $(".variations_form .variation-select, .variations select, table.variations select, form.cart select").each((_, el) => {
    const label = $(el).attr("data-attribute_name") || $(el).prev("label").text().trim() || "";
    const options: string[] = [];
    $(el).find("option").each((_, opt) => {
      const val = $(opt).val() as string;
      if (val && val !== "") options.push(val);
    });
    if (options.length > 0) {
      variantTypes.push({ group: sanitizeFilename(label), label: label.replace(/\*/g, "").trim(), options });
    }
  });

  // Also look for custom option groups (the original site uses custom fields)
  $(".woocommerce-product-addons, .product-addon, [class*='variation']").each((_, el) => {
    const groupLabel = $(el).find("label, h3, h4, .addon-name").first().text().trim()
      .replace(/\*\s*$/, "").replace(/\*/, "").trim();
    if (!groupLabel) return;

    const options: string[] = [];
    $(el).find("input[type='radio'], input[type='checkbox'], select option").each((_, opt) => {
      const label = $(opt).attr("data-label") || $(opt).attr("value") ||
        $(opt).closest("label").text().trim() ||
        $(opt).next("label").text().trim();
      if (label && label !== "" && !options.includes(label)) {
        options.push(label);
      }
    });

    if (options.length > 0) {
      variantTypes.push({ group: sanitizeFilename(groupLabel), label: groupLabel, options });
    }
  });

  // Look for the custom variation structure on the original site
  // They use labels like "Tipo di Pelle", "Tacco", "Taglia"
  $("label, .variation-label, .wc-pao-addon-name").each((_, el) => {
    const labelText = $(el).text().trim().replace(/\*\s*$/, "").replace(/\*$/, "");
    if (!labelText) return;

    // Check if this is a variation group label
    const isVariation = /tipo di pelle|tacco|taglia|colore|colore treccia|gioiello|pelle|soletta|misura/i.test(labelText);
    if (!isVariation) return;

    // Avoid duplicates
    if (variantTypes.some((v) => v.label.toLowerCase() === labelText.toLowerCase())) return;

    // Find associated options
    const container = $(el).closest(".variation, .variations, form, .woocommerce-product-addons-wrap, .wc-pao-wrap, td, tr, div");
    const options: string[] = [];

    container.find("label:contains('+'), a:contains('+'), .swatch-label, .variation-option").each((_, opt) => {
      const text = $(opt).text().trim().replace(/^\+/, "").trim();
      if (text && !options.includes(text)) options.push(text);
    });

    if (options.length > 0) {
      variantTypes.push({ group: sanitizeFilename(labelText), label: labelText, options });
    }
  });

  return {
    name,
    slug: productInfo.slug,
    price,
    originalUrl: productInfo.url,
    description: fullDescription || description,
    shortDescription: description.split("\n")[0].slice(0, 200),
    categories,
    images,
    variantTypes,
    isFeatured,
    inStock,
  };
}

// ─── Phase 3: Download images ────────────────────────────────────────

async function downloadProductImages(product: ScrapedProduct): Promise<void> {
  for (const img of product.images) {
    const filename = path.basename(img.localPath);
    const filepath = path.join(PRODUCTS_DIR, filename);

    if (fs.existsSync(filepath)) {
      // Already downloaded
      continue;
    }

    let imgUrl = img.originalUrl;
    // Make absolute URL
    if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;
    if (imgUrl.startsWith("/")) imgUrl = BASE_URL + imgUrl;

    const success = await downloadImage(imgUrl, filepath);
    if (success) {
      console.log(`      📷 ${filename}`);
    } else {
      console.log(`      ❌ Failed: ${filename}`);
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Starting scraper for calzoleriaprevenzano.it");
  console.log("=".repeat(55));

  // Ensure directories exist
  fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
  fs.mkdirSync(SITE_OUTPUT_DIR, { recursive: true });

  // Phase 1: Get all product URLs
  const productUrls = await getProductUrls();

  if (productUrls.length === 0) {
    console.log("❌ No products found. Check if the site is accessible.");
    process.exit(1);
  }

  // Phase 2: Scrape each product detail page
  console.log(`\n📋 Phase 2: Scraping ${productUrls.length} product details...`);
  const products: ScrapedProduct[] = [];
  let failed = 0;

  for (let i = 0; i < productUrls.length; i++) {
    const p = productUrls[i];
    console.log(`  [${i + 1}/${productUrls.length}] ${p.name}`);

    const detail = await scrapeProductDetail(p);
    if (detail) {
      products.push(detail);
    } else {
      failed++;
      // Still add basic info
      products.push({
        name: p.name,
        slug: p.slug,
        price: p.price,
        originalUrl: p.url,
        description: "",
        shortDescription: "",
        categories: [],
        images: [],
        variantTypes: [],
        isFeatured: false,
        inStock: true,
      });
    }

    // Rate limiting
    await sleep(600 + Math.random() * 400);
  }

  console.log(`  ✅ Scraped ${products.length - failed} products (${failed} failed)`);

  // Phase 3: Download images
  console.log(`\n📋 Phase 3: Downloading images...`);
  let downloaded = 0;
  for (const product of products) {
    if (product.images.length === 0) continue;
    console.log(`  📦 ${product.name} (${product.images.length} images)`);
    for (const img of product.images) {
      const filename = path.basename(img.localPath);
      const filepath = path.join(PRODUCTS_DIR, filename);

      if (fs.existsSync(filepath)) {
        downloaded++;
        continue;
      }

      let imgUrl = img.originalUrl;
      if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;
      if (imgUrl.startsWith("/")) imgUrl = BASE_URL + imgUrl;

      const success = await downloadImage(imgUrl, filepath);
      if (success) {
        downloaded++;
        console.log(`    📷 ${filename}`);
      }
    }
    await sleep(300);
  }

  console.log(`  ✅ Downloaded ${downloaded} images`);

  // Phase 4: Save JSON output
  console.log(`\n📋 Phase 4: Saving data to ${OUTPUT_FILE}...`);

  // Extract unique categories
  const allCategories = new Set<string>();
  for (const p of products) {
    for (const cat of p.categories) allCategories.add(cat);
  }

  const output = {
    scrapedAt: new Date().toISOString(),
    totalProducts: products.length,
    totalImages: downloaded,
    categories: Array.from(allCategories),
    products,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  console.log("=".repeat(55));
  console.log("✅ Scraping complete!");
  console.log(`   Products: ${products.length}`);
  console.log(`   Images: ${downloaded}`);
  console.log(`   Categories: ${allCategories.size}`);
  console.log(`   Output: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("❌ Scraping failed:", err);
  process.exit(1);
});
