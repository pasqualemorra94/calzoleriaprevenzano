# Technology Stack

**Analysis Date:** 2026-04-02

\document written to**

## STACK.md

```

**Analysis Date:** 2026-04-02

## Languages

**Primary:**
- TypeScript 5.x — `ES2022` — `ESNext`, `Bundler` resolution — target `ES2022` — `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCases`
 `noFallthroughCasesInSwitch`) — Build targets config. all generated project templates and `.template` files in TanStack and React Router 7 framework modules (`framework-react-router7.md`)

- **React 19** - Latest React with Suspense and React Router 7 SSR mode
- **React Router v7** uses `@react-router/fs-routes` for file-based routing with loaders/action pattern (Remix-style)
- **React Router 7** (TanStack Router uses `createFileRoute() for TanStack Router for file-based routing convention + `.` as filename, not dot-separated by `.`)

- **JSON:** in template file convention `app/routes/` in TanStack Start (`__root.tsx` -> `app/routes/__root.tsx`)

- **File-based routing**: TanStack Start uses `@tanstack/router-plugin/vite` Vite plugin (auto-generates `routeTree.gen.ts`)
- **TanStack Query** (`@tanstack/react-query`) - Server-side data fetching and caching
 SSR TanStack Start uses `createServerFn`({ method: "GET" })` for route loaders
- **TanStack Form** (`@tanstack/react-form`) with `@tanstack/zod-form-adapter` + `zod` - declarative forms handling
 validations and the shadcn/ui components rendering - shadcn/ui provides a button, input, card, label, textarea, checkbox, alert, dialog, sheet, navigation components, select, dropdown-menu, table, badge, separator, etc.
- `Radix UI` primitives via `@radix-ui/react` for accessible components (e.g., Accordion, Tabs, dialogs, select)
 tables, card, etc.)

- **React Icons:**
  - `lucide-react` for UI icons (e.g., `Loader2Icon`, `ShoppingCartIcon`)
  - `@icons-pack/react-simple-icons` in brand icons (e.g., `SiGithub`)

 `design System:** `Tailwind CSS v4` + CSS custom properties (design tokens stored in `app/styles/design-tokens.css`, imported into `app/styles/app.css` after the Tailwind import. Tailwind v3 uses `tailwind.config.ts` extension with design tokens. React Router 7 projects uses `@tailwindcss/vite` plugin)

- **CSS/styling approach ( Use CSS custom properties (design tokens + Tailwind utility classes. `shadcn/ui` provides `button`, input, card, label, textarea, checkbox, select, dialog, sheet, navigation components, etc.)

- **Form Handling:** `@tanstack/react-form` with `@tanstack/zod-form-adapter` + `zod` - server-side validation. forms use `Form` from React Router 7 and `useFetcher` for TanStack Start. `createServerFn`
- **Auth:** `secure-auth-sdk` ( GitHub-hosted private auth SDK providing `AuthUser`/`AuthSession`/`AuthAuditLog`, `AuthOAuthAccount`, `AuthBackupCode`, `AuthEmailToken`, `AuthLockout` models management + session tracking, login, registration, password reset, email verification, TOTP 2FA/MFA via TOTP secret + backup codes)
 Argon2id hashing, breach checking, pepper rotation ( auth.login throttle via session lockout, and `request.cookies`）

 CSRF protection via `secure-auth-sdk` middleware for Hono
 CSP headers, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and production

 `server.ts` wraps the Hono for server-level middleware for production for **Stripe integration:** `stripe` npm package with webhook handlers at `/api/webhooks/stripe` route, **Webhook-first pattern** — never trust client-side payment confirmation; client-side only). Currency cents ( cents) stripe handles `amount in cents (smallest currency unit), `STRIPE_SECRET_KEY` and env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
  - Webhook `charge.refunded` event handled for refunds logic, `STRIPE_API_VERSION: "2025-03-31.basil` ( api version: Stripe API in `apiVersion: "2025-03-31.basil`)
- **TypeScript: true, enabled with `strict: true`
- **Email:** Resend (primary via `nodemailer` (SMTP) or Resend HTTP API or or Gmail, Mailgun, etc. - **HTML Emails:** Premium table-based HTML email templates using Resolved design tokens from the site's design system
 `design-tokens.css` ( in `email-brand.server.ts`)
- **Monitoring:** Sentry (with `@sentry/react-router` SDK) for error tracking and Plausible Analytics (privacy-first analytics via `PlausibleAnalytics` component)
- **Health checks:** at `/api/health` endpoint
 pm2 cluster mode in production)
 VPS ( `ecosystem.config.cjs` with pm2 for development)
 **Database:** PostgreSQL 16 Alpine in Docker for Prisma ORM for Prisma 7, `@prisma/client`
 generator)
 Prisma client singleton (`~/lib/prisma.ts`)
  **State Management:** `softDelete` via Prisma middleware in `app/lib/prisma-soft-delete.server.ts`
  - **Rate limiting** in-memory rate limiting via `@rate-limit.server.ts` (development) or Redis in production via `@upstash/redis` or `rate-limit.redis.server.ts`
- **Production**: Redis via `ioredis` npm package)

 `ioredis`)
- **Web Vitals tracking** in `WebVitals` component
 Performance metrics
 `PerformanceMetric` Prisma model)
- **Security module** uses `secure-auth-sdk` with OWASP 2025 security guidelines, Argon2id hashing, session management, rate limiting, CSRF protection, server-side validation, `react i18next` for `react-i18next` ( JSON-based translations dictionaries), route aliases `~/` → `./app/*`)

- **i18n config file:** `public/locales/[lang]/` with namespace-based files structure)

 e.g., `it/IT/common.json`, `home.json`)
- **Directory:** `site-generator-agents/modules/i18n.md` (`modules/integration-patterns.md`)
)

- **Animation Module** (`modules/animations.md`):
 premium scroll animations via Lenis, Framer Motion page `framer Motion` + GSAP ScrollTrigger for premium+ tier)
- **Performance Module** (`modules/performance.md`) - route-based code splitting, lazy loading, image optimization
 `React.lazy()` for components loading)
 `SEO module** (`modules/seo.md`) - structured data via JSON-LD, schema.org markup, dynamic sitemap, robots.txt, meta tags, Open Graph meta tags)
- **GDPR compliance module** (`modules/gdpr-compliance.md` - cookie consent, data protection, GDPR rights cookie consent management)
 `CookieBanner` component)
- **Security module** (`modules/security.md`) with OWASP 2025 hardening, CSP headers, rate limiting, session lockout, CSRF protection, CSRF, guard in `secure-auth-sdk` middleware
 `securityHeadersMiddleware` in Hono)
  **Testing module** (`modules/testing.md`) for Vitest unit tests and Playwright E2E tests E2E ****Testing** with Playwright**
- **CI/CD module** (`modules/cicd.md`) - GitHub Actions CI/CD workflows, nginx + pm2 deployment, Netlify for staging

 VPS (Ubuntu 22.04) via VPS host in `.github/agents/` directory in `.github/agents`` mode="copilot Agent definitions"
 `dispatcher`, `research`, `design`, `pipeline`, `quality-check` `audit`, `codegen-foundation`, `codegen-pages`, `codegen-api`, `compliance`, `features-coding`, `features-redesign`, `deep-debug`, `features-deepscan`, `refactoring-code`, `refactoring-dedeepsearch` (test-writer`, `test-runner`)

 `.github/agents/` directory
 which `.github/agents/` directory provide additional agent definitions. Copilot Agent chat mode modes definitions files are `site-generator-agents/.github/agents/dispatcher.agent.md`
)

- **Package:** installed via `npx github:Mischio95/site-generator-agent-docs` (GitHub-hosted private package)
 contains agent definitions, modules governance files contracts, protocols docs)
  **Agents**:** `dispatcher`, `research`, `schema`, `pipeline`, `quality-check`, `audit`, `codegen-foundation`, `codegen-pages`, `codegen-api`, `compliance`, `features-coding`, `features-redesign`, `features-deepscan`, `features-deepsearch`, `refactoring-code`, `refactoring-deepsearch`, `test-writer`, `test-runner`
- Each agent saves its `site-output/` directory with artifacts including Markdown (JSON, etc.)
 `site-output/pipeline-state.json` tracks progress)

  `test-scenarios/` directory contains test scenario JSON files configurations files (e.g., `landing-simple.json`) used by test-runner as integration testing
  **Generated site types configuration (database model):**
- **Generated template files:** The `site-generator-agents/templates/` (React Router 7, TanStack) and shared subdirectory ` `templates/tanstack/` and `templates/react-router7/` and `templates/shared/` - `templates/shared/lib/` ( `lib/api-response.ts.template` and `lib/rate-limit.server.ts.template` ( `lib/rate-limit.redis.server.ts.template` - `lib/i18n.ts.template` in `lib/auth-guard.server.ts.template` in `lib/animation-variants.ts.template`, in `components/ErrorBoundary.tsx.template`, `components/CookieBanner.tsx.template`, `components/Cart.tsx.template`, `components/providers/SmoothScrollProvider.tsx.template`)

- **Plugin definition files** in `site-generator-agents/plugins/` directory (each `.md` file defines plugin capabilities, dependencies, and Prisma models additionsitions routes to the generated site)
  - **Plugin:** FAQ, `faq.md` - FAQ accordion with categories, schema.org FAQPage
 database-schema, seo, faq, newsletter, blog, gallery, reviews, live-chat, multi-language, document-manager, events, booking - newsletter signup + double opt-in, campaigns, GDPR-compliant blog, FAQ, Booking

 E-commerce, and SaaS sites types, from addition to Stripe integration
  - Plugin: Newsletter (`newsletter.md`) - email signup + double opt-in, campaigns, GDPR-compliant blog - Newsletter, FAQ, Booking, SaaS, E-commerce, in `02-site-types.md`)

    88 site types patterns: corporate, e-commerce, blog, portfolio, showcase, SaaS, local-business, landing
 Each site type has its corresponding Prisma models and `02-site-types.md`
- Plugin defined `site-generator-agents/plugins/` directory extend specific generated sites
- **Plugin system:** Plugin definitions are `site-generator-agents/plugins/README.md`, dependency management via semver versioning `ownership-matrix.json` and `site-generator-agents/governance/`

- **Contracts/ Protocols docs** in `site-generator-agents/contracts/` and `site-generator-agents/protocols/`
- **Agent definitions** in `.github/agents/` directory (19 per project root)

- **`site-generator-agents/templates/` - Template files for `.template` format for TanStack and React Router 7 variants
- **`docs/` - Documentation references files in `site-generator-agents/docs/`
- **Installation** via `npx github:Mischio95/site-generator-agent-docs agents` CLI
- **Runtime:** Node.js via Vinxi (TanStack Start) or React Router 7 via `react-router dev` in development mode) - **Runtime:** Node.js 22 LTS
 configured in `tsconfig.json` as `ES2022`
  **Build Tools:** Vite + Vinxi (TanStack Start), `react-router dev` (React Router 7), `@tailwindcss/vite` plugin)
- **Linter:** Biome (`@biomejs/biome`)
- **Formatter:** Biome (2-space indent, double quotes `"double"`, semicolons `always`)
- **Package Manager:** pnpm 9
 - Config: `biome.json`, `tsconfig.json`
- **CSS:** Tailwind CSS v4 (`@import "tailwindcss"`) with CSS custom properties design tokens
- **CSS Framework:** shadcn/ui (Radix UI-based components via `@/components/ui/`)
- **Database:** PostgreSQL 16 via Prisma ORM 7
 `Docker` (`docker-compose.dev.yml`)
- **Auth:** Custom `secure-auth-sdk` (GitHub-hosted) Argon2id hashing, session management, TOTP 2FA/MFA, OAuth, magic Link, CSRF protection, `secure-auth-sdk` with Argon2id, OWASP 2025 security guidelines, HSTS, CSP headers via Hono middleware
 production, Stripe webhooks signature verification, Hono (`hono`, `@hono/node-server` server production)
 `tsx` runner
 **Testing:** Vitest (unit tests), Playwright (E2E tests)
  **Email:** Resend (recommended) or SMTP (nodemailer) as fallback
 **Monitoring:** Sentry (`@sentry/react-router`) in error tracking, Plausible Analytics in privacy-first analytics via `webVitals` tracking ( structured JSON logging ( server-side)
 **Logging:** File-based (`~/lib/logger.server.ts`)
- **Analytics:** Plausible (privacy-first, consent-gated via GDPR module's GDPR cookie consent management`)
- **GDPR Compliance:** Cookie consent, data protection, GDPR documentation, `CookieBanner` component, `data export`/erasure ( GDPR right to be forgotten (`modules/gdpr-compliance.md`)
- **PWA:** Progressive Web App support manifest ( `manifest.json`, service worker, service worker (`workbox` manifest)
 `@prisma/client` type-safe database access) **Storage:** Supabase (S3) + Cloudinary as future alternative
 File upload handling in `server.ts`

 currently local filesystem only `public/uploads/`, but `templates/shared/lib/api-response.ts.template`) - `templates/shared/lib/rate-limit.server.ts.template`, `app/lib/api-response.ts` - `templates/shared/lib/rate-limit.redis.server.ts.template` - `templates/shared/lib/i18n.ts.template` - `templates/shared/lib/auth-guard.server.ts.template`)
  `templates/shared/lib/animation-variants.ts.template` - `templates/shared/components/ErrorBoundary.tsx.template` - `templates/shared/components/CookieBanner.tsx.template`
 in `templates/shared/components/Cart.tsx.template` - `templates/shared/providers/SmoothScrollProvider.tsx.template`

  - **GDPR Compliance modules (`modules/gdpr-compliance.md`) - **Security module** `modules/security.md`
  **Performance module** `modules/performance.md`)

- **PWA module** `modules/pwa.md`
- **SEO module** `modules/seo.md`
  - **i18n module** `modules/integration-patterns.md` ( `modules/integration-patterns.md`)
  - **Frontend pages module** `modules/frontend-pages.md`
 - **Design system module** `modules/design-system.md` - **Content intelligence module** `modules/content-intelligence.md`
  - **Research agent module** `modules/research-agent.md` - **Discussion mode module** `modules/discussion-mode.md`
  - **Enterprise segmentation module** `modules/enterprise-segmentation.md` - **Smart recommendations** `modules/smart-recommendations.md` ( *(This is only under construction)*
 - **Email module** `modules/email.md` - **Payment system** `modules/payments.md` - **CI/CD module** `modules/cicd.md` ( **Database module** `modules/database-schema.md` ( **Authentication module** `modules/authentication.md`)

 **Refactoring module** `modules/refactoring.md`
  **Testing module** `modules/testing.md`
  **Audit module** `modules/compliance.md`, `audit.md` - `deep Debug module** `modules/deep-debug.md` - **Custom plugins** `modules/custom-plugins.md`
- **Design system documentation** in `docs/ui-ux.md`, `site-generator-agents/docs/ui-ux.md`
 - **Auth SDK reference** in `docs/auth-sdk-reference.md`
 - **Premium UI patterns** in `docs/skill-premium-patterns.md`
- **shadcn strategy** in `modules/shadcn-strategy.md` ( various agent system docs ( GUIDE.md and REFACTORING-GUIDE.md`)

 **Deployment via VPS (nginx reverse proxy, pm2 cluster manager) in production, GitHub Actions CI/CD
 **Staging via Netlify PRPR preview deployments)
 **Hosting:** Self-hosted VPS or `.github/agents/` definitions, `site-generator-agents/.github/agents/` directory, and the `site-generator-agents/` project root
 `.planning/codebase/` folder does `.planning/codebase/` directory ( ensure it exists) create the file.

 Then write both documents.

 STACK.md and IN the .planning/codebase/ directory.