/**
 * Variant Templates Service — server-only
 *
 * CRUD for reusable variant form templates.
 * Templates define groups of options (with optional images) that can be
 * applied to products by copying the JSON config.
 */

import { prisma } from "~/lib/db.server";

interface TemplateListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  groupCount: number;
  isActive: boolean;
  createdAt: string;
}

interface TemplateDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  config: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateTemplateInput {
  name: string;
  slug: string;
  description?: string;
  config: Record<string, unknown>;
  sortOrder?: number;
}

interface UpdateTemplateInput {
  name?: string;
  slug?: string;
  description?: string;
  config?: Record<string, unknown>;
  sortOrder?: number;
  isActive?: boolean;
}

export async function getTemplateList(): Promise<TemplateListItem[]> {
  const templates = await prisma.variantTemplate.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isActive: true,
      createdAt: true,
      config: true,
    },
  });

  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description,
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
    groupCount: extractGroupCount(t.config),
  }));
}

function extractGroupCount(config: unknown): number {
  if (!config || typeof config !== "object") return 0;
  const c = config as { groups?: unknown[] };
  return Array.isArray(c.groups) ? c.groups.length : 0;
}

export async function getTemplate(id: string): Promise<TemplateDetail | null> {
  const t = await prisma.variantTemplate.findUnique({ where: { id } });
  if (!t) return null;

  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description,
    config: t.config as Record<string, unknown>,
    sortOrder: t.sortOrder,
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export async function createTemplate(input: CreateTemplateInput): Promise<TemplateDetail> {
  const t = await prisma.variantTemplate.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      config: input.config as never,
      sortOrder: input.sortOrder ?? 0,
    },
  });

  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description,
    config: t.config as Record<string, unknown>,
    sortOrder: t.sortOrder,
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export async function updateTemplate(id: string, input: UpdateTemplateInput): Promise<TemplateDetail | null> {
  try {
    const t = await prisma.variantTemplate.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.config !== undefined ? { config: input.config as never } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });

    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      config: t.config as Record<string, unknown>,
      sortOrder: t.sortOrder,
      isActive: t.isActive,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export async function deleteTemplate(id: string): Promise<boolean> {
  try {
    await prisma.variantTemplate.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
