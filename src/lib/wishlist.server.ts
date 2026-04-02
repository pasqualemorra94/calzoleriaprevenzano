/**
 * Wishlist Service — server-only
 *
 * Business logic for wishlist: listing, adding, removing products.
 */

import { prisma } from "~/lib/db.server";

// ─── Types ────────────────────────────────────────────────────────────

interface WishlistItem {
  id: string;
  productId: string;
  addedAt: string;
  product: {
    name: string;
    slug: string;
    price: number;
    compareAtPrice: number | null;
    image: { id: string; url: string; alt: string | null } | null;
  };
}

interface WishlistRawRow {
  id: string;
  productId: string;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    slug: string;
    price: unknown;
    compareAtPrice: unknown | null;
    isActive: boolean;
    deletedAt: Date | null;
    images: Array<{ id: string; url: string; alt: string | null }>;
  };
}

// ─── Public service functions ──────────────────────────────────────────

/** Get user's wishlist with product details */
export async function getWishlist(userId: string): Promise<WishlistItem[]> {
  const items = await prisma.wishlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          compareAtPrice: true,
          isActive: true,
          deletedAt: true,
          images: { where: { sortOrder: 0 }, select: { id: true, url: true, alt: true }, take: 1 },
        },
      },
    },
  });

  const rawItems = items as unknown as WishlistRawRow[];

  return rawItems
    .filter((item: WishlistRawRow) => item.product.isActive && !item.product.deletedAt)
    .map((item: WishlistRawRow) => ({
      id: item.id,
      productId: item.productId,
      addedAt: item.createdAt.toISOString(),
      product: {
        name: item.product.name,
        slug: item.product.slug,
        price: Number(item.product.price),
        compareAtPrice: item.product.compareAtPrice ? Number(item.product.compareAtPrice) : null,
        image: item.product.images[0] ?? null,
      },
    }));
}

/** Add product to wishlist */
export async function addToWishlist(
  userId: string,
  productId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true, deletedAt: null },
  });
  if (!product) return { ok: false, error: "Prodotto non trovato" };

  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) return { ok: false, error: "Già in wishlist" };

  await prisma.wishlist.create({ data: { userId, productId } });
  return { ok: true };
}

/** Remove product from wishlist */
export async function removeFromWishlist(
  userId: string,
  productId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const item = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (!item) return { ok: false, error: "Non in wishlist" };

  await prisma.wishlist.delete({ where: { id: item.id } });
  return { ok: true };
}

export type { WishlistItem };
