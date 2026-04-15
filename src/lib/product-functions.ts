/**
 * Products Server Functions — createServerFn pattern
 *
 * Server-side data loading for product catalog pages.
 * Runs on the server during SSR and as RPC from the client.
 *
 * NOTE: LSP may show type errors on .handler() due to TanStack Start's
 * virtual module — these are resolved at runtime by the Vite plugin.
 */

import { createServerFn } from "@tanstack/react-start";
import { getCategories, getProducts, getProductBySlug, getFeaturedProducts } from "./products.server";
import type { ProductListItem, ProductDetail, CategoryItem } from "./products.server";
import type { PaginatedData } from "./types/api";

// Re-export types for convenience
export type { ProductListItem, ProductDetail, CategoryItem };

// ─── Homepage ───────────────────────────────────────────────────────

/**
 * Get category images for homepage CategoriesSection.
 * Returns a Record<categoryName, imageUrl>.
 */
export const $getCategoryImages = createServerFn({ method: "GET" }).handler(async () => {
  const categories = await getCategories();
  const images: Record<string, string> = {};
  for (const cat of categories) {
    if (cat.image) images[cat.name] = cat.image;
    for (const child of cat.children) {
      if (child.image) images[child.name] = child.image;
      for (const gc of child.children) {
        if (gc.image) images[gc.name] = gc.image;
      }
    }
  }
  return images;
});

// ─── Catalogo ───────────────────────────────────────────────────────

/**
 * Get paginated products for catalog page.
 */
export const $getCatalogProducts = createServerFn({ method: "GET" })
  .inputValidator((data: {
    page?: number;
    perPage?: number;
    category?: string;
    query?: string;
    sort?: string;
  }) => data)
  .handler(async ({ data }) => {
    const result = await getProducts({
      page: data.page ?? 1,
      perPage: data.perPage ?? 12,
      category: data.category,
      query: data.query,
      sort: (data.sort ?? "newest") as "newest" | "price_asc" | "price_desc" | "name",
    });
    return result satisfies PaginatedData<ProductListItem>;
  });

/**
 * Get all categories for catalog sidebar.
 */
export const $getCategories = createServerFn({ method: "GET" }).handler(async () => {
  const categories = await getCategories();
  return categories satisfies CategoryItem[];
});

// ─── Product Detail ─────────────────────────────────────────────────

/**
 * Get full product detail by slug.
 * Returns null if product not found.
 */
export const $getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const product = await getProductBySlug(data.slug);
    return product satisfies ProductDetail | null;
  });

/**
 * Get featured products (for related products section).
 */
export const $getFeaturedProducts = createServerFn({ method: "GET" })
  .inputValidator((data: { limit: number }) => data)
  .handler(async ({ data }) => {
    const products = await getFeaturedProducts(data.limit);
    return products satisfies ProductListItem[];
  });
