/**
 * Orders Service — server-only
 *
 * Business logic for order creation, listing, and detail retrieval.
 */

import { prisma } from "~/lib/db.server";
import type { CheckoutInput, CheckoutGuestInput } from "~/lib/validators/products";
import type { PaginatedData } from "~/lib/types/api";

// ─── Types ────────────────────────────────────────────────────────────

interface OrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
}

interface OrderDetailResult {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  discountAmount: number;
  shippingMethod: string | null;
  trackingNumber: string | null;
  notes: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    variantName: string | null;
    price: number;
    quantity: number;
    product: { slug: string };
  }>;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    method: string | null;
    createdAt: string;
  }>;
}

interface OrderCreatedData {
  id: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  items: Array<{
    name: string;
    variantName: string | null;
    price: number;
    quantity: number;
  }>;
}

interface CartItemFull {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  price: unknown;
  product: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    deletedAt: Date | null;
    stock: number;
    price: unknown;
  };
  variant: {
    id: string;
    name: string;
    color: string | null;
    size: string | null;
    stock: number;
    price: unknown;
    isActive: boolean;
  } | null;
}

// ─── Public service functions ──────────────────────────────────────────

/** Create order from cart (supports both authenticated and guest) */
export async function createOrder(
  userId: string | null,
  sessionId: string | null,
  input: CheckoutInput | CheckoutGuestInput,
  ipAddress: string | null,
  userAgent: string | null,
): Promise<
  | { ok: true; order: OrderCreatedData }
  | { ok: false; error: string }
> {
  // Build addressId from either saved address or inline guest address
  let addressId: string;

  if ("addressId" in input) {
    // Authenticated: validate address belongs to user
    if (!userId) return { ok: false, error: "Utente non autenticato" };
    const address = await prisma.address.findFirst({ where: { id: input.addressId, userId } });
    if (!address) return { ok: false, error: "Indirizzo non trovato" };
    addressId = address.id;
  } else {
    // Guest: create address on the fly (no userId)
    const addr = await prisma.address.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        address1: input.address.address1,
        address2: input.address.address2 ?? null,
        city: input.address.city,
        province: input.address.province,
        postalCode: input.address.postalCode,
        country: input.address.country,
        phone: input.address.phone ?? null,
        isDefault: false,
        guestEmail: input.email,
      },
    });
    addressId = addr.id;
  }

  // Find the active cart (by userId or sessionId)
  const cartWhere = userId
    ? { userId, expiresAt: { gt: new Date() } }
    : { sessionId, expiresAt: { gt: new Date() } };

  const cart = await prisma.cart.findFirst({
    where: cartWhere,
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, isActive: true, deletedAt: true, stock: true, price: true } },
          variant: { select: { id: true, name: true, color: true, size: true, stock: true, price: true, isActive: true } },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) return { ok: false, error: "Carrello vuoto" };

  const cartItems = cart.items as unknown as CartItemFull[];

  // Validate all items are still available
  for (const item of cartItems) {
    if (!item.product.isActive || item.product.deletedAt) {
      return { ok: false, error: `Il prodotto "${item.product.name}" non è più disponibile` };
    }
    if (item.variant && !item.variant.isActive) {
      return { ok: false, error: `La variante "${item.variant.name}" non è più disponibile` };
    }
    const availableStock = item.variant ? item.variant.stock : item.product.stock;
    if (item.quantity > availableStock) {
      return { ok: false, error: `Quantità non disponibile per "${item.product.name}"` };
    }
  }

  // Apply discount code if provided
  let discountAmount = 0;
  if (input.discountCode) {
    const code = await prisma.discountCode.findFirst({
      where: {
        code: input.discountCode.toUpperCase(),
        isActive: true,
        startsAt: { lte: new Date() },
        expiresAt: { gte: new Date() },
      },
    });
    if (code) {
      const subtotal = cartItems.reduce(
        (sum: number, item: CartItemFull) => sum + Number(item.price) * item.quantity,
        0,
      );
      if (code.minOrder && subtotal < Number(code.minOrder)) {
        return { ok: false, error: `Ordine minimo: €${code.minOrder}` };
      }
      if (code.maxUses && code.usedCount >= code.maxUses) {
        return { ok: false, error: "Codice sconto esaurito" };
      }
      discountAmount = code.type === "percentage"
        ? Math.round(subtotal * Number(code.value) / 100 * 100) / 100
        : Math.min(Number(code.value), subtotal);
      await prisma.discountCode.update({ where: { id: code.id }, data: { usedCount: { increment: 1 } } });
    }
  }

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum: number, item: CartItemFull) => sum + Number(item.price) * item.quantity,
    0,
  );
  const shippingCost = subtotal >= 99 ? 0 : 7.9;
  const taxRate = 0.22;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
  const total = Math.round((taxableAmount + shippingCost + taxAmount) * 100) / 100;

  // Generate order number
  const orderCount = await prisma.order.count();
  const orderNumber = `CP-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, "0")}`;

  // Create order with items
  const isGuest = !userId && "email" in input;
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      status: "pending",
      subtotal,
      shippingCost,
      taxAmount,
      total,
      discountAmount,
      shippingMethod: input.shippingMethod,
      notes: input.notes,
      ipAddress,
      userAgent,
      ...(isGuest ? { guestEmail: input.email } : {}),
      items: {
        create: cartItems.map((item: CartItemFull) => ({
          productId: item.productId,
          variantId: item.variantId,
          addressId,
          name: item.product.name,
          variantName: item.variant?.name,
          price: Number(item.price),
          quantity: item.quantity,
        })),
      },
    },
    include: {
      items: { include: { product: { select: { name: true } } } },
    },
  });

  // Deduct stock
  for (const item of cartItems) {
    if (item.variantId) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    }
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  // Clear cart
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });

  return {
    ok: true,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      taxAmount: Number(order.taxAmount),
      discountAmount: Number(order.discountAmount),
      items: order.items.map((item) => ({
        name: item.name,
        variantName: item.variantName,
        price: Number(item.price),
        quantity: item.quantity,
      })),
    },
  };
}

/** Get paginated orders for a user */
export async function getUserOrders(
  userId: string,
  page = 1,
  perPage = 10,
): Promise<PaginatedData<OrderListItem>> {
  const skip = (page - 1) * perPage;

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
      select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
    }),
    prisma.order.count({ where: { userId, deletedAt: null } }),
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      orderNumber: item.orderNumber,
      status: item.status,
      total: Number(item.total),
      createdAt: item.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / perPage),
  };
}

/** Get single order detail */
export async function getOrderDetail(userId: string, orderId: string): Promise<OrderDetailResult | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId, deletedAt: null },
    include: {
      items: { include: { product: { select: { name: true, slug: true } }, variant: { select: { name: true } } } },
      payments: { select: { id: true, amount: true, status: true, method: true, createdAt: true } },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    taxAmount: Number(order.taxAmount),
    total: Number(order.total),
    discountAmount: Number(order.discountAmount),
    shippingMethod: order.shippingMethod,
    trackingNumber: order.trackingNumber,
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      variantName: item.variantName,
      price: Number(item.price),
      quantity: item.quantity,
      product: { slug: item.product.slug },
    })),
    payments: order.payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      status: p.status,
      method: p.method,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

/** Create Stripe checkout session for an order (supports guest email) */
export async function createCheckoutSession(
  orderId: string,
  orderNumber: string,
  totalEuros: number,
  userId: string | null,
  guestEmail?: string,
) {
  const { stripe } = await import("~/lib/stripe.server");
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";

  const metadata: Record<string, string> = { orderId };
  if (userId) metadata.userId = userId;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: Math.round(totalEuros * 100),
          product_data: { name: `Ordine ${orderNumber}` },
        },
        quantity: 1,
      },
    ],
    metadata,
    ...(guestEmail ? { customer_email: guestEmail } : {}),
    success_url: `${baseUrl}/ordine-confermato?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/carrello`,
  });

  return session;
}

export type { OrderListItem, OrderDetailResult, OrderCreatedData };
