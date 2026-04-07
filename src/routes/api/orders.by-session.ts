/**
 * GET /api/orders/by-session — Get order by Stripe checkout session_id
 *
 * Used by the /ordine-confermato page after Stripe redirect.
 * No auth required — the session_id is the proof of ownership.
 * First tries the Payment table (fast, if webhook already processed).
 * Falls back to Stripe API to get orderId from session metadata.
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { prisma } from "~/lib/db.server";
import { stripe } from "~/lib/stripe.server";

export const Route = createFileRoute("/api/orders/by-session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const sessionId = url.searchParams.get("session_id");

        if (!sessionId) {
          return apiError("BAD_REQUEST", "session_id richiesto", 400);
        }

        let orderId: string | undefined;

        const payment = await prisma.payment.findFirst({
          where: { stripeSessionId: sessionId },
          select: { orderId: true },
        });

        if (payment) {
          orderId = payment.orderId;
        } else {
          const session = await stripe.checkout.sessions.retrieve(sessionId);
          orderId = session.metadata?.orderId as string | undefined;
        }

        if (!orderId) {
          return apiError("NOT_FOUND", "Ordine non trovato", 404);
        }

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            items: {
              select: {
                name: true,
                quantity: true,
                price: true,
              },
            },
          },
        });

        if (!order) {
          return apiError("NOT_FOUND", "Ordine non trovato", 404);
        }

        return apiSuccess({
          orderNumber: order.orderNumber,
          status: order.status,
          total: Number(order.total),
          items: order.items.map((item: { name: string; quantity: number; price: { toNumber: () => number } }) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price.toNumber(),
          })),
          createdAt: order.createdAt.toISOString(),
        });
      },
    },
  },
});
