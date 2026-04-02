# Architecture

**Analysis Date:** 2026-04-02

## Pattern Overview

**Overall:** Multi-Agent Pipeline Orchestrator for AI-driven website generation

**Key Characteristics:**
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
User Request
    ↓
[dispatcher] → analyzes request, infers siteType/framework/modules
    ↓ writes
site-output/session-plan.json
site-output/handoff.md
    ↓ reads
[research] → fetches 20-30 competitor sites
    ↓ writes
research-output/[slug]-blueprint.md
research-output/[slug]-copy-bank.md
research-output/[slug]-batch-N.md (incremental)
research-output/[slug]-tallies.md
research-output/[slug]-progress.json
    ↓ reads
[design] → produces creative direction with DNA Fingerprint
    ↓ writes
site-output/design-direction.md
    ↓ reads
[schema] → generates Prisma schema, Docker, seed
    ↓ writes
prisma/schema.prisma, prisma/seed.ts, docker-compose.dev.yml
    ↓ reads
[codegen-foundation] → design tokens, root layout, routing, shared components
    ↓ writes
public/design-tokens.css, app/root.tsx, app/components/ui/Navbar.tsx, etc.
    ↓ reads
[codegen-pages] → section components, pages, i18n copy
    ↓ writes
app/components/sections/*.tsx, app/routes/**/*.tsx, public/locales/**/*.json
    ↓ reads
[compliance] → auth, GDPR, payments, security
    ↓ writes
app/lib/sdk-auth.server.ts, legal pages, Stripe routes, security headers
    ↓ reads
[codegen-api] → business API routes with auth guards + Zod
    ↓ writes
app/routes/api/**/*.ts
    ↓ reads
[audit] → validates everything, fixes issues, certifies
    ↓ writes
site-output/audit-report.md
    ↓
DONE — site is ready
```

### State Management

**Pipeline State:** `site-output/pipeline-state.json` tracks `currentPhase`, `completedPhases`, `slug`, and optional `rerun` info. Enables recovery after interruption.

**Handoff Protocol:** Each agent overwrites `site-output/handoff.md` with the exact prompt for the next agent. Append-only `site-output/handoff-ledger.md` records all handoffs for traceability.

**Metrics:** All agents append entries to `site-output/metrics.json` — an append-only JSON array tracking timing, files written, and per-agent metrics.

**Anti-Regression:** `site-output/implementation-map.json` (produced by features-deepscan) defines `regressionBoundaries.immutable` and `regressionBoundaries.guarded` files that agents must respect.

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

**Strategy:** Fail-stop per phase with immediate fix

**Patterns:**
- **Research Gate:** Quality gate in `protocols/research-gate.md` — if gate is FAIL, research must complete missing sections before handoff
- **Audit Gate:** Audit agent fixes issues immediately and re-validates. Build must pass (`pnpm typecheck`, `pnpm lint`, `pnpm build`)
- **Context Split:** Pipeline suggests splitting chat after research (heavy output) and optionally after codegen-pages to prevent context window exhaustion
- **Recovery Protocol:** All stateful agents support recovery via progress/state JSON files on disk. Agents never rely on chat history for data between phases.

## Cross-Cutting Concerns

**Logging:** Append-only `site-output/metrics.json` with per-agent entries tracking timing, files written, status, and errors

**Validation:** `bin/validate-artifacts.js session-plan` validates structural correctness of session plan. `bin/consistency-check.js` validates ownership matrix coverage.

**Authentication:** All auth via `secure-auth-sdk` — never manual JWT/bcrypt. SDK provides `createPrismaAdapter(prisma)`, `requireUser()`, `requireAdmin()`. Referenced in `docs/auth-sdk-reference.md`.

**Anti-AI Audit:** Cross-cutting protocol (`protocols/anti-ai-audit.md`) executed at design, codegen-foundation, codegen-pages, and audit phases. Checks for AI-generated clichés (generic hero, purple gradients, Inter font, centered text).

**TypeScript Zero `any` Policy:** Enforced across all codegen phases via `docs/typescript/SKILL.md`. Audit includes `grep any` as a gate.

**Enterprise Segmentation:** All codegen follows layer architecture from `modules/enterprise-segmentation.md` — sections ≤200 LOC, API routes ≤150 LOC, strict import boundaries, barrel exports.

**Version Control:** Git commits after each pipeline phase on `site-gen/[slug]` branch. Commit messages follow conventional format. Never auto-push.

## Template System Architecture

### Dual Framework Support

The system maintains parallel template sets:

**React Router 7:** `site-generator-agents/templates/react-router7/`
- Routes: `routes/_index.tsx.template`, `routes/$lang/_layout.tsx.template`, `routes/$lang/_index.tsx.template`
- Auth: `routes/auth/login.tsx.template`, `routes/auth/register.tsx.template`
- API: `routes/api/products.ts.template`, `routes/api/webhooks/stripe.ts.template`
- Components: `components/CookieBanner.tsx.template`, `components/Cart.tsx.template`
- Lib: `lib/api-response.ts.template`

**TanStack Router:** `site-generator-agents/templates/tanstack/`
- Routes: `routes/__root.tsx.template`, `routes/index.tsx.template`
- Auth: `routes/auth/login.tsx.template`, `routes/auth/register.tsx.template`
- API: `routes/api/products.ts.template`, `routes/api/webhooks/stripe.ts.template`
- Components: `components/CookieBanner.tsx.template`, `components/Cart.tsx.template`
- Lib: `lib/api-response.ts.template`

**Shared:** `site-generator-agents/templates/shared/`
- Components: `components/ErrorBoundary.tsx.template`
- Lib: `lib/i18n.ts.template`, `lib/rate-limit.server.ts.template`, `lib/rate-limit.redis.server.ts.template`, `lib/auth-guard.server.ts.template`, `lib/animation-variants.ts.template`
- Providers: `providers/SmoothScrollProvider.tsx.template`

### Template Usage Pattern
Agents read `.template` files as structural references. The actual files are generated into the target project's `app/` directory with real content from the Copy Bank, design tokens from the Design Direction, and i18n data.

## Plugin Architecture

### Plugin Lifecycle
1. **Discovery:** Dispatcher detects plugin request or pre-defined plugin in `plugins/`
2. **Registration:** Plugin added to `session-plan.plugins[]` with `name`, `file`, `requiresModels`, `requiresAuth`
3. **Impact Analysis:** Dispatcher runs Plugin Impact Analysis from `modules/custom-plugins.md`
4. **Schema Extension:** Schema agent adds plugin models to `prisma/schema.prisma`
5. **UI Generation:** Codegen-pages generates plugin pages and components
6. **API Generation:** Codegen-api generates plugin API routes
7. **Commit:** Partial re-run from appropriate phase

### Available Plugins
10 pre-built plugins in `plugins/`: blog, booking, document-manager, events, faq, gallery, live-chat, multi-language, newsletter, reviews. Each declares dependencies and complexity level.

## Design System Patterns

### Token System
Design tokens flow from `site-output/design-direction.md` → `public/design-tokens.css` → components via CSS custom properties (`var(--color-primary)` etc.). Never hardcoded hex values.

### DNA Fingerprint
Each site gets unique Shape (geometric motif), Motion (micro-interaction trademark), and Rhythm (layout cadence). This prevents the "all AI sites look the same" problem.

### Quality Baseline
Apple product pages (MacBook Pro, iPhone Pro) serve as aspirational quality floor for scroll-driven animations, pinned sections, and visual rhythm.

---

*Architecture analysis: 2026-04-02*
