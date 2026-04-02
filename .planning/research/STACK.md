# Technology Stack

**Project:** Calzoleria Prevenzano — Artisanal Italian E-Commerce
**Researched:** 2026-04-02
**Overall confidence:** HIGH

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| TypeScript | 6.x | Language | Strict type safety across the full stack. Required by TanStack Start and Prisma 7. | HIGH |
| React | 19.2.x | UI library | Latest React with concurrent features, Suspense, streaming SSR via TanStack Start. | HIGH |
| TanStack Start | 1.167.x | Full-stack React framework | File-based routing, SSR, server functions, middleware — all type-safe. RC stage, API stable. Built on TanStack Router + Vite. | HIGH |
| TanStack Router | 1.168.x | Type-safe routing | Nested routing, search params, loaders, code splitting. Start's routing engine. | HIGH |
| Vite | 6.x | Build tool | Fast HMR, optimized builds. TanStack Start runs on Vite. | HIGH |
| Vinxi | 0.5.x | Server runtime | TanStack Start's underlying server runtime for SSR and server functions. | HIGH |

### Database & ORM

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| PostgreSQL | 16 | Primary database | Battle-tested relational DB. Prisma 7 native support. Required for complex product variants, orders, and relationships. | HIGH |
| Prisma ORM | 7.6.x | Type-safe ORM | Auto-generated client, declarative schema, migrations. v7 uses `prisma.config.ts` and requires `output` path in schema. | HIGH |
| `@prisma/client` | 7.6.x | Generated client | Type-safe queries, relations, transactions. Import from custom output path (not `@prisma/client` directly in v7). | HIGH |

### Authentication

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Better Auth | 1.5.x | Authentication framework | Framework-agnostic, Prisma adapter, plugin ecosystem (2FA, passkeys, admin). Has dedicated Prisma adapter with joins support. CLI generates Prisma schema. | HIGH |
| `@better-auth/prisma-adapter` | 1.5.x | Prisma integration | Official adapter for connecting Better Auth to Prisma. Supports experimental joins for performance. | HIGH |

### Payments

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `stripe` | 21.x | Server-side Stripe API | Industry standard. Webhook-first pattern (never trust client). EUR support, PaymentIntents for SCA compliance (required for EU). Type-safe with latest API version. | HIGH |
| `@stripe/stripe-js` | 9.x | Client-side Stripe | Loading Stripe.js in the browser for Elements, Payment Element. | HIGH |
| `@stripe/react-stripe-js` | 6.x | React Stripe components | Drop-in Payment Element, Card Element as React components. | HIGH |

### Email

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `resend` | 6.x | Email delivery | Modern API, React Email integration (send `react` prop directly). Domain verification at resend.com/domains. | HIGH |
| `react-email` | 5.x | Email templates | Build transactional emails as React components. Works natively with Resend's `react` parameter. | HIGH |
| `@react-email/components` | 1.x | Email primitives | Table-based layout components (Container, Button, Text, etc.) for cross-client compatibility. | HIGH |

### UI & Design System

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | 4.2.x | Utility-first CSS | v4 uses `@import "tailwindcss"` syntax (no `tailwind.config.ts`). CSS-first configuration. | HIGH |
| `@tailwindcss/vite` | 4.x | Vite plugin | Tailwind v4's Vite integration. Required for v4. | HIGH |
| shadcn/ui | latest | Component library | Copy-paste accessible components built on Radix UI. Customizable, no lock-in. Install via `pnpm dlx shadcn@latest add <component>`. | HIGH |
| Radix UI | latest | Component primitives | Accessible, unstyled primitives used by shadcn/ui. Dialog, Select, Tabs, Accordion, etc. | HIGH |
| `lucide-react` | 1.7.x | UI icons | Comprehensive icon set. Import with `Icon` suffix convention: `import { ShoppingCartIcon } from "lucide-react"`. | HIGH |
| `@icons-pack/react-simple-icons` | 13.x | Brand icons | Social/brand icons: `SiInstagram`, `SiFacebook`, `SiWhatsapp`, `SiStripe`. | HIGH |
| `framer-motion` | 12.x | Animations | Page transitions, product image carousels, micro-interactions. Tree-shakeable, SSR-compatible. | HIGH |

### Forms & Validation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| TanStack Form | 1.28.x | Form management | Headless, type-safe forms. Native SSR support with TanStack Start. Reactive validation. | HIGH |
| Zod | 4.3.x | Schema validation | Runtime type validation for server functions, form validation, API inputs. Standard Schema spec compatible. | HIGH |

### Data Fetching & State

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| TanStack Query | 5.96.x | Server state management | Caching, background refetching, optimistic updates. Use for product listings, cart, user data. Integrates with TanStack Start loaders. | HIGH |
| Nanoid | 5.x | ID generation | URL-safe unique IDs for order numbers, cart IDs. Non-crypto but fast. | HIGH |

### Image Processing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Sharp | 0.34.x | Server-side image processing | Resize, optimize, convert product images to WebP/JPEG. 4-5x faster than ImageMagick. Required for product image pipeline (sandals, leather goods). | HIGH |
| `slugify` | 1.6.x | URL slug generation | Create SEO-friendly product URLs from Italian names (e.g., "Sandalo Classico Napoli" → "sandalo-classico-napoli"). | HIGH |

### Caching & Performance

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `ioredis` | 5.x | Redis client | Production rate limiting, session secondary storage, cart caching. Better Auth has official `@better-auth/redis-storage` integration. | HIGH |
| `@better-auth/redis-storage` | latest | Auth session cache | Offload session/verification/rate-limit data to Redis. Reduces DB load. | MEDIUM |

### SEO & Meta

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Custom implementation | — | Sitemap, robots.txt, JSON-LD | TanStack Start has no official SEO guide. Build custom: server route for `/sitemap.xml`, static `robots.txt`, JSON-LD for Product/LocalBusiness/Organization schemas. | MEDIUM |
| TanStack Router head | built-in | Meta tags | `<head>` management via route configuration. Title, description, Open Graph per route. | HIGH |

### Developer Tooling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `@biomejs/biome` | 2.4.x | Linter + Formatter | Replaces ESLint + Prettier. Faster, unified config. 2-space indent, double quotes, semicolons. | HIGH |
| pnpm | 9.x | Package manager | Fast, disk-efficient. Workspace support for monorepo if needed. | HIGH |
| Vitest | latest | Unit testing | Native TypeScript, Vite-compatible. Test server functions, utilities, Prisma queries. | HIGH |
| Playwright | latest | E2E testing | Test checkout flow, auth, product customization end-to-end. | HIGH |
| `@tanstack/router-plugin` | 1.167.x | Route generation | Auto-generates `routeTree.gen.ts` from file-based routes. Vite plugin. | HIGH |
| `@tanstack/react-query-devtools` | 5.x | Query debugging | Visual query inspector. Development only. | HIGH |
| `@tanstack/react-router-devtools` | 1.x | Router debugging | Visual route inspector. Development only. | HIGH |

### Infrastructure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Docker + Docker Compose | latest | Local PostgreSQL | `docker-compose.dev.yml` for PostgreSQL 16 Alpine. Consistent dev environments. | HIGH |
| pm2 | latest | Process manager | Cluster mode for production. `ecosystem.config.cjs` configuration. | HIGH |
| nginx | latest | Reverse proxy | SSL termination, static assets, gzip. In front of pm2/Node. | HIGH |
| GitHub Actions | — | CI/CD | Automated testing, linting, deployment pipelines. | HIGH |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | TanStack Start | Next.js 15 | Project mandate is TanStack Start. Also: TanStack Start has better type-safe routing, server functions, no RSC complexity. |
| Framework | TanStack Start | Remix / React Router 7 | Project mandate. RR7 is viable alternative with similar patterns, but Start is the chosen path. |
| ORM | Prisma 7 | Drizzle ORM | Project mandate. Drizzle is lighter but Prisma has Better Auth's official adapter with CLI schema generation. |
| Auth | Better Auth | NextAuth/Auth.js | Project mandate. Also: Better Auth is framework-agnostic, has Prisma adapter, plugin ecosystem. |
| Auth | Better Auth | Clerk / Supabase Auth | Project mandate. Also: self-hosted, no vendor lock-in, free. |
| Forms | TanStack Form | React Hook Form | Project uses TanStack ecosystem. RHF doesn't have native SSR support with TanStack Start. |
| Email SDK | Resend | Nodemailer | Project mandate. Also: Resend has cleaner API, React Email native integration. |
| Animations | Framer Motion | GSAP | FM is React-native, tree-shakeable, sufficient for e-commerce UI. GSAP is overkill unless premium scroll-triggered animations needed (deferred). |
| Validation | Zod | Yup / Valibot | Zod is the ecosystem standard. TanStack Form's Standard Schema adapter works with Zod. |
| Image | Sharp | Cloudinary SDK | Self-hosted, no vendor dependency. Sharp handles resize/WebP conversion on upload. Cloudinary could be added later if CDN needed. |
| Icons | Lucide | Heroicons | Lucide is more comprehensive, used by shadcn/ui natively. |
| Linter | Biome | ESLint + Prettier | Faster, single tool, zero config for most cases. Project standard. |
| Redis | ioredis | `@upstash/redis` | ioredis for self-hosted Redis on VPS. Upstash is serverless-only — doesn't match VPS deployment. |

## Installation

```bash
# Core framework
pnpm add @tanstack/react-start @tanstack/react-router @tanstack/react-query @tanstack/react-form @tanstack/router-plugin vinxi

# React
pnpm add react react-dom

# Database
pnpm add @prisma/client
pnpm add -D prisma

# Auth
pnpm add better-auth @better-auth/prisma-adapter

# Payments
pnpm add stripe @stripe/stripe-js @stripe/react-stripe-js

# Email
pnpm add resend react-email @react-email/components

# UI
pnpm add tailwindcss @tailwindcss/vite
pnpm add -D @tailwindcss/vite
# shadcn components installed individually:
# pnpm dlx shadcn@latest add button card input label ...

# Icons
pnpm add lucide-react @icons-pack/react-simple-icons

# Animation
pnpm add framer-motion

# Validation
pnpm add zod

# Image processing
pnpm add sharp

# Utilities
pnpm add nanoid slugify

# Redis (production)
pnpm add ioredis @better-auth/redis-storage

# Dev dependencies
pnpm add -D @biomejs/biome typescript vitest playwright @tanstack/react-query-devtools @tanstack/react-router-devtools
```

## Key Architecture Decisions

### 1. Stripe Payment Flow (SCA-Compliant for EU)
Use **PaymentIntents** (not Charges) — mandatory for European cards with Strong Customer Authentication (SCA). Flow:
1. Server creates PaymentIntent via `stripe.paymentIntents.create()`
2. Client confirms with `stripe.confirmPayment()` via Payment Element
3. Webhook (`/api/webhooks/stripe`) handles `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Never trust client-side confirmation — webhook is source of truth

### 2. Product Variant System (Custom Sandals)
Sandals have 4+ personalization dimensions (heel, leather type, leather color, jewelry/decorative element). Model this as:
- `Product` → has many `ProductVariant` (each variant = unique combination)
- `ProductOption` (e.g., "Tacco") → has many `ProductOptionValue` (e.g., "5cm", "7cm")
- Variant selection on frontend via TanStack Form with dynamic pricing
- Variant images via Sharp-processed product gallery

### 3. Cart State Management
- **Guest cart**: Server-side session/cart stored in PostgreSQL, keyed by session cookie
- **Auth cart**: Persisted in DB tied to user account
- **Merge on login**: Guest cart merges into user cart when authenticated
- Use TanStack Query for optimistic updates (add to cart, update quantity)
- Do NOT use localStorage — causes hydration mismatches with SSR

### 4. Image Pipeline
Product images flow:
1. Admin uploads via server function → Sharp processes (resize to multiple sizes, WebP conversion)
2. Store in `public/uploads/products/{id}/` (local filesystem for VPS)
3. Serve with `<picture>` element for responsive images (WebP with JPEG fallback)
4. Future: CDN layer via nginx or Cloudflare in front

### 5. SEO Strategy (No Library — Custom)
TanStack Start has no official SEO library. Build custom:
- **Sitemap**: Server route at `/sitemap.xml` that queries all published products from DB
- **robots.txt**: Static file in `public/`
- **JSON-LD**: Component that renders `Product`, `LocalBusiness`, `Organization` structured data
- **Meta tags**: Per-route `<head>` via TanStack Router's route config
- **Open Graph**: Per-product OG images (can use Sharp to generate)

### 6. i18n (Italian-First, Deferred Multi-Language)
Site is Italian-only in v1. For future multi-language readiness:
- Use Italian strings directly in components (no i18n library overhead for single-language)
- Extract strings to constants files when adding languages in v2
- Consider `react-i18next` only when multi-language is actually needed
- **Do NOT add i18n library now** — YAGNI, adds complexity for zero benefit

### 7. Rate Limiting
- **Better Auth built-in**: Has rate limiter for auth endpoints
- **Custom API rate limiting**: In-memory for dev, Redis-based for production via ioredis
- Apply to: contact form, checkout, search, API endpoints

## Version Notes

| Package | Version | Notes |
|---------|---------|-------|
| TanStack Start | 1.167.x | RC stage, API considered stable. No RSC support yet (not needed for this project). |
| Prisma 7 | 7.6.x | Breaking change: requires `prisma.config.ts` in project root, `output` path in schema. Import client from output path, not `@prisma/client`. |
| Better Auth | 1.5.x | Has Prisma adapter with joins support. CLI can generate Prisma schema. Enable `experimental: { joins: true }` for performance. |
| Stripe | 21.x | Latest API version. Use PaymentIntents for EU SCA compliance. TypeScript types reflect latest API version. |
| Tailwind CSS | 4.2.x | v4 breaking: no `tailwind.config.ts`. CSS-first config via `@import "tailwindcss"`. Uses `@tailwindcss/vite` plugin. |
| Zod | 4.3.x | Major version bump from v3. Standard Schema spec compatible. Works with TanStack Form's Standard Schema adapter. |
| React | 19.2.x | React 19 stable. No more `use client` directives needed (not using RSC). |

## What NOT to Use

| Library / Approach | Why Avoid |
|--------------------|-----------|
| `redux` / `zustand` | TanStack Query handles server state. React state + context handles UI state. No global state store needed for e-commerce. |
| `localStorage` for cart | SSR hydration mismatch. Use server-side cart persistence. |
| `next-i18next` / `react-i18next` | Overhead for Italian-only site. Add in v2 if multi-language needed. |
| `express` / `hono` separately | TanStack Start's Vinxi server handles everything. Don't add another HTTP framework. |
| `multer` / `formidable` | TanStack Start server functions handle file uploads. Parse multipart in server function. |
| `GSAP` | Overkill. Framer Motion handles all needed animations. Add later only if premium scroll animations needed. |
| `cloudinary` / `uploadthing` | Self-hosted with Sharp. No vendor dependency. Can add CDN layer later if needed. |
| `@sentry/react` | Not needed initially. Add monitoring in production phase. Can integrate later. |
| `plausible` analytics | Defer to v2. Focus on core e-commerce first. |
| `workbox` / PWA | Not required. Mobile-responsive web is sufficient. |
| `wordpress` / `woocommerce` | Being replaced. No legacy dependency. |

## Sources

- TanStack Start docs: https://tanstack.com/start/latest/docs/framework/react/overview (RC stage, API stable)
- TanStack Form docs: https://tanstack.com/form/latest/docs/overview (v1 stable)
- Better Auth docs: https://www.better-auth.com/docs/introduction (v1.5, Prisma adapter available)
- Better Auth Prisma adapter: https://www.better-auth.com/docs/adapters/prisma (joins support since 1.4)
- Prisma 7 docs: https://prisma.io/docs/orm/overview/introduction (v7 with prisma.config.ts)
- Stripe Node.js: https://www.npmjs.com/package/stripe (v21, PaymentIntents API)
- Resend Node.js SDK: https://resend.com/docs/send-with-nodejs (v6, React Email integration)
- React Email: https://react.email/docs/introduction (v5)
- Sharp: https://sharp.pixelplumbing.com/ (v0.34, high-performance image processing)
- All version numbers verified via `npm view` on 2026-04-02
