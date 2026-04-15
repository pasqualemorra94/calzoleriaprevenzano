/**
 * Admin Server Functions — createServerFn pattern
 *
 * Server-side data loading for admin panel pages.
 * All functions call $getUser() internally to verify admin role.
 */

import { createServerFn } from "@tanstack/react-start";
import { $getUser } from "./auth-functions";
import { redirect } from "@tanstack/react-router";
import { getDashboardStats } from "./admin/admin-dashboard.server";
import { getAdminProducts } from "./admin/admin-products.server";
import { getAdminProduct } from "./admin/admin-products.server";
import { getAdminOrders } from "./admin/admin-orders.server";
import { getAdminOrder } from "./admin/admin-orders.server";
import { listMedia, getMediaStats } from "./media.server";
import type { DashboardStats, AdminProductListItem, AdminProductDetail, AdminOrderListItem, AdminOrderDetail } from "./admin/types";
import type { PaginatedData } from "./types/api";
import type { MediaListItem } from "./media.server";

// Re-export types
export type { DashboardStats, AdminProductListItem, AdminProductDetail, AdminOrderListItem, AdminOrderDetail, MediaListItem };

// ─── Auth guard for admin server functions ─────────────────────────

async function requireAdmin() {
  const user = await $getUser();
  if (!user || user.role !== "admin") {
    throw redirect({ to: "/auth/login" });
  }
  return user;
}

// ─── Dashboard ────────────────────────────────────────────────────

export const $getDashboardStats = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return getDashboardStats() satisfies Promise<DashboardStats>;
});

// ─── Products ──────────────────────────────────────────────────────

export const $getAdminProducts = createServerFn({ method: "GET" })
  .inputValidator((data: {
    page?: number;
    perPage?: number;
    query?: string;
    status?: string;
    sort?: string;
  }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    return getAdminProducts({
      page: data.page ?? 1,
      perPage: data.perPage ?? 20,
      query: data.query,
      status: (data.status ?? "all") as "all" | "active" | "inactive" | "deleted",
      sort: (data.sort ?? "newest") as "newest" | "name" | "price_asc" | "price_desc",
    }) satisfies Promise<PaginatedData<AdminProductListItem>>;
  });

export const $getAdminProduct = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    return getAdminProduct(data.id) satisfies Promise<AdminProductDetail | null>;
  });

// ─── Orders ────────────────────────────────────────────────────────

export const $getAdminOrders = createServerFn({ method: "GET" })
  .inputValidator((data: {
    page?: number;
    perPage?: number;
    status?: string;
    query?: string;
    sort?: string;
  }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    return getAdminOrders({
      page: data.page ?? 1,
      perPage: data.perPage ?? 20,
      status: data.status,
      query: data.query,
      sort: (data.sort ?? "newest") as "newest" | "order_number",
    }) satisfies Promise<PaginatedData<AdminOrderListItem>>;
  });

export const $getAdminOrder = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    return getAdminOrder(data.id) satisfies Promise<AdminOrderDetail | null>;
  });

// ─── Media ─────────────────────────────────────────────────────────

export const $getAdminMedia = createServerFn({ method: "GET" })
  .inputValidator((data: {
    page?: number;
    perPage?: number;
    query?: string;
    folder?: string;
    type?: string;
  }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const [result, stats] = await Promise.all([
      listMedia({
        page: data.page ?? 1,
        perPage: data.perPage ?? 40,
        query: data.query,
        folder: data.folder,
        type: (data.type ?? "image") as "image" | "all",
        sort: "newest" as const,
      }),
      getMediaStats(),
    ]);
    return { ...result, stats };
  });
