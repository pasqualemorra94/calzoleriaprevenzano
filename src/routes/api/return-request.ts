/**
 * POST /api/return-request — Form pubblico richiesta reso (D.Lgs. 206/2005 Art. 52)
 *
 * Flow:
 *  1. Rate limit FORM (3/min per IP) → 429 + Retry-After
 *  2. Zod validation 422 con messaggio dal primo issue
 *  3. Order lookup tramite orderNumber → 404 se non trovato
 *  4. Email match (order.guestEmail OR order.user.email, case-insensitive) → 403 se mismatch
 *  5. Date check (now - order.createdAt) ≤ 14gg → 422 se scaduto
 *  6. Idempotency: count pending requests = 0 → 409 se duplicato
 *  7. Compute hasOnlyCustomItems via subcategoria di "sandali" (Art. 59.c — soft block)
 *  8. INSERT ReturnRequest
 *  9. sendEmail admin (resi@) + sendEmail cliente — best-effort, fail non blocca 201
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { apiSuccess, apiError } from "~/lib/api-response";
import { checkRateLimit, getClientIp } from "~/lib/rate-limit.server";
import { prisma } from "~/lib/db.server";
import { sendEmail } from "~/lib/email.server";
import { createLogger } from "~/lib/logger.server";

const log = createLogger("return-request");

const returnRequestSchema = z.object({
  fullName: z.string().trim().min(2, "Nome troppo corto").max(100),
  email: z.string().email("Email non valida"),
  orderNumber: z
    .string()
    .trim()
    .regex(/^CP-\d{4}-\d{4}$/, "Formato numero ordine non valido (es. CP-2026-0001)"),
  reason: z.string().trim().min(10, "Indica almeno 10 caratteri di motivazione").max(500),
  acceptedPolicy: z.literal(true, {
    message: "Devi accettare la procedura di reso per inviare la richiesta",
  }),
});

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const Route = createFileRoute("/api/return-request")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // ── 1. Rate limit ──
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

        // ── 2. Zod validation ──
        const body = (await request.json().catch(() => null)) as unknown;
        const parsed = returnRequestSchema.safeParse(body);
        if (!parsed.success) {
          return apiError(
            "VALIDATION_ERROR",
            parsed.error.issues[0]?.message ?? "Dati non validi",
            422,
          );
        }
        const data = parsed.data;

        // ── 3. Order lookup ──
        const order = await prisma.order.findUnique({
          where: { orderNumber: data.orderNumber },
          include: {
            user: { select: { email: true } },
            items: {
              include: {
                product: {
                  select: {
                    category: {
                      select: {
                        slug: true,
                        parent: { select: { slug: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        });
        if (!order) {
          return apiError(
            "NOT_FOUND",
            "Ordine non trovato. Verifica il numero indicato.",
            404,
          );
        }

        // ── 4. Email match (case-insensitive) ──
        const emailLower = data.email.toLowerCase();
        const orderEmails = [order.guestEmail, order.user?.email]
          .filter((e): e is string => typeof e === "string" && e.length > 0)
          .map((e) => e.toLowerCase());
        if (!orderEmails.includes(emailLower)) {
          return apiError(
            "FORBIDDEN",
            "L'email indicata non corrisponde all'ordine.",
            403,
          );
        }

        // ── 5. Date check (14gg dal createdAt) ──
        const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
        if (Date.now() - order.createdAt.getTime() > FOURTEEN_DAYS_MS) {
          return apiError(
            "VALIDATION_ERROR",
            "Termine di 14 giorni superato. Il diritto di recesso non è più esercitabile.",
            422,
          );
        }

        // ── 6. Idempotency ──
        const pendingCount = await prisma.returnRequest.count({
          where: { orderNumber: data.orderNumber, status: "pending" },
        });
        if (pendingCount > 0) {
          return apiError(
            "CONFLICT",
            "Hai già una richiesta di reso in corso per questo ordine.",
            409,
          );
        }

        // ── 7. Compute hasOnlyCustomItems (subcategoria di "sandali") ──
        const hasOnlyCustomItems =
          order.items.length > 0 &&
          order.items.every(
            (it) => it.product.category?.parent?.slug === "sandali",
          );

        // ── 8. INSERT ──
        let created;
        try {
          created = await prisma.returnRequest.create({
            data: {
              orderId: order.id,
              orderNumber: data.orderNumber,
              email: data.email,
              fullName: data.fullName,
              reason: data.reason,
              hasOnlyCustomItems,
            },
          });
        } catch (e: unknown) {
          log.error("ReturnRequest insert failed", {
            error: e instanceof Error ? e.message : "unknown",
            orderNumber: data.orderNumber,
          });
          return apiError(
            "INTERNAL_ERROR",
            "Errore durante il salvataggio della richiesta",
            500,
          );
        }

        // ── 9. Email admin (resi@) — best-effort ──
        const baseUrl =
          process.env.BETTER_AUTH_URL ?? "https://calzoleriaprevenzano.it";
        const adminLink = `${baseUrl}/admin/resi/${created.id}`;
        const safeFullName = escapeHtml(data.fullName);
        const safeEmail = escapeHtml(data.email);
        const safeOrderNumber = escapeHtml(data.orderNumber);
        const safeReason = escapeHtml(data.reason).replace(/\n/g, "<br>");
        const customWarning = hasOnlyCustomItems
          ? `<p style="background:#fff3cd;border:1px solid #ffeaa7;padding:12px;border-radius:4px;color:#856404;"><strong>&#9888; Attenzione:</strong> l'ordine contiene SOLO prodotti personalizzati (esclusi ex Art. 59.c). Valutare caso per caso.</p>`
          : "";
        const adminHtml = `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#f5f3ef;padding:20px;color:#2d2419;">
  <table cellpadding="0" cellspacing="0" border="0" width="600" align="center" style="background:#fff;padding:32px;border:1px solid #d9cdb8;">
    <tr><td>
      <h2 style="color:#8b6f47;margin:0 0 16px;">Nuova richiesta di reso</h2>
      ${customWarning}
      <p><strong>Cliente:</strong> ${safeFullName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Ordine:</strong> ${safeOrderNumber}</p>
      <p><strong>Motivazione:</strong></p>
      <p style="background:#f5f3ef;padding:12px;border-left:3px solid #8b6f47;">${safeReason}</p>
      <p style="margin-top:24px;"><a href="${adminLink}" style="background:#8b6f47;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;">Apri in admin</a></p>
    </td></tr>
  </table>
</body></html>`;
        const adminEmail = await sendEmail({
          to: "resi@calzoleriaprevenzano.it",
          subject: `[Reso] Nuova richiesta da ${data.fullName} — Ordine ${data.orderNumber}`,
          html: adminHtml,
          replyTo: data.email,
        });
        if (!adminEmail.ok) {
          log.warn("Admin notification email failed", {
            orderNumber: data.orderNumber,
          });
        }

        // ── 10. Email cliente — best-effort ──
        const clientHtml = `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#f5f3ef;padding:20px;color:#2d2419;">
  <table cellpadding="0" cellspacing="0" border="0" width="600" align="center" style="background:#fff;padding:32px;border:1px solid #d9cdb8;">
    <tr><td>
      <h2 style="color:#8b6f47;margin:0 0 16px;">Conferma ricezione richiesta reso</h2>
      <p>Gentile ${safeFullName},</p>
      <p>abbiamo ricevuto la tua richiesta di reso relativa all'ordine <strong>${safeOrderNumber}</strong>.</p>
      <p>Il nostro team la valuterà e ti contatterà via email entro <strong>14 giorni</strong> con le istruzioni di restituzione o l'esito della valutazione.</p>
      <p style="margin-top:24px;color:#6b6157;font-size:14px;">Per qualsiasi necessità: <a href="mailto:resi@calzoleriaprevenzano.it" style="color:#8b6f47;">resi@calzoleriaprevenzano.it</a></p>
      <hr style="border:0;border-top:1px solid #d9cdb8;margin:24px 0;">
      <p style="color:#6b6157;font-size:12px;">Calzoleria Prevenzano di Prevenzano Antonio<br>Via Chiaia 104 — 80121 Napoli (NA)<br>P.IVA 04590921211</p>
    </td></tr>
  </table>
</body></html>`;
        const clientEmail = await sendEmail({
          to: data.email,
          subject: "Calzoleria Prevenzano — Conferma ricezione richiesta reso",
          html: clientHtml,
        });
        if (!clientEmail.ok) {
          log.warn("Client confirmation email failed", {
            orderNumber: data.orderNumber,
          });
        }

        return apiSuccess({ submitted: true });
      },
    },
  },
});
