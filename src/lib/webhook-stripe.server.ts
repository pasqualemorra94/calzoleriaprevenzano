/**
 * Stripe Webhook Handler — server-only
 *
 * Processes Stripe webhook events:
 * - checkout.session.completed → Mark order as paid
 * - payment_intent.succeeded → Confirm payment
 * - payment_intent.payment_failed → Mark payment as failed
 * - charge.refunded → Update order status
 * - invoice.payment_failed → Dunning notification
 *
 * IMPORTANT: Webhook signature verification must be done BEFORE calling processEvent().
 * This function only handles the business logic after verification.
 */

import { prisma } from "~/lib/db.server";
import { createLogger } from "~/lib/logger.server";
import { sendOrderConfirmedEmails } from "~/lib/order-emails.server";
import { stripe } from "~/lib/stripe.server";
import type Stripe from "stripe";

const log = createLogger("webhook");

interface WebhookResult {
  ok: boolean;
  message: string;
  status: number;
}

/**
 * Process a verified Stripe webhook event.
 * Idempotency is guaranteed by checking StripeEvent table.
 */
export async function processWebhookEvent(event: Stripe.Event): Promise<WebhookResult> {
  // Idempotency: check if already processed
  const existing = await prisma.stripeEvent.findUnique({
    where: { id: event.id },
  });

  if (existing) {
    return { ok: true, message: "Already processed", status: 200 };
  }

  // Record event before processing (best-effort)
  try {
    await prisma.stripeEvent.create({
      data: {
        id: event.id,
        type: event.type,
        processedAt: new Date(),
      },
    });
  } catch (error) {
    log.error("Failed to record event", { eventId: event.id, error });
    return { ok: false, message: "Failed to record event", status: 500 };
  }

  // Process event by type
  try {
    switch (event.type) {
      case "checkout.session.completed":
        return await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
      case "payment_intent.succeeded":
        return handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
      case "payment_intent.payment_failed":
        return handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      case "charge.refunded":
        return await handleChargeRefunded(event.data.object as Stripe.Charge);
      case "invoice.payment_failed":
        return handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      default:
        log.info("Unhandled event type", { eventType: event.type });
        return { ok: true, message: `Unhandled: ${event.type}`, status: 200 };
    }
  } catch (error) {
    log.error("Error processing event", { eventType: event.type, error });
    return { ok: false, message: "Processing error", status: 500 };
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<WebhookResult> {
  if (session.mode === "payment") {
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "confirmed",
        },
      });

      // Derive the real payment method used (card/paypal/klarna) from the
      // PaymentIntent's charge details. Falls back to "card" if undeterminable.
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);

      let paymentMethod = "card"; // fallback sensato se il tipo non è determinabile
      if (paymentIntentId) {
        try {
          const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ["latest_charge.payment_method_details"],
          });
          const charge = intent.latest_charge;
          // latest_charge può essere string | Stripe.Charge | null → narrowing
          const type =
            charge && typeof charge !== "string"
              ? charge.payment_method_details?.type
              : undefined;
          if (type) paymentMethod = type;
        } catch (e: unknown) {
          log.error("Impossibile determinare il metodo di pagamento", {
            orderId,
            paymentIntentId,
            message: e instanceof Error ? e.message : String(e),
          });
          // paymentMethod resta "card" (fallback) — il webhook NON deve fallire per questo
        }
      }

      // Create payment record
      await prisma.payment.create({
        data: {
          orderId,
          stripePaymentId: session.payment_intent as string,
          stripeSessionId: session.id,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency ?? "EUR",
          status: "succeeded",
          method: paymentMethod,
        },
      });

      // Order emails are best-effort: a failure must NOT fail the webhook
      // (sendOrderConfirmedEmails never throws by design — try/catch is a safety net).
      try {
        await sendOrderConfirmedEmails(orderId);
      } catch (e: unknown) {
        log.error("Order confirmation emails threw", {
          orderId,
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }
  return { ok: true, message: "Checkout completed", status: 200 };
}

function handlePaymentSuccess(_paymentIntent: Stripe.PaymentIntent): WebhookResult {
  // Payment success is primarily handled by checkout.session.completed
  return { ok: true, message: "Payment success recorded", status: 200 };
}

function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): WebhookResult {
  log.warn("Payment failed", { paymentIntentId: paymentIntent.id });
  return { ok: true, message: "Payment failure logged", status: 200 };
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<WebhookResult> {
  const paymentIntentId = charge.payment_intent as string;
  if (!paymentIntentId) {
    return { ok: true, message: "No payment intent on charge", status: 200 };
  }

  const payment = await prisma.payment.findFirst({
    where: { stripePaymentId: paymentIntentId },
  });

  if (payment) {
    const isFullRefund = charge.amount_refunded === charge.amount;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? "refunded" : "succeeded",
      },
    });

    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: isFullRefund ? "refunded" : "confirmed",
      },
    });
  }

  return { ok: true, message: "Refund processed", status: 200 };
}

function handleInvoicePaymentFailed(_invoice: Stripe.Invoice): WebhookResult {
  log.warn("Invoice payment failed — dunning required");
  // TODO: Send dunning email notification to customer
  return { ok: true, message: "Dunning logged", status: 200 };
}
