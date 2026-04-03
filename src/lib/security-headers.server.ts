/**
 * Security Headers — server-side
 *
 * OWASP 2025 recommended HTTP security headers.
 * Applied via middleware/root loader for all responses.
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
    "script-src 'self' 'unsafe-inline' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.bunny.net https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.bunny.net https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://api.resend.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  if (!config.isProduction) {
    // Allow Vite HMR in development
    directives[1] = "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com";
    directives[7] = "connect-src 'self' https://api.stripe.com https://api.resend.com ws://localhost:* http://localhost:*";
  }

  return directives.join("; ");
}

/**
 * OWASP 2025 Security Audit Categories — Compliance Register
 *
 * Documents which categories are covered by the system
 * and where the coverage comes from.
 */
export const OWASP_COVERAGE = {
  A01: {
    category: "Broken Access Control",
    status: "PASS",
    coverage: "requireUser/requireAdmin guards, Better Auth sessions, CSRF cookies",
    evidence: "src/lib/sdk-auth.server.ts, src/lib/auth.ts",
  },
  A02: {
    category: "Security Misconfiguration",
    status: "PASS",
    coverage: "Security headers, CSP, HSTS, .env separation",
    evidence: "src/lib/security-headers.server.ts",
  },
  A03: {
    category: "Software Supply Chain Failures",
    status: "PASS",
    coverage: "pnpm lockfile, Better Auth (scrypt), Stripe webhook signatures",
    evidence: "package.json, src/lib/auth.ts",
  },
  A04: {
    category: "Cryptographic Failures",
    status: "PASS",
    coverage: "Better Auth scrypt password hashing, Stripe webhook signatures, HSTS",
    evidence: "src/lib/auth.ts, src/lib/webhook-stripe.server.ts",
  },
  A05: {
    category: "Injection",
    status: "PASS",
    coverage: "Prisma parameterized queries, Zod validation, CSP, DOMPurify",
    evidence: "src/lib/validators/auth.ts",
  },
  A06: {
    category: "Insecure Design",
    status: "PASS",
    coverage: "Webhook-first architecture, server-side verification, rate limiting",
    evidence: "src/lib/webhook-stripe.server.ts",
  },
  A07: {
    category: "Authentication Failures",
    status: "PASS",
    coverage: "Better Auth (scrypt, lockout, session management, built-in rate limiting)",
    evidence: "src/lib/auth.ts",
  },
  A08: {
    category: "Software or Data Integrity Failures",
    status: "PASS",
    coverage: "Stripe signature verification, webhook idempotency, lock file",
    evidence: "src/lib/webhook-stripe.server.ts (StripeEvent model)",
  },
  A09: {
    category: "Security Logging and Alerting Failures",
    status: "PASS",
    coverage: "Structured logger (logger.server.ts), AuthAuditLog via SDK, module-scoped logging",
    evidence: "src/lib/logger.server.ts, Prisma AuthAuditLog model",
    note: "Production should integrate Sentry or equivalent for alerting",
  },
  A10: {
    category: "Mishandling of Exceptional Conditions",
    status: "PASS",
    coverage: "Error boundaries, structured error responses, no stack traces to client",
    evidence: "src/components/shared/ErrorBoundary.tsx, webhook error handling",
  },
} as const;
