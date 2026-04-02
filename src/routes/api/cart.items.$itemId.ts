/**
 * PATCH /api/cart/items/$itemId — Update cart item quantity
 * DELETE /api/cart/items/$itemId — Remove item from cart
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { getUser } from "~/lib/sdk-auth.server";
import { getCart, updateCartItem, removeFromCart } from "~/lib/cart.server";
import { updateCartItemSchema } from "~/lib/validators/products";

function getSessionId(request: Request): string | null {
  const cookies = request.headers.get("cookie") ?? "";
  const match = cookies.match(/cart_session_id=([^;]+)/);
  return match?.[1] ?? null;
}

export const Route = createFileRoute("/api/cart/items/$itemId")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const user = await getUser(request);
        const sessionId = getSessionId(request);

        if (!user && !sessionId) {
          return apiError("BAD_REQUEST", "Sessione non valida", 400);
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
        const sessionId = getSessionId(request);

        if (!user && !sessionId) {
          return apiError("BAD_REQUEST", "Sessione non valida", 400);
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
