/**
 * POST /api/checkout — Create order from cart
 *
 * Supports both authenticated users and anonymous guests.
 * For guests: accepts shipping + email directly from the form body.
 * For logged-in users: accepts addressId (existing) or inline address data.
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { getUser } from "~/lib/sdk-auth.server";
import { createOrder, createCheckoutSession } from "~/lib/orders.server";
import { checkoutGuestSchema, checkoutSchema } from "~/lib/validators/products";
import { sendEmail } from "~/lib/email.server";
import { orderConfirmationTemplate } from "~/lib/email-templates.server";
import { getSessionId } from "~/lib/cart-session";
import { createLogger } from "~/lib/logger.server";

const log = createLogger("checkout");

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await getUser(request);
        const sessionId = getSessionId(request);

        const body = await request.json() as unknown;

        // Guest checkout: user is not logged in
        if (!user) {
          if (!sessionId) {
            return apiError("BAD_REQUEST", "Carrello non trovato", 400);
          }

          const parsed = checkoutGuestSchema.safeParse(body);
          if (!parsed.success) {
            return apiError("VALIDATION_ERROR", "Dati non validi", 422);
          }

          const ipAddress = request.headers.get("x-forwarded-for") ?? null;
          const userAgent = request.headers.get("user-agent") ?? null;

          let result: Awaited<ReturnType<typeof createOrder>>;
          try {
            result = await createOrder(
              null,
              sessionId,
              parsed.data,
              ipAddress,
              userAgent,
            );
          } catch (err) {
            log.error("createOrder threw (guest branch)", {
              sessionId,
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

          // Send order confirmation email (best-effort)
          try {
            await sendEmail({
              to: parsed.data.email,
              subject: `Conferma ordine ${result.order.orderNumber} — Calzoleria Prevenzano`,
              html: orderConfirmationTemplate({
                customerName: parsed.data.firstName,
                orderNumber: result.order.orderNumber,
                items: result.order.items.map((item) => ({
                  name: item.name,
                  quantity: item.quantity,
                  priceCents: Math.round(item.price * 100),
                })),
                totalCents: Math.round(result.order.total * 100),
              }),
            });
          } catch {
            // Email failure doesn't block the order
          }

          // Create Stripe checkout session
          try {
            const session = await createCheckoutSession(
              result.order.id,
              result.order.orderNumber,
              result.order.total,
              null,
              parsed.data.email,
            );

            return apiSuccess({
              orderId: result.order.id,
              orderNumber: result.order.orderNumber,
              checkoutUrl: session.url,
            }, 201);
          } catch {
            return apiSuccess({
              orderId: result.order.id,
              orderNumber: result.order.orderNumber,
              checkoutUrl: null,
            }, 201);
          }
        }

        // Authenticated checkout (existing flow)
        const parsed = checkoutSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        const ipAddress = request.headers.get("x-forwarded-for") ?? null;
        const userAgent = request.headers.get("user-agent") ?? null;

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

        // Send order confirmation email (best-effort)
        try {
          await sendEmail({
            to: user.email,
            subject: `Conferma ordine ${result.order.orderNumber} — Calzoleria Prevenzano`,
            html: orderConfirmationTemplate({
              customerName: user.name ?? "Cliente",
              orderNumber: result.order.orderNumber,
              items: result.order.items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                priceCents: Math.round(item.price * 100),
              })),
              totalCents: Math.round(result.order.total * 100),
            }),
          });
        } catch {
          // Email failure doesn't block the order
        }

        // Create Stripe checkout session
        try {
          const session = await createCheckoutSession(
            result.order.id,
            result.order.orderNumber,
            result.order.total,
            user.id,
          );

          return apiSuccess({
            orderId: result.order.id,
            orderNumber: result.order.orderNumber,
            checkoutUrl: session.url,
          }, 201);
        } catch {
          return apiSuccess({
            orderId: result.order.id,
            orderNumber: result.order.orderNumber,
            checkoutUrl: null,
          }, 201);
        }
      },
    },
  },
});
