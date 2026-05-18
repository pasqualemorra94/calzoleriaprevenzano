/**
 * Email Service — server-only
 *
 * Sends transactional emails. Transport selection is environment-driven:
 *   - If `SMTP_HOST` is configured, uses SMTP via nodemailer
 *     (port 465 → secure TLS, any other port → STARTTLS).
 *   - Otherwise, if `RESEND_API_KEY` is configured, falls back to the Resend HTTP API.
 *   - If neither is configured, logs a structured error and returns `{ ok: false }`.
 *
 * The public interface (`SendEmailOptions` / `SendEmailResult`) is stable so call-sites
 * never need to change regardless of the active transport.
 */

import nodemailer from "nodemailer";
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

/**
 * SMTP transport (nodemailer). Used when `SMTP_HOST` is configured.
 * Caller guarantees `SMTP_HOST` is non-empty before invoking this.
 */
async function sendViaSmtp({
  to,
  subject,
  html,
  replyTo,
}: SendEmailOptions): Promise<SendEmailResult> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure = port === 465;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? "noreply@calzoleriaprevenzano.it",
      to,
      subject,
      html,
      replyTo,
    });

    return { ok: true, id: info.messageId };
  } catch (error: unknown) {
    log.error("SMTP send error", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return { ok: false };
  }
}

/**
 * Resend HTTP transport. Used as fallback when `SMTP_HOST` is not configured
 * but `RESEND_API_KEY` is. Caller guarantees `RESEND_API_KEY` is non-empty.
 */
async function sendViaResend({
  to,
  subject,
  html,
  replyTo,
}: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    log.error("RESEND_API_KEY not configured — email not sent", {
      to,
      subject,
    });
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
      log.error("Resend API error", {
        status: response.status,
        error: errorText,
      });
      return { ok: false };
    }

    const data = (await response.json()) as { id: string };
    return { ok: true, id: data.id };
  } catch (error) {
    log.error("Network error", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return { ok: false };
  }
}

/**
 * Send a transactional email. Dispatches to SMTP or Resend based on configuration.
 */
export async function sendEmail(
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  if (process.env.SMTP_HOST) {
    return sendViaSmtp(options);
  }
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(options);
  }
  log.error(
    "No email transport configured (SMTP_HOST / RESEND_API_KEY) — email not sent",
    {
      to: options.to,
      subject: options.subject,
    },
  );
  return { ok: false };
}
