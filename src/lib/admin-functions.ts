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
import { getAdvisorCatalog } from "./ai-advisor.server";
import type { AdvisorProduct } from "./ai-advisor.server";
import { listConsentLogs } from "./admin/admin-consents.server";
import type { AdminConsentLogItem } from "./admin/admin-consents.server";
import {
  listReturnRequests,
  getReturnRequest,
  countPendingReturnRequests,
} from "./admin/admin-returns.server";
import type {
  AdminReturnRequestListItem,
  AdminReturnRequestDetail,
} from "./admin/admin-returns.server";
import {
  getShippingConfig,
  updateShippingConfig,
  type ShippingConfigData,
} from "./admin/shipping-config.server";
import type { UpdateShippingConfigInput } from "./validators/admin";

// Re-export types
export type { DashboardStats, AdminProductListItem, AdminProductDetail, AdminOrderListItem, AdminOrderDetail, MediaListItem, AdminConsentLogItem, AdminReturnRequestListItem, AdminReturnRequestDetail, ShippingConfigData };

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
    view?: "active" | "trash";
    emailContains?: string;
    createdFrom?: string;
    createdTo?: string;
  }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    return getAdminOrders({
      page: data.page ?? 1,
      perPage: data.perPage ?? 20,
      status: data.status,
      query: data.query,
      sort: (data.sort ?? "newest") as "newest" | "order_number",
      view: data.view ?? "active",
      emailContains: data.emailContains,
      createdFrom: data.createdFrom ? new Date(data.createdFrom) : undefined,
      createdTo: data.createdTo ? new Date(data.createdTo) : undefined,
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

// ─── Consent Logs ──────────────────────────────────────────────────

export const $listConsentLogs = createServerFn({ method: "GET" })
  .inputValidator((data: {
    page?: number;
    perPage?: number;
    type?: "cookie" | "preferences" | "analytics" | "marketing" | "privacy";
    createdFrom?: string;
    createdTo?: string;
  }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    return listConsentLogs({
      page: data.page ?? 1,
      perPage: data.perPage ?? 12,
      type: data.type,
      createdFrom: data.createdFrom ? new Date(data.createdFrom) : undefined,
      createdTo: data.createdTo ? new Date(data.createdTo) : undefined,
    }) satisfies Promise<PaginatedData<AdminConsentLogItem>>;
  });

// ─── Return Requests (Resi) ────────────────────────────────────────

export const $listReturnRequests = createServerFn({ method: "GET" })
  .inputValidator((data: {
    page?: number;
    perPage?: number;
    status?: "pending" | "approved" | "rejected" | "completed";
    createdFrom?: string;
    createdTo?: string;
  }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    return listReturnRequests({
      page: data.page ?? 1,
      perPage: data.perPage ?? 12,
      status: data.status,
      createdFrom: data.createdFrom ? new Date(data.createdFrom) : undefined,
      createdTo: data.createdTo ? new Date(data.createdTo) : undefined,
    }) satisfies Promise<PaginatedData<AdminReturnRequestListItem>>;
  });

export const $getReturnRequest = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    return getReturnRequest(data.id) satisfies Promise<AdminReturnRequestDetail | null>;
  });

export const $countPendingReturnRequests = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return countPendingReturnRequests();
});

// ─── AI Advisor ────────────────────────────────────────────────────

export const $getAdvisorCatalog = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const catalog = await getAdvisorCatalog();
  // Serialize JSON fields to avoid Prisma JsonValue type issues with createServerFn
  return catalog.map((p) => ({
    ...p,
    variantConfig: JSON.parse(JSON.stringify(p.variantConfig ?? {})),
    aiMetadata: JSON.parse(JSON.stringify(p.aiMetadata ?? {})),
  }));
});

// ─── Shipping Config ──────────────────────────────────────────────

export const $getShippingConfig = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return getShippingConfig();
});

export const $updateShippingConfig = createServerFn({ method: "POST" })
  .inputValidator((data: UpdateShippingConfigInput) => data)
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    return updateShippingConfig(data, user.id);
  });
