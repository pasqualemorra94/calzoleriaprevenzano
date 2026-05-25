/**
 * Admin Abandoned Carts — server-only (view-only)
 *
 * Definizione "carrello abbandonato":
 *   - Cart con almeno 1 CartItem (items: { some: {} })
 *   - updatedAt < (now - thresholdMs)
 *   - expiresAt > now()
 *
 * NOTA cross-check Order non necessario: orders.server.ts:310-312 esegue
 * cartItem.deleteMany subito dopo creazione ordine. I cart convertiti
 * restano come riga ma con items vuoti → naturalmente esclusi da items.some.
 *
 * Volume atteso <1000 cart abbandonati attivi → no indice DB su updatedAt.
 */

import { prisma } from "~/lib/db.server";
import type { PaginatedData } from "~/lib/types/api";

export type ThresholdRange = "1h" | "24h" | "7gg" | "30gg";
export type UserFilter = "all" | "logged" | "guest";

export interface ListAbandonedCartsInput {
  page: number;
  perPage: number;
  threshold: ThresholdRange;
  userFilter: UserFilter;
}

export interface AbandonedCartListItem {
  id: string;
  userId: string | null;
  sessionId: string | null;
  userEmail: string | null;
  userName: string | null;
  itemCount: number;
  totalValue: number;
  firstProductName: string;
  additionalProductsCount: number;
  updatedAt: string;
  createdAt: string;
  expiresAt: string;
}

export interface AbandonedCartDetailItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  variantId: string | null;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  selectedOptions: Array<{ label: string; value: string; color?: string }> | null;
}

export interface AbandonedCartDetail {
  id: string;
  userId: string | null;
  sessionId: string | null;
  userEmail: string | null;
  userName: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  totalValue: number;
  itemCount: number;
  items: AbandonedCartDetailItem[];
}

export interface AbandonedCartsStats {
  totalCount: number;
  totalPotentialValue: number;
  loggedCount: number;
  guestCount: number;
}

const THRESHOLD_MS: Record<ThresholdRange, number> = {
  "1h": 3_600_000,
  "24h": 86_400_000,
  "7gg": 604_800_000,
  "30gg": 2_592_000_000,
};

function thresholdToMs(threshold: ThresholdRange): number {
  return THRESHOLD_MS[threshold];
}

function buildWhereClause(
  threshold: ThresholdRange,
  userFilter: UserFilter,
  now: Date,
): { AND: Array<Record<string, unknown>> } {
  const thresholdDate = new Date(now.getTime() - thresholdToMs(threshold));
  const conditions: Array<Record<string, unknown>> = [
    { items: { some: {} } },
    { updatedAt: { lt: thresholdDate } },
    { expiresAt: { gt: now } },
  ];
  if (userFilter === "logged") conditions.push({ userId: { not: null } });
  else if (userFilter === "guest") conditions.push({ userId: null });
  return { AND: conditions };
}

/**
 * Type guard runtime per selectedOptions JsonValue → tipo strict.
 * Ritorna null se la shape non è un array di { label, value, color? }.
 */
function parseSelectedOptions(
  raw: unknown,
): Array<{ label: string; value: string; color?: string }> | null {
  if (!Array.isArray(raw)) return null;
  const out: Array<{ label: string; value: string; color?: string }> = [];
  for (const entry of raw) {
    if (
      entry === null ||
      typeof entry !== "object" ||
      typeof (entry as { label?: unknown }).label !== "string" ||
      typeof (entry as { value?: unknown }).value !== "string"
    ) {
      return null;
    }
    const item: { label: string; value: string; color?: string } = {
      label: (entry as { label: string }).label,
      value: (entry as { value: string }).value,
    };
    const color = (entry as { color?: unknown }).color;
    if (typeof color === "string") item.color = color;
    out.push(item);
  }
  return out;
}

export async function listAbandonedCarts(
  input: ListAbandonedCartsInput,
): Promise<PaginatedData<AbandonedCartListItem>> {
  const { page, perPage, threshold, userFilter } = input;
  const now = new Date();
  const where = buildWhereClause(threshold, userFilter, now);
  const skip = (page - 1) * perPage;

  const [carts, total] = await Promise.all([
    prisma.cart.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: perPage,
      include: {
        user: { select: { name: true, email: true } },
        items: {
          select: {
            quantity: true,
            price: true,
            product: { select: { name: true } },
          },
          orderBy: { id: "asc" },
        },
      },
    }),
    prisma.cart.count({ where }),
  ]);

  const items: AbandonedCartListItem[] = carts.map((c) => {
    let itemCount = 0;
    let totalValue = 0;
    for (const it of c.items) {
      itemCount += it.quantity;
      totalValue += it.quantity * Number(it.price);
    }
    const distinctProductNames = new Set(c.items.map((it) => it.product.name));
    const firstProductName = c.items[0]?.product.name ?? "—";
    const additionalProductsCount = Math.max(0, distinctProductNames.size - 1);

    return {
      id: c.id,
      userId: c.userId,
      sessionId: c.sessionId,
      userEmail: c.user?.email ?? null,
      userName: c.user?.name ?? null,
      itemCount,
      totalValue,
      firstProductName,
      additionalProductsCount,
      updatedAt: c.updatedAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
      expiresAt: c.expiresAt.toISOString(),
    };
  });

  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getAbandonedCart(
  id: string,
): Promise<AbandonedCartDetail | null> {
  const cart = await prisma.cart.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                select: { url: true, alt: true, sortOrder: true },
                orderBy: { sortOrder: "asc" },
                take: 1,
              },
            },
          },
          variant: {
            select: { id: true, name: true, color: true, size: true },
          },
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!cart) return null;

  let itemCount = 0;
  let totalValue = 0;
  const items: AbandonedCartDetailItem[] = cart.items.map((it) => {
    const unitPrice = Number(it.price);
    const subtotal = it.quantity * unitPrice;
    itemCount += it.quantity;
    totalValue += subtotal;
    // Serialize JsonValue defensively poi parse con type guard runtime.
    const rawOptions: unknown = JSON.parse(JSON.stringify(it.selectedOptions ?? null));
    const selectedOptions = parseSelectedOptions(rawOptions);
    return {
      id: it.id,
      productId: it.productId,
      productName: it.product.name,
      productSlug: it.product.slug,
      imageUrl: it.product.images[0]?.url ?? null,
      variantId: it.variantId,
      variantName: it.variant?.name ?? null,
      quantity: it.quantity,
      unitPrice,
      subtotal,
      selectedOptions,
    };
  });

  return {
    id: cart.id,
    userId: cart.userId,
    sessionId: cart.sessionId,
    userEmail: cart.user?.email ?? null,
    userName: cart.user?.name ?? null,
    createdAt: cart.createdAt.toISOString(),
    updatedAt: cart.updatedAt.toISOString(),
    expiresAt: cart.expiresAt.toISOString(),
    totalValue,
    itemCount,
    items,
  };
}

export async function getAbandonedCartsStats(
  threshold: ThresholdRange,
  userFilter: UserFilter,
): Promise<AbandonedCartsStats> {
  const now = new Date();
  const whereTotal = buildWhereClause(threshold, userFilter, now);
  const whereLogged = buildWhereClause(threshold, "logged", now);
  const whereGuest = buildWhereClause(threshold, "guest", now);

  const [totalCount, loggedCount, guestCount, cartsForValue] = await Promise.all([
    prisma.cart.count({ where: whereTotal }),
    prisma.cart.count({ where: whereLogged }),
    prisma.cart.count({ where: whereGuest }),
    prisma.cart.findMany({
      where: whereTotal,
      select: {
        items: { select: { quantity: true, price: true } },
      },
    }),
  ]);

  let totalPotentialValue = 0;
  for (const c of cartsForValue) {
    for (const it of c.items) {
      totalPotentialValue += it.quantity * Number(it.price);
    }
  }

  return {
    totalCount,
    totalPotentialValue,
    loggedCount,
    guestCount,
  };
}
