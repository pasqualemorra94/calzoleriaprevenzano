/**
 * POST /api/checkout — Create order from cart
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireUser } from "~/lib/sdk-auth.server";
import { createOrder, createCheckoutSession } from "~/lib/orders.server";
import { checkoutSchema } from "~/lib/validators/products";
import { sendEmail } from "~/lib/email.server";
import { orderConfirmationTemplate } from "~/lib/email-templates.server";

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let user: { id: string; email: string; name: string | null };
        try {
          user = await requireUser(request);
        } catch {
          return apiError("UNAUTHORIZED", "Autenticazione richiesta", 401);
        }

        const body = await request.json() as unknown;
        const parsed = checkoutSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        const ipAddress = request.headers.get("x-forwarded-for") ?? null;
        const userAgent = request.headers.get("user-agent") ?? null;

        const result = await createOrder(user.id, parsed.data, ipAddress, userAgent);
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
