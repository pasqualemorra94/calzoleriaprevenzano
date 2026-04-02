/**
 * Email Service — server-only
 *
 * Uses Resend API for transactional emails.
 * Falls back gracefully if not configured (logs via structured logger).
 */

import { createLogger } from "~/lib/logger.server";

const log = createLogger("email");

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

interface SendEmailResult {
  ok: boolean;
  id?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    log.error("RESEND_API_KEY not configured — email not sent", { to, subject });
    return { ok: false };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "noreply@calzoleriaprevenzano.it",
        to,
        subject,
        html,
        reply_to: replyTo,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error("Resend API error", { status: response.status, error: errorText });
      return { ok: false };
    }

    const data = await response.json() as { id: string };
    return { ok: true, id: data.id };
  } catch (error) {
    log.error("Network error", { message: error instanceof Error ? error.message : "unknown" });
    return { ok: false };
  }
}
