# Codebase Structure

**Analysis Date:** 2026-04-02

## Directory Layout

```
calzoleriaprevenzano/                     # Project root
├── .github/                              # GitHub-specific configuration
│   └── agents/                           # Agent definitions (19 agents)
├── .planning/                            # Planning documents
│   └── codebase/                         # Codebase analysis documents
├── site-generator-agents/                # Main agent framework system
│   ├── .github/                          # Canonical agent source (2 agents)
│   │   └── agents/
│   ├── contracts/                        # Canonical artifact schemas
│   ├── docs/                             # Skill docs and references
│   │   ├── references/                   # Advanced reference guides
│   │   └── typescript/                   # TypeScript skill module
│   ├── governance/                       # Ownership matrix and validation
│   ├── modules/                          # Feature modules (28 modules)
│   ├── plugins/                          # Pre-built plugins (10 plugins)
│   ├── protocols/                        # Quality gate protocols
│   ├── templates/                        # Code templates for codegen
│   │   ├── react-router7/                # React Router 7 templates
│   │   │   ├── components/               # Component templates
│   │   │   ├── lib/                      # Library templates
│   │   │   └── routes/                   # Route templates
│   │   ├── shared/                       # Framework-agnostic templates
│   │   │   ├── components/               # Shared component templates
│   │   │   ├── lib/                      # Shared library templates
│   │   │   └── providers/                # Provider templates
│   │   └── tanstack/                     # TanStack Router templates
│   │       ├── components/               # Component templates
│   │       ├── lib/                      # Library templates
│   │       └── routes/                   # Route templates
│   ├── test-scenarios/                   # E2E test scenario definitions
│   ├── 02-site-types.md                  # Site type definitions
│   ├── GUIDE.md                          # User-facing guide
│   ├── REFACTORING-GUIDE.md              # Refactoring workflow guide
│   └── WEB-AGENCY-DRY-RUN.md             # Test scenario for web agency
├── .gitignore
└── .DS_Store
```

## Directory Purposes

### `.github/agents/`
- Purpose: All agent definitions used by GitHub Copilot Chat
- Contains: 19 `.agent.md` files, one per agent
- Key files: `dispatcher.agent.md` (orchestrator), `pipeline.agent.md` (single-chat runner), `research.agent.md`, `design.agent.md`, `schema.agent.md`, `codegen-foundation.agent.md`, `codegen-pages.agent.md`, `codegen-api.agent.md`, `compliance.agent.md`, `audit.agent.md`, plus 9 post-pipeline agents

### `site-generator-agents/contracts/`
- Purpose: Canonical schemas for inter-agent artifacts (the "source of truth" when conflicts arise)
- Contains: 3 contract files
- Key files: `session-plan.md` (session plan shape), `research-artifacts.md` (blueprint + copy bank shape), `design-direction.md` (design direction shape)

### `site-generator-agents/docs/`
- Purpose: Skill documentation for specific technologies and patterns
- Contains: UI/UX guidelines, TypeScript skill, Tailwind skill, shadcn skill, premium patterns, auth SDK reference
- Key files: `ui-ux.md` (aesthetic library, hero patterns, responsive rules), `typescript/SKILL.md` (Zero `any` Policy), `auth-sdk-reference.md` (secure-auth-sdk API), `skill-premium-patterns.md` (GSAP ScrollTrigger patterns)

### `site-generator-agents/docs/references/`
- Purpose: Advanced technical reference guides
- Key files: `tailwind-advanced-patterns.md`

### `site-generator-agents/governance/`
- Purpose: Ownership matrix and validation rules for the canonical file system
- Key files: `ownership-matrix.md` (defines owner/consumer for every governed file), `ownership-matrix.json` (machine-readable version for `bin/consistency-check.js`)

### `site-generator-agents/modules/`
- Purpose: Feature modules loaded conditionally based on session plan flags
- Contains: 28 module files covering all capability areas
- Key files: See "Module Organization" section below

### `site-generator-agents/plugins/`
- Purpose: Pre-built plugin packages for extensible site features
- Contains: 10 plugin definitions + README
- Key files: See "Plugin Organization" section below

### `site-generator-agents/protocols/`
- Purpose: Quality gate protocols that enforce standards at pipeline boundaries
- Contains: 4 protocol files
- Key files: `research-gate.md` (quality gate before research handoff), `anti-ai-audit.md` (v3.0 — 42 checks for AI-generated clichés), `final-audit-checklist.md` (16-category audit checklist), `integration-test.md` (E2E test protocol)

### `site-generator-agents/templates/`
- Purpose: Code templates used as structural references by codegen agents
- Contains: 3 sub-directories (react-router7, tanstack, shared) with route, component, lib, and provider templates
- Key files: See "Template Organization" section below

### `site-generator-agents/test-scenarios/`
- Purpose: Pre-defined JSON scenarios for the test-runner agent
- Contains: 6 scenario files covering major site types
- Key files: `ecommerce-monolingual.json`, `saas-bilingual.json`, `corporate-multilang.json`, `local-business-booking.json`, `portfolio-minimal.json`, `landing-simple.json`

## Key File Locations

### Entry Points
- `.github/agents/pipeline.agent.md`: Single-chat orchestrator (primary entry point)
- `.github/agents/dispatcher.agent.md`: Multi-chat mode first agent
- `site-generator-agents/GUIDE.md`: User-facing quick start guide

### Agent Definitions (19 total)
- **Core pipeline (9):** `.github/agents/dispatcher.agent.md`, `research.agent.md`, `design.agent.md`, `schema.agent.md`, `codegen-foundation.agent.md`, `codegen-pages.agent.md`, `compliance.agent.md`, `codegen-api.agent.md`, `audit.agent.md`
- **Pipeline runner (1):** `.github/agents/pipeline.agent.md`
- **Post-pipeline features (3):** `.github/agents/features-deepscan.agent.md`, `features-coding.agent.md`, `features-redesign.agent.md`
- **Post-pipeline refactoring (2):** `.github/agents/refactoring-deepsearch.agent.md`, `refactoring-code.agent.md`
- **Post-pipeline quality (3):** `.github/agents/quality-check.agent.md`, `deep-debug.agent.md`, `test-writer.agent.md`
- **Testing (1):** `.github/agents/test-runner.agent.md`

### Contracts
- `site-generator-agents/contracts/session-plan.md`: Session plan canonical shape
- `site-generator-agents/contracts/research-artifacts.md`: Blueprint + copy bank canonical shape
- `site-generator-agents/contracts/design-direction.md`: Design direction canonical shape

### Core Modules
- `site-generator-agents/modules/design-system.md`: Design tokens, palette, typography
- `site-generator-agents/modules/database-schema.md`: Prisma schema per siteType
- `site-generator-agents/modules/frontend-pages.md`: Page structure patterns
- `site-generator-agents/modules/enterprise-segmentation.md`: Layer architecture rules
- `site-generator-agents/modules/framework-tanstack.md`: TanStack Router specifics
- `site-generator-agents/modules/framework-react-router7.md`: React Router 7 specifics

### Runtime Output (generated, not committed)
- `site-output/session-plan.json`: Central pipeline configuration
- `site-output/design-direction.md`: Locked creative direction
- `site-output/handoff.md`: Current agent handoff prompt
- `site-output/handoff-ledger.md`: Append-only handoff history
- `site-output/pipeline-state.json`: Pipeline phase tracking
- `site-output/metrics.json`: Append-only agent metrics
- `site-output/audit-report.md`: Final audit results
- `research-output/[slug]-blueprint.md`: Competitor research blueprint
- `research-output/[slug]-copy-bank.md`: All site copy
- `research-output/[slug]-batch-N.md`: Incremental research batches
- `research-output/[slug]-tallies.md`: Running tallies for research
- `research-output/[slug]-progress.json`: Research recovery state

## Module Organization

**Always-loaded modules** (every site, unconditional):
| Module | Purpose |
|--------|---------|
| `modules/design-system.md` | Design tokens, palette, CSS variables |
| `modules/database-schema.md` | Prisma models per siteType |
| `modules/frontend-pages.md` | Page structure, section patterns |
| `modules/content-intelligence.md` | Content context and copy strategy |
| `modules/error-handling.md` | Error boundaries, error pages |
| `modules/shadcn-strategy.md` | shadcn/ui component usage rules |
| `modules/enterprise-segmentation.md` | Layer architecture, LOC limits, import boundaries |

**Conditional modules** (loaded based on session plan flags):
| Flag | Module |
|------|--------|
| `modules.auth` | `authentication.md`, `auth-sdk-reference.md` |
| `modules.payments` | `payments.md` |
| `modules.gdpr` | `gdpr-compliance.md` |
| `modules.seo` | `seo.md` |
| `modules.security` | `security.md` |
| `modules.testing` | `testing.md` |
| `modules.email` | `email.md` |
| `modules.cicd` | `cicd.md` |
| `modules.pwa` | `pwa.md` |
| `modules.monitoring` | `monitoring.md` |
| `modules.accessibility` | `accessibility.md` |
| `modules.performance` | `performance.md` |
| `modules.integrationPatterns` | `integration-patterns.md` |

**Framework modules** (one loaded based on `framework` field):
| Framework | Module |
|-----------|--------|
| `tanstack` | `modules/framework-tanstack.md` |
| `react-router7` | `modules/framework-react-router7.md` |

**Other modules:**
| Module | Purpose |
|--------|---------|
| `modules/animations.md` | Animation tiers, Lenis setup, scroll animations |
| `modules/research-agent.md` | Deep research protocol phases 0-6 |
| `modules/discussion-mode.md` | Interactive discovery state machine |
| `modules/smart-recommendations.md` | Section gap analysis algorithm |
| `modules/custom-plugins.md` | Plugin system with impact analysis |
| `modules/refactoring.md` | Refactoring protocol with PRESERVE_ALWAYS |

## Plugin Organization

**Location:** `site-generator-agents/plugins/`

**Plugin structure:** Each plugin is a single `.md` file with:
- Feature description and scope
- Database models (`requiresModels` flag)
- API routes needed
- UI pages and components
- Dependencies on other modules/plugins
- Semantic versioning

**Available plugins:**

| Plugin | File | Complexity | Dependencies |
|--------|------|-----------|--------------|
| FAQ | `faq.md` | 🟢 Low | database-schema, seo |
| Newsletter | `newsletter.md` | 🟡 Medium | email, database-schema, gdpr-compliance |
| Blog | `blog.md` | 🔴 High | database-schema, seo, authentication |
| Gallery | `gallery.md` | 🟡 Medium | database-schema, performance |
| Reviews | `reviews.md` | 🟡 Medium | database-schema, seo |
| Booking | `booking.md` | 🔴 High | authentication, email, database-schema |
| Events | `events.md` | 🔴 High | database-schema, email, seo |
| Live Chat | `live-chat.md` | 🔴 High | authentication, database-schema |
| Multi-language | `multi-language.md` | 🔴 High | database-schema, seo, frontend-pages |
| Document Manager | `document-manager.md` | 🟡 Medium | database-schema, authentication (opt.) |

**Adding a new plugin:** Create `[name].md` in `plugins/` following `modules/custom-plugins.md` format. Register in session plan `plugins[]`. Run partial re-run from appropriate phase.

## Template Organization

### React Router 7 Templates
**Location:** `site-generator-agents/templates/react-router7/`

```
react-router7/
├── components/
│   ├── Cart.tsx.template
│   └── CookieBanner.tsx.template
├── lib/
│   └── api-response.ts.template
└── routes/
    ├── $lang/
    │   ├── _index.tsx.template
    │   ├── _layout.tsx.template
    │   └── product.$id.tsx.template
    ├── _index.tsx.template
    ├── api/
    │   ├── products.$id.ts.template
    │   ├── products.ts.template
    │   └── webhooks/
    │       └── stripe.ts.template
    ├── auth/
    │   ├── login.tsx.template
    │   └── register.tsx.template
    ├── cart.tsx.template
    └── root.tsx.template
```

### TanStack Router Templates
**Location:** `site-generator-agents/templates/tanstack/`

```
tanstack/
├── components/
│   ├── Cart.tsx.template
│   └── CookieBanner.tsx.template
├── lib/
│   └── api-response.ts.template
└── routes/
    ├── __root.tsx.template
    ├── api/
    │   ├── products.$id.ts.template
    │   ├── products.ts.template
    │   └── webhooks/
    │       └── stripe.ts.template
    ├── auth/
    │   ├── login.tsx.template
    │   └── register.tsx.template
    ├── cart.tsx.template
    ├── index.tsx.template
    └── products.$id.tsx.template
```

### Shared Templates
**Location:** `site-generator-agents/templates/shared/`

```
shared/
├── components/
│   └── ErrorBoundary.tsx.template
├── lib/
│   ├── animation-variants.ts.template
│   ├── auth-guard.server.ts.template
│   ├── i18n.ts.template
│   ├── rate-limit.redis.server.ts.template
│   └── rate-limit.server.ts.template
└── providers/
    └── SmoothScrollProvider.tsx.template
```

## Naming Conventions

### Files
- Agent definitions: `[name].agent.md` (e.g., `dispatcher.agent.md`)
- Modules: `[name].md` (e.g., `authentication.md`)
- Plugins: `[name].md` (e.g., `blog.md`)
- Contracts: `[artifact-name].md` (e.g., `session-plan.md`)
- Protocols: `[protocol-name].md` (e.g., `research-gate.md`)
- Templates: `[filename].template` (e.g., `index.tsx.template`)

### Generated Output Files
- Session plan: `site-output/session-plan.json`
- Artifacts: `site-output/[name].md` or `site-output/[name].json`
- Research output: `research-output/[slug]-[artifact].md`
- Implementation map: `site-output/implementation-map.md` + `site-output/implementation-map.json`

## Governance and Contracts

### Ownership Matrix
**Location:** `site-generator-agents/governance/ownership-matrix.md`

Defines for every canonical file:
- **Owner:** The single agent responsible for writing/modifying it
- **Consumers:** All agents that read it
- **Purpose:** What the file governs

**Precedence order:** canonical-file > consumer-implementation > inline-example > guide

### Validation
- `bin/validate-artifacts.js session-plan` — validates session plan structure
- `bin/consistency-check.js` — validates ownership matrix coverage using `governance/ownership-matrix.json`
- Contract versioning tracked in `ownership-matrix.json` with semver

### Canonical Source
In this repository, the canonical agent source is `site-generator-agents/.github/agents/`. The installer copies these to `.github/agents/` in target projects. The matrix governs the source files.

## Where to Add New Code

### New Agent
- Definition: `.github/agents/[name].agent.md`
- Register in: `governance/ownership-matrix.md` and `governance/ownership-matrix.json`
- Add to pipeline: Update `pipeline.agent.md` phase list

### New Module
- File: `site-generator-agents/modules/[name].md`
- Register in: Dispatcher's Module Loading Decision Tree
- Add to: `governance/ownership-matrix.md`

### New Plugin
- File: `site-generator-agents/plugins/[name].md`
- Follow: `modules/custom-plugins.md` format
- Register in: `plugins/README.md` compatibility table

### New Template
- Framework-specific: `site-generator-agents/templates/react-router7/` or `templates/tanstack/`
- Shared: `site-generator-agents/templates/shared/`
- Follow: `[directory-structure]/[name].[ext].template` pattern

### New Contract
- File: `site-generator-agents/contracts/[artifact].md`
- Must include: Required Shape, Field Rules, Invariants, Consumer Expectations, Update Rule
- Register in: `governance/ownership-matrix.md`

### New Test Scenario
- File: `site-generator-agents/test-scenarios/[name].json`
- Follow existing scenario format (see `ecommerce-monolingual.json`)

## Special Directories

### `site-output/`
- Purpose: Generated pipeline artifacts (session plan, design direction, handoff, metrics, audit report)
- Generated: Yes — created by agents during execution
- Committed: No — listed in `.gitignore`

### `research-output/`
- Purpose: Research phase output (blueprint, copy bank, batch files, tallies, progress)
- Generated: Yes — created by research agent
- Committed: No — listed in `.gitignore`

### `refactor-output/`
- Purpose: Refactoring phase output (deepsearch report, refactor report)
- Generated: Yes — created by refactoring agents
- Committed: No — excluded from git

---

*Structure analysis: 2026-04-02*
