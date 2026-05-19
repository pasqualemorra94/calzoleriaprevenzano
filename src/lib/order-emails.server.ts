/**
 * Order Emails Service — server-only
 *
 * Invio best-effort delle email d'ordine a PAGAMENTO CONFERMATO
 * (checkout.session.completed). Spedisce due email:
 * - conferma al cliente (orderConfirmationTemplate)
 * - notifica al titolare (orderNotificationTemplate) verso EMAIL_ORDERS
 *
 * La funzione non lancia MAI: ogni invio è in un try/catch separato e
 * un fallimento viene solo loggato. Così il webhook Stripe resta 200.
 */

import { prisma } from "~/lib/db.server";
import { createLogger } from "~/lib/logger.server";
import { sendEmail } from "~/lib/email.server";
import {
  orderConfirmationTemplate,
  orderNotificationTemplate,
} from "~/lib/email-templates.server";

const log = createLogger("order-emails");

export async function sendOrderConfirmedEmails(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { address: true } },
    },
  });

  if (!order) {
    log.error("Order not found for confirmation emails", { orderId });
    return;
  }

  const address = order.items[0]?.address ?? null;
  const customerEmail = order.guestEmail ?? order.user?.email ?? null;
  const customerName =
    order.user?.name ??
    (address ? `${address.firstName} ${address.lastName}` : "Cliente");
  const customerPhone = address?.phone ?? "—";
  const items = order.items.map((i) => ({
    name: i.name,
    quantity: i.quantity,
    priceCents: Math.round(Number(i.price) * 100),
  }));
  const totalCents = Math.round(Number(order.total) * 100);

  // ─── Conferma cliente (best-effort) ──────────────────────────────
  try {
    if (!customerEmail) {
      log.warn("No customer email on order, skipping confirmation", { orderId });
    } else {
      await sendEmail({
        to: customerEmail,
        subject: `Conferma ordine ${order.orderNumber} — Calzoleria Prevenzano`,
        html: orderConfirmationTemplate({
          customerName,
          orderNumber: order.orderNumber,
          items,
          totalCents,
        }),
      });
    }
  } catch (e: unknown) {
    log.error("Failed to send customer confirmation email", {
      orderId,
      message: e instanceof Error ? e.message : String(e),
    });
  }

  // ─── Notifica titolare (best-effort) ─────────────────────────────
  try {
    const ordersEmail = process.env.EMAIL_ORDERS;
    if (!ordersEmail) {
      log.warn("EMAIL_ORDERS not configured, skipping owner notification", {
        orderId,
      });
      return;
    }
    if (!address) {
      log.warn("No shipping address on order, skipping owner notification", {
        orderId,
      });
      return;
    }
    await sendEmail({
      to: ordersEmail,
      subject: `Nuovo ordine ${order.orderNumber} — Calzoleria Prevenzano`,
      html: orderNotificationTemplate({
        orderNumber: order.orderNumber,
        customerName,
        customerEmail: customerEmail ?? "—",
        customerPhone,
        shippingAddress: {
          address1: address.address1,
          address2: address.address2 ?? undefined,
          city: address.city,
          province: address.province,
          postalCode: address.postalCode,
          country: address.country,
        },
        items,
        totalCents,
      }),
    });
  } catch (e: unknown) {
    log.error("Failed to send owner notification email", {
      orderId,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
