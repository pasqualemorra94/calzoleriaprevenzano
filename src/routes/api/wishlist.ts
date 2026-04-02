/**
 * GET /api/wishlist — Get user's wishlist (authenticated)
 * POST /api/wishlist — Add product to wishlist (authenticated)
 * DELETE /api/wishlist — Remove product from wishlist (authenticated)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireUser } from "~/lib/sdk-auth.server";
import { getWishlist, addToWishlist, removeFromWishlist } from "~/lib/wishlist.server";
import { wishlistSchema } from "~/lib/validators/products";

export const Route = createFileRoute("/api/wishlist")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        let user: { id: string };
        try {
          user = await requireUser(request);
        } catch {
          return apiError("UNAUTHORIZED", "Autenticazione richiesta", 401);
        }

        const items = await getWishlist(user.id);
        return apiSuccess(items);
      },

      POST: async ({ request }) => {
        let user: { id: string };
        try {
          user = await requireUser(request);
        } catch {
          return apiError("UNAUTHORIZED", "Autenticazione richiesta", 401);
        }

        const body = await request.json() as unknown;
        const parsed = wishlistSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        const result = await addToWishlist(user.id, parsed.data.productId);
        if (!result.ok) {
          return apiError("BAD_REQUEST", result.error, 400);
        }

        const items = await getWishlist(user.id);
        return apiSuccess(items, 201);
      },

      DELETE: async ({ request }) => {
        let user: { id: string };
        try {
          user = await requireUser(request);
        } catch {
          return apiError("UNAUTHORIZED", "Autenticazione richiesta", 401);
        }

        const body = await request.json() as unknown;
        const parsed = wishlistSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        const result = await removeFromWishlist(user.id, parsed.data.productId);
        if (!result.ok) {
          return apiError("BAD_REQUEST", result.error, 400);
        }

        const items = await getWishlist(user.id);
        return apiSuccess(items);
      },
    },
  },
});
