/**
 * PATCH /api/cart/items/$itemId — Update cart item quantity
 * DELETE /api/cart/items/$itemId — Remove item from cart
 *
 * Supports both authenticated users and anonymous guests.
 * For guests without session, returns 400 (they need to add to cart first).
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { getUser } from "~/lib/sdk-auth.server";
import { getCart, updateCartItem, removeFromCart } from "~/lib/cart.server";
import { updateCartItemSchema } from "~/lib/validators/products";
import { getSessionId } from "~/lib/cart-session";

export const Route = createFileRoute("/api/cart/items/$itemId")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const user = await getUser(request);
        let sessionId = getSessionId(request);

        // For guests without session: can't update what doesn't exist
        if (!user && !sessionId) {
          return apiError("BAD_REQUEST", "Carrello vuoto", 400);
        }

        const body = await request.json() as unknown;
        const parsed = updateCartItemSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        const result = await updateCartItem(user?.id ?? null, sessionId, params.itemId, parsed.data);
        if (!result.ok) {
          return apiError("BAD_REQUEST", result.error, 400);
        }

        const cart = await getCart(user?.id ?? null, sessionId);
        return apiSuccess(cart);
      },

      DELETE: async ({ request, params }) => {
        const user = await getUser(request);
        let sessionId = getSessionId(request);

        // For guests without session: can't remove what doesn't exist
        if (!user && !sessionId) {
          return apiError("BAD_REQUEST", "Carrello vuoto", 400);
        }

        const result = await removeFromCart(user?.id ?? null, sessionId, params.itemId);
        if (!result.ok) {
          return apiError("BAD_REQUEST", result.error, 400);
        }

        const cart = await getCart(user?.id ?? null, sessionId);
        return apiSuccess(cart);
      },
    },
  },
});
