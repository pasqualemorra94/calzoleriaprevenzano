/**
 * GET /api/site/media — Public endpoint for site template images
 *
 * Returns decorative/media images used across public pages (hero, calzoleria, etc.).
 * No auth required — this is a public-facing endpoint.
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess } from "~/lib/api-response";
import { prisma } from "~/lib/db.server";

export const Route = createFileRoute("/api/site/media")({
  server: {
    handlers: {
      GET: async () => {
        const templateMedia = await prisma.media.findMany({
          where: { folder: "templates" },
          select: { filename: true, url: true, alt: true, width: true, height: true },
          orderBy: { filename: "asc" },
        });

        return apiSuccess({ templates: templateMedia });
      },
    },
  },
});
