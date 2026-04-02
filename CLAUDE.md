<!-- GSD:project-start source:PROJECT.md -->
## Project

**Calzoleria Prevenzano**

E-commerce artigianale per Calzoleria Prevenzano, storica calzoleria napoletana fondata nel 1984. Il sito vende sandali personalizzabili fatti a mano, prodotti in pelletteria (borselli, cinture, agende, accessori), articoli per calzature (solette), e verrà espanso con nuovi prodotti in pelle e accessori. I clienti possono personalizzare i sandali scegliendo tacco, tipo e colore di pelle, e gioielli/elementi decorativi.

Il sito è rivolto a clienti che apprezzano l'artigianato italiano di qualità, con spedizione in tutta Italia e all'estero.

**Core Value:** I clienti possono sfogliare, personalizzare e acquistare sandali artigianali italiani e prodotti in pelletteria di qualità, con un'esperienza di acquisto fluida che rispecchia l'eccellenza artigianale del brand.

### Constraints

- **Tech Stack**: TypeScript + React (TanStack Start), Prisma 7 ORM, shadcn/ui, Better Auth — definito dal progetto monorepo
- **Lingua**: Italiano come lingua primaria
- **Brand**: Mantenere l'identità visiva artigianale di Calzoleria Prevenzano
- **Contenuti**: Tutti i contenuti e prodotti del sito esistente devono essere presenti nel nuovo sito
- **Dominio**: calzoleriaprevenzano.it
- **GDPR**: Compliance con normativa italiana/europea
- **Pagamenti**: Stripe per pagamenti online
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## STACK.md
## Languages
- TypeScript 5.x — `ES2022` — `ESNext`, `Bundler` resolution — target `ES2022` — `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCases`
- **React 19** - Latest React with Suspense and React Router 7 SSR mode
- **React Router v7** uses `@react-router/fs-routes` for file-based routing with loaders/action pattern (Remix-style)
- **React Router 7** (TanStack Router uses `createFileRoute() for TanStack Router for file-based routing convention + `.` as filename, not dot-separated by `.`)
- **JSON:** in template file convention `app/routes/` in TanStack Start (`__root.tsx` -> `app/routes/__root.tsx`)
- **File-based routing**: TanStack Start uses `@tanstack/router-plugin/vite` Vite plugin (auto-generates `routeTree.gen.ts`)
- **TanStack Query** (`@tanstack/react-query`) - Server-side data fetching and caching
- **TanStack Form** (`@tanstack/react-form`) with `@tanstack/zod-form-adapter` + `zod` - declarative forms handling
- `Radix UI` primitives via `@radix-ui/react` for accessible components (e.g., Accordion, Tabs, dialogs, select)
- **React Icons:**
- **CSS/styling approach ( Use CSS custom properties (design tokens + Tailwind utility classes. `shadcn/ui` provides `button`, input, card, label, textarea, checkbox, select, dialog, sheet, navigation components, etc.)
- **Form Handling:** `@tanstack/react-form` with `@tanstack/zod-form-adapter` + `zod` - server-side validation. forms use `Form` from React Router 7 and `useFetcher` for TanStack Start. `createServerFn`
- **Auth:** `secure-auth-sdk` ( GitHub-hosted private auth SDK providing `AuthUser`/`AuthSession`/`AuthAuditLog`, `AuthOAuthAccount`, `AuthBackupCode`, `AuthEmailToken`, `AuthLockout` models management + session tracking, login, registration, password reset, email verification, TOTP 2FA/MFA via TOTP secret + backup codes)
- **TypeScript: true, enabled with `strict: true`
- **Email:** Resend (primary via `nodemailer` (SMTP) or Resend HTTP API or or Gmail, Mailgun, etc. - **HTML Emails:** Premium table-based HTML email templates using Resolved design tokens from the site's design system
- **Monitoring:** Sentry (with `@sentry/react-router` SDK) for error tracking and Plausible Analytics (privacy-first analytics via `PlausibleAnalytics` component)
- **Health checks:** at `/api/health` endpoint
- **Production**: Redis via `ioredis` npm package)
- **Web Vitals tracking** in `WebVitals` component
- **Security module** uses `secure-auth-sdk` with OWASP 2025 security guidelines, Argon2id hashing, session management, rate limiting, CSRF protection, server-side validation, `react i18next` for `react-i18next` ( JSON-based translations dictionaries), route aliases `~/` → `./app/*`)
- **i18n config file:** `public/locales/[lang]/` with namespace-based files structure)
- **Directory:** `site-generator-agents/modules/i18n.md` (`modules/integration-patterns.md`)
- **Animation Module** (`modules/animations.md`):
- **Performance Module** (`modules/performance.md`) - route-based code splitting, lazy loading, image optimization
- **GDPR compliance module** (`modules/gdpr-compliance.md` - cookie consent, data protection, GDPR rights cookie consent management)
- **Security module** (`modules/security.md`) with OWASP 2025 hardening, CSP headers, rate limiting, session lockout, CSRF protection, CSRF, guard in `secure-auth-sdk` middleware
- **CI/CD module** (`modules/cicd.md`) - GitHub Actions CI/CD workflows, nginx + pm2 deployment, Netlify for staging
- **Package:** installed via `npx github:Mischio95/site-generator-agent-docs` (GitHub-hosted private package)
- Each agent saves its `site-output/` directory with artifacts including Markdown (JSON, etc.)
- **Generated template files:** The `site-generator-agents/templates/` (React Router 7, TanStack) and shared subdirectory ` `templates/tanstack/` and `templates/react-router7/` and `templates/shared/` - `templates/shared/lib/` ( `lib/api-response.ts.template` and `lib/rate-limit.server.ts.template` ( `lib/rate-limit.redis.server.ts.template` - `lib/i18n.ts.template` in `lib/auth-guard.server.ts.template` in `lib/animation-variants.ts.template`, in `components/ErrorBoundary.tsx.template`, `components/CookieBanner.tsx.template`, `components/Cart.tsx.template`, `components/providers/SmoothScrollProvider.tsx.template`)
- **Plugin definition files** in `site-generator-agents/plugins/` directory (each `.md` file defines plugin capabilities, dependencies, and Prisma models additionsitions routes to the generated site)
- Plugin defined `site-generator-agents/plugins/` directory extend specific generated sites
- **Plugin system:** Plugin definitions are `site-generator-agents/plugins/README.md`, dependency management via semver versioning `ownership-matrix.json` and `site-generator-agents/governance/`
- **Contracts/ Protocols docs** in `site-generator-agents/contracts/` and `site-generator-agents/protocols/`
- **Agent definitions** in `.github/agents/` directory (19 per project root)
- **`site-generator-agents/templates/` - Template files for `.template` format for TanStack and React Router 7 variants
- **`docs/` - Documentation references files in `site-generator-agents/docs/`
- **Installation** via `npx github:Mischio95/site-generator-agent-docs agents` CLI
- **Runtime:** Node.js via Vinxi (TanStack Start) or React Router 7 via `react-router dev` in development mode) - **Runtime:** Node.js 22 LTS
- **Linter:** Biome (`@biomejs/biome`)
- **Formatter:** Biome (2-space indent, double quotes `"double"`, semicolons `always`)
- **Package Manager:** pnpm 9
- **CSS:** Tailwind CSS v4 (`@import "tailwindcss"`) with CSS custom properties design tokens
- **CSS Framework:** shadcn/ui (Radix UI-based components via `@/components/ui/`)
- **Database:** PostgreSQL 16 via Prisma ORM 7
- **Auth:** Custom `secure-auth-sdk` (GitHub-hosted) Argon2id hashing, session management, TOTP 2FA/MFA, OAuth, magic Link, CSRF protection, `secure-auth-sdk` with Argon2id, OWASP 2025 security guidelines, HSTS, CSP headers via Hono middleware
- **Analytics:** Plausible (privacy-first, consent-gated via GDPR module's GDPR cookie consent management`)
- **GDPR Compliance:** Cookie consent, data protection, GDPR documentation, `CookieBanner` component, `data export`/erasure ( GDPR right to be forgotten (`modules/gdpr-compliance.md`)
- **PWA:** Progressive Web App support manifest ( `manifest.json`, service worker, service worker (`workbox` manifest)
- **PWA module** `modules/pwa.md`
- **SEO module** `modules/seo.md`
- **Design system documentation** in `docs/ui-ux.md`, `site-generator-agents/docs/ui-ux.md`
- **shadcn strategy** in `modules/shadcn-strategy.md` ( various agent system docs ( GUIDE.md and REFACTORING-GUIDE.md`)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Project Nature
## Naming Conventions
### Agent Definition Files
- **Pattern:** `kebab-case.agent.md`
- **Location:** `.github/agents/` (project root) and `site-generator-agents/.github/agents/` (source)
- **Examples:** `test-writer.agent.md`, `codegen-foundation.agent.md`, `quality-check.agent.md`
- **Frontmatter:** YAML frontmatter with `name` and `description` fields:
### Module Files
- **Pattern:** `kebab-case.md`
- **Location:** `site-generator-agents/modules/`
- **Examples:** `testing.md`, `enterprise-segmentation.md`, `design-system.md`
- **Header convention:** Title with emoji prefix + module description block:
### Protocol Files
- **Pattern:** `kebab-case.md`
- **Location:** `site-generator-agents/protocols/`
- **Header convention:** Title + version + last updated + owner + executor:
- **Version:** 1.6
- **Last updated:** 2026-03-21
- Owner: `protocols/final-audit-checklist.md`
- Esecutore: `audit.agent.md`, `quality-check.agent.md`
### Contract Files
- **Pattern:** `kebab-case.md`
- **Location:** `site-generator-agents/contracts/`
- **Header convention:** Title + version + last updated + owner + consumers:
- **Version:** 1.1
- **Last updated:** 2026-03-16
- Owner: `dispatcher.agent.md`
- Consumatori: tutti gli agenti successivi
### Test Scenario Files
- **Pattern:** `kebab-case.json`
- **Location:** `site-generator-agents/test-scenarios/`
- **JSON structure fields:** `id`, `name`, `description`, `difficulty`, `prompt`, `expectedSiteType`, `expectedModules`, `expectedLanguages`, `validationFocus`, `knownEdgeCases`
### Plugin Files
- **Pattern:** `kebab-case.md`
- **Location:** `site-generator-agents/plugins/`
- **Examples:** `reviews.md`, `booking.md`, `multi-language.md`, `gallery.md`
## Generated Code Conventions (Applied to Output Projects)
### File Naming — Enterprise Segmentation
| Artifact | Convention | Example |
|----------|-----------|---------|
| React components | PascalCase `.tsx` | `HeroSection.tsx`, `CartItem.tsx` |
| Custom hooks | camelCase with `use` prefix | `useCart.ts`, `useAuth.ts` |
| Utility functions | camelCase | `formatCurrency.ts`, `cn.ts` |
| API routes | kebab-case | `routes/api/products.ts`, `routes/api/order-items.ts` |
| Zod schemas | camelCase + `Schema` suffix | `createProductSchema`, `loginSchema` |
| Types/Interfaces | PascalCase | `Product`, `OrderItem`, `ApiResponse<T>` |
| Constants | UPPER_SNAKE_CASE | `MAX_CART_ITEMS`, `DEFAULT_LOCALE` |
| Server services | kebab-case + `.server.ts` | `email.server.ts`, `sdk-auth.server.ts` |
| Env variables | UPPER_SNAKE_CASE with module prefix | `AUTH_SECRET`, `STRIPE_SECRET_KEY`, `DATABASE_URL` |
### Test File Naming (from `test-writer.agent.md`)
| Type | Path | Suffix |
|------|------|--------|
| Unit component | `tests/unit/components/[dir]/[Name].test.tsx` | `.test.tsx` |
| Unit hook | `tests/unit/hooks/[name].test.ts` | `.test.ts` |
| Unit validator | `tests/unit/validators/[name].test.ts` | `.test.ts` |
| Unit service | `tests/unit/services/[name].server.test.ts` | `.server.test.ts` |
| Integration | `tests/integration/[category]/[name].test.ts` | `.test.ts` |
| E2E | `tests/e2e/[flow].spec.ts` | `.spec.ts` |
| Security | `tests/security/[category].spec.ts` | `.spec.ts` |
| Accessibility | `tests/a11y/[name].spec.ts` | `.spec.ts` |
| Performance | `tests/performance/[name].spec.ts` | `.spec.ts` |
| Snapshot | `tests/unit/components/[Name].snapshot.test.tsx` | `.snapshot.test.tsx` |
## TypeScript Conventions
### Zero `any` Policy (Non-Negotiable)
- **MAI `any` come tipo esplicito** — use `unknown`, generics, or specific types
- **MAI `as any`** — use type guards, assertion functions, or `satisfies`
- **MAI `Record<string, any>`** — use `Record<string, unknown>` or specific type
- **MAI callback non tipati** — `(data: any) => void` → `(data: SomeType) => void`
- **Catch error** — `catch (e: unknown)` + `instanceof Error` narrowing, never `catch (e: any)`
- **`noImplicitAny: true`** mandatory in `tsconfig.json` (via `strict: true`)
### Type System Usage
- Use `satisfies` operator for validation without widening
- Use `as const` for literal type preservation
- Use `const` type parameters (TS 5.0+) for generic functions
- Use discriminated unions for state machines
- Use `unknown` with type guards instead of `any`
- Use `NoInfer<T>` (TS 5.4+) to prevent unwanted widening
- Prefer `interface` for object shapes, `type` for unions/intersections
### Zod Validation
- All Zod schemas live in `lib/validators/` (never inline in routes)
- Shared between client and server
- Every API action must import validators from `lib/validators/`
## Import Conventions
### Import Alias
### Import Boundaries (Enforced)
| From | Can import | Cannot import |
|------|-----------|---------------|
| `components/sections/` | `ui/`, `hooks/`, `utils/`, `types/`, `constants/`, `validators/`, `providers/` | `routes/`, `*.server.ts`, `prisma/` |
| `components/ui/` | `utils/`, `types/`, `constants/` | `sections/`, `routes/`, `*.server.ts` |
| `components/features/` | `ui/`, `hooks/`, `utils/`, `types/`, `validators/` | `routes/`, `*.server.ts` directly |
| `routes/api/` | `*.server.ts`, `validators/`, `types/`, `constants/` | `components/` (no UI import) |
| `routes/[pages]/` | `components/**`, `hooks/`, `utils/`, `types/` | `*.server.ts` (only via loader/action) |
| `lib/hooks/` | `utils/`, `types/`, `constants/`, `stores/` | `components/`, `routes/`, `*.server.ts` |
| `lib/*.server.ts` | `db.server.ts`, `types/`, `validators/`, `constants/` | `components/`, `hooks/` |
## Component Patterns
### shadcn/ui Component Strategy
- **NEVER raw HTML form elements** — always use shadcn equivalents:
### Form Library
- **ALWAYS** use `@tanstack/react-form` with `@tanstack/zod-form-adapter`
- **NEVER** use `react-hook-form` or `@hookform/resolvers/zod`
- Custom error messages required (no browser defaults):
### Component Size Limits
- **Max 200 LOC** per component — if exceeded, split into sub-components or custom hook
- **Max 150 LOC** per API route — if exceeded, extract business logic to service layer
- **Max 100 LOC** per hook — if exceeded, split into composite hooks
### Barrel Exports
## CSS/Styling Conventions
### Design Token System
- **NEVER hardcode hex values** in components — always reference CSS custom properties
- Design tokens defined in `app/styles/design-tokens.css`
- Imported in `app/styles/app.css` after Tailwind import:
### Tailwind Configuration
- Tailwind v4: use `@theme` overrides in CSS
- Tailwind v3: use `tailwind.config.ts` with `satisfies Config`
- Color tokens mapped to semantic roles: `--background`, `--foreground`, `--primary`, `--muted`, etc.
- Dark mode via `.dark` class on `<html>` element
### Spacing Conventions
- Use varied vertical rhythm: `py-16`, `py-24`, `py-32`, `py-40` — never same padding on all sections
- Design tokens for layout: `--page-max-width`, `--page-padding-x`, `--section-gap`
### DNA Fingerprint
## Directory Structure Convention (Generated Projects)
## Server/Client Boundary
- Files with `.server.ts` suffix — **never imported** from client code
- Files with `.client.ts` suffix — **never imported** from server code
- Zod validation in `lib/validators/` — shared (importable from both)
- Types in `lib/types/` — shared
## Error Handling Conventions
- No generic `try/catch` with `console.log(error)`
- Every catch must: (1) log with context, (2) return typed response, (3) not expose stack trace
- Error architecture:
## Markdown Documentation Patterns
### Agent Definitions
### Language Convention
- Agent internal instructions: **Italian**
- Code, technical identifiers, variable names: **English**
- Agent descriptions and user-facing messages: **Italian**
- Comments in generated code: **Italian**
### Canonical Governance
- `**Version:**` header for version tracking
- `**Last updated:**` date
- **Owner:** path to responsible agent/file
- **Consumatori/Esecutori:** list of consuming files
- **Regola Canonica** section stating precedence
- **Update Rule** section listing files to co-update
## Contract and Protocol Conventions
### Contract Shape (JSON Schema for session-plan.json)
### Invariants (Enforced)
- If `region` is EU/Italy → `modules.gdpr` must be `true`
- If `modules.auth === true` → `modules.security` must be `true`
- If `siteType === "ecommerce"` → `modules.payments` must be `true`
- If `siteType === "blog"` or `"ecommerce"` → `modules.seo` must be `true`
### Precedence Order
## Security Conventions
### Authentication
- **ALWAYS** use `secure-auth-sdk` — never manual JWT/bcrypt
- Auth adapter in `app/lib/sdk-auth.server.ts`
- Session cookies via SDK — no custom JWT
- Protected routes use guard/middleware
### OWASP 2025 Coverage
- All 10 categories (A01-A10) must be explicitly verified
- Categories covered by `secure-auth-sdk` still need real wiring validation
- Security headers mandatory: `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Referrer-Policy`
## Metrics Convention
## Handoff Convention
- `site-output/handoff.md` is **overwritten entirely** by each agent (never appended)
- Must contain **exactly one** `# Prossimo step:` block after overwrite
- `site-output/handoff-ledger.md` is **append-only** — never overwritten
- Ledger entry format:
## [agent-name] → next-agent | [ISO 8601 timestamp]
- Artefatti prodotti: [list]
- Status: COMPLETE | PARTIAL | FAIL
## Git Commit Conventions
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Sequential pipeline with 9 phases, each handled by a specialized agent
- Artifact-based handoff: agents communicate via files on disk, not via API calls or shared memory
- Dual execution modes: single-chat pipeline (`pipeline.agent.md`) or multi-chat sequential invocation
- Contract-driven design: canonical file schemas govern inter-agent data exchange
- Plugin architecture for extensible site features
- Dual frontend framework support (React Router 7 and TanStack Router)
## Layers
### Agent Orchestration Layer
- Purpose: Dispatch user requests, orchestrate pipeline phases, manage handoffs
- Location: `.github/agents/dispatcher.agent.md`, `.github/agents/pipeline.agent.md`
- Contains: Dispatcher logic, pipeline state machine, partial re-run protocol
- Depends on: Session plan contract, module loading decision tree
- Used by: End user (via GitHub Copilot chat)
### Research & Discovery Layer
- Purpose: Analyze 20-30 competitor websites, produce structured blueprint and copy bank
- Location: `.github/agents/research.agent.md`
- Contains: Deep research protocol, competitor analysis, section frequency analysis, copy evidence matrix
- Depends on: `site-output/session-plan.json`, `modules/research-agent.md`, `protocols/research-gate.md`
- Used by: Design agent, codegen agents, audit agent
### Design Direction Layer
- Purpose: Transform research data into locked creative direction (fonts, colors, layout, animation)
- Location: `.github/agents/design.agent.md`
- Contains: Anti-AI audit, aesthetic selection, DNA Fingerprint (Shape/Motion/Rhythm)
- Depends on: Blueprint, `docs/ui-ux.md`, `modules/design-system.md`, `modules/animations.md`
- Used by: Codegen-foundation, codegen-pages, audit, features-redesign
### Data Layer
- Purpose: Generate Prisma schema, seed data, Docker setup for PostgreSQL
- Location: `.github/agents/schema.agent.md`
- Contains: Schema models per siteType, `secure-auth-sdk` models, plugin models, seed with realistic Italian data
- Depends on: `modules/database-schema.md`, session plan modules/plugins
- Used by: Codegen agents, compliance agent
### Codegen Layer (3 sub-agents)
- Purpose: Generate all frontend and backend code
- Location: `.github/agents/codegen-foundation.agent.md`, `.github/agents/codegen-pages.agent.md`, `.github/agents/codegen-api.agent.md`
- Contains: Foundation (design tokens, root layout, routing, shared components), Pages (section components, homepage, i18n), API (CRUD routes, auth guards, Zod validation)
- Depends on: Design direction, blueprint, copy bank, framework module, enterprise-segmentation module
- Used by: Audit agent
### Compliance Layer
- Purpose: Implement auth (secure-auth-sdk), GDPR, Stripe payments, security headers
- Location: `.github/agents/compliance.agent.md`
- Contains: Auth adapter, cookie consent, legal pages, Stripe webhook, rate limiting
- Depends on: `modules/authentication.md`, `modules/gdpr-compliance.md`, `modules/payments.md`, `modules/security.md`
- Used by: Codegen-api (for auth guards), audit
### Audit & Quality Layer
- Purpose: Final validation, anti-AI smell test, build verification
- Location: `.github/agents/audit.agent.md`
- Contains: 16-category checklist (5.0–5.15), OWASP 2025, TypeScript zero-any, build gates
- Depends on: All prior artifacts, `protocols/final-audit-checklist.md`, `protocols/anti-ai-audit.md`
- Used by: End user (final gate before deployment)
### Post-Pipeline Agents (Optional)
- Purpose: Feature addition, refactoring, debugging, quality analysis, testing
- Location: `.github/agents/features-deepscan.agent.md`, `.github/agents/features-coding.agent.md`, `.github/agents/features-redesign.agent.md`, `.github/agents/deep-debug.agent.md`, `.github/agents/quality-check.agent.md`, `.github/agents/test-writer.agent.md`, `.github/agents/test-runner.agent.md`, `.github/agents/refactoring-deepsearch.agent.md`, `.github/agents/refactoring-code.agent.md`
- Contains: Implementation Map, regression guards, flow tracing, test generation
- Depends on: `site-output/implementation-map.json`, session plan, enterprise-segmentation module
- Used by: End user (on-demand post-generation)
## Data Flow
### Main Pipeline Flow
```
```
### State Management
## Key Abstractions
### Session Plan
- Purpose: Central configuration artifact for the entire pipeline
- Examples: `site-output/session-plan.json`
- Pattern: JSON contract with canonical shape defined in `contracts/session-plan.md`
- Fields: `slug`, `siteType`, `framework`, `modules`, `plugins`, `animationTier`, `features`, `compliance`, etc.
### DNA Fingerprint
- Purpose: Unique visual identity per project (Shape + Motion + Rhythm)
- Examples: `site-output/design-direction.md` → DNA Fingerprint section
- Pattern: Three-axis design token set that makes each generated site visually distinct
### Module
- Purpose: Encapsulated capability area loaded conditionally based on siteType/feature flags
- Examples: `modules/authentication.md`, `modules/payments.md`, `modules/seo.md`
- Pattern: Self-contained markdown with rules, code patterns, and dependencies
### Plugin
- Purpose: Extensible feature package (blog, booking, gallery, etc.)
- Examples: `plugins/blog.md`, `plugins/booking.md`
- Pattern: Standardized markdown with `requiresModels`, `requiresAuth`, `dependsOn` declarations
### Contract
- Purpose: Canonical schema for inter-agent artifacts, resolving conflicts between inline examples and agent instructions
- Examples: `contracts/session-plan.md`, `contracts/research-artifacts.md`, `contracts/design-direction.md`
- Pattern: Versioned document with Required Shape, Field Rules, Invariants, Consumer Expectations, Update Rules
## Entry Points
### Pipeline Agent (Primary)
- Location: `.github/agents/pipeline.agent.md`
- Triggers: User selects `pipeline` mode in GitHub Copilot Chat and writes a site description
- Responsibilities: Executes all 9 phases sequentially in a single chat (with context split recommendations)
### Individual Agents (Multi-Chat)
- Location: `.github/agents/*.agent.md`
- Triggers: User selects specific agent mode (e.g., `research`, `design`) and writes "procedi"
- Responsibilities: Execute one phase, write artifacts, write handoff for next agent
### Post-Pipeline Agents
- Location: `.github/agents/features-*.agent.md`, `.github/agents/deep-debug.agent.md`, etc.
- Triggers: User invokes agent after site is generated (e.g., "@features-deepscan mappa")
- Responsibilities: Feature addition, debugging, quality analysis, testing, redesign
## Error Handling
- **Research Gate:** Quality gate in `protocols/research-gate.md` — if gate is FAIL, research must complete missing sections before handoff
- **Audit Gate:** Audit agent fixes issues immediately and re-validates. Build must pass (`pnpm typecheck`, `pnpm lint`, `pnpm build`)
- **Context Split:** Pipeline suggests splitting chat after research (heavy output) and optionally after codegen-pages to prevent context window exhaustion
- **Recovery Protocol:** All stateful agents support recovery via progress/state JSON files on disk. Agents never rely on chat history for data between phases.
## Cross-Cutting Concerns
## Template System Architecture
### Dual Framework Support
- Routes: `routes/_index.tsx.template`, `routes/$lang/_layout.tsx.template`, `routes/$lang/_index.tsx.template`
- Auth: `routes/auth/login.tsx.template`, `routes/auth/register.tsx.template`
- API: `routes/api/products.ts.template`, `routes/api/webhooks/stripe.ts.template`
- Components: `components/CookieBanner.tsx.template`, `components/Cart.tsx.template`
- Lib: `lib/api-response.ts.template`
- Routes: `routes/__root.tsx.template`, `routes/index.tsx.template`
- Auth: `routes/auth/login.tsx.template`, `routes/auth/register.tsx.template`
- API: `routes/api/products.ts.template`, `routes/api/webhooks/stripe.ts.template`
- Components: `components/CookieBanner.tsx.template`, `components/Cart.tsx.template`
- Lib: `lib/api-response.ts.template`
- Components: `components/ErrorBoundary.tsx.template`
- Lib: `lib/i18n.ts.template`, `lib/rate-limit.server.ts.template`, `lib/rate-limit.redis.server.ts.template`, `lib/auth-guard.server.ts.template`, `lib/animation-variants.ts.template`
- Providers: `providers/SmoothScrollProvider.tsx.template`
### Template Usage Pattern
## Plugin Architecture
### Plugin Lifecycle
### Available Plugins
## Design System Patterns
### Token System
### DNA Fingerprint
### Quality Baseline
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
