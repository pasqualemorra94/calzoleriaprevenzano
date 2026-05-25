/**
 * Nitro Server Middleware — Security Headers
 *
 * Applied to ALL responses (HTML, API, assets).
 * Categories covered:
 * - A02 Security Misconfiguration
 * - A05 Injection (CSP)
 * - A04 Cryptographic Failures (HSTS)
 *
 * NOTE: The getSecurityHeaders() function in src/lib/security-headers.server.ts
 * remains as the canonical definition. This middleware is the Nitro-side wiring
 * that actually applies headers to responses.
 */

import { defineEventHandler } from "h3";
import type { H3Event } from "h3";

export default defineEventHandler((event: H3Event) => {
  const isProduction = process.env.NODE_ENV === "production";

  // ── Content Security Policy ──
  const cspDirectives = [
    "default-src 'self'",
    // 'unsafe-inline' needed for Tailwind CSS — never add 'unsafe-eval'
    "script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.bunny.net https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.bunny.net https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://api.resend.com https://*.google-analytics.com https://www.googletagmanager.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  if (!isProduction) {
    // Allow Vite HMR in development
    cspDirectives[1] =
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com";
    cspDirectives[7] =
      "connect-src 'self' https://api.stripe.com https://api.resend.com https://*.google-analytics.com https://www.googletagmanager.com ws://localhost:* http://localhost:*";
  }

  const res = event.node?.res;
  if (!res) return;

  res.setHeader("Content-Security-Policy", cspDirectives.join("; "));
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  // X-XSS-Protection is deprecated — explicitly disabled
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader(
    "Referrer-Policy",
    "strict-origin-when-cross-origin",
  );
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=()",
  );

  if (isProduction) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }
});
