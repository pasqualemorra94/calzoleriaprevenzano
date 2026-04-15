/**
 * Account Server Functions — createServerFn pattern
 *
 * Server-side data loading for account dashboard pages.
 * Runs on the server during SSR and as RPC from the client.
 *
 * All functions call $getUser() internally to get the authenticated
 * user's ID — the layout's beforeLoad already ensures the user is
 * authenticated, so these functions are only called for valid sessions.
 */

import { createServerFn } from "@tanstack/react-start";
import { $getUser } from "./auth-functions";
import { getUserOrders, getOrderDetail } from "./orders.server";
import type { OrderListItem, OrderDetailResult } from "./orders.server";
import type { PaginatedData } from "./types/api";
import { getWishlist } from "./wishlist.server";
import type { WishlistItem } from "./wishlist.server";
import { getAddresses } from "./address.server";

// AddressData is not exported from address.server.ts — redeclare here
interface AddressData {
  id: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
  createdAt: string;
}

// Re-export types for convenience
export type { OrderListItem, OrderDetailResult, WishlistItem, AddressData };

// ─── Orders ───────────────────────────────────────────────────────

/**
 * Get paginated orders for the current user.
 */
export const $getUserOrders = createServerFn({ method: "GET" })
  .inputValidator((data: { page?: number; perPage?: number }) => data)
  .handler(async ({ data }) => {
    const user = await $getUser();
    if (!user) return null;
    return getUserOrders(user.id, data.page ?? 1, data.perPage ?? 10) satisfies Promise<PaginatedData<OrderListItem>>;
  });

/**
 * Get single order detail for the current user.
 */
export const $getOrderDetail = createServerFn({ method: "GET" })
  .inputValidator((data: { orderId: string }) => data)
  .handler(async ({ data }) => {
    const user = await $getUser();
    if (!user) return null;
    return getOrderDetail(user.id, data.orderId) satisfies Promise<OrderDetailResult | null>;
  });

// ─── Wishlist ─────────────────────────────────────────────────────

/**
 * Get current user's wishlist items.
 */
export const $getWishlist = createServerFn({ method: "GET" }).handler(async () => {
  const user = await $getUser();
  if (!user) return [];
  return getWishlist(user.id) satisfies Promise<WishlistItem[]>;
});

// ─── Addresses ────────────────────────────────────────────────────

/**
 * Get current user's saved addresses.
 */
export const $getAddresses = createServerFn({ method: "GET" }).handler(async () => {
  const user = await $getUser();
  if (!user) return [];
  return getAddresses(user.id) satisfies Promise<AddressData[]>;
});

// ─── Profile ──────────────────────────────────────────────────────

/**
 * Get current user's profile (name + email).
 * Reuses $getUser — no extra DB call needed.
 */
export const $getUserProfile = createServerFn({ method: "GET" }).handler(async () => {
  const user = await $getUser();
  if (!user) return null;
  return { name: user.name ?? "", email: user.email };
});
