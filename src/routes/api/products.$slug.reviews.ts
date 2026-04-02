/**
 * GET /api/products/$slug/reviews — List reviews for a product (public)
 * POST /api/products/$slug/reviews — Create review (authenticated)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireUser } from "~/lib/sdk-auth.server";
import { getProductReviews, getProductReviewSummary, createReview } from "~/lib/reviews.server";
import { listReviewsSchema, createReviewSchema } from "~/lib/validators/products";
import { prisma } from "~/lib/db.server";

export const Route = createFileRoute("/api/products/$slug/reviews")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const product = await prisma.product.findFirst({
          where: { slug: params.slug, isActive: true, deletedAt: null },
          select: { id: true },
        });

        if (!product) {
          return apiError("NOT_FOUND", "Prodotto non trovato", 404);
        }

        const url = new URL(request.url);
        const includeSummary = url.searchParams.get("summary") === "true";

        if (includeSummary) {
          const [summary, reviews] = await Promise.all([
            getProductReviewSummary(product.id),
            getProductReviews(product.id, listReviewsSchema.parse({})),
          ]);
          return apiSuccess({ ...reviews, summary });
        }

        const rawParams: Record<string, string> = {};
        for (const [key, value] of url.searchParams) {
          rawParams[key] = value;
        }
        const parsed = listReviewsSchema.safeParse(rawParams);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Parametri non validi", 400);
        }

        const result = await getProductReviews(product.id, parsed.data);
        return apiSuccess(result);
      },

      POST: async ({ request, params }) => {
        let user: { id: string };
        try {
          user = await requireUser(request);
        } catch {
          return apiError("UNAUTHORIZED", "Autenticazione richiesta", 401);
        }

        const product = await prisma.product.findFirst({
          where: { slug: params.slug, isActive: true, deletedAt: null },
          select: { id: true },
        });

        if (!product) {
          return apiError("NOT_FOUND", "Prodotto non trovato", 404);
        }

        const body = await request.json() as unknown;
        const parsed = createReviewSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        const result = await createReview(user.id, product.id, parsed.data);
        if (!result.ok) {
          return apiError("BAD_REQUEST", result.error, 400);
        }

        return apiSuccess(result.review, 201);
      },
    },
  },
});
