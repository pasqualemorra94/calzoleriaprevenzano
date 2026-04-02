/**
 * GET /api/cart — Get current cart
 * POST /api/cart — Add item to cart
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { getUser } from "~/lib/sdk-auth.server";
import { getCart, addToCart } from "~/lib/cart.server";
import { addToCartSchema } from "~/lib/validators/products";

function getSessionId(request: Request): string | null {
  const cookies = request.headers.get("cookie") ?? "";
  const match = cookies.match(/cart_session_id=([^;]+)/);
  return match?.[1] ?? null;
}

export const Route = createFileRoute("/api/cart")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getUser(request);
        const sessionId = getSessionId(request);

        if (!user && !sessionId) {
          return apiSuccess({ id: "", items: [], itemCount: 0, subtotal: 0 });
        }

        const cart = await getCart(user?.id ?? null, sessionId);
        return apiSuccess(cart);
      },

      POST: async ({ request }) => {
        const user = await getUser(request);
        const sessionId = getSessionId(request);

        if (!user && !sessionId) {
          return apiError("BAD_REQUEST", "Sessione non valida", 400);
        }

        const body = await request.json() as unknown;
        const parsed = addToCartSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        const result = await addToCart(user?.id ?? null, sessionId, parsed.data);
        if (!result.ok) {
          return apiError("BAD_REQUEST", result.error, 400);
        }

        const cart = await getCart(user?.id ?? null, sessionId);
        return apiSuccess(cart, 201);
      },
    },
  },
});
