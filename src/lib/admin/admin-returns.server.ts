/**
 * Admin Return Requests — server-only
 * CRUD richieste di reso per pannello admin.
 */

import { prisma } from "~/lib/db.server";
import type { PaginatedData } from "~/lib/types/api";

export interface ListReturnRequestsInput {
  page: number;
  perPage: number;
  status?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

export interface AdminReturnRequestListItem {
  id: string;
  orderNumber: string;
  fullName: string;
  email: string;
  status: string;
  hasOnlyCustomItems: boolean;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AdminReturnRequestDetailItem {
  name: string;
  quantity: number;
  price: number;
  categorySlug: string | null;
  parentCategorySlug: string | null;
}

export interface AdminReturnRequestDetail {
  id: string;
  orderId: string;
  orderNumber: string;
  fullName: string;
  email: string;
  reason: string;
  status: string;
  adminNotes: string | null;
  hasOnlyCustomItems: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  order: {
    id: string;
    orderNumber: string;
    total: number;
    createdAt: string;
    items: AdminReturnRequestDetailItem[];
  };
}

export async function listReturnRequests(
  input: ListReturnRequestsInput,
): Promise<PaginatedData<AdminReturnRequestListItem>> {
  const { page, perPage, status, createdFrom, createdTo } = input;
  const skip = (page - 1) * perPage;

  const conditions: Array<Record<string, unknown>> = [];
  if (status) conditions.push({ status });
  if (createdFrom || createdTo) {
    const range: Record<string, Date> = {};
    if (createdFrom) range.gte = createdFrom;
    if (createdTo) range.lte = createdTo;
    conditions.push({ createdAt: range });
  }
  const where = conditions.length > 0 ? { AND: conditions } : {};

  const [items, total] = await Promise.all([
    prisma.returnRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
      select: {
        id: true,
        orderNumber: true,
        fullName: true,
        email: true,
        status: true,
        hasOnlyCustomItems: true,
        createdAt: true,
        resolvedAt: true,
      },
    }),
    prisma.returnRequest.count({ where }),
  ]);

  return {
    items: items.map((r) => ({
      id: r.id,
      orderNumber: r.orderNumber,
      fullName: r.fullName,
      email: r.email,
      status: r.status,
      hasOnlyCustomItems: r.hasOnlyCustomItems,
      createdAt: r.createdAt.toISOString(),
      resolvedAt: r.resolvedAt?.toISOString() ?? null,
    })),
    total,
    page,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getReturnRequest(
  id: string,
): Promise<AdminReturnRequestDetail | null> {
  const rr = await prisma.returnRequest.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          createdAt: true,
          items: {
            select: {
              name: true,
              quantity: true,
              price: true,
              product: {
                select: {
                  category: {
                    select: {
                      slug: true,
                      parent: { select: { slug: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!rr) return null;

  return {
    id: rr.id,
    orderId: rr.orderId,
    orderNumber: rr.orderNumber,
    fullName: rr.fullName,
    email: rr.email,
    reason: rr.reason,
    status: rr.status,
    adminNotes: rr.adminNotes,
    hasOnlyCustomItems: rr.hasOnlyCustomItems,
    createdAt: rr.createdAt.toISOString(),
    updatedAt: rr.updatedAt.toISOString(),
    resolvedAt: rr.resolvedAt?.toISOString() ?? null,
    order: {
      id: rr.order.id,
      orderNumber: rr.order.orderNumber,
      total: Number(rr.order.total),
      createdAt: rr.order.createdAt.toISOString(),
      items: rr.order.items.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        price: Number(it.price),
        categorySlug: it.product.category?.slug ?? null,
        parentCategorySlug: it.product.category?.parent?.slug ?? null,
      })),
    },
  };
}

export interface UpdateReturnRequestInput {
  status: "pending" | "approved" | "rejected" | "completed";
  adminNotes: string | null;
}

export interface UpdateReturnRequestResult {
  id: string;
  status: string;
  oldStatus: string;
}

export async function updateReturnRequest(
  id: string,
  input: UpdateReturnRequestInput,
): Promise<UpdateReturnRequestResult> {
  const existing = await prisma.returnRequest.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!existing) {
    throw new Error("ReturnRequest not found");
  }
  const oldStatus = existing.status;
  const isTerminal =
    input.status === "approved" ||
    input.status === "rejected" ||
    input.status === "completed";

  const updated = await prisma.returnRequest.update({
    where: { id },
    data: {
      status: input.status,
      adminNotes: input.adminNotes,
      resolvedAt: isTerminal ? new Date() : null,
    },
    select: { id: true, status: true },
  });
  return { id: updated.id, status: updated.status, oldStatus };
}

export async function countPendingReturnRequests(): Promise<number> {
  return prisma.returnRequest.count({ where: { status: "pending" } });
}
