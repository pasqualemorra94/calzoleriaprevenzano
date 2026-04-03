/**
 * Admin Service — server-only
 *
 * Business logic for admin dashboard: stats, CRUD products, orders, categories.
 * All functions require admin context (caller verifies auth).
 */

import { prisma } from "~/lib/db.server";
import type { PaginatedData } from "~/lib/types/api";
import type {
  ListAdminProductsInput,
  ListAdminOrdersInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "~/lib/validators/admin";

// ─── Types ──────────────────────────────────────────────────────────────

interface DashboardStats {
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

interface AdminProductListItem {
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

interface AdminProductDetail {
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
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  images: Array<{
    id: string;
    url: string;
    alt: string | null;
    sortOrder: number;
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

interface AdminOrderListItem {
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

interface AdminOrderDetail {
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
  }>;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    method: string | null;
    createdAt: string;
  }>;
}

interface AdminCategoryItem {
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

// ─── Dashboard ──────────────────────────────────────────────────────────

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
      createdAt: Date; user: { name: string | null };
    }) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: Number(o.total),
      createdAt: o.createdAt.toISOString(),
      userName: o.user.name,
    })),
  };
}

// ─── Products (Admin) ───────────────────────────────────────────────────

export async function getAdminProducts(
  input: ListAdminProductsInput,
): Promise<PaginatedData<AdminProductListItem>> {
  const { page, perPage, query, category, status, sort } = input;
  const skip = (page - 1) * perPage;

  const conditions: Array<Record<string, unknown>> = [];

  if (status === "active") {
    conditions.push({ isActive: true }, { deletedAt: null });
  } else if (status === "inactive") {
    conditions.push({ isActive: false }, { deletedAt: null });
  } else if (status === "deleted") {
    conditions.push({ deletedAt: { not: null } });
  }

  if (category) {
    conditions.push({ category: { slug: category } });
  }

  if (query) {
    conditions.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { slug: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const orderBy = getAdminProductOrderBy(sort);

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: perPage,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stock: true,
        isActive: true,
        deletedAt: true,
        category: { select: { id: true, name: true } },
        images: { where: { sortOrder: 0 }, select: { id: true, url: true }, take: 1 },
        createdAt: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map((p: {
      id: string; name: string; slug: string; price: unknown; stock: number;
      isActive: boolean; deletedAt: Date | null;
      category: { id: string; name: string } | null;
      images: Array<{ id: string; url: string }>;
      createdAt: Date;
    }) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      stock: p.stock,
      isActive: p.isActive,
      deletedAt: p.deletedAt?.toISOString() ?? null,
      category: p.category,
      image: p.images[0] ? { id: p.images[0].id, url: p.images[0].url } : null,
      createdAt: p.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / perPage),
  };
}

function getAdminProductOrderBy(
  sort: string,
): Record<string, string> {
  const map: Record<string, Record<string, string>> = {
    newest: { createdAt: "desc" },
    name: { name: "asc" },
    price_asc: { price: "asc" },
    price_desc: { price: "desc" },
  };
  return map[sort] ?? { createdAt: "desc" };
}

export async function getAdminProduct(id: string): Promise<AdminProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    sku: product.sku,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    stock: product.stock,
    weight: product.weight ? Number(product.weight) : null,
    materials: product.materials,
    categoryId: product.categoryId,
    category: product.category,
    images: product.images.map((img: { id: string; url: string; alt: string | null; sortOrder: number }) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      sortOrder: img.sortOrder,
    })),
    variants: product.variants.map((v: {
      id: string; name: string; color: string | null; size: string | null;
      price: unknown; stock: number; sku: string | null; isActive: boolean; sortOrder: number;
    }) => ({
      id: v.id,
      name: v.name,
      color: v.color,
      size: v.size,
      price: v.price ? Number(v.price) : null,
      stock: v.stock,
      sku: v.sku,
      isActive: v.isActive,
      sortOrder: v.sortOrder,
    })),
  };
}

interface VariantPayload {
  name: string;
  color?: string | null;
  size?: string | null;
  price?: number | null;
  stock: number;
  sku?: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface ImagePayload {
  url: string;
  alt?: string | null;
  sortOrder: number;
}

interface ProductWithRelationsInput {
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
  categoryId?: string;
  variants?: VariantPayload[];
  images?: ImagePayload[];
}

export async function adminCreateProduct(data: ProductWithRelationsInput) {
  const { variants, images, ...productData } = data;

  return prisma.product.create({
    data: {
      ...productData,
      ...(variants && variants.length > 0
        ? {
            variants: {
              create: variants.map((v) => ({
                name: v.name,
                color: v.color ?? null,
                size: v.size ?? null,
                price: v.price ?? null,
                stock: v.stock,
                sku: v.sku ?? null,
                isActive: v.isActive,
                sortOrder: v.sortOrder,
              })),
            },
          }
        : {}),
      ...(images && images.length > 0
        ? {
            images: {
              create: images.map((img) => ({
                url: img.url,
                alt: img.alt ?? null,
                sortOrder: img.sortOrder,
              })),
            },
          }
        : {}),
    },
  });
}

export async function adminUpdateProduct(id: string, data: Record<string, unknown>) {
  const { variants, images, ...productData } = data as ProductWithRelationsInput & Record<string, unknown>;

  return prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
    // Update base product fields
    const product = await tx.product.update({
      where: { id },
      data: productData,
    });

    // Handle variants — delete existing and recreate
    if (Array.isArray(variants)) {
      await tx.productVariant.deleteMany({ where: { productId: id } });
      if (variants.length > 0) {
        await tx.productVariant.createMany({
          data: variants.map((v: VariantPayload) => ({
            productId: id,
            name: v.name,
            color: v.color ?? null,
            size: v.size ?? null,
            price: v.price ?? null,
            stock: v.stock,
            sku: v.sku ?? null,
            isActive: v.isActive,
            sortOrder: v.sortOrder,
          })),
        });
      }
    }

    // Handle images — delete existing and recreate
    if (Array.isArray(images)) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((img: ImagePayload) => ({
            productId: id,
            url: img.url,
            alt: img.alt ?? null,
            sortOrder: img.sortOrder,
          })),
        });
      }
    }

    return product;
  });
}

export async function adminDeleteProduct(id: string, adminUserId: string) {
  const now = new Date();
  return prisma.product.update({
    where: { id },
    data: { deletedAt: now, deletedBy: adminUserId, isActive: false },
  });
}

export async function adminRestoreProduct(id: string) {
  return prisma.product.update({
    where: { id },
    data: { deletedAt: null, deletedBy: null },
  });
}

// ─── Orders (Admin) ─────────────────────────────────────────────────────

export async function getAdminOrders(
  input: ListAdminOrdersInput,
): Promise<PaginatedData<AdminOrderListItem>> {
  const { page, perPage, status, query, sort } = input;
  const skip = (page - 1) * perPage;

  const conditions: Array<Record<string, unknown>> = [{ deletedAt: null }];

  if (status) {
    conditions.push({ status });
  }

  if (query) {
    conditions.push({
      OR: [
        { orderNumber: { contains: query, mode: "insensitive" } },
        { user: { name: { contains: query, mode: "insensitive" } } },
        { user: { email: { contains: query, mode: "insensitive" } } },
      ],
    });
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
      user: { id: string; name: string | null; email: string };
      items: Array<{ quantity: number }>;
    }) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: Number(o.total),
      shippingMethod: o.shippingMethod,
      trackingNumber: o.trackingNumber,
      createdAt: o.createdAt.toISOString(),
      user: { id: o.user.id, name: o.user.name, email: o.user.email },
      itemCount: o.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0),
    })),
    total,
    page,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getAdminOrder(orderId: string): Promise<AdminOrderDetail | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          product: { select: { sku: true } },
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
    user: { id: order.user.id, name: order.user.name, email: order.user.email },
    items: order.items.map((item: {
      id: string; name: string; variantName: string | null;
      price: unknown; quantity: number;
      variant: { sku: string | null } | null;
      product: { sku: string | null };
    }) => ({
      id: item.id,
      name: item.name,
      variantName: item.variantName,
      price: Number(item.price),
      quantity: item.quantity,
      sku: item.variant?.sku ?? item.product.sku,
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

  // Audit log
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

// ─── Categories (Admin) ─────────────────────────────────────────────────

export async function getAdminCategories(): Promise<AdminCategoryItem[]> {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { products: true } },
    },
  });

  return categories.map((c: {
    id: string; name: string; slug: string; description: string | null;
    image: string | null; parentId: string | null; sortOrder: number;
    isActive: boolean;
    parent: { id: string; name: string } | null;
    _count: { products: number };
  }) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    image: c.image,
    parentId: c.parentId,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    productCount: c._count.products,
    parent: c.parent,
  }));
}

export async function adminCreateCategory(data: CreateCategoryInput) {
  return prisma.category.create({ data });
}

export async function adminUpdateCategory(id: string, data: UpdateCategoryInput) {
  return prisma.category.update({ where: { id }, data });
}

export async function adminDeleteCategory(id: string) {
  // Check if category has products
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return { error: "Impossibile eliminare una categoria con prodotti associati" };
  }

  // Check if category has children
  const childCount = await prisma.category.count({ where: { parentId: id } });
  if (childCount > 0) {
    return { error: "Impossibile eliminare una categoria con sottocategorie" };
  }

  await prisma.category.delete({ where: { id } });
  return { ok: true };
}

export type {
  DashboardStats,
  AdminProductListItem,
  AdminProductDetail,
  AdminOrderListItem,
  AdminOrderDetail,
  AdminCategoryItem,
};
