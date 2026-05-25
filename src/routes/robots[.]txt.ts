/**
 * GET /robots.txt — direttive crawler + link sitemap
 */

import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = process.env.APP_URL ?? "https://calzoleriaprevenzano.it";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const body = [
          "User-agent: *",
          "Allow: /",
          "Disallow: /admin",
          "Disallow: /admin/",
          "Disallow: /account",
          "Disallow: /account/",
          "Disallow: /api/",
          "Disallow: /checkout",
          "Disallow: /carrello",
          "Disallow: /auth/",
          "",
          `Sitemap: ${BASE_URL}/sitemap.xml`,
          "",
        ].join("\n");

        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
