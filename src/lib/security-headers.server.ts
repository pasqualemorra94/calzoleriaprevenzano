/**
 * Security Headers — server-side
 *
 * OWASP 2025 recommended HTTP security headers.
 * The canonical implementation is in `server/middleware/security-headers.ts`
 * (Nitro middleware applied to ALL responses).
 *
 * This file provides the `getSecurityHeaders()` utility for programmatic use
 * (e.g., custom responses, test utilities) and the OWASP compliance register.
 *
 * Categories covered:
 * - A02 Security Misconfiguration
 * - A05 Injection (CSP)
 * - A04 Cryptographic Failures (HSTS)
 */

import { createLogger } from "~/lib/logger.server";

const log = createLogger("security-headers");

interface SecurityHeaderConfig {
  isProduction: boolean;
}

/**
 * Returns a Record of security headers to apply to all responses.
 */
export function getSecurityHeaders(config: SecurityHeaderConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Security-Policy": buildCSP(config),
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    // X-XSS-Protection is deprecated — explicitly disabled
    "X-XSS-Protection": "0",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=()",
  };

  if (config.isProduction) {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
    log.info("Production security headers applied");
  }

  return headers;
}

function buildCSP(config: SecurityHeaderConfig): string {
  const directives = [
    "default-src 'self'",
    // 'unsafe-inline' needed for Tailwind CSS inline styles — never add 'unsafe-eval'
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

  if (!config.isProduction) {
    // Allow Vite HMR in development
    directives[1] = "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com";
    directives[7] = "connect-src 'self' https://api.stripe.com https://api.resend.com https://*.google-analytics.com https://www.googletagmanager.com ws://localhost:* http://localhost:*";
  }

  return directives.join("; ");
}
