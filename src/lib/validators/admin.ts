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

// ─── Admin Return Requests (resi/recesso) ──────────────────────────────

export const listReturnRequestsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(12),
  status: z.enum(["pending", "approved", "rejected", "completed"]).optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
});

export type ListReturnRequestsInput = z.infer<typeof listReturnRequestsSchema>;

export const updateReturnRequestSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "completed"]),
  adminNotes: z.string().trim().max(2000).nullable(),
});

export type UpdateReturnRequestInput = z.infer<typeof updateReturnRequestSchema>;

// ─── Admin ConsentLog listing ──────────────────────────────────────────

export const listConsentLogsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(50).default(12),
  type: z.enum(["cookie", "preferences", "analytics", "marketing", "privacy"]).optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
});

export type ListConsentLogsInput = z.infer<typeof listConsentLogsSchema>;

// ─── Admin Shipping Config ──────────────────────────────────────────────

export const updateShippingConfigSchema = z.object({
  cost: z.coerce
    .number({ message: "Inserisci un numero valido" })
    .min(0, "Il costo non può essere negativo")
    .max(9999.99, "Costo massimo €9999.99"),
  freeThreshold: z.coerce
    .number({ message: "Inserisci un numero valido" })
    .min(0, "La soglia non può essere negativa")
    .max(99999.99, "Soglia massima €99999.99"),
  enabled: z.boolean(),
});

export type UpdateShippingConfigInput = z.infer<typeof updateShippingConfigSchema>;

// ─── Discount Codes ─────────────────────────────────────────────────────

export const createDiscountCodeSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, "Il codice deve avere almeno 2 caratteri")
      .max(50, "Il codice è troppo lungo")
      .regex(/^[A-Za-z0-9_-]+$/, "Solo lettere, numeri, trattino e underscore")
      .transform((c) => c.toUpperCase()),
    value: z.coerce
      .number({ message: "Inserisci una percentuale valida" })
      .positive("La percentuale deve essere maggiore di 0")
      .max(100, "La percentuale non può superare 100"),
    startsAt: z.coerce.date({ message: "Data inizio non valida" }),
    expiresAt: z.coerce.date({ message: "Data scadenza non valida" }),
    minOrder: z.coerce
      .number({ message: "Ordine minimo non valido" })
      .min(0, "L'ordine minimo non può essere negativo")
      .max(99999.99)
      .optional(),
    maxUses: z.coerce
      .number({ message: "Limite utilizzi non valido" })
      .int("Deve essere un numero intero")
      .min(1, "Il limite deve essere almeno 1")
      .max(1000000)
      .optional(),
  })
  .refine((d) => d.expiresAt > d.startsAt, {
    message: "La data di scadenza deve essere successiva alla data di inizio",
    path: ["expiresAt"],
  });

export type CreateDiscountCodeInput = z.infer<typeof createDiscountCodeSchema>;

export const toggleDiscountCodeSchema = z.object({
  id: z.string().cuid(),
  isActive: z.boolean(),
});

export type ToggleDiscountCodeInput = z.infer<typeof toggleDiscountCodeSchema>;
