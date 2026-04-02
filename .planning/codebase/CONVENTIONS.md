# Coding Conventions

**Analysis Date:** 2026-04-02

## Project Nature

This is a **multi-agent AI system** for generating websites. The codebase itself is primarily **agent definitions** (`.agent.md` files), **protocols**, **contracts**, **modules**, and **test scenarios** — not traditional application code. Generated projects follow the conventions documented below.

The system uses a canonical governance model: contracts/protocols/modules are the source of truth; agent implementations must conform to them.

---

## Naming Conventions

### Agent Definition Files

- **Pattern:** `kebab-case.agent.md`
- **Location:** `.github/agents/` (project root) and `site-generator-agents/.github/agents/` (source)
- **Examples:** `test-writer.agent.md`, `codegen-foundation.agent.md`, `quality-check.agent.md`
- **Frontmatter:** YAML frontmatter with `name` and `description` fields:

```yaml
---
name: test-writer
description: "Description of agent purpose"
---
```

### Module Files

- **Pattern:** `kebab-case.md`
- **Location:** `site-generator-agents/modules/`
- **Examples:** `testing.md`, `enterprise-segmentation.md`, `design-system.md`
- **Header convention:** Title with emoji prefix + module description block:

```markdown
# 🧪 Testing Module

> **Load when:** User selects Basic/Standard/Comprehensive testing
> **Primary consumer:** `test-writer.agent.md`
```

### Protocol Files

- **Pattern:** `kebab-case.md`
- **Location:** `site-generator-agents/protocols/`
- **Header convention:** Title + version + last updated + owner + executor:

```markdown
# Final Audit Checklist Protocol

- **Version:** 1.6
- **Last updated:** 2026-03-21
- Owner: `protocols/final-audit-checklist.md`
- Esecutore: `audit.agent.md`, `quality-check.agent.md`
```

### Contract Files

- **Pattern:** `kebab-case.md`
- **Location:** `site-generator-agents/contracts/`
- **Header convention:** Title + version + last updated + owner + consumers:

```markdown
# Session Plan Contract

- **Version:** 1.1
- **Last updated:** 2026-03-16
- Owner: `dispatcher.agent.md`
- Consumatori: tutti gli agenti successivi
```

### Test Scenario Files

- **Pattern:** `kebab-case.json`
- **Location:** `site-generator-agents/test-scenarios/`
- **JSON structure fields:** `id`, `name`, `description`, `difficulty`, `prompt`, `expectedSiteType`, `expectedModules`, `expectedLanguages`, `validationFocus`, `knownEdgeCases`

### Plugin Files

- **Pattern:** `kebab-case.md`
- **Location:** `site-generator-agents/plugins/`
- **Examples:** `reviews.md`, `booking.md`, `multi-language.md`, `gallery.md`

---

## Generated Code Conventions (Applied to Output Projects)

### File Naming — Enterprise Segmentation

All generated projects follow the Enterprise Code Segmentation rules from `site-generator-agents/modules/enterprise-segmentation.md`:

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

---

## TypeScript Conventions

### Zero `any` Policy (Non-Negotiable)

Defined in `site-generator-agents/docs/typescript/SKILL.md`:

- **MAI `any` come tipo esplicito** — use `unknown`, generics, or specific types
- **MAI `as any`** — use type guards, assertion functions, or `satisfies`
- **MAI `Record<string, any>`** — use `Record<string, unknown>` or specific type
- **MAI callback non tipati** — `(data: any) => void` → `(data: SomeType) => void`
- **Catch error** — `catch (e: unknown)` + `instanceof Error` narrowing, never `catch (e: any)`
- **`noImplicitAny: true`** mandatory in `tsconfig.json` (via `strict: true`)

**Verification command:**
```bash
grep -rn ': any\b\|as any\|<any>' app/ --include="*.ts" --include="*.tsx" | grep -v '\.d\.ts'
```

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

---

## Import Conventions

### Import Alias

Use `~/` alias pointing to `app/` (configured in `vitest.config.ts` and framework config):

```typescript
import { Button } from "~/components/ui/button";
import { useCart } from "~/lib/hooks/useCart";
import { prisma } from "~/lib/db.server";
```

### Import Boundaries (Enforced)

From `site-generator-agents/modules/enterprise-segmentation.md`:

| From | Can import | Cannot import |
|------|-----------|---------------|
| `components/sections/` | `ui/`, `hooks/`, `utils/`, `types/`, `constants/`, `validators/`, `providers/` | `routes/`, `*.server.ts`, `prisma/` |
| `components/ui/` | `utils/`, `types/`, `constants/` | `sections/`, `routes/`, `*.server.ts` |
| `components/features/` | `ui/`, `hooks/`, `utils/`, `types/`, `validators/` | `routes/`, `*.server.ts` directly |
| `routes/api/` | `*.server.ts`, `validators/`, `types/`, `constants/` | `components/` (no UI import) |
| `routes/[pages]/` | `components/**`, `hooks/`, `utils/`, `types/` | `*.server.ts` (only via loader/action) |
| `lib/hooks/` | `utils/`, `types/`, `constants/`, `stores/` | `components/`, `routes/`, `*.server.ts` |
| `lib/*.server.ts` | `db.server.ts`, `types/`, `validators/`, `constants/` | `components/`, `hooks/` |

---

## Component Patterns

### shadcn/ui Component Strategy

From `site-generator-agents/modules/shadcn-strategy.md`:

- **NEVER raw HTML form elements** — always use shadcn equivalents:
  - `<input>` → `<Input>` from `~/components/ui/input`
  - `<button>` → `<Button>` from `~/components/ui/button`
  - `<textarea>` → `<Textarea>` from `~/components/ui/textarea`
  - `<select>` → `<Select>` from `~/components/ui/select`
  - Error messages → `<Alert variant="destructive">`

### Form Library

- **ALWAYS** use `@tanstack/react-form` with `@tanstack/zod-form-adapter`
- **NEVER** use `react-hook-form` or `@hookform/resolvers/zod`
- Custom error messages required (no browser defaults):

```tsx
<form.Field name="name" validators={{ onChange: z.string().min(2, "Custom error message") }}>
  {(field) => (
    <div className="space-y-2">
      <Label htmlFor="name">Name</Label>
      <Input id="name" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
      {field.state.meta.errors.length > 0 && <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>}
    </div>
  )}
</form.Field>
```

### Component Size Limits

- **Max 200 LOC** per component — if exceeded, split into sub-components or custom hook
- **Max 150 LOC** per API route — if exceeded, extract business logic to service layer
- **Max 100 LOC** per hook — if exceeded, split into composite hooks

### Barrel Exports

Every directory with ≥3 exportable files MUST have an `index.ts`:

```typescript
// app/components/sections/index.ts
export { Hero } from "./Hero";
export { Services } from "./Services";
export { FAQ } from "./FAQ";
```

Exception: `routes/` directory — no barrel exports (framework handles routing).

---

## CSS/Styling Conventions

### Design Token System

From `site-generator-agents/modules/design-system.md`:

- **NEVER hardcode hex values** in components — always reference CSS custom properties
- Design tokens defined in `app/styles/design-tokens.css`
- Imported in `app/styles/app.css` after Tailwind import:

```css
@import "tailwindcss";
@import "./design-tokens.css";
```

### Tailwind Configuration

- Tailwind v4: use `@theme` overrides in CSS
- Tailwind v3: use `tailwind.config.ts` with `satisfies Config`
- Color tokens mapped to semantic roles: `--background`, `--foreground`, `--primary`, `--muted`, etc.
- Dark mode via `.dark` class on `<html>` element

### Spacing Conventions

- Use varied vertical rhythm: `py-16`, `py-24`, `py-32`, `py-40` — never same padding on all sections
- Design tokens for layout: `--page-max-width`, `--page-padding-x`, `--section-gap`

### DNA Fingerprint

Every generated site has a 3-element visual signature:
1. **Signature Shape** — recurring geometric motif
2. **Signature Motion** — distinctive micro-interaction trademark
3. **Signature Rhythm** — layout cadence with varied section heights

---

## Directory Structure Convention (Generated Projects)

From `site-generator-agents/modules/enterprise-segmentation.md`:

```
app/
├── components/
│   ├── sections/          # Homepage sections (Hero, Services, FAQ...)
│   ├── shared/            # Layout components (Navbar, Footer, ErrorBoundary)
│   ├── ui/                # shadcn/atomic UI components
│   └── features/          # Feature-specific composites (cart/, booking/)
├── lib/
│   ├── hooks/             # Custom React hooks
│   ├── stores/            # State stores (Zustand/Jotai)
│   ├── utils/             # Pure utility functions
│   ├── validators/        # Zod schemas (shared client/server)
│   ├── types/             # Type definitions
│   ├── constants/         # Enum, config values, no magic numbers
│   ├── db.server.ts       # Prisma singleton
│   ├── sdk-auth.server.ts # Auth SDK adapter
│   ├── email.server.ts    # Email service
│   ├── stripe.server.ts   # Stripe service
│   └── api-response.ts    # Standardized API responses
├── providers/             # Context providers
├── routes/
│   ├── api/               # API endpoints (server-only)
│   ├── auth/              # Auth routes
│   └── [pages]/           # UI routes
└── styles/
    └── global.css
```

---

## Server/Client Boundary

- Files with `.server.ts` suffix — **never imported** from client code
- Files with `.client.ts` suffix — **never imported** from server code
- Zod validation in `lib/validators/` — shared (importable from both)
- Types in `lib/types/` — shared

**Gate:** `grep -rn 'from.*\.server' app/components/` must return zero results.

---

## Error Handling Conventions

From `site-generator-agents/modules/enterprise-segmentation.md`:

- No generic `try/catch` with `console.log(error)`
- Every catch must: (1) log with context, (2) return typed response, (3) not expose stack trace
- Error architecture:
  - Domain errors → `lib/errors/` (custom error classes)
  - Validation errors → `lib/validators/` (Zod)
  - UI error boundaries → `components/shared/ErrorBoundary.tsx`
  - API error responses → `lib/api-response.ts` (`apiError` with status code)
  - Logging → `lib/logger.server.ts` (structured JSON logging)

---

## Markdown Documentation Patterns

### Agent Definitions

All agent `.md` files follow this structure:

1. **YAML frontmatter** with `name` and `description`
2. **Title** with emoji prefix and agent name
3. **Role description** paragraph (Italian language)
4. **Capability summary** with ✅/❌ bullet points
5. **AVVIO (Boot) section** — ordered list of canonical files to read
6. **Phase sections** — detailed execution steps
7. **GATE DI COMPLETAMENTO** — completion checklist
8. **METRICS** — metrics JSON schema for `site-output/metrics.json`
9. **VERSION CONTROL** — git commit pattern
10. **HANDOFF** — next agent instructions + ledger entry
11. **Update Rule** — files to update when this agent changes

### Language Convention

- Agent internal instructions: **Italian**
- Code, technical identifiers, variable names: **English**
- Agent descriptions and user-facing messages: **Italian**
- Comments in generated code: **Italian**

### Canonical Governance

Every canonical file (contract, protocol, module) includes:

- `**Version:**` header for version tracking
- `**Last updated:**` date
- **Owner:** path to responsible agent/file
- **Consumatori/Esecutori:** list of consuming files
- **Regola Canonica** section stating precedence
- **Update Rule** section listing files to co-update

---

## Contract and Protocol Conventions

### Contract Shape (JSON Schema for session-plan.json)

From `site-generator-agents/contracts/session-plan.md`:

```json
{
  "slug": "kebab-case",
  "siteType": "ecommerce | saas | blog | portfolio | landing | corporate | local-business | custom",
  "positioningMode": "service-led | portfolio-led | hybrid",
  "framework": "tanstack | react-router7",
  "animationTier": "minimal | standard | premium",
  "runMode": "production | dry-run",
  "modules": { "auth": true, "gdpr": true, "payments": true, "seo": true, ... },
  "plugins": [{ "name": "", "file": "", "addedAt": "", "requiresModels": false, "requiresAuth": false }]
}
```

### Invariants (Enforced)

- If `region` is EU/Italy → `modules.gdpr` must be `true`
- If `modules.auth === true` → `modules.security` must be `true`
- If `siteType === "ecommerce"` → `modules.payments` must be `true`
- If `siteType === "blog"` or `"ecommerce"` → `modules.seo` must be `true`

### Precedence Order

From `site-generator-agents/governance/ownership-matrix.json`:

1. `canonical-file` (contract/protocol)
2. `consumer-implementation` (agent)
3. `inline-example`
4. `guide`

If inline examples, agents, or guides diverge from canonical files, the canonical file prevails.

---

## Security Conventions

### Authentication

From `site-generator-agents/.github/agents/compliance.agent.md`:

- **ALWAYS** use `secure-auth-sdk` — never manual JWT/bcrypt
- Auth adapter in `app/lib/sdk-auth.server.ts`
- Session cookies via SDK — no custom JWT
- Protected routes use guard/middleware

### OWASP 2025 Coverage

From `site-generator-agents/modules/security.md`:

- All 10 categories (A01-A10) must be explicitly verified
- Categories covered by `secure-auth-sdk` still need real wiring validation
- Security headers mandatory: `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Referrer-Policy`

---

## Metrics Convention

All agents append metrics to `site-output/metrics.json` (JSON array, append-only):

```json
{
  "agent": "agent-name",
  "startedAt": "ISO timestamp",
  "completedAt": "ISO timestamp",
  "durationMs": "number",
  "filesCreated": ["list"],
  "filesWritten": ["list"],
  "artifactsProduced": ["list"],
  "metrics": { "key": "value" },
  "errors": [],
  "status": "SUCCESS"
}
```

Rule: read existing file, parse JSON, append, rewrite. Never overwrite other agents' entries.

---

## Handoff Convention

From multiple agent definitions:

- `site-output/handoff.md` is **overwritten entirely** by each agent (never appended)
- Must contain **exactly one** `# Prossimo step:` block after overwrite
- `site-output/handoff-ledger.md` is **append-only** — never overwritten
- Ledger entry format:

```markdown
## [agent-name] → next-agent | [ISO 8601 timestamp]

- Artefatti prodotti: [list]
- Status: COMPLETE | PARTIAL | FAIL
```

---

## Git Commit Conventions

Each agent commits with a specific message pattern:

```bash
git add -A && git commit -m "audit: final validation — [STATUS]"
git add -A && git commit -m "security: auth + gdpr + payments + security headers"
git add -A && git commit -m "test: comprehensive test suite — [N] unit, [N] integration, [N] e2e"
git add -A && git commit -m "test: integration test run — [scenario-id] — [PASS/FAIL]"
```

---

*Convention analysis: 2026-04-02*
