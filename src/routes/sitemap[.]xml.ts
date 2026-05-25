/**
 * GET /sitemap.xml — XML sitemap dinamica per SEO
 *
 * Include: pagine statiche + prodotti pubblicati + categorie attive.
 * Spec: https://www.sitemaps.org/protocol.html
 * Refresh: ricaricata al massimo ogni 1h (Cache-Control max-age=3600).
 */

import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "~/lib/db.server";

const BASE_URL = process.env.APP_URL ?? "https://calzoleriaprevenzano.it";

// Pagine statiche da indicizzare (confermate esistenti in src/routes/)
const STATIC_PAGES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/catalogo", changefreq: "weekly", priority: "0.9" },
  { path: "/la-bottega", changefreq: "monthly", priority: "0.6" },
  { path: "/contatti", changefreq: "monthly", priority: "0.5" },
  { path: "/guida-alla-taglia", changefreq: "yearly", priority: "0.5" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/termini", changefreq: "yearly", priority: "0.3" },
  { path: "/cookie", changefreq: "yearly", priority: "0.3" },
  { path: "/resi-e-recesso", changefreq: "yearly", priority: "0.3" },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(date: Date): string {
  // YYYY-MM-DD (W3C Datetime spec, accettato da sitemaps.org)
  return date.toISOString().slice(0, 10);
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = formatDate(new Date());

        // Query parallele: prodotti pubblicati + categorie attive
        const [products, categories] = await Promise.all([
          prisma.product.findMany({
            where: { isActive: true, deletedAt: null },
            select: { slug: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
          }),
          prisma.category.findMany({
            where: { isActive: true },
            select: { slug: true, updatedAt: true },
          }),
        ]);

        const urls: string[] = [];

        // Pagine statiche
        for (const page of STATIC_PAGES) {
          urls.push(
            [
              "  <url>",
              `    <loc>${escapeXml(`${BASE_URL}${page.path}`)}</loc>`,
              `    <lastmod>${today}</lastmod>`,
              `    <changefreq>${page.changefreq}</changefreq>`,
              `    <priority>${page.priority}</priority>`,
              "  </url>",
            ].join("\n"),
          );
        }

        // Prodotti pubblicati
        for (const product of products) {
          urls.push(
            [
              "  <url>",
              `    <loc>${escapeXml(`${BASE_URL}/prodotti/${product.slug}`)}</loc>`,
              `    <lastmod>${formatDate(product.updatedAt)}</lastmod>`,
              "    <changefreq>weekly</changefreq>",
              "    <priority>0.8</priority>",
              "  </url>",
            ].join("\n"),
          );
        }

        // Categorie attive (URL = /catalogo?categoria={slug})
        for (const category of categories) {
          urls.push(
            [
              "  <url>",
              `    <loc>${escapeXml(`${BASE_URL}/catalogo?categoria=${category.slug}`)}</loc>`,
              `    <lastmod>${formatDate(category.updatedAt)}</lastmod>`,
              "    <changefreq>weekly</changefreq>",
              "    <priority>0.7</priority>",
              "  </url>",
            ].join("\n"),
          );
        }

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          urls.join("\n"),
          "</urlset>",
        ].join("\n");

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
