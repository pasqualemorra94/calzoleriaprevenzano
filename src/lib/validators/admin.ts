/**
 * Admin Validators — Zod schemas for admin CRUD operations.
 */

import { z } from "zod";
import { APP_CONFIG } from "~/lib/constants/app";

// ─── Admin Product listing ───────────────────────────────────────────────

export const listAdminProductsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(APP_CONFIG.pagination.maxPageSize).default(20),
  query: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["all", "active", "inactive", "deleted"]).default("all"),
  sort: z.enum(["newest", "name", "price_asc", "price_desc"]).default("newest"),
});

export type ListAdminProductsInput = z.infer<typeof listAdminProductsSchema>;

// ─── Admin Order listing ────────────────────────────────────────────────

export const listAdminOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(APP_CONFIG.pagination.maxPageSize).default(20),
  status: z.string().optional(),
  query: z.string().optional(),
  sort: z.enum(["newest", "order_number"]).default("newest"),
  // Vista: lista attiva (deletedAt null) o cestino (deletedAt non null)
  view: z.enum(["active", "trash"]).default("active").optional(),
  // Filtro substring case-insensitive su user.email + guestEmail
  emailContains: z.string().optional(),
  // Range data createdAt (coerce da stringhe ISO/yyyy-mm-dd a Date)
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
});

export type ListAdminOrdersInput = z.infer<typeof listAdminOrdersSchema>;

// ─── Bulk Order action ──────────────────────────────────────────────────

export const bulkOrderActionSchema = z.object({
  action: z.enum(["soft-delete", "restore", "hard-delete"]),
  ids: z.array(z.string().cuid()).min(1).max(500),
});

export type BulkOrderActionInput = z.infer<typeof bulkOrderActionSchema>;

// ─── Update order status ────────────────────────────────────────────────

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  trackingNumber: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// ─── Category CRUD ──────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio").max(200),
  slug: z
    .string()
    .min(1, "Lo slug è obbligatorio")
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Solo lettere minuscole, numeri e trattini"),
  description: z.string().max(1000).optional(),
  image: z.string().url().optional().or(z.literal("")),
  parentId: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial().omit({ slug: true });

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
