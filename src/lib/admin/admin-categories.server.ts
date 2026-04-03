/**
 * Admin Categories — server-only
 *
 * Category CRUD operations for admin panel.
 */

import { prisma } from "~/lib/db.server";
import type { CreateCategoryInput, UpdateCategoryInput } from "~/lib/validators/admin";
import type { AdminCategoryItem } from "./types";

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

export async function adminGetCategory(id: string) {
  return prisma.category.findUnique({ where: { id } });
}

export async function adminCreateCategory(data: CreateCategoryInput) {
  return prisma.category.create({ data });
}

export async function adminUpdateCategory(id: string, data: UpdateCategoryInput) {
  return prisma.category.update({ where: { id }, data });
}

export async function adminDeleteCategory(id: string) {
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return { error: "Impossibile eliminare una categoria con prodotti associati" };
  }

  const childCount = await prisma.category.count({ where: { parentId: id } });
  if (childCount > 0) {
    return { error: "Impossibile eliminare una categoria con sottocategorie" };
  }

  await prisma.category.delete({ where: { id } });
  return { ok: true };
}
