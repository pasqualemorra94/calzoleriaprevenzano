/**
 * GET /api/products/$slug — Get single product by slug
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { getProductBySlug } from "~/lib/products.server";

export const Route = createFileRoute("/api/products/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const product = await getProductBySlug(params.slug);

        if (!product) {
          return apiError("NOT_FOUND", "Prodotto non trovato", 404);
        }

        return apiSuccess(product);
      },
    },
  },
});
