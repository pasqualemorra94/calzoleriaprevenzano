/**
 * POST/GET /api/auth/* — Better Auth catch-all handler
 *
 * All auth requests (login, register, forgot-password, reset-password,
 * sign-out, get-session, etc.) are handled by Better Auth's built-in handler.
 */

import { createFileRoute } from "@tanstack/react-router";
import { auth } from "~/lib/auth";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        return auth.handler(request);
      },
      POST: async ({ request }: { request: Request }) => {
        return auth.handler(request);
      },
    },
  },
});
