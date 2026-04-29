/**
 * Admin Products — server-only
 *
 * Product CRUD operations for admin panel.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "~/lib/db.server";
import type { PaginatedData } from "~/lib/types/api";
import type { ListAdminProductsInput } from "~/lib/validators/admin";
import type {
  AdminProductListItem,
  AdminProductDetail,
  VariantPayload,
  ImagePayload,
  ProductWithRelationsInput,
} from "./types";

// ─── List ───────────────────────────────────────────────────────────────

export async function getAdminProducts(
  input: ListAdminProductsInput,
): Promise<PaginatedData<AdminProductListItem>> {
  const { page, perPage, query, category, status, sort } = input;
  const skip = (page - 1) * perPage;

  const conditions: Array<Record<string, unknown>> = [];

  if (status === "active") {
    conditions.push({ isActive: true }, { deletedAt: null });
  } else if (status === "inactive") {
    conditions.push({ isActive: false }, { deletedAt: null });
  } else if (status === "deleted") {
    conditions.push({ deletedAt: { not: null } });
  }

  if (category) {
    conditions.push({ category: { slug: category } });
  }

  if (query) {
    conditions.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { slug: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};
  const orderBy = getProductOrderBy(sort);

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
        price: true,
        stock: true,
        isActive: true,
        deletedAt: true,
        category: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true }, take: 1 },
        createdAt: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map((p: {
      id: string; name: string; slug: string; price: unknown; stock: number;
      isActive: boolean; deletedAt: Date | null;
      category: { id: string; name: string } | null;
      images: Array<{ id: string; url: string }>;
      createdAt: Date;
    }) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      stock: p.stock,
      isActive: p.isActive,
      deletedAt: p.deletedAt?.toISOString() ?? null,
      category: p.category,
      image: p.images[0] ? { id: p.images[0].id, url: p.images[0].url } : null,
      createdAt: p.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / perPage),
  };
}

function getProductOrderBy(sort: string): Record<string, string> {
  const map: Record<string, Record<string, string>> = {
    newest: { createdAt: "desc" },
    name: { name: "asc" },
    price_asc: { price: "asc" },
    price_desc: { price: "desc" },
  };
  return map[sort] ?? { createdAt: "desc" };
}

// ─── Detail ─────────────────────────────────────────────────────────────

export async function getAdminProduct(id: string): Promise<AdminProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
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
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    stock: product.stock,
    weight: product.weight ? Number(product.weight) : null,
    materials: product.materials,
    variantConfig: product.variantConfig as Record<string, unknown> | null,
    categoryId: product.categoryId,
    category: product.category,
    images: product.images.map((img: { id: string; url: string; alt: string | null; sortOrder: number; mediaId: string | null }) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      sortOrder: img.sortOrder,
      mediaId: img.mediaId,
    })),
    variants: product.variants.map((v: {
      id: string; name: string; color: string | null; size: string | null;
      price: unknown; stock: number; sku: string | null; isActive: boolean; sortOrder: number;
    }) => ({
      id: v.id,
      name: v.name,
      color: v.color,
      size: v.size,
      price: v.price ? Number(v.price) : null,
      stock: v.stock,
      sku: v.sku,
      isActive: v.isActive,
      sortOrder: v.sortOrder,
    })),
  };
}

// ─── Create ─────────────────────────────────────────────────────────────

export async function adminCreateProduct(data: ProductWithRelationsInput) {
  const { variants, images, variantConfig, ...productData } = data;

  return prisma.product.create({
    data: {
      ...productData,
      ...(variantConfig !== undefined ? { variantConfig } : {}),
      ...(variants && variants.length > 0
        ? {
            variants: {
              create: variants.map((v) => ({
                name: v.name,
                color: v.color ?? null,
                size: v.size ?? null,
                price: v.price ?? null,
                stock: v.stock,
                sku: v.sku ?? null,
                isActive: v.isActive,
                sortOrder: v.sortOrder,
              })),
            },
          }
        : {}),
      ...(images && images.length > 0
        ? {
            images: {
              create: images.map((img) => ({
                url: img.url,
                alt: img.alt ?? null,
                sortOrder: img.sortOrder,
                mediaId: img.mediaId ?? null,
              })),
            },
          }
        : {}),
    } as Parameters<typeof prisma.product.create>[0]["data"],
  });
}

// ─── Update ─────────────────────────────────────────────────────────────

export async function adminUpdateProduct(id: string, data: Record<string, unknown>) {
  const { variants, images, variantConfig, ...productData } = data as ProductWithRelationsInput & Record<string, unknown>;

  return prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
    const product = await tx.product.update({
      where: { id },
      data: {
        ...productData,
        ...(variantConfig !== undefined ? { variantConfig } : {}),
      } as Parameters<typeof tx.product.update>[0]["data"],
    });

    if (Array.isArray(variants)) {
      await tx.productVariant.deleteMany({ where: { productId: id } });
      if (variants.length > 0) {
        await tx.productVariant.createMany({
          data: variants.map((v: VariantPayload) => ({
            productId: id,
            name: v.name,
            color: v.color ?? null,
            size: v.size ?? null,
            price: v.price ?? null,
            stock: v.stock,
            sku: v.sku ?? null,
            isActive: v.isActive,
            sortOrder: v.sortOrder,
          })),
        });
      }
    }

    if (Array.isArray(images)) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((img: ImagePayload) => ({
            productId: id,
            url: img.url,
            alt: img.alt ?? null,
            sortOrder: img.sortOrder,
            mediaId: img.mediaId ?? null,
          })),
        });
      }
    }

    return product;
  });
}

// ─── Delete / Restore ───────────────────────────────────────────────────

export async function adminDeleteProduct(id: string, adminUserId: string) {
  const now = new Date();
  return prisma.product.update({
    where: { id },
    data: { deletedAt: now, deletedBy: adminUserId, isActive: false },
  });
}

export async function adminRestoreProduct(id: string) {
  return prisma.product.update({
    where: { id },
    data: { deletedAt: null, deletedBy: null, isActive: true },
  });
}

// ─── Duplicate ──────────────────────────────────────────────────────────

export async function adminDuplicateProduct(
  id: string,
): Promise<{ id: string; slug: string }> {
  const src = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!src) throw new Error("Prodotto non trovato");

  const baseSlug = `${src.slug}-copia`;
  const baseSku = src.sku ? `${src.sku}-COPIA` : null;

  const existing = await prisma.product.findMany({
    where: { slug: { startsWith: baseSlug } },
    select: { slug: true, sku: true },
  });
  const slugs = new Set(existing.map((p: { slug: string; sku: string | null }) => p.slug));
  const skus = new Set(
    existing
      .map((p: { slug: string; sku: string | null }) => p.sku)
      .filter((s: string | null): s is string => s !== null),
  );

  let suffix = "";
  let found = false;
  for (let n = 1; n <= 50; n++) {
    suffix = n === 1 ? "" : `-${n}`;
    const trySlug = `${baseSlug}${suffix}`;
    const trySku = baseSku ? `${baseSku}${suffix}` : null;
    if (!slugs.has(trySlug) && (!trySku || !skus.has(trySku))) {
      found = true;
      break;
    }
  }
  if (!found) throw new Error("SLUG_COLLISION_LIMIT");

  const newSlug = `${baseSlug}${suffix}`;
  const newSku = baseSku ? `${baseSku}${suffix}` : null;

  const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    return tx.product.create({
      data: {
        name: `${src.name} (copia)`,
        slug: newSlug,
        description: src.description,
        shortDescription: src.shortDescription,
        price: src.price,
        compareAtPrice: src.compareAtPrice,
        sku: newSku,
        isActive: false,
        isFeatured: false,
        stock: src.stock,
        weight: src.weight,
        materials: src.materials,
        variantConfig: src.variantConfig ?? Prisma.JsonNull,
        aiMetadata: src.aiMetadata ?? Prisma.JsonNull,
        categoryId: src.categoryId,
        images: {
          create: src.images.map((i: {
            url: string; alt: string | null; sortOrder: number;
            width: number | null; height: number | null; mediaId: string | null;
          }) => ({
            url: i.url,
            alt: i.alt,
            sortOrder: i.sortOrder,
            width: i.width,
            height: i.height,
            mediaId: i.mediaId,
          })),
        },
        variants: {
          create: src.variants.map((v: {
            name: string; color: string | null; size: string | null;
            price: Prisma.Decimal | null; stock: number; isActive: boolean; sortOrder: number;
          }) => ({
            name: v.name,
            color: v.color,
            size: v.size,
            price: v.price,
            stock: v.stock,
            sku: null,
            isActive: v.isActive,
            sortOrder: v.sortOrder,
          })),
        },
      },
      select: { id: true, slug: true },
    });
  });

  return { id: created.id, slug: created.slug };
}
