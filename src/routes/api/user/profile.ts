/**
 * PUT /api/user/profile — Update user profile (name, email)
 * POST /api/user/change-password — Change password
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireUser } from "~/lib/sdk-auth.server";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Il nome deve avere almeno 2 caratteri").max(100),
  email: z.string().email("Email non valida"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password attuale obbligatoria"),
  newPassword: z.string().min(8, "La nuova password deve avere almeno 8 caratteri"),
  revokeOtherSessions: z.boolean().default(false),
});

export const Route = createFileRoute("/api/user/profile")({
  server: {
    handlers: {
      PUT: async ({ request }) => {
        let userId: string;
        try {
          const user = await requireUser(request);
          userId = user.id;
        } catch {
          return apiError("UNAUTHORIZED", "Autenticazione richiesta", 401);
        }

        const body = await request.json() as unknown;
        const parsed = updateProfileSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        try {
          await prisma.user.update({
            where: { id: userId },
            data: { name: parsed.data.name, email: parsed.data.email },
          });
          return apiSuccess({ message: "Profilo aggiornato" });
        } catch {
          return apiError("INTERNAL_ERROR", "Errore durante l'aggiornamento del profilo", 500);
        }
      },

      POST: async ({ request }) => {
        try {
          await requireUser(request);
        } catch {
          return apiError("UNAUTHORIZED", "Autenticazione richiesta", 401);
        }

        const body = await request.json() as unknown;
        const parsed = changePasswordSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        // Better Auth changePassword — delegate to auth API
        try {
          const res = await fetch(`${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/api/auth/change-password`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              cookie: request.headers.get("cookie") ?? "",
            },
            body: JSON.stringify(parsed.data),
          });

          if (!res.ok) {
            const json = await res.json() as { error?: string; message?: string };
            const msg = json.message ?? json.error ?? "Password attuale non corretta";
            return apiError("INVALID_PASSWORD", msg, 400);
          }

          return apiSuccess({ message: "Password aggiornata" });
        } catch {
          return apiError("INTERNAL_ERROR", "Errore durante il cambio password", 500);
        }
      },
    },
  },
});

import { prisma } from "~/lib/db.server";
