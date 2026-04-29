/**
 * Admin Orders — server-only
 *
 * Order queries and status management for admin panel.
 */

import { prisma } from "~/lib/db.server";
import type { PaginatedData } from "~/lib/types/api";
import type { ListAdminOrdersInput } from "~/lib/validators/admin";
import type { AdminOrderListItem, AdminOrderDetail } from "./types";

// ─── List ───────────────────────────────────────────────────────────────

export async function getAdminOrders(
  input: ListAdminOrdersInput,
): Promise<PaginatedData<AdminOrderListItem>> {
  const { page, perPage, status, query, sort, view, emailContains, createdFrom, createdTo } = input;
  const skip = (page - 1) * perPage;

  const conditions: Array<Record<string, unknown>> = [];

  // View: active (deletedAt null) | trash (deletedAt non null)
  conditions.push(view === "trash" ? { deletedAt: { not: null } } : { deletedAt: null });

  if (status) {
    conditions.push({ status });
  }

  if (query) {
    conditions.push({
      OR: [
        { orderNumber: { contains: query, mode: "insensitive" } },
        { user: { name: { contains: query, mode: "insensitive" } } },
        { user: { email: { contains: query, mode: "insensitive" } } },
        { guestEmail: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  // Filtro email: match su user.email (loggato) + guestEmail (ospite)
  if (emailContains) {
    conditions.push({
      OR: [
        { guestEmail: { contains: emailContains, mode: "insensitive" } },
        { user: { email: { contains: emailContains, mode: "insensitive" } } },
      ],
    });
  }

  // Range createdAt (Date già coerce dal validator)
  if (createdFrom || createdTo) {
    const range: Record<string, Date> = {};
    if (createdFrom) range.gte = createdFrom;
    if (createdTo) range.lte = createdTo;
    conditions.push({ createdAt: range });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};
  const orderBy = sort === "order_number" ? { orderNumber: "desc" as const } : { createdAt: "desc" as const };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy,
      skip,
      take: perPage,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { select: { quantity: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items: items.map((o: {
      id: string; orderNumber: string; status: string; total: unknown;
      shippingMethod: string | null; trackingNumber: string | null;
      createdAt: Date;
      user: { id: string; name: string | null; email: string } | null;
      guestEmail: string | null;
      items: Array<{ quantity: number }>;
    }) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: Number(o.total),
      shippingMethod: o.shippingMethod,
      trackingNumber: o.trackingNumber,
      createdAt: o.createdAt.toISOString(),
      user: o.user
        ? { id: o.user.id, name: o.user.name, email: o.user.email }
        : { id: "", name: "Ospite", email: o.guestEmail ?? "" },
      itemCount: o.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0),
    })),
    total,
    page,
    totalPages: Math.ceil(total / perPage),
  };
}

// ─── Detail ─────────────────────────────────────────────────────────────

export async function getAdminOrder(orderId: string): Promise<AdminOrderDetail | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          product: {
            select: {
              sku: true,
              images: { orderBy: { sortOrder: "asc" }, select: { url: true }, take: 1 },
            },
          },
          variant: { select: { sku: true } },
        },
      },
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
    updatedAt: order.updatedAt.toISOString(),
    user: order.user
      ? { id: order.user.id, name: order.user.name, email: order.user.email }
      : { id: "", name: "Ospite", email: order.guestEmail ?? "" },
    items: order.items.map((item: {
      id: string; name: string; variantName: string | null;
      price: unknown; quantity: number; selectedOptions: unknown;
      variant: { sku: string | null } | null;
      product: { sku: string | null; images: Array<{ url: string }> };
    }) => ({
      id: item.id,
      name: item.name,
      variantName: item.variantName,
      price: Number(item.price),
      quantity: item.quantity,
      sku: item.variant?.sku ?? item.product.sku,
      imageUrl: item.product.images[0]?.url ?? null,
      selectedOptions: item.selectedOptions as Array<{ label: string; value: string; color?: string }> | null,
    })),
    payments: order.payments.map((p: {
      id: string; amount: unknown; status: string;
      method: string | null; createdAt: Date;
    }) => ({
      id: p.id,
      amount: Number(p.amount),
      status: p.status,
      method: p.method,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

// ─── Status Update ─────────────────────────────────────────────────────

export async function adminUpdateOrderStatus(
  orderId: string,
  data: { status: string; trackingNumber?: string; notes?: string },
  adminUserId: string,
) {
  const updateData: Record<string, unknown> = { status: data.status };
  if (data.trackingNumber !== undefined) updateData.trackingNumber = data.trackingNumber;

  const order = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
    include: { user: { select: { email: true, name: true } } },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      event: `order_status_changed`,
      metadata: {
        orderId,
        orderNumber: order.orderNumber,
        oldStatus: "previous",
        newStatus: data.status,
        trackingNumber: data.trackingNumber,
      },
    },
  }).catch(() => {});

  return order;
}

// ─── Bulk soft-delete / restore / hard-delete ──────────────────────────

/**
 * Soft-delete bulk: setta deletedAt + deletedBy. Guarda solo gli ordini
 * attualmente attivi (deletedAt null) per idempotenza.
 */
export async function softDeleteOrders(
  ids: string[],
  deletedBy?: string,
): Promise<{ count: number }> {
  const result = await prisma.order.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { deletedAt: new Date(), deletedBy: deletedBy ?? null },
  });
  return { count: result.count };
}

/**
 * Restore bulk: pulisce deletedAt/deletedBy. Guarda solo ordini gia' nel cestino.
 */
export async function restoreOrders(ids: string[]): Promise<{ count: number }> {
  const result = await prisma.order.updateMany({
    where: { id: { in: ids }, deletedAt: { not: null } },
    data: { deletedAt: null, deletedBy: null },
  });
  return { count: result.count };
}

/**
 * Hard-delete bulk: elimina fisicamente. OrderItem e Payment hanno onDelete: Cascade
 * (schema righe 412, 435). Safety net: opera solo su ordini gia' nel cestino.
 */
export async function hardDeleteOrders(ids: string[]): Promise<{ count: number }> {
  const result = await prisma.order.deleteMany({
    where: { id: { in: ids }, deletedAt: { not: null } },
  });
  return { count: result.count };
}
