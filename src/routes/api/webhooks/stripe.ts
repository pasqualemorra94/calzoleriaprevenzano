/**
 * POST /api/webhooks/stripe — Stripe webhook endpoint
 *
 * Verifies webhook signature and delegates to processWebhookEvent().
 * Business logic is in ~/lib/webhook-stripe.server.ts (created by compliance agent).
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { stripe } from "~/lib/stripe.server";
import { processWebhookEvent } from "~/lib/webhook-stripe.server";
import { createLogger } from "~/lib/logger.server";
import type Stripe from "stripe";

const log = createLogger("webhook");

export const Route = createFileRoute("/api/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = await request.text();
        const sig = request.headers.get("stripe-signature");

        if (!sig) {
          return apiError("BAD_REQUEST", "Stripe signature missing", 400);
        }

        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
          log.error("STRIPE_WEBHOOK_SECRET not configured");
          return apiError("CONFIG_ERROR", "Webhook not configured", 500);
        }

        let event: Stripe.Event;
        try {
          event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
        } catch {
          return apiError("INVALID_SIGNATURE", "Invalid webhook signature", 400);
        }

        const result = await processWebhookEvent(event);
        return apiSuccess({ received: true, message: result.message }, result.status);
      },
    },
  },
});
