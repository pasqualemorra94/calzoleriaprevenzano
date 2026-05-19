/**
 * POST /api/checkout — Create order from cart
 *
 * Discrimina lo schema in base alla forma del payload, NON in base allo stato di auth:
 * - Payload guest-shape (email + address inline): supportato sia per guest che per
 *   utenti loggati (il form checkout invia sempre questo formato).
 * - Payload auth-shape (addressId di un indirizzo salvato): richiede utente loggato.
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { getUser } from "~/lib/sdk-auth.server";
import { createOrder, createCheckoutSession } from "~/lib/orders.server";
import { checkoutGuestSchema, checkoutSchema } from "~/lib/validators/products";
import { getSessionId } from "~/lib/cart-session";
import { createLogger } from "~/lib/logger.server";

const log = createLogger("checkout");

function isGuestShapePayload(body: unknown): boolean {
  return (
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    "address" in body
  );
}

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await getUser(request);
        const sessionId = getSessionId(request);

        const body = (await request.json()) as unknown;

        const ipAddress = request.headers.get("x-forwarded-for") ?? null;
        const userAgent = request.headers.get("user-agent") ?? null;

        // ─── Guest-shape payload (email + address inline) ───────────────
        // Supportato per guest E utenti loggati (il form checkout invia
        // sempre questo formato).
        if (isGuestShapePayload(body)) {
          if (!user && !sessionId) {
            return apiError("BAD_REQUEST", "Carrello non trovato", 400);
          }

          const parsed = checkoutGuestSchema.safeParse(body);
          if (!parsed.success) {
            log.warn("Guest-shape checkout validation failed", {
              userId: user?.id ?? null,
              issues: parsed.error.issues,
            });
            return apiError("VALIDATION_ERROR", "Dati non validi", 422);
          }

          let result: Awaited<ReturnType<typeof createOrder>>;
          try {
            result = await createOrder(
              user?.id ?? null,
              user ? null : sessionId,
              parsed.data,
              ipAddress,
              userAgent,
            );
          } catch (err) {
            log.error("createOrder threw (guest-shape branch)", {
              userId: user?.id ?? null,
              sessionId: user ? null : sessionId,
              email: parsed.data.email,
              errorMessage: err instanceof Error ? err.message : String(err),
            });
            return apiError(
              "INTERNAL_ERROR",
              "Errore durante la creazione dell'ordine. Riprova tra qualche secondo.",
              500,
            );
          }

          if (!result.ok) {
            return apiError("BAD_REQUEST", result.error, 400);
          }

          // Stripe checkout session
          try {
            const session = await createCheckoutSession(
              result.order.id,
              result.order.orderNumber,
              result.order.total,
              user?.id ?? null,
              parsed.data.email,
            );

            return apiSuccess(
              {
                orderId: result.order.id,
                orderNumber: result.order.orderNumber,
                checkoutUrl: session.url,
              },
              201,
            );
          } catch {
            return apiSuccess(
              {
                orderId: result.order.id,
                orderNumber: result.order.orderNumber,
                checkoutUrl: null,
              },
              201,
            );
          }
        }

        // ─── Auth-shape payload (addressId) ─────────────────────────────
        // Richiede utente loggato.
        if (!user) {
          return apiError(
            "UNAUTHORIZED",
            "Sessione non valida. Effettua di nuovo il login.",
            401,
          );
        }

        const parsed = checkoutSchema.safeParse(body);
        if (!parsed.success) {
          log.warn("Auth-shape checkout validation failed", {
            userId: user.id,
            issues: parsed.error.issues,
          });
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        let result: Awaited<ReturnType<typeof createOrder>>;
        try {
          result = await createOrder(user.id, null, parsed.data, ipAddress, userAgent);
        } catch (err) {
          log.error("createOrder threw (auth branch)", {
            userId: user.id,
            errorMessage: err instanceof Error ? err.message : String(err),
          });
          return apiError(
            "INTERNAL_ERROR",
            "Errore durante la creazione dell'ordine. Riprova tra qualche secondo.",
            500,
          );
        }
        if (!result.ok) {
          return apiError("BAD_REQUEST", result.error, 400);
        }

        // Stripe checkout session
        try {
          const session = await createCheckoutSession(
            result.order.id,
            result.order.orderNumber,
            result.order.total,
            user.id,
          );

          return apiSuccess(
            {
              orderId: result.order.id,
              orderNumber: result.order.orderNumber,
              checkoutUrl: session.url,
            },
            201,
          );
        } catch {
          return apiSuccess(
            {
              orderId: result.order.id,
              orderNumber: result.order.orderNumber,
              checkoutUrl: null,
            },
            201,
          );
        }
      },
    },
  },
});
