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
// @ts-expect-error — TanStack Start virtual module typing; works at runtime
export const $getCatalogProducts = createServerFn({ method: "GET" }).handler(async (input: {
  page?: number;
  perPage?: number;
  category?: string;
  query?: string;
  sort?: string;
}) => {
  const result = await getProducts({
    page: input.page ?? 1,
    perPage: input.perPage ?? 12,
    category: input.category,
    query: input.query,
    sort: (input.sort ?? "newest") as "newest" | "price_asc" | "price_desc" | "name",
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
// @ts-expect-error — TanStack Start virtual module typing; works at runtime
export const $getProductBySlug = createServerFn({ method: "GET" }).handler(async (slug: string) => {
  const product = await getProductBySlug(slug);
  return product satisfies ProductDetail | null;
});

/**
 * Get featured products (for related products section).
 */
// @ts-expect-error — TanStack Start virtual module typing; works at runtime
export const $getFeaturedProducts = createServerFn({ method: "GET" }).handler(async (limit: number) => {
  const products = await getFeaturedProducts(limit);
  return products satisfies ProductListItem[];
});
