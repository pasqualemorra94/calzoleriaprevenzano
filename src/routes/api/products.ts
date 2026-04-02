/**
 * GET /api/products — List products with pagination & filters
 * POST /api/products — Create product (admin only)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { getProducts, getFeaturedProducts } from "~/lib/products.server";
import { listProductsSchema, createProductSchema } from "~/lib/validators/products";
import { prisma } from "~/lib/db.server";

export const Route = createFileRoute("/api/products")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const rawParams: Record<string, string> = {};
        for (const [key, value] of url.searchParams) {
          rawParams[key] = value;
        }

        const parsed = listProductsSchema.safeParse(rawParams);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Parametri non validi", 400);
        }

        const featured = url.searchParams.get("featured");
        if (featured === "true") {
          const limit = parsed.data.perPage;
          const items = await getFeaturedProducts(limit);
          return apiSuccess({ items, total: items.length, page: 1, totalPages: 1 });
        }

        const result = await getProducts(parsed.data);
        return apiSuccess(result);
      },

      POST: async ({ request }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const body = await request.json() as unknown;
        const parsed = createProductSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        const product = await prisma.product.create({ data: parsed.data });
        return apiSuccess(product, 201);
      },
    },
  },
});
