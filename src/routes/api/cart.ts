/**
 * GET /api/cart — Get current cart
 * POST /api/cart — Add item to cart
 *
 * Supports both authenticated users and anonymous guests.
 * For guests, auto-generates a cart_session_id cookie on first interaction.
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { getUser } from "~/lib/sdk-auth.server";
import { getCart, addToCart } from "~/lib/cart.server";
import { addToCartSchema } from "~/lib/validators/products";
import { getSessionId, generateSessionId, buildSessionCookie } from "~/lib/cart-session";

export const Route = createFileRoute("/api/cart")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getUser(request);
        let sessionId = getSessionId(request);

        // For guests without session: return empty cart
        if (!user && !sessionId) {
          return apiSuccess({ id: "", items: [], itemCount: 0, subtotal: 0 });
        }

        const cart = await getCart(user?.id ?? null, sessionId);
        return apiSuccess(cart);
      },

      POST: async ({ request }) => {
        const user = await getUser(request);
        let sessionId = getSessionId(request);

        // For guests without session: auto-generate one
        let newSessionCookie: string | null = null;
        if (!user && !sessionId) {
          sessionId = generateSessionId();
          newSessionCookie = buildSessionCookie(sessionId);
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

        const headers: Record<string, string> = {};
        if (newSessionCookie) {
          headers["Set-Cookie"] = newSessionCookie;
        }

        return apiSuccess(cart, 201, headers);
      },
    },
  },
});
