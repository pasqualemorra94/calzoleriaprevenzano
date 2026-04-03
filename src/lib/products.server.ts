/**
 * Products Service — server-only
 *
 * Business logic for product catalog: listing, detail, categories.
 * No Prisma queries leak to API routes — all go through here.
 */

import { prisma } from "~/lib/db.server";
import type { PaginatedData } from "~/lib/types/api";
import type { ListProductsInput } from "~/lib/validators/products";

// ─── Types for safe JSON serialization ─────────────────────────────────

interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  image: { id: string; url: string; alt: string | null } | null;
  category: { id: string; name: string; slug: string } | null;
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  stock: number;
  weight: number | null;
  materials: string | null;
  variantConfig: Record<string, unknown> | null;
  category: { id: string; name: string; slug: string } | null;
  images: Array<{ id: string; url: string; alt: string | null; width: number | null; height: number | null }>;
  variants: Array<{
    id: string;
    name: string;
    color: string | null;
    size: string | null;
    price: number | null;
    stock: number;
    sku: string | null;
  }>;
}

interface CategoryChildItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  productCount: number;
  children: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    productCount: number;
  }>;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  productCount: number;
  children: CategoryChildItem[];
}

interface RawProductListRow {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  price: unknown;
  compareAtPrice: unknown | null;
  images: Array<{ id: string; url: string; alt: string | null }>;
  category: { id: string; name: string; slug: string } | null;
}

// ─── Sort mapping ─────────────────────────────────────────────────────

type ProductSortKey = "newest" | "price_asc" | "price_desc" | "name";

function getOrderBy(sort: ProductSortKey) {
  const map: Record<ProductSortKey, Record<string, string>> = {
    newest: { createdAt: "desc" },
    price_asc: { price: "asc" },
    price_desc: { price: "desc" },
    name: { name: "asc" },
  };
  return map[sort];
}

// ─── Public service functions ──────────────────────────────────────────

/** Get paginated product listing with filters */
export async function getProducts(input: ListProductsInput): Promise<PaginatedData<ProductListItem>> {
  const { page, perPage, category, query, minPrice, maxPrice, sort } = input;
  const skip = (page - 1) * perPage;
  const orderBy = getOrderBy(sort as ProductSortKey);

  const where = buildProductWhere({ category, query, minPrice, maxPrice });

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: perPage,
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        price: true,
        compareAtPrice: true,
        images: { where: { sortOrder: 0 }, select: { id: true, url: true, alt: true }, take: 1 },
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map(mapProductListItem),
    total,
    page,
    totalPages: Math.ceil(total / perPage),
  };
}

/** Get a single product by slug with full details */
export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, alt: true, width: true, height: true } },
      variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    sku: product.sku,
    stock: product.stock,
    weight: product.weight ? Number(product.weight) : null,
    materials: product.materials,
    variantConfig: product.variantConfig as Record<string, unknown> | null,
    category: product.category,
    images: product.images,
    variants: product.variants.map((v: {
      id: string;
      name: string;
      color: string | null;
      size: string | null;
      price: unknown;
      stock: number;
      sku: string | null;
    }) => ({
      id: v.id,
      name: v.name,
      color: v.color,
      size: v.size,
      price: v.price ? Number(v.price) : null,
      stock: v.stock,
      sku: v.sku,
    })),
  };
}

/** Get all active categories with full hierarchy and product counts */
export async function getCategories(): Promise<CategoryItem[]> {
  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: { id: true, name: true, slug: true, description: true, image: true },
          },
        },
      },
    },
  });

  // Collect all IDs for product count query
  const allIds: string[] = [];
  for (const cat of categories) {
    allIds.push(cat.id);
    for (const child of cat.children) {
      allIds.push(child.id);
      for (const gc of child.children) {
        allIds.push(gc.id);
      }
    }
  }

  const productCounts = await prisma.product.groupBy({
    by: ["categoryId"],
    where: { categoryId: { in: allIds, not: null }, isActive: true, deletedAt: null },
    _count: { id: true },
  });

  const countMap = new Map<string, number>();
  for (const pc of productCounts) {
    if (pc.categoryId) countMap.set(pc.categoryId, pc._count.id);
  }

  const getCount = (id: string): number => countMap.get(id) ?? 0;

  const result: CategoryItem[] = categories.map((cat) => {
    const directCount = getCount(cat.id);
    const childrenSum = cat.children.reduce((s, ch) => {
      const chDirect = getCount(ch.id);
      const gcSum = ch.children.reduce((s2, gc) => s2 + getCount(gc.id), 0);
      return s + chDirect + gcSum;
    }, 0);

    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      productCount: directCount + childrenSum,
      children: cat.children.map((ch) => {
        const chDirect = getCount(ch.id);
        const gcSum = ch.children.reduce((s2, gc) => s2 + getCount(gc.id), 0);
        return {
          id: ch.id,
          name: ch.name,
          slug: ch.slug,
          description: ch.description,
          image: ch.image,
          productCount: chDirect + gcSum,
          children: ch.children.map((gc) => ({
            id: gc.id,
            name: gc.name,
            slug: gc.slug,
            description: gc.description,
            image: gc.image,
            productCount: getCount(gc.id),
          })),
        };
      }),
    };
  });

  return result;
}

/** Get featured products */
export async function getFeaturedProducts(limit = 8): Promise<ProductListItem[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      price: true,
      compareAtPrice: true,
      images: { where: { sortOrder: 0 }, select: { id: true, url: true, alt: true }, take: 1 },
      category: { select: { id: true, name: true, slug: true } },
    },
  });
  return products.map(mapProductListItem);
}

// ─── Internal helpers ──────────────────────────────────────────────────

function buildProductWhere(opts: {
  category?: string;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  const conditions: Array<Record<string, unknown>> = [{ isActive: true }, { deletedAt: null }];

  if (opts.category) {
    // Match the category itself OR any of its descendants (children, grandchildren, etc.)
    conditions.push({
      OR: [
        { category: { slug: opts.category } },
        { category: { parent: { slug: opts.category } } },
        { category: { parent: { parent: { slug: opts.category } } } },
      ],
    });
  }
  if (opts.query) {
    conditions.push({
      OR: [
        { name: { contains: opts.query, mode: "insensitive" } },
        { description: { contains: opts.query, mode: "insensitive" } },
        { materials: { contains: opts.query, mode: "insensitive" } },
      ],
    });
  }
  if (opts.minPrice !== undefined) {
    conditions.push({ price: { gte: opts.minPrice } });
  }
  if (opts.maxPrice !== undefined) {
    conditions.push({ price: { lte: opts.maxPrice } });
  }

  return { AND: conditions };
}

function mapProductListItem(product: RawProductListRow): ProductListItem {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    image: product.images[0] ?? null,
    category: product.category,
  };
}

export type { ProductListItem, ProductDetail, CategoryItem };
