/**
 * Reviews Service — server-only
 *
 * Business logic for product reviews: listing, creation, approval.
 */

import { prisma } from "~/lib/db.server";
import type { CreateReviewInput, ListReviewsInput } from "~/lib/validators/products";
import type { PaginatedData } from "~/lib/types/api";

// ─── Types ────────────────────────────────────────────────────────────

interface ReviewItem {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  createdAt: string;
  user: { name: string };
}

interface ReviewSummary {
  total: number;
  average: number;
  distribution: number[];
}

// ─── Public service functions ──────────────────────────────────────────

/** Get paginated reviews for a product */
export async function getProductReviews(
  productId: string,
  input: ListReviewsInput,
): Promise<PaginatedData<ReviewItem>> {
  const { page, perPage, sort } = input;
  const skip = (page - 1) * perPage;
  const orderBy = sort === "highest"
    ? { rating: "desc" as const }
    : sort === "lowest"
      ? { rating: "asc" as const }
      : { createdAt: "desc" as const };

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId, isApproved: true },
      orderBy,
      skip,
      take: perPage,
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.review.count({ where: { productId, isApproved: true } }),
  ]);

  return {
    items: items.map((item: { id: string; rating: number; title: string | null; content: string; createdAt: Date; user: { name: string | null } }) => ({
      id: item.id,
      rating: item.rating,
      title: item.title,
      content: item.content,
      createdAt: item.createdAt.toISOString(),
      user: { name: item.user.name ?? "Anonimo" },
    })),
    total,
    page,
    totalPages: Math.ceil(total / perPage),
  };
}

/** Get review summary for a product */
export async function getProductReviewSummary(productId: string): Promise<ReviewSummary> {
  const reviews = await prisma.review.findMany({
    where: { productId, isApproved: true },
    select: { rating: true },
  });

  const total = reviews.length;
  const average = total > 0
    ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / total
    : 0;

  const distribution = [0, 0, 0, 0, 0];
  for (const r of reviews) {
    distribution[r.rating - 1]++;
  }

  return { total, average: Math.round(average * 10) / 10, distribution };
}

/** Create a new review (requires authentication) */
export async function createReview(
  userId: string,
  productId: string,
  input: CreateReviewInput,
): Promise<{ ok: true; review: { id: string } } | { ok: false; error: string }> {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true, deletedAt: null },
  });
  if (!product) return { ok: false, error: "Prodotto non trovato" };

  const existing = await prisma.review.findFirst({ where: { userId, productId } });
  if (existing) return { ok: false, error: "Hai già recensito questo prodotto" };

  const review = await prisma.review.create({
    data: {
      userId,
      productId,
      rating: input.rating,
      title: input.title,
      content: input.content,
      isApproved: false,
    },
  });

  return { ok: true, review: { id: review.id } };
}

export type { ReviewItem, ReviewSummary };
