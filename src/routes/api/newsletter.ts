/**
 * POST /api/newsletter — Subscribe newsletter (double opt-in)
 *
 * Pattern: upsert NewsletterSubscription { email, status: "pending", token } + invio
 * email Resend con link di conferma. ConsentLog NON viene loggato qui — solo a
 * /api/newsletter/confirm dopo conferma effettiva (audit-by-presence: il consenso
 * marketing vale solo dopo double opt-in).
 *
 * Idempotency: se email già confirmed → 200 senza inviare email (no spam).
 * Re-subscribe: se pending o unsubscribed → reset token + status=pending + reinvia email.
 *
 * Token: crypto.randomUUID() (Node 22 native, no nuova dep — @paralleldrive/cuid2 NON
 * presente in package.json).
 *
 * Rate limit FORM (3/min per IP).
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { z } from "zod";
import { prisma } from "~/lib/db.server";
import { sendEmail } from "~/lib/email.server";
import { createLogger } from "~/lib/logger.server";
import { checkRateLimit, getClientIp } from "~/lib/rate-limit.server";

const log = createLogger("newsletter");

const newsletterSchema = z.object({
  email: z.string().min(1, "L'email è obbligatoria").email("Inserisci un indirizzo email valido"),
});

function buildConfirmEmailHtml(confirmUrl: string, unsubscribeUrl: string): string {
  return `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><title>Conferma iscrizione</title></head>
<body style="margin:0;padding:0;background:#f5f3ef;font-family:Georgia,serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ef;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px 32px;max-width:560px;">
        <tr><td>
          <h1 style="margin:0 0 16px;font-size:22px;color:#2d2419;font-weight:600;">Conferma la tua iscrizione</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5a4d3f;">
            Grazie per esserti iscritto alla newsletter di Calzoleria Prevenzano. Per completare l'iscrizione, conferma il tuo indirizzo email cliccando sul pulsante qui sotto.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:4px;background:#8b6f47;">
            <a href="${confirmUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.5px;">Conferma iscrizione</a>
          </td></tr></table>
          <p style="margin:32px 0 0;font-size:13px;line-height:1.5;color:#8a7d6b;">
            Se non riesci a cliccare il pulsante, copia e incolla questo link nel browser:<br/>
            <a href="${confirmUrl}" style="color:#8b6f47;word-break:break-all;">${confirmUrl}</a>
          </p>
          <p style="margin:24px 0 0;font-size:12px;color:#a89c8a;">
            Se non hai richiesto questa iscrizione, ignora questa email. Non riceverai altri messaggi da noi.
          </p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#a89c8a;">
        Calzoleria Prevenzano &middot; <a href="${unsubscribeUrl}" style="color:#a89c8a;">Disiscriviti</a>
      </p>
    </td></tr>
  </table>
</body></html>`;
}

export const Route = createFileRoute("/api/newsletter")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // ── Rate limit ──
        const ip = getClientIp(request);
        const limit = checkRateLimit(ip, "FORM");
        if (!limit.success) {
          return apiError(
            "RATE_LIMITED",
            "Troppe richieste. Riprova tra qualche minuto.",
            429,
            undefined,
            { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) },
          );
        }

        const body = (await request.json().catch(() => null)) as unknown;
        const parsed = newsletterSchema.safeParse(body);
        if (!parsed.success) {
          return apiError(
            "VALIDATION_ERROR",
            parsed.error.issues[0]?.message ?? "Email non valida",
            422,
          );
        }

        const email = parsed.data.email;

        try {
          // ── Idempotency: se confirmed → 200 senza inviare email ──
          const existing = await prisma.newsletterSubscription.findUnique({
            where: { email },
          });
          if (existing?.status === "confirmed") {
            log.info("Subscription already confirmed", { email });
            return apiSuccess({ message: "Sei già iscritto alla newsletter" });
          }

          // ── Genera nuovo token (re-issue su pending/unsubscribed) ──
          const token = crypto.randomUUID();
          await prisma.newsletterSubscription.upsert({
            where: { email },
            create: { email, token, status: "pending" },
            update: { token, status: "pending", confirmedAt: null },
          });

          // ── Invia email confirm ──
          const baseUrl = process.env.BETTER_AUTH_URL ?? "https://calzoleriaprevenzano.it";
          const confirmUrl = `${baseUrl}/newsletter/conferma?token=${token}`;
          const unsubscribeUrl = `${baseUrl}/newsletter/disiscriviti?token=${token}`;
          const html = buildConfirmEmailHtml(confirmUrl, unsubscribeUrl);

          const result = await sendEmail({
            to: email,
            subject: "Conferma la tua iscrizione alla newsletter",
            html,
          });

          log.info("New subscription", { email, status: existing?.status ?? "new", emailSent: result.ok });

          if (!result.ok) {
            // NON 500: la subscription è creata, l'utente può richiedere reinvio
            return apiSuccess(
              {
                message: "Iscrizione registrata. Se non ricevi l'email entro qualche minuto, riprova.",
              },
              201,
            );
          }

          return apiSuccess(
            {
              message: "Ti abbiamo inviato un'email di conferma. Clicca sul link per completare l'iscrizione.",
            },
            201,
          );
        } catch (e: unknown) {
          log.error("Newsletter subscribe failed", {
            error: e instanceof Error ? e.message : "unknown",
            email,
          });
          return apiError("INTERNAL_ERROR", "Errore durante l'iscrizione", 500);
        }
      },
    },
  },
});
