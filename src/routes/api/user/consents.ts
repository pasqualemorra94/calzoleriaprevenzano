/**
 * POST /api/user/consents — Audit-trail GDPR consensi post-signup
 *
 * Riceve i consensi dichiarati nel form di signup (privacy obbligatoria, marketing
 * opzionale) DOPO che authClient.signUp.email() ha creato user + sessione (autoSignIn:
 * true in src/lib/auth.ts:45). I checkbox client-side non passano dal flow Better Auth
 * server-side, quindi questo endpoint è la strategia di audit by-presence per il signup.
 *
 * Insert ConsentLog: 1 row type=privacy granted=true (sempre) + (se opt-in) 1 row
 * type=marketing granted=true. Le righe sono linkate a userId dalla sessione fresca.
 *
 * Rate limit FORM (3/min per IP). Failure non blocca user experience (silent fail
 * in RegisterForm). Schema Zod: privacy: literal(true) + marketing: boolean.
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { apiSuccess, apiError } from "~/lib/api-response";
import { getUser } from "~/lib/sdk-auth.server";
import { getClientIp, checkRateLimit } from "~/lib/rate-limit.server";
import { prisma } from "~/lib/db.server";
import { createLogger } from "~/lib/logger.server";

const log = createLogger("user-consents");

const schema = z.object({
  privacy: z.literal(true),
  marketing: z.boolean(),
});

export const Route = createFileRoute("/api/user/consents")({
  server: {
    handlers: {
      POST: async ({ request }) => {
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

        const user = await getUser(request);
        if (!user) {
          return apiError("UNAUTHORIZED", "Devi essere autenticato", 401);
        }

        const body = (await request.json().catch(() => null)) as unknown;
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return apiError(
            "VALIDATION_ERROR",
            parsed.error.issues[0]?.message ?? "Payload non valido",
            422,
          );
        }
        const { privacy, marketing } = parsed.data;
        const userAgent = request.headers.get("user-agent");

        try {
          const rows: Array<{
            userId: string;
            type: string;
            granted: boolean;
            ip: string;
            userAgent: string | null;
          }> = [
            { userId: user.id, type: "privacy", granted: privacy, ip, userAgent },
          ];
          if (marketing) {
            rows.push({ userId: user.id, type: "marketing", granted: true, ip, userAgent });
          }
          await prisma.consentLog.createMany({ data: rows });
        } catch (e: unknown) {
          log.error("ConsentLog insert failed", {
            error: e instanceof Error ? e.message : "unknown",
            userId: user.id,
          });
          return apiError("INTERNAL_ERROR", "Errore salvataggio consensi", 500);
        }

        return apiSuccess({ logged: true });
      },
    },
  },
});
