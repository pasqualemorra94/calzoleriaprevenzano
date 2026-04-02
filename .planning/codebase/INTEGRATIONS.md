# External Integrations

**Analysis Date:** 2026-04-02

---

## APIs & External Services

### Payments — Stripe
- **Service:** Stripe — Payment processing, subscriptions, refunds
 one-time checkout, subscription management
  - **SDK/Client:** `stripe` npm package
  - **Auth:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY` (server-only, in `.server.ts` files)
  - **Integration files:** `site-generator-agents/modules/payments.md`
  - **Routes generated:** `~/routes/api/checkout`, `~/routes/api/subscribe`, `~/routes/api/webhooks/stripe`, `~/routes/api/billing-portal`, checkout flow, refund flow
 Prisma schema additions)
 webhook handlers with idempotency, StripeEvent model

 subscription guard (`requireActivePlan`, `~/lib/subscription.server.ts`)
- **Stripe API version:** `2025-03-31.basil`
- **Environment variables:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`
- **Stripe listen CLI:** `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (for local testing)



- **Webhook Events Hand ( include:**
    - `checkout.session.completed` — order completed, subscription started
 paid orders and subscription status updated
 and subscription deleted
    - `invoice.payment_failed` — past_due notification
 `charge.refunded` — refund with email
 `charge.dispute.created` — dispute tracking

 security events
 (`modules/payments.md` lines 238-385)

 
### Auth System — secure-auth-sdk (- **Service:** Custom auth SDK ( GitHub: `https://github.com/Mischio95/secure-auth-sdk.git)
  - **Purpose:** Complete authentication system (email/password, magic link, OAuth via TOTP, 2FA/MFA, audit logging, session management)
 password hashing with Argon2id + pepper, and breach checking)
  - **Integration file:** `site-generator-agents/modules/authentication.md`
 (adapter: `~/app/lib/sdk-auth.server.ts` and `~/lib/auth.server.ts`)
  - **Auth methods:** Email/Password, Magic Link, OAuth, TOTP, backup codes)
 password reset, email verification
  - **Prisma models:** `AuthUser`, `AuthSession`, `AuthTOTPSecret`, `AuthBackupCode`, `AuthEmailToken`, `AuthLockout`, `AuthAuditLog`, `AuthOAuthAccount` (`database-schema.md`)
  - **Environment variables:** `AUTH_SECRET`, `APP_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

  - **OAuth providers:** Google, GitHub, Apple, Discord, Microsoft (`AuthOAuthAccount.provider` field)
  - **Auth pages:** `app/routes/auth/_index.tsx`, `app/routes/auth/register.tsx`, `app/routes/auth/forgot-password.tsx`, `app/routes/auth/reset-password.tsx`, `app/routes/auth/verify-email.ts` (`modules/authentication.md` lines 42-82)
  - **GDPR note:** Essential cookies (auth, session) are `essential` category, analytics requires explicit consent (`modules/authentication.md` lines 100-131, `modules/monitoring.md`)

  - **Stripe Billing Portal** (`requireActivePlan` with `user.stripeCustomerId` check → redirect to Stripe portal (`modules/payments.md` lines 204-226)
  - **Helpers:** `requireUser`, ( `requireAdmin`, `getUser` (`modules/authentication.md` lines 353-391)

  - **Form library:** `@tanstack/react-form` + `@tanstack/zod-form-adapter` — never `react-hook-form` (`modules/authentication.md` line 138)
  - **Form validation:** `zod` (`site-generator-agents/modules/authentication.md`)

  - **i18n:** `react-i18next` (`plugins/multi-language.md`)

  - **Database adapter:** `createPrismaAdapter(prisma)` from `secure-auth-sdk` — **SDK requires specific model names:** `AuthUser`, `AuthSession`, etc. — not the standard `User` model. Schema must to use `passwordHash` directly; use `auth.register()` for `prisma/seed.ts` (`modules/database-schema.md`)

  - **GDPR compliance:** Cookie consent tracking (`modules/gdpr-compliance.md`)

 `Auth` cookie consent logging ( `site-generator-agents/modules/gdpr-compliance.md`)
 
 - **GDPR Data requests:** right to erasure (`DELETE`) portability and `POST /api/data-delete` (`modules/gdpr-compliance.md` lines 45-79,)
  - **GDPR double opt-in:** (`POST /api/cookie-consent`, for analytics/ scripts; Sentry
 `PlausibleAnalytics` and a `loadScriptWithConsent("analytics", ...)` pattern
 `modules/monitoring.md` lines 100-119)
  - **Plausible Analytics:** `plausible.io/js/script.js` via `loadScriptWithConsent("analytics", ...)` - server-side error logging endpoint `~/routes/api/errors/log` (DB error logs via Prisma `ErrorLog`, `PerformanceMetric` models
  - **Web Vitals:** `LCP`, `INP`, `CLS` tracking via `PerformanceObserver` ( consent-gated by `hasConsent("analytics")`)
  - **Log aggregation:** Datadog, Grafana Loki, ELK (`modules/monitoring.md` lines 337-383)
  - **Health check:** `GET /api/health` checks DB + Redis + Prisma connection, `http://127.0.0.1:3000/health` endpoint at `~/routes/health.tsx` (`site-generator-agents/modules/monitoring.md` lines 430-457)
  - **Uptime monitoring:** External monitors like UUptimeRobot, `Better Stack, or `Checkly` pointing `GET /api/health` (`modules/monitoring.md` lines 456-458)
  - **Structured JSON logs:** `JSON.stringify(entry) ...)` via `process.stdout.write` / `process.stderr` (`modules/monitoring.md` lines 376-383)
  - **Environment variables:** `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `PLAUSIBLE_DOMAIN`
  - **Structured logger:** `~/lib/logger.server.ts` writes JSON to `stdout` and `process.stderr` via `JSON.stringify(entry) ...)` via `process.stdout.write` (`modules/monitoring.md` lines 360-382)
  - **nginx JSON logging:** `~/lib/request-context.server.ts` writes JSON to nginx access log in parseable format (`json_combined` - `modules/monitoring.md` lines 388-406)
  - **Process management:** pm2 with cluster mode (production config in `ecosystem.config.cjs`)
  - **Graceful shutdown:** `~/lib/graceful-shutdown.server.ts` (`modules/cicd.md` lines 894-941)
 `modules/monitoring.md` lines 899-941)

 `modules/monitoring.md`)

- **PM2 process manager:** pm2 with cluster mode, max memory restart: `1G`, auto-restart on needed, ensure logs have correct config (`modules/cicd.md` line 220-228)
 `pm2 logs your <app>` (`modules/cicd.md` lines 688-693)
  - **PM2 config:** `ecosystem.config.cjs` — `error_file: "build/server/index.js", entry point: `build/`, `pm2 start build && run test:run through pipeline `build` (`modules/cicd.md` lines 221-228, `pm2 reload ecosystem.config.cjs` (`modules/cicd.md` lines 412-416)  - **Redis caching ( optional, via `REDIS_URL` env var, health checks endpoint attempts Redis connection;  health endpoint uses `~/lib/cache.server.ts` (`modules/cicd.md` lines 728-738,  - **Staging:** Netlify ( PR preview deployments)
 `  - **CI Pipeline:** GitHub Actions (type-check, lint, test, e2e, coverage, security audit)
 deploy to VPS via SSH+ SCP
 pm2 reload via SSH)
  - **CD Pipeline:** GitHub Actions (type-check, lint, e2e, coverage, security audit) deploy to VPS via SSH)  - **Deploy Scripts:**
    - `scripts/setup-vps.sh`, `scripts/db-backup.sh` for `scripts/rollback.sh`
 - **Netlify StSG Preview** via `nwtgck/actions-netlify` action (`modules/cicd.md` lines 450-503)
  - **Workflow Secrets:** `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_URL`, `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_SECRET`, `STRIPE_AUTH_TOKEN`, `SENTRY_AUTH_TOKEN`, `NETLIFY_AUTH_TOKEN` ( `NETLIFY_SITE_ID`
 (`modules/cicd.md` lines 504-543)
  - **Additional GitHub Actions used:**
    - `actions/checkout@v4` — `pnpm/action-setup@v4` with `version: 9`
    - `actions/setup-node@v4` with `node-version: "22"
          cache: "pnpm"
`,    - `appleboy/scp-action@v0.2.0` (`appleboy/scp-action@v1.2.0`, `appleboy/ssh-action@v1.2.0` (`appleboy/scp-action@v0.2.0`, `appleboy/ssh-action@v1.2.0` (`modules/cicd.md` lines 412-416)
  - **nginx config:** `site-generator-agents/modules/cicd.md`
  - **Netlify config:** `netlify.toml` in project root (`modules/cicd.md` lines 696-715)
  - **DNS**:**
    - `https://api.stripe.com` (CSP allow-list)
 `js.stripe.com` and script-src: `script-src 'self' https://js.stripe.com`; style-src 'self' https://fonts.gstatic.com; font-src 'self' data: https://fonts.gstatic.com`)
  - **Rate limiting** configured at `limit_req_zone` directives
 rate limiting zones nginx (`modules/cicd.md`)
  - **Security headers** configured with CSP, HSTS`, `X-Frame-Options`, `DENY;`, `X-Content-type-options` `nosniff" always; `X-XSS-Protection: 0` (deprecated)`, `Referrer-Policy: strict-origin-when-cross-origin` always)
 `strict-transport-security: max-age=31536000`
 always) (modules/cicd.md` lines 80-187)

  - **Brotli/Gzip compression** enabled via `ngx_brotli` module (`modules/cicd.md` lines 107-109)
  - **Deployment target:**
    - **Production:** VPS via GitHub Actions → pm2 → nginx → pm2
SSL
 `   - **Staging:** Netlify (PR preview via `nwtgck/actions-netlify` (`modules/cicd.md` lines 450-503)

  - **Workflow secrets:**
    - `VPS_HOST`, `VPS_USER`, `VVPS_SSH_KEY`
    - `STAGING_DATABASE_URL`: `STAGING_DATABASE_URL`
 (staging secrets)
 `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STR_STRIPE_SECRET`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_URL` (staging URL)  - **NETlify Auth token** `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` (`modules/cicd.md` lines 538-543)
  - **Additional environment variables** (combined from all modules):
  - `DATABASE_URL` — PostgreSQL connection
 `prisma/ORM`
  - **Migration client:** `prisma` CLI
 generated via `npx prisma generate` from applied via `npx prisma migrate dev`)
  - **Connection:** `postgresql://postgres:16-alpine` in `docker-compose.dev.yml` (`database-schema.md` lines 265-268)
  - **Backup/restore:** Bash scripts in `scripts/db-backup.sh` and `scripts/db-restore.sh` (`database-schema.md` lines 565-711)
  - **Soft-delete middleware:** Prisma middleware in `~/lib/prisma-soft-delete.server.ts` (`database-schema.md` lines 437-542)
  - **Schema management:** Models live in `prisma/schema.prisma` with models additions per site type (`site-generator-agents/modules/payments.md`),  - **Authentication models** extend the `AuthUser` model with `stripeCustomerId` and `plan` fields
  - **Schema generation via `prisma migrate` CLI

 (`modules/database-schema.md` lines 343-348)  - **Prisma schema required per `AuthUser` model must follow exact field names from `database-schema.md` —  **All site-type models share these models:**
    - `Corporate` site: `TeamMember`, `Service`, `CaseStudy` models; `Blog` site: `Post`, `Comment`, `Tag` models
 `E-commerce` site: `Product`, `ProductVariant`, `ProductImage`, `Category`, `Cart`, `CartItem`, `Order`, `Payment`, models and `ContactSubmission`, `NewsletterSubscriber`, `NewsletterCampaign`, `Faq` ( `Review`, `Booking` services in `Event`, `EventRegistration` models in `ChatConversation`, `ChatMessage`, `ChatQuickReply` (live chat plugin, `DocumentManager` models for `Document`, `DocumentCategory`, etc.)
  - **Newsletter emails:** newsletter-specific via `sendEmail()` from `~/lib/email.server.ts`
 (`modules/email.md`, `~/plugins/newsletter.md`),  - **Template references:** `contactNotificationTemplate()`, `autoReplyTemplate()`, `welcomeEmailTemplate()` from `~/lib/email-templates.server.ts` (`modules/email.md`), `~/plugins/booking.md`, `bookingConfirmationTemplate`, from `~/plugins/events.md`), `eventRegistrationTemplate` from `~/lib/email-templates.server.ts` (`modules/email.md` →  `~/plugins/newsletter.md`):
    - Event reminder emails via `~/lib/timezone.server.ts` (`modules/email.md` + `~/plugins/booking.md`)
    - `paymentFailed` Stripe webhooks trigger admin notification via `sendEmail()` (modules/payments.md`)
  - **Welcome emails after registration** via `sendEmail()` (`integration-patterns.md`)

  - **AI Estimator ( OpenAI API integration) `site-generator-agents/modules/integration-patterns.md` defines an AI-powered project estimator that uses OpenAI's `gpt-4o-mini` model, a `Zod` for request validation, and and `EstimateRequestSchema` with structured JSON response containing cost range, timeline, phases breakdown, and notes. **Module creates `ProjectEstimate` Prisma model for `~/lib/estimator-rate-limit.server.ts` for `site-generator-agents/modules/integration-patterns.md` lines 1040-1131)
    - **Prisma schema addition:** `ProjectEstimate` model (`site-generator-agents/modules/integration-patterns.md` lines 1486-1516)
    - **Environment variables:** `OPENAI_API_KEY`, `RATE_LIMIT_SALT`

 (`modules/integration-patterns.md`)

    - **Loading rules:** "Load when site type is corporate/agency" — uses OpenAI for cost/time and project estimates (`modules/integration-patterns.md`)

  - **Trigger:** Enterprise segmentation (`site-generator-agents/modules/enterprise-segmentation.md`)
  - **Environment variable:** `ENTERPRISE_SEGMENTATION_KEY` (not currently used in generated sites

 `modules/enterprise-segmentation.md`)

  - **When to add a new site type:**
    - Consider which docs in `site-generator-agents/modules/`:
        `modules/custom-plugins.md` defines the plugin creation format and plugin name, dependencies, version, and compatibility matrix
 - Plugin doc directory: `site-generator-agents/plugins/`
  - Plugin versions follow semantic versioning (MAJOR = breaking change)

 rename model, change route). plugin must be regenerated from a `plugins/README.md`)
    - Plugin conflicts are routes or Navbar slots Navbar menu overflow (6 items) check module and use the dependencies array in module `depends on` other plugins (`plugins/README.md`)

- Each plugin has a version and the header: `**Version:** 1.0,0 `**Last updated:** varies (plugin version in the header

 follow the template
 increment ( minor additions
 `**Breaking change: rename model, change route)`), plugin must be regenerated with new Prisma schema additions, `**Removal of fields not to be deleted `

 plugin must generate new Prisma migration.
 `**compatibility** (`site-generator-agents/plugins/README.md`)
)

- `plugins/faq.md` — FAQ accordion with categories, schema.org FAQPage, blogPost, comments, SEO schema `schema.org/FAQPage`
 ( **Dependencies:** database-schema, seo (` **Complexity:** Low
 **| blog** — Blog with posts, categories, tags, comments, RSS feed (`modules/blog.md`); full blog with complete CRUD, admin management (`modules/authentication.md`);  - **FAQ** — FAQ accordion, categories, **FaqCategoryFilter**, search, client-side FAQ search (` **Gallery** — Gallery with albums, lightbox, lazy loading, optimised images, **Image format support** (WebP preferred). Up to 10MB max)
 (`plugins/gallery.md`); Gallery lightbox, full-screen zoom, swipe navigation, image preview via keyboard gestures
 **File storage:** Local filesystem by default, cloud storage (`S3 via Ssession plan` config` in `netlify.toml`)
 for `plugins/gallery.md`).) or S3 Cloud storage (`document-manager` plugin) is `public/uploads/documents/` directory, `public/uploads/documents/` — S50MB per document, - configurableable via `session plan` (`plugins/document-manager.md`).)
    - S3 Cloud storage: S `S3 via thesession plan` (`plugins/document-manager.md`)

 - Configurable via `plugins/document-manager.md`):
  `storage` key in session plan or config, S provider, credentials:
 `{ AWS_ACCESS_KEY, env var, `OPENAI_API_KEY` }

- `S3 Cloud storage: credentials: store in `.env` (`modules/cicd.md` `.env.example`)

 - **Stripe** — `SUPABASE_URL`, `SUPABASE_ANON_KEY` (`modules/cicd.md`)
)

- **Session management** via feature flags (`pwa`, `live-chat`, `document-manager`, plugins use **SSE ( conjunction with webhook handlers at `/api/chat/stream/$conversationId` + `to `~/routes/api/chat/stream` endpoint` for `~/lib/websocket.server.ts` via `ws` npm package for sidecar process)
  
 - **Real-time pattern via Server-sent Events (SSE with exponential backoff on reconnect (`modules/integration-patterns.md`)
)

- **WebSocket alternative:** SSE for recommended for most sites, SSE sufficient ** — `SSE via server-sent events (Suse be listened in the `Scustom-plugins.md`)
)

- **Document preview:** via `DocumentPreview` component, `DocumentManager` plugin) with inline PDF preview

 in the browser (`plugins/document-manager.md`)
):
- **Content intelligence AI content analysis** via `modules/content-intelligence.md` (`site-generator-agents/modules/content-intelligence.md`) - Content suggestions for research-based on brand voice and differentiate from competitors ( market positioning
 ( **SMart recommendations** and `smart-recommendations` in site copy (`modules/smart-recommendations.md`):
  - Breaks down page-specific pages or **news** subscriber and **Newsletter` pages, **Newsletter subscriber**) - Complete feature layout, (`modules/smart-recommendations.md` lines 374-383)
 `CICD` → **Newsletter** plugin (or i18n docs in `site-generator-agents/plugins/` in `English`, use `newsletter` config for `. See `content-intelligence.md`)
 for strategic category recommendations)

  - `Blog` plugin should show a CTA at bottom of Blog posts) (`plugins/blog.md` and in `BlogPostDetail` component)
 using `NewsletterSignup` embed in footer)
  - `Review` plugin should show review count in `ReviewCarousel` on homepage

  - `FAQ` plugin should show FAQ accordion with categories and footer,  - `Multi-language` plugin shows `LanguageSwitcher` in navbar and all pages use URL prefix path (default language has no no prefix) via `hreflang` tags
 SEO; docs in `sitemap_multilingual s (`plugins/multi-language.md`)

  - **Reviews` plugin shows `ReviewStars`, component, carousel, review summary, aggregate rating schema.org structured data, **Review` admin pages are GDPR-compliant
 Cookie consent banner) in contact form and **ReviewForm` requires `requireAdmin` guard (`modules/reviews.md`)

 - `events` plugin uses timezone-aware date display. All times are UTC. Converted to local time for timezone. `Events` plugin has timezone handling via `utcToLocal`/ `~/lib/timezone.server.ts` (shared with booking and events plugins, `~/lib/timezone.server.ts` (shared with events plugin, `~/lib/timezone.server.ts`)

 - **Admin document pages** use `requireAdmin` guard
 `modules/reviews.md` + `plugins/booking.md`)
    - `live-chat` uses SSE (Server-Sent Events) for real-time with `ws` npm package as sidecar process)  - **Real-time pattern:** SSE + exponential backoff reconnection (`modules/integration-patterns.md`).
  - **Chat admin dashboard:** `~/admin/chat` (`site-generator-agents/plugins/` in `app/routes/admin/chat` (`plugins/live-chat.md`):
- Document preview is lazy-loaded via `~/lib/virus-scan.server.ts` (shared with gallery, document-manager plugins) (`plugins/gallery.md`, `document-manager.md`)
  - **Virus scanning** is mandatory for all file uploads (`modules/custom-plugins.md` → "Virus Scanning per Upload" section) (`plugins/gallery.md`)
  - **Upload security:** MIME whitelist, magic bytes verification, MIME type, blocked executable/script block), and regex patterns, in file extensions: `image/jpeg`, `image/png` `image/webp` `image/gif`, `image/avif` (`plugins/gallery.md`)
  - **File size limit:** 10MB max per file (`plugins/document-manager.md`)
  - **Upload security:** deny list blocks executable/script blocks (`BLOCKED_MIME_TYPES`), `application/x-executable`, `text/html`, etc (`plugins/document-manager.md`)
  - **Cloud storage config:** Configurable via `session plan` as `storage` or `bucket`, and `region` in `netlify.toml`)
  - **AWS/ not used in `site-generator-agents/modules/custom-plugins.md` → `templates/README.md` file `site-generator-agents/templates/` storage` — S3/ Cloud storage (optional). Uses `S3 Azure S`  - **Local filesystem** in `public/uploads/documents/` (protected downloads dir not accessible via auth) - AWS S3 staged via nginx reverse proxy to `public/uploads/documents/` should be used and not a `public/uploads/documents/` (`modules/cicd.md`)

- **Rate limiting:** defined per `RATE_limit` in `site-generator-agents/modules/security.md`, and rate limiting configs from `RATE-limits` in `site-generator-agents/modules/security.md` + rate limiting via nginx
 `security.md`)
    - **Rate limiting for plugins**: API endpoints and contact `RATE-limiting from `checkRateLimit` in `~/lib/rate-limit.server.ts` (`plugins/faq.md`, + `~/plugins/booking.md` + `~/plugins/events.md` + `~/plugins/reviews.md` + `~/plugins/newsletter.md` + `~/plugins/live-chat.md` + `~/plugins/document-manager.md` + `~/plugins/multi-language.md`)
  - **Rate limiting:** 5-10 req/hr, for booking plugin (`RATE_LIMITS.publicForm`),  - 3 reviews/email per month` in reviews plugin (`rateLimit: public form `)
  - 5 reviews from reviews for newsletter plugin (`rateLimit` public form, from FAQ plugin: `NewsletterSignup` component (footer newsletter popup) is be shown, with rate limiting to 5 req/IP/hour` in booking plugin (`rateLimit` public form;)
 - Live-chat real-time conversations use SSE, with exponential backoff reconnection (`modules/integration-patterns.md`)
).
- **WebSocket for live-chat plugin uses the `ws` npm package for sidecar process,  - **Real-time pattern:** SSE + exponential backoff reconnection. Client updates UI in real-time (`modules/integration-patterns.md`)

- **Rate limiting:** max 5 convos per IP per hour, in booking plugin (`rateLimit.public/api/booking`)), max 20 messages per 5 min/IP per IP per hour. in booking plugin (`rateLimit.publicForm`),  - Booking plugin endpoint POST /api/booking` checks slot availability before redirect to `/prenota/conferma` (`modules/booking.md`)
  - **Live-chat endpoint** (`/api/chat/stream/$conversationId`) + `GET /api/chat/conversations/$id` for real-time via SSE + exponential backoff reconnection. Provides typing indicator via `hasConsent("analytics")`) while `loadScriptWithConsent("analytics", callback `_initSentry()`) for booking mode,use `EventSource` for root.tsx (`plugins/live-chat.md`)
  - **Operator messages** need to be detected via browser `Notification`, sound, and typing indicator) (`modules/integration-patterns.md`)
  - **PRuning** via Prisma `$transaction` with atomic check and (`modules/integration-patterns.md`)
  - **Prisma transaction:** wrap `Booking creation` and `Overbooking prevention` (`modules/booking.md`)

- **Seed data:** See per-plugin for defines template seed values. including contact details, project type and `/pricing` page)

 booking route overrides `/admin/booking` route in `ec2Commerce` and corporate site type labels in `pricing` page (`/pricing` page on both tabs show "Cart" or "Buy now" button), and as applicable) for product pages, matching `product name`, `unitPriceCents`)
  - **Button label:** on `pricing` page shows currency formatted with `Intl.NumberFormat` for `€` format, but with discount applied ` - €` format from `€` format. `items.map` (item) => `€${item.price.toLocaleString("it-IT")} % (item.name}` }

 `€${item.quantity}` × ` = Stock: `₣` items.map` (item) => `€${item.price.toLocaleString("it-IT")}`)

 { amount: i.price.toLocaleString("it-IT")}))))

- **Amount** i price | `total` amount per unit)
 `items` reduce`(
  item) => `item.price.toLocaleString("it-IT")}`
) | `totalAmount` in `€`: `discount code` in cart))

 `Shipping` info ( `€${cart.map((item: any) => ({ brand: siteName })(`.${item.name}`)}))
  **item:** [`Product`]
 `Product` model at `prisma/schema.prisma` files: these fields `↓ the make sure** if they exist, (`site-generator-agents/modules/database-schema.md`)
)

  - **`Product` model is the `modules/payments.md`):
  - **Stripe integration file** (`site-generator-agents/modules/payments.md`)
- **Recurring Stripe integration** (`site-generator-agents/modules/integration-patterns.md` for `Email` + Stripe webhooks.  - **PWA support in module definitions the `manifest.webmanifest` file, `workbox` for a `workbox` for `service worker caching). app icons, `manifest.webmanifest` ( metadata, `pwa` metadata, `theme-color`,/ P `<meta>`)
  - **SEO Module defines meta tags and pages (`sitemap.xml`, `robots.txt`  `manifest-sitemap.xml` (`modules/pwa.md`)
  - **Security module adds security headers, rate limiting zones, CSP/ HSTS, `X-Frame-Options` `DENY`, always in API routes), `X-Content-Type-options` `nosniff` always) `X-XSS-Protection` set to 0` (deprecated) (`referrer-Policy` strict-origin-when-cross-origin` always) `strict-transport-security` max-age=31536000; always (`modules/security.md`)
- **Redis** — optional caching layer. `REDIS_URL` env var configured in `docker-compose.dev.yml` (`docker-compose.dev.yml` in generated by `database-schema.md`)
- **Connection:** `DATABASE_URL`
 env var
prisma/client` environment: `DATABASE_URL` env var loaded via `~/lib/prisma.server.ts`)
- **Session management:** Secure-auth-sdk session `Auth` cookie-based session tracking)
 "essential" cookie is separate from `AuthUser` model)
- **Database backup/restore:**
    - Scripts in `scripts/db-backup.sh`, (`scripts/db-restore.sh`) and `scripts/db-backup.sh`, `scripts/db-restore.sh` (`database-schema.md`)
- **Scheduled backups:** Daily at 3:00 AM via cron job on VPS ( `scripts/db-backup.sh production` runs in CI/CD pre-deploy step in `deploy-production.yml`)
  - **Backup retention:** 30 days ( configurable via `RETENTION_DAYS` in `db-backup.sh`)

- **Connection pool:** Prisma default connection pool size is defined by `DATABASE_URL` (default: `url` parameter on `prisma/client`)

- **Prisma soft-delete middleware:** Configured in `~/lib/prisma-soft-delete.server.ts`, automatically soft-deletes by turning into `update` with `deletedAt` and `deletedBy` fields set to null. when explicitly querying deleted records via `deletedAt: null` (`database-schema.md`)
- **Feature flags:** `FeatureFlag` model in DB enables dynamic module togg (`modules/integration-patterns.md`)
    ```typescript
    export async function isEnabled(flag: FeatureFlag): Promise<boolean> {
      const envKey = `FEATURE_${flag.toUpperCase().replace(/-/g, "_")}`;
      if (process.env[envKey] !== undefined) return process.env[envKey] === "true";
    
      const dbFlag = await prisma.featureFlag.findUnique({ where: { name: flag } });
      if (dbFlag) return dbFlag.enabled;
    
      return DEFAULTS[flag] ?? false;
    }
    ```

    ```prisma
    model FeatureFlag {
      id      String  @id @default(cuid())
      name    String  @unique
      enabled Boolean @default(false)
    }
    ```

  (`modules/integration-patterns.md` lines 641-681)

- **Email + Stripe webhook patterns:** `checkout.session.completed` webhook triggers order confirmation email to admin (`modules/email.md` + `~/lib/email.server.ts` + `~/lib/email-templates.server.ts`). Email sending is best-eff — never block the transaction (`modules/integration-patterns.md`)
- **Email + Auth webhook pattern:** Registration email is sent after `auth.register()` via `sendEmail()` from `~/lib/email.server.ts` + `welcomeEmailTemplate` from `~/lib/email-templates.server.ts` (`modules/integration-patterns.md` lines 979-1003)
- **Stripe dispute webhook** in `modules/payments.md` triggers email on `charge.refunded` (`modules/integration-patterns.md` lines 423-471 and `modules/payments.md` lines 856-885)
- **Security:** 
    - **Rate limiting:** nginx `limit_req_zone` for API and general rate limiting; application-level via `~/lib/rate-limit.server` (`modules/security.md`)
    - **Security headers:** nginx sets CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection (deprecated, set to 00)
    - **GDPR cookie consent:** cookie consent banner gates analytics scripts (`modules/gdpr-compliance.md`)
    - **GDPR data export/deerasure:** right API routes for GDPR data requests handling (`modules/gdpr-compliance.md`)
    - **Input validation:** Zod for all form submissions (`modules/security.md` referenced across multiple modules)
    - **Virus scanning:** `~/lib/virus-scan.server` for file uploads (`modules/custom-plugins.md`)
    - **Auth protection:** `requireAdmin` and `requireUser` guards for all admin routes (`modules/authentication.md`)
    - **GDPR data deletion:** cascading Prisma `$transaction` to delete all user data on account deletion (`modules/gdpr-compliance.md` + `modules/integration-patterns.md`)

- **Search:** 
    - **SEO meta tags:** OpenGraph, canonical, structured data (schema.org) (`modules/seo.md`)
    - **Sitemap generation:** Dynamic sitemap.xml generation (`modules/seo.md`)
    - **Blog search:** Client-side full-text search in `BlogSearch.tsx` (`plugins/blog.md`)
    - **FAQ search:** Client-side search in `FaqSearch.tsx` (`plugins/faq.md`)
    - **Document search:** Search by title/description in document manager (`plugins/document-manager.md`)
    - **SEO in plugins:** Each plugin contributes schema.org structured data (FAQPage, BlogPosting, AggregateRating, Event, Product)

- **Storage:** 
    - **Local filesystem:** `public/uploads/documents/` for document uploads (`plugins/document-manager.md`)
    - **Local filesystem:** `public/uploads/gallery/` for gallery images (`plugins/gallery.md`)
    - **Cloud storage (optional):** S3 or Cloudflare R2 configurable via session plan (`plugins/gallery.md`, `plugins/document-manager.md`)
    - **Docker volumes:** `postgres_data` named volume for PostgreSQL persistence (`database-schema.md`)

- **GDPR compliance:** 
    - **Cookie consent:** CookieBanner component with granular consent controls (essential, analytics, marketing) (`modules/gdpr-compliance.md`)
    - **Consent logging:** `ConsentLog` Prisma model with session tracking (`modules/gdpr-compliance.md`)
    - **Data export:** GDPR Article 20 — JSON export of user data (`modules/gdpr-compliance.md`)
    - **Data deletion:** GDPR Article 17 — right to erasure with cascading delete (`modules/gdpr-compliance.md`)
    - **Double opt-in:** Newsletter plugin requires email confirmation before subscription (`plugins/newsletter.md`)
    - **Consent-gated analytics:** Sentry and Plausible only load after `loadScriptWithConsent("analytics", ...)` (`modules/monitoring.md`)
    - **Legal pages:** Privacy policy, cookie policy, terms of service (`modules/gdpr-compliance.md`)
    - **IP hashing:** Rate limiting uses SHA-256 hashed IPs for `~/lib/estimator-rate-limit.server.ts` (`modules/integration-patterns.md`)

- **Testing:** 
    - **Unit tests:** Vitest (`site-generator-agents/modules/testing.md`)
    - **E2E tests:** Playwright (`site-generator-agents/modules/testing.md`)
    - **Coverage:** Vitest coverage + Codecov upload (`modules/testing.md`)
    - **A11y testing:** axe-core or Pa11y CI (`modules/testing.md`)
    - **Visual regression:** (Not detected)

- **Content delivery:** 
    - **Static assets:** nginx serves `public/` and `build/client/assets/` with 1-year cache, immutable headers (`modules/cicd.md`)
    - **Image optimization:** Automatic resize to thumbnail (300×300), medium (800px), full (original) + WebP preferred (`plugins/gallery.md`)
    - **Lazy loading:** All gallery images use `loading="lazy" decoding="async"` (`plugins/gallery.md`)

---

*Integration audit: 2026-04-02*
