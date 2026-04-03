/**
 * Admin Dashboard — server-only
 *
 * Dashboard statistics and recent orders for admin panel.
 */

import { prisma } from "~/lib/db.server";
import type { DashboardStats } from "./types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const [totalOrders, pendingOrders, totalProducts, activeProducts, totalUsers, recentOrdersRaw] =
    await Promise.all([
      prisma.order.count({ where: { deletedAt: null } }),
      prisma.order.count({ where: { status: "pending", deletedAt: null } }),
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true, deletedAt: null } }),
      prisma.user.count(),
      prisma.order.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: { select: { name: true } },
          items: { select: { quantity: true } },
        },
      }),
    ]);

  const revenueAgg = await prisma.order.aggregate({
    _sum: { total: true },
    where: { status: { in: ["confirmed", "processing", "shipped", "delivered"] }, deletedAt: null },
  });

  return {
    totalOrders,
    totalRevenue: Number(revenueAgg._sum.total ?? 0),
    pendingOrders,
    totalProducts,
    activeProducts,
    totalUsers,
    recentOrders: recentOrdersRaw.map((o: {
      id: string; orderNumber: string; status: string; total: unknown;
      createdAt: Date; user: { name: string | null } | null; guestEmail: string | null;
    }) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: Number(o.total),
      createdAt: o.createdAt.toISOString(),
      userName: o.user?.name ?? o.guestEmail ?? "Ospite",
    })),
  };
}
