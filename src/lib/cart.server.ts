/**
 * Cart Service — server-only
 *
 * Business logic for shopping cart: get, add, update, remove items.
 * Supports both authenticated users (userId) and anonymous sessions.
 */

import { prisma } from "~/lib/db.server";
import type { AddToCartInput, UpdateCartItemInput } from "~/lib/validators/products";
import { APP_CONFIG } from "~/lib/constants/app";

// ─── Types ────────────────────────────────────────────────────────────

interface CartItemDetail {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  price: number;
  product: { name: string; slug: string };
  variant: { name: string; color: string | null; size: string | null } | null;
}

interface CartItemWithProduct {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  price: unknown;
  product: { id: string; name: string; slug: string; isActive: boolean; deletedAt: Date | null };
  variant: { id: string; name: string; color: string | null; size: string | null; isActive: boolean } | null;
}

interface CartResult {
  id: string;
  items: CartItemDetail[];
  itemCount: number;
  subtotal: number;
}

interface CartWithItems {
  id: string;
  items: CartItemWithProduct[];
}

// ─── Helpers ──────────────────────────────────────────────────────────

async function getOrCreateCart(userId: string | null, sessionId: string | null): Promise<CartWithItems> {
  const where = userId
    ? { userId, expiresAt: { gt: new Date() } }
    : { sessionId, expiresAt: { gt: new Date() } };

  let cart = await prisma.cart.findFirst({
    where,
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, isActive: true, deletedAt: true } },
          variant: { select: { id: true, name: true, color: true, size: true, isActive: true } },
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId: userId ?? undefined,
        sessionId: sessionId ?? undefined,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, isActive: true, deletedAt: true } },
            variant: { select: { id: true, name: true, color: true, size: true, isActive: true } },
          },
          orderBy: { id: "asc" },
        },
      },
    });
  }

  return cart as CartWithItems;
}

function isValidItem(item: CartItemWithProduct): boolean {
  if (!item.product.isActive || item.product.deletedAt) return false;
  if (item.variant && !item.variant.isActive) return false;
  return true;
}

function mapCartItem(item: CartItemWithProduct): CartItemDetail {
  return {
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    price: Number(item.price),
    product: { name: item.product.name, slug: item.product.slug },
    variant: item.variant ? { name: item.variant.name, color: item.variant.color, size: item.variant.size } : null,
  };
}

// ─── Public service functions ──────────────────────────────────────────

/** Get cart with items */
export async function getCart(userId: string | null, sessionId: string | null): Promise<CartResult> {
  const cart = await getOrCreateCart(userId, sessionId);
  const validItems = cart.items.filter(isValidItem).map(mapCartItem);

  const itemCount = validItems.reduce((sum: number, item: CartItemDetail) => sum + item.quantity, 0);
  const subtotal = validItems.reduce((sum: number, item: CartItemDetail) => sum + item.price * item.quantity, 0);

  return { id: cart.id, items: validItems, itemCount, subtotal };
}

/** Add item to cart */
export async function addToCart(
  userId: string | null,
  sessionId: string | null,
  input: AddToCartInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cart = await getOrCreateCart(userId, sessionId);

  const product = await prisma.product.findFirst({
    where: { id: input.productId, isActive: true, deletedAt: null },
    include: { variants: { where: { id: input.variantId, isActive: true } } },
  });

  if (!product) return { ok: false, error: "Prodotto non trovato" };

  const variant = input.variantId ? product.variants[0] : null;
  if (input.variantId && !variant) return { ok: false, error: "Variante non disponibile" };

  const availableStock = variant ? variant.stock : product.stock;
  const existingItem = cart.items.find(
    (i: CartItemWithProduct) => i.productId === input.productId && i.variantId === (input.variantId ?? null),
  );
  const currentQty = existingItem?.quantity ?? 0;
  const totalQty = currentQty + input.quantity;

  if (totalQty > availableStock) return { ok: false, error: "Quantità non disponibile" };
  if (cart.items.length >= APP_CONFIG.cart.maxItems) return { ok: false, error: "Carrello pieno" };

  const price = variant?.price ?? product.price;

  if (existingItem) {
    await prisma.cartItem.update({ where: { id: existingItem.id }, data: { quantity: totalQty } });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: input.productId,
        variantId: input.variantId,
        quantity: input.quantity,
        price,
      },
    });
  }

  await prisma.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
  return { ok: true };
}

/** Update cart item quantity */
export async function updateCartItem(
  userId: string | null,
  sessionId: string | null,
  itemId: string,
  input: UpdateCartItemInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cart = await getOrCreateCart(userId, sessionId);
  const item = cart.items.find((i: CartItemWithProduct) => i.id === itemId);
  if (!item) return { ok: false, error: "Articolo non trovato nel carrello" };

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: input.quantity } });
  await prisma.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
  return { ok: true };
}

/** Remove item from cart */
export async function removeFromCart(
  userId: string | null,
  sessionId: string | null,
  itemId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cart = await getOrCreateCart(userId, sessionId);
  const item = cart.items.find((i: CartItemWithProduct) => i.id === itemId);
  if (!item) return { ok: false, error: "Articolo non trovato nel carrello" };

  await prisma.cartItem.delete({ where: { id: itemId } });
  await prisma.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
  return { ok: true };
}

/** Merge anonymous session cart into user cart on login */
export async function mergeCart(sessionId: string, userId: string): Promise<void> {
  const sessionCart = await prisma.cart.findFirst({
    where: { sessionId, expiresAt: { gt: new Date() } },
    include: { items: true },
  });

  if (!sessionCart || sessionCart.items.length === 0) return;

  const userCart = await getOrCreateCart(userId, null);

  for (const item of sessionCart.items) {
    const existing = userCart.items.find(
      (i: CartItemWithProduct) => i.productId === item.productId && i.variantId === item.variantId,
    );

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity },
      });
    } else {
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { cartId: userCart.id },
      });
    }
  }

  await prisma.cart.delete({ where: { id: sessionCart.id } });
}
