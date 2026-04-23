import type { PaginatedData } from "~/lib/types/api";
import type {
  ListAdminProductsInput,
  ListAdminOrdersInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "~/lib/validators/admin";

// Re-export validator types for convenience
export type {
  ListAdminProductsInput,
  ListAdminOrdersInput,
  CreateCategoryInput,
  UpdateCategoryInput,
};

// ─── Dashboard ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
  activeProducts: number;
  totalUsers: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    userName: string | null;
  }>;
}

// ─── Products ───────────────────────────────────────────────────────────

export interface AdminProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  isActive: boolean;
  deletedAt: string | null;
  category: { id: string; name: string } | null;
  image: { id: string; url: string } | null;
  createdAt: string;
}

export interface AdminProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  isActive: boolean;
  isFeatured: boolean;
  stock: number;
  weight: number | null;
  materials: string | null;
  variantConfig: Record<string, unknown> | null;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  images: Array<{
    id: string;
    url: string;
    alt: string | null;
    sortOrder: number;
    mediaId: string | null;
  }>;
  variants: Array<{
    id: string;
    name: string;
    color: string | null;
    size: string | null;
    price: number | null;
    stock: number;
    sku: string | null;
    isActive: boolean;
    sortOrder: number;
  }>;
}

export interface VariantPayload {
  name: string;
  color?: string | null;
  size?: string | null;
  price?: number | null;
  stock: number;
  sku?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface ImagePayload {
  url: string;
  alt?: string | null;
  sortOrder: number;
  mediaId?: string | null;
}

export interface ProductWithRelationsInput {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  stock?: number;
  weight?: number;
  materials?: string;
  variantConfig?: Record<string, unknown>;
  categoryId?: string;
  variants?: VariantPayload[];
  images?: ImagePayload[];
}

// ─── Orders ─────────────────────────────────────────────────────────────

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  shippingMethod: string | null;
  trackingNumber: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
  itemCount: number;
}

export interface AdminOrderDetail {
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
  updatedAt: string;
  user: { id: string; name: string | null; email: string };
  items: Array<{
    id: string;
    name: string;
    variantName: string | null;
    price: number;
    quantity: number;
    sku: string | null;
    imageUrl: string | null;
    selectedOptions?: Array<{ label: string; value: string; color?: string }> | null;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    method: string | null;
    createdAt: string;
  }>;
}

// ─── Categories ─────────────────────────────────────────────────────────

export interface AdminCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  parent: { id: string; name: string } | null;
}

// Re-export PaginatedData for consumers
export type { PaginatedData };
