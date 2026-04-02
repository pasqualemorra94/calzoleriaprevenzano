/**
 * GET /api/categories — List all active categories (public)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess } from "~/lib/api-response";
import { getCategories } from "~/lib/products.server";

export const Route = createFileRoute("/api/categories")({
  server: {
    handlers: {
      GET: async () => {
        const categories = await getCategories();
        return apiSuccess(categories);
      },
    },
  },
});
