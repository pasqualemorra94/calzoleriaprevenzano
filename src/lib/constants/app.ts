/** Application configuration — centralized magic-number elimination */
export const APP_CONFIG = {
  site: {
    name: "Calzoleria Prevenzano",
    tagline: "Sandali artigianali dal 1984",
    url: process.env.APP_URL ?? "http://localhost:5173",
  },
  pagination: {
    defaultPageSize: 12,
    maxPageSize: 100,
  },
  cart: {
    maxItems: 50,
    maxQuantityPerItem: 10,
  },
  auth: {
    sessionMaxAge: 60 * 60 * 24 * 30, // 30 giorni
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
  },
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5 MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  locale: {
    default: "it",
    supported: ["it"] as const,
  },
} as const;
