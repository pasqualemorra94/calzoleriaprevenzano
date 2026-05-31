/**
 * Product Validators — shared Zod schemas for product-related forms & API.
 */

import { z } from "zod";
import { APP_CONFIG } from "~/lib/constants/app";

/** Query params for product listing */
export const listProductsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(APP_CONFIG.pagination.maxPageSize).default(APP_CONFIG.pagination.defaultPageSize),
  category: z.string().optional(),
  query: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "name"]).default("newest"),
});

export type ListProductsInput = z.infer<typeof listProductsSchema>;

/** Variant payload (create/update) */
const productVariantSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  color: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  price: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0),
  sku: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

/** Image payload (create/update) */
const productImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().min(1),
  alt: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  mediaId: z.string().nullable().optional(),
});

/** Create product (admin) */
export const createProductSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio").max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Solo lettere minuscole, numeri e trattini"),
  description: z.string().min(1, "La descrizione è obbligatoria"),
  shortDescription: z.string().max(500).optional(),
  price: z.number().positive("Il prezzo deve essere positivo"),
  compareAtPrice: z.number().positive().nullable().optional(),
  sku: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  stock: z.number().int().min(0).default(0),
  weight: z.number().min(0).nullable().optional(),
  materials: z.string().nullable().optional(),
  variantConfig: z.record(z.string(), z.unknown()).nullable().optional(),
  categoryId: z.string().nullable().optional(),
  variants: z.array(productVariantSchema).optional(),
  images: z.array(productImageSchema).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

/** Update product (admin) */
export const updateProductSchema = createProductSchema
  .partial()
  .extend({
    compareAtPrice: z.number().positive().nullable().optional(),
    weight: z.number().min(0).nullable().optional(),
    materials: z.string().nullable().optional(),
    sku: z.string().nullable().optional(),
    categoryId: z.string().nullable().optional(),
    variantConfig: z.record(z.string(), z.unknown()).nullable().optional(),
  });

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

/** Add to cart */
export const addToCartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional(),
  selectedOptions: z.record(z.string(), z.string()).optional(),
  quantity: z.number().int().min(1).max(APP_CONFIG.cart.maxQuantityPerItem),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

/** Update cart item quantity */
export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(APP_CONFIG.cart.maxQuantityPerItem),
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

/** List reviews query */
export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  content: z.string().min(10, "La recensione deve avere almeno 10 caratteri").max(2000),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

/** List reviews query */
export const listReviewsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(["newest", "highest", "lowest"]).default("newest"),
});

export type ListReviewsInput = z.infer<typeof listReviewsSchema>;

/** Toggle wishlist */
export const wishlistSchema = z.object({
  productId: z.string().min(1),
});

export type WishlistInput = z.infer<typeof wishlistSchema>;

/** Contact form */
export const contactSchema = z.object({
  name: z.string().min(2, "Il nome deve avere almeno 2 caratteri").max(100),
  email: z.string().min(1, "L'email è obbligatoria").email("Inserisci un indirizzo email valido"),
  subject: z.string().max(200).optional(),
  message: z.string().min(10, "Il messaggio deve avere almeno 10 caratteri").max(5000),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** Discount code preview (live validation at checkout — public) */
export const validateDiscountSchema = z.object({
  code: z.string().min(1, "Inserisci un codice").max(50),
  subtotal: z.number().nonnegative(),
});

export type ValidateDiscountInput = z.infer<typeof validateDiscountSchema>;

/** Checkout input (authenticated — uses saved addressId) */
export const checkoutSchema = z.object({
  addressId: z.string().min(1, "L'indirizzo di spedizione è obbligatorio"),
  shippingMethod: z.string().default("standard"),
  notes: z.string().max(1000).optional(),
  discountCode: z.string().max(50).optional(),
  acceptedTerms: z.literal(true, {
    message: "Devi accettare i Termini di Vendita per procedere",
  }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Checkout input (guest — includes inline shipping data + email) */
export const checkoutGuestSchema = z.object({
  email: z.string().email("Email non valida"),
  firstName: z.string().min(1, "Il nome è obbligatorio").max(100),
  lastName: z.string().min(1, "Il cognome è obbligatorio").max(100),
  address: z.object({
    address1: z.string().min(1, "L'indirizzo è obbligatorio").max(200),
    address2: z.string().max(200).optional(),
    city: z.string().min(1, "La città è obbligatoria").max(100),
    province: z.string().min(2, "La provincia è obbligatoria").max(2),
    postalCode: z.string().min(5, "Il CAP deve avere 5 caratteri").max(5),
    country: z.string().default("IT"),
    phone: z.string().max(20).optional(),
  }),
  shippingMethod: z.string().default("standard"),
  notes: z.string().max(1000).optional(),
  discountCode: z.string().max(50).optional(),
  acceptedTerms: z.literal(true, {
    message: "Devi accettare i Termini di Vendita per procedere",
  }),
});

export type CheckoutGuestInput = z.infer<typeof checkoutGuestSchema>;

/** Create address */
export const createAddressSchema = z.object({
  firstName: z.string().min(1, "Il nome è obbligatorio").max(100),
  lastName: z.string().min(1, "Il cognome è obbligatorio").max(100),
  address1: z.string().min(1, "L'indirizzo è obbligatorio").max(200),
  address2: z.string().max(200).optional(),
  city: z.string().min(1, "La città è obbligatoria").max(100),
  province: z.string().min(2, "La provincia è obbligatoria").max(2),
  postalCode: z.string().min(5, "Il CAP deve avere 5 caratteri").max(5),
  country: z.string().default("IT"),
  phone: z.string().max(20).optional(),
  isDefault: z.boolean().default(false),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
