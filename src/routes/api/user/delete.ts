/**
 * POST /api/user/delete — GDPR Art. 17 (cancellazione)
 *
 * CRITICO: NON chiama mai prisma.user.delete() — Order ha onDelete:Cascade su user
 * → cancellerebbe gli ordini violando obblighi fiscali (DPR 633/72, art. 2220 c.c.,
 * conservazione 10 anni).
 *
 * Strategia: anonymize il record user (email/name/image rimpiazzati, emailVerified
 * = false), cancella tutto il PII collaterale (account/session/address/cart/wishlist/review),
 * MANTIENE Order/Payment/OrderItem con userId valorizzato (link audit interno),
 * shippingAddress JSON snapshot già immutabile per legge.
 *
 * passwordHash NON esiste su user model (Better Auth pattern: credenziali in
 * account.password). Quindi account.deleteMany({ userId }) disabilita login.
 *
 * Body: { confirm: "CANCELLA" } validato Zod literal.
 * Rate limit AUTH per userId (5/15min).
 *
 * Sessione invalidata via auth.api.signOut + forward Set-Cookie clear.
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { apiSuccess, apiError } from "~/lib/api-response";
import { getUser } from "~/lib/sdk-auth.server";
import { getClientIp, checkRateLimit } from "~/lib/rate-limit.server";
import { prisma } from "~/lib/db.server";
import { auth } from "~/lib/auth";
import { createLogger } from "~/lib/logger.server";

const log = createLogger("user-delete");

const deleteSchema = z.object({
  confirm: z.literal("CANCELLA"),
});

export const Route = createFileRoute("/api/user/delete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await getUser(request);
        if (!user) {
          return apiError("UNAUTHORIZED", "Devi essere autenticato", 401);
        }

        // ── Rate limit AUTH per userId (5/15min, brute force guard) ──
        const limit = checkRateLimit(`delete-${user.id}`, "AUTH");
        if (!limit.success) {
          return apiError(
            "RATE_LIMITED",
            "Troppi tentativi. Riprova più tardi.",
            429,
            undefined,
            { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) },
          );
        }

        // ── Body validation ──
        const body = (await request.json().catch(() => null)) as unknown;
        const parsed = deleteSchema.safeParse(body);
        if (!parsed.success) {
          return apiError(
            "VALIDATION_ERROR",
            "Conferma richiesta: digita CANCELLA per procedere",
            422,
          );
        }

        const ip = getClientIp(request);
        const userAgent = request.headers.get("user-agent");
        const anonEmail = `deleted-${crypto.randomUUID()}@deleted.local`;

        try {
          // ── Transazione atomica: anonymize + cleanup PII (NESSUNA prisma.user.delete!) ──
          await prisma.$transaction([
            // Anonimizza user (preserva id per FK Order.userId)
            prisma.user.update({
              where: { id: user.id },
              data: {
                email: anonEmail,
                name: "Utente cancellato",
                image: null,
                emailVerified: false,
              },
            }),
            // Cancella credenziali (passwordHash è in account.password — schema:86)
            prisma.account.deleteMany({ where: { userId: user.id } }),
            // Cancella sessioni (logout forzato globale)
            prisma.session.deleteMany({ where: { userId: user.id } }),
            // Cancella PII collaterale
            prisma.address.deleteMany({ where: { userId: user.id } }),
            prisma.cart.deleteMany({ where: { userId: user.id } }),
            prisma.wishlist.deleteMany({ where: { userId: user.id } }),
            prisma.review.deleteMany({ where: { userId: user.id } }),
            // Audit trail (NON tramite auditLog helper perché vogliamo che fallisca con la transaction)
            prisma.auditLog.create({
              data: {
                userId: user.id,
                event: "account_deleted",
                ip,
                userAgent,
                metadata: { anonymizedEmail: anonEmail },
              },
            }),
            prisma.dataRequest.create({
              data: {
                userId: user.id,
                type: "delete",
                status: "completed",
                completedAt: new Date(),
              },
            }),
          ]);
        } catch (e: unknown) {
          log.error("Account deletion failed", {
            error: e instanceof Error ? e.message : "unknown",
            userId: user.id,
          });
          return apiError("INTERNAL_ERROR", "Errore durante la cancellazione", 500);
        }

        // ── Invalida sessione corrente: forward Set-Cookie clear ──
        // Best-effort: la sessione è già stata cancellata dalla transazione (session.deleteMany),
        // ma chiamiamo signOut per ottenere l'header di clear-cookie da inviare al client.
        let setCookieHeader: string | undefined;
        try {
          const signOutResult = await auth.api.signOut({ headers: request.headers });
          const sr = signOutResult as { headers?: { getSetCookie?: () => string[] } };
          const cookies = sr.headers?.getSetCookie?.() ?? [];
          if (cookies.length > 0) {
            setCookieHeader = cookies.join(", ");
          }
        } catch {
          // Ignora errori signOut: la sessione è già morta (deleteMany)
        }

        const headers: Record<string, string> = {};
        if (setCookieHeader) {
          headers["Set-Cookie"] = setCookieHeader;
        }

        return apiSuccess({ deleted: true }, 200, headers);
      },
    },
  },
});
