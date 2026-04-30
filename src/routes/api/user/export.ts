/**
 * POST /api/user/export — GDPR Art. 15/20 (accesso + portabilità)
 *
 * Genera dump JSON completo dei dati utente loggato, scaricabile via attachment.
 * Rate limit custom 3/giorno per userId (controllo via DataRequest count).
 * Insert DataRequest + AuditLog per audit trail.
 *
 * Payload: user (no password) + addresses + orders+items+payments + wishlist
 *          + consentLogs + auditLogs (cap 500) + reviews.
 *
 * Decimal -> Number via JSON.stringify replacer (Prisma Decimal serializza come stringa).
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiError } from "~/lib/api-response";
import { getUser } from "~/lib/sdk-auth.server";
import { getClientIp } from "~/lib/rate-limit.server";
import { prisma } from "~/lib/db.server";
import { auditLog } from "~/lib/auth.server";
import { createLogger } from "~/lib/logger.server";

const log = createLogger("user-export");

/**
 * Replacer per JSON.stringify che converte Prisma Decimal in Number.
 * Prisma Decimal ha shape `{ s: number, e: number, d: number[] }` con metodo `toNumber()`,
 * ma non sempre il discriminator funziona — usiamo il check sul constructor name.
 */
function decimalReplacer(_key: string, value: unknown): unknown {
  if (value !== null && typeof value === "object") {
    const ctor = (value as { constructor?: { name?: string } }).constructor;
    if (ctor?.name === "Decimal") {
      return Number(value);
    }
  }
  return value;
}

export const Route = createFileRoute("/api/user/export")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await getUser(request);
        if (!user) {
          return apiError("UNAUTHORIZED", "Devi essere autenticato", 401);
        }

        // ── Rate limit custom: 3/giorno per userId via DataRequest count ──
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentExports = await prisma.dataRequest.count({
          where: {
            userId: user.id,
            type: "export",
            createdAt: { gte: oneDayAgo },
          },
        });
        if (recentExports >= 3) {
          return apiError(
            "RATE_LIMITED",
            "Hai raggiunto il limite di 3 export/giorno. Riprova domani.",
            429,
          );
        }

        try {
          // ── Query parallele ──
          const [
            userRecord,
            addresses,
            orders,
            wishlist,
            consentLogs,
            auditLogs,
            reviews,
          ] = await Promise.all([
            prisma.user.findUnique({
              where: { id: user.id },
              select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                image: true,
                createdAt: true,
                updatedAt: true,
                role: true,
              },
            }),
            prisma.address.findMany({ where: { userId: user.id } }),
            prisma.order.findMany({
              where: { userId: user.id },
              include: {
                items: true,
                payments: {
                  select: {
                    id: true,
                    amount: true,
                    currency: true,
                    status: true,
                    method: true,
                    createdAt: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            }),
            prisma.wishlist.findMany({
              where: { userId: user.id },
              include: {
                product: { select: { id: true, name: true, slug: true } },
              },
            }),
            prisma.consentLog.findMany({
              where: { userId: user.id },
              orderBy: { createdAt: "desc" },
            }),
            prisma.auditLog.findMany({
              where: { userId: user.id },
              orderBy: { createdAt: "desc" },
              take: 500,
            }),
            prisma.review.findMany({ where: { userId: user.id } }),
          ]);

          const payload = {
            exportedAt: new Date().toISOString(),
            user: userRecord,
            addresses,
            orders,
            wishlist,
            consentLogs,
            auditLogs,
            reviews,
          };

          // ── Insert DataRequest + AuditLog (non blocca la risposta) ──
          await Promise.all([
            prisma.dataRequest.create({
              data: {
                userId: user.id,
                type: "export",
                status: "completed",
                completedAt: new Date(),
              },
            }).catch(() => {
              // Non bloccare l'export se il log fallisce
            }),
            auditLog({
              userId: user.id,
              event: "data_exported",
              ip: getClientIp(request),
              userAgent: request.headers.get("user-agent"),
            }),
          ]);

          // ── Risposta raw con Content-Disposition ──
          const today = new Date().toISOString().slice(0, 10);
          const json = JSON.stringify(payload, decimalReplacer, 2);
          return new Response(json, {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Content-Disposition": `attachment; filename="prevenzano-dati-${user.id}-${today}.json"`,
            },
          });
        } catch (e: unknown) {
          log.error("Export failed", {
            error: e instanceof Error ? e.message : "unknown",
            userId: user.id,
          });
          return apiError("INTERNAL_ERROR", "Errore durante l'esportazione", 500);
        }
      },
    },
  },
});
