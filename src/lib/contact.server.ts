/**
 * Contact Service — server-only
 *
 * Business logic for contact form submissions.
 */

import { prisma } from "~/lib/db.server";
import type { ContactInput } from "~/lib/validators/products";
import { sendEmail } from "~/lib/email.server";
import { contactNotificationTemplate, autoReplyTemplate } from "~/lib/email-templates.server";

/** Submit a contact form */
export async function submitContact(input: ContactInput, ipAddress: string | null) {
  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.EMAIL_FROM ?? "info@calzoleriaprevenzano.it";

  // Send notification email to admin (best-effort)
  await sendEmail({
    to: adminEmail,
    subject: `Nuovo messaggio da ${input.name}`,
    html: contactNotificationTemplate(input),
    replyTo: input.email,
  });

  // Send auto-reply to user (best-effort)
  await sendEmail({
    to: input.email,
    subject: "Grazie per averci contattato — Calzoleria Prevenzano",
    html: autoReplyTemplate(input.name),
  });

  // Log submission for GDPR compliance tracking
  // Using ConsentLog as a lightweight audit trail for contact submissions
  await prisma.consentLog.create({
    data: {
      type: "contact",
      granted: true,
      ip: ipAddress,
    },
  });

  return { ok: true as const };
}
