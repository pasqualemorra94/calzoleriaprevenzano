# Testing Patterns

**Analysis Date:** 2026-04-02

## Overview

This project uses a **multi-layer testing approach** with three distinct testing systems:

1. **Unit/Integration testing** — Vitest + MSW + Testing Library (for generated site projects)
2. **E2E testing** — Playwright (for generated site projects)
3. **Pipeline integration testing** — Agent-based simulation via test-runner (for the multi-agent framework itself)

---

## Test Framework

### Runner

- **Vitest** — Unit and integration tests for generated projects
  - Config: `vitest.config.ts` at generated project root
  - Spec: jsdom environment, `@testing-library/jest-dom/vitest` matchers
  - Coverage provider: v8 with thresholds (80% statements/branches/functions/lines)

- **Playwright** — E2E tests in generated projects
  - Config: `playwright.config.ts` at generated project root
  - Multi-browser: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
  - Reporter: HTML + JSON

- **MSW (Mock Service Worker)** — API mocking for generated projects
  - Config: `tests/mocks/server.ts` with `tests/mocks/handlers.ts`

### Assertion Library

- **Vitest built-in** (`expect`, `vi.fn`, `vi.mock`)
- **@testing-library/react** — `render`, `screen`, `waitFor`, `act` (via `renderHook`)
- **@testing-library/jest-dom** — DOM matchers (`toBeInTheDocument`, `toHaveTextContent`, etc.)
- **@axe-core/playwright** — Accessibility audit (WCAG 2.1 AA)
- **Zod** — Schema validation in tests (via `.safeParse()`)

### Run Commands (Generated Projects)

```bash
pnpm test              # Run all unit + integration tests
pnpm test:watch        # Watch mode
pnpm test:ui           # Vitest UI dashboard
pnpm test:coverage    # With coverage report
pnpm test:unit          # Only unit tests
pnpm test:integration  # Only integration tests
pnpm test:security     # Security tests
pnpm test:e2e          # Playwright E2E tests
pnpm test:e2e:ui      # Playwright UI mode
pnpm test:e2e:debug   # Playwright debug mode
pnpm test:a11y         # Accessibility tests
pnpm test:smoke        # Quick smoke test
pnpm test:all          # Vitest + Playwright (everything)
```

---

## Test File Organization

### Location

Tests are **co-located** in a `tests/` directory (separate from `app/` source code):

```
tests/
├── setup.ts                      # Global setup (cleanup, mocks)
├── helpers/
│   └── test-utils.tsx            # Custom render with providers
├── mocks/
│   ├── server.ts                 # MSW server setup
│   ├── handlers.ts               # MSW request handlers
│   └── data/
│       └── factories.ts          # Type-safe test data factories
├── unit/
│   ├── components/
│   │   ├── sections/             # Section component tests
│   │   ├── shared/               # Navbar, Footer, ErrorBoundary
│   │   ├── ui/                   # shadcn component tests
│   │   └── features/             # Feature composite tests
│   ├── hooks/                    # Custom hook tests
│   ├── utils/                     # Utility function tests
│   ├── validators/                # Zod schema tests
│   └── services/                  # Server service tests (mocked DB)
├── integration/
│   ├── loaders/                  # Route loader tests
│   ├── actions/                  # Route action tests
│   ├── api/                      # API endpoint tests
│   └── auth/                      # Auth flow integration tests
├── e2e/
│   ├── smoke.spec.ts             # App starts, no console errors
│   ├── navigation.spec.ts        # Nav + routing
│   ├── auth.spec.ts              # Auth flows (if auth active)
│   ├── forms.spec.ts             # Form submissions
│   ├── i18n.spec.ts              # Language switching
│   ├── cart.spec.ts              # Cart flow (if e-commerce)
│   ├── checkout.spec.ts          # Checkout (if payments)
│   └── critical-paths.spec.ts   # All critical user journeys
├── security/
│   ├── auth-bypass.spec.ts       # Auth bypass attempts
│   ├── xss.spec.ts               # XSS injection tests
│   ├── csrf.spec.ts              # CSRF protection
│   ├── headers.spec.ts           # Security headers validation
│   ├── rate-limit.spec.ts        # Rate limiting verification
│   └── input-validation.spec.ts  # Malicious input handling
├── a11y/
│   └── accessibility.spec.ts     # axe-core WCAG 2.1 AA tests
└── performance/
    └── lighthouse.spec.ts        # Core Web Vitals assertions
```

### Test File Naming Conventions

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

**Rule:** Unit/Integration tests use `.test.ts`/`.test.tsx` suffix. E2E/Security/A11y/Performance tests use `.spec.ts` suffix.

 Server tests use `.server.test.ts` suffix.

 Snapshot tests use `.snapshot.test.tsx` suffix.

---

## Test Structure

### Suite Organization

Use `describe`/`it` blocks following **Arrange-Act-Assert** pattern:

```typescript
// tests/unit/validators/product.test.ts
import { describe, it, expect } from "vitest";
import { createProductSchema } from "~/lib/validators/product";

describe("createProductSchema", () => {
  // ✅ Happy path — valid input
  it("accepts valid input", () => {
    const result = createProductSchema.safeParse({
      name: "Test Product",
      price: 99.99,
      slug: "test-product",
    });
    expect(result.success).toBe(true);
  });

  // ❌ Boundary values
  it("rejects empty name", () => {
    const result = createProductSchema.safeParse({
      name: "",
      price: 99.99,
      slug: "test",
    });
    expect(result.success).toBe(false);
  });

  // 🔒 Security — XSS injection
  it("sanitizes XSS in string fields", () => {
    const result = createProductSchema.safeParse({
      name: '<script>alert("xss")</script>',
      price: 10,
      slug: "test",
    });
    if (result.success) {
      expect(result.data.name).not.toContain("<script>");
    }
  });
});
```

### Per-Zod Schema Test Pattern

Every Zod validator test must cover:

1. **Happy path** — valid input passes
2. **Boundary values** — empty strings, zero, max values, missing optional fields
3. **Type errors** — wrong types (string where number expected)
4. **Security** — XSS/SQL injection strings
5. **Optional fields** — present and absent
6. **Default values** — if `.default()` is used

### Component Test Pattern

```typescript
// tests/unit/components/sections/Hero.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "~/../../tests/helpers/test-utils";
import { Hero } from "~/components/sections/Hero";

describe("Hero", () => {
  const defaultProps = {
    title: "Welcome",
    subtitle: "Subtitle text",
    ctaText: "Get Started",
    ctaHref: "/contact",
  };

  it("renders title and subtitle", () => {
    render(<Hero {...defaultProps} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Welcome");
  });

  it("renders CTA link with correct href", () => {
    render(<Hero {...defaultProps} />);
    const link = screen.getByRole("link", { name: /get started/i });
    expect(link).toHaveAttribute("href", "/contact");
  });

  it("applies correct semantic structure", () => {
    const { container } = render(<Hero {...defaultProps} />);
    expect(container.querySelector("section")).toBeInTheDocument();
  });
});
```

### Loader Test Pattern (React Router 7 / TanStack)

```typescript
// tests/integration/loaders/products.loader.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("~/lib/db.server", () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { loader } from "~/routes/products._index";
import { prisma } from "~/lib/db.server";

describe("products loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns data for default request", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([]);
    const request = new Request("http://localhost/products");
    const response = await loader({ request, params: {}, context: {} });
    expect(response).toBeDefined();
  });

  it("handles database errors gracefully", async () => {
    vi.mocked(prisma.product.findMany).mockRejectedValue(new Error("DB down"));
    const request = new Request("http://localhost/products");
    await expect(loader({ request, params: {}, context: {} })).rejects.toThrow();
  });
});
```

---

## Mocking

### Framework

- **Vitest `vi.mock()`** — primary mocking tool
- **MSW (Mock Service Worker)** — API request interception

### Patterns

Mock external dependencies **before** importing the module under test:

```typescript
// Mock dependencies BEFORE import
vi.mock("~/lib/db.server", () => ({
  prisma: {
    product: { findMany: vi.fn() },
  },
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: "email_123" }) },
  })),
}));

// Then import the module under test
import { sendEmail } from "~/lib/email.server";
import { prisma } from "~/lib/db.server";
```

### What to Mock

- **Prisma client** — always mock via `vi.mock("~/lib/db.server")`
- **External services** — Stripe, Resend, Auth SDK via `vi.mock()` with factory implementations
- **Session/cookie** — via `vi.mock("~/lib/session.server")`
- **API responses** — via MSW handlers in `tests/mocks/handlers.ts`

### What NOT to Mock

- **Zod schemas** — test them directly (pure functions)
- **Utility functions** — test them directly (pure functions)
- **Component rendering** — use real component + Testing Library
- **Business logic in services** — test the actual logic with mocked I/O

---

## Fixtures and Factories

### Test Data Factories

Use type-safe factory functions for consistent test data:

```typescript
// tests/mocks/data/factories.ts
import type { Product, AuthUser, Order } from "~/lib/types/models";

let idCounter = 0;
const nextId = () => String(++idCounter);

export function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: nextId(),
    name: `Test Product ${idCounter}`,
    slug: `test-product-${idCounter}`,
    price: 99.99,
    description: "A test product",
    imageUrl: "/images/test.webp",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: nextId(),
    email: `user${idCounter}@example.com`,
    name: `Test User ${idCounter}`,
    role: "USER",
    createdAt: new Date(),
    ...overrides,
  };
}
```

### Location

- `tests/mocks/data/factories.ts` — Type-safe factory functions
- `tests/helpers/test-utils.tsx` — Custom render wrapper with providers

---

## Coverage

### Requirements

From `site-generator-agents/modules/testing.md`:

- **Unit tests:** 80%+ coverage
- **Loader/action tests:** 100% of critical paths (auth, cart, checkout)
- **E2E tests:** All critical user flows
- **Accessibility tests:** WCAG 2.1 AA

### Vitest Coverage Thresholds (from `test-writer.agent.md`)

```typescript
coverage: {
  provider: "v8",
  reporter: ["text", "json-summary", "html", "lcov"],
  exclude: ["node_modules/", "tests/", "**/*.d.ts", "**/*.config.*", "prisma/", "public/"],
  thresholds: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  },
}
```

### Priority-Based Coverage Targets (from `test-writer.agent.md`)

| Priority | Category | Target |
|----------|----------|--------|
| CRITICAL | Auth flows, payment flows, data mutations | 100% |
| HIGH | Business logic (services, validators) | 95%+ |
| HIGH | UI components | 80%+ |
| MEDIUM | Utils/hooks | 90%+ |

### Test Matrix by Site Type (from `test-writer.agent.md`)

| Site Type | Unit | Integration | E2E | Security | A11y | Perf |
|-----------|------|-------------|-----|----------|------|------|
| landing | ⬜ | ⬜ | ✅ | ⬜ | ✅ | ✅ |
| portfolio | ⬜ | ⬜ | ✅ | ⬜ | ✅ | ✅ |
| corporate | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| e-commerce | ✅✅ | ✅✅ | ✅✅ | ✅✅ | ✅ | ✅ |
| saas | ✅✅ | ✅✅ | ✅✅ | ✅✅ | ✅ | ✅ |
| booking | ✅ | ✅✅ | ✅✅ | ✅ | ✅ | ✅ |

✅ = standard coverage, ✅✅ = deep coverage  ⬜ = smoke tests only

### View Coverage

```bash
pnpm test:coverage     # Generate coverage report
```

---

## Testing Categories

### Unit Tests (Vitest)

**Test priority order:**
1. **Validators** (Zod schemas) — pure validation logic
2. **Utils** — Pure functions, easy to test
3. **Server services** — Business logic with mocked Prisma
4. **Hooks** — With `renderHook`, mocked dependencies
5. **Components** — Rendering, interaction, states

**Key principle:** Write tests for real code that exists — never write placeholder tests. From `test-writer.agent.md`: "Test reali eseguibili — zero placeholder, zero `// TODO`".

"

### Integration Tests (Vitest + MSW)

Test server-side logic in isolation:

1. **Loader tests** — Verify data retrieval, pagination, error handling
2. **Action tests** — Verify form submissions, validation, side effects
3. **API route tests** — Verify GET/POST responses, auth guards, status codes
4. **Auth flow tests** — Registration, login, logout, protected routes, rate limiting

### E2E Tests (Playwright)

**Smoke test:**
```typescript
// tests/e2e/smoke.spec.ts
test("homepage loads successfully", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("body")).toBeVisible();
});

test("no console errors on homepage", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(errors).toHaveLength(0);
});
```

**Navigation tests:** Verify all nav links resolve, 404 handling
 routing
**i18n tests:** Language switching (if multilingual)
**Form tests:** Contact form submission + validation errors
**Auth E2E:** Login/register/logout/protected routes
**Cart E2E:** Add to cart, persist across navigation (if e-commerce)
**Checkout E2E:** Full checkout flow (if payments)

### Security Tests (Playwright + Vitest)

Test against OWASP 2025 categories:

```typescript
// tests/security/xss.spec.ts — XSS payload testing
const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  '"><img src=x onerror=alert(1)>',
  "javascript:alert(1)",
  "<svg/onload=alert(1)>",
];

// tests/security/headers.spec.ts — Security header validation
// Tests: Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, Referrer-Policy

// tests/security/auth-bypass.spec.ts — Unauthenticated API access attempts
// tests/security/rate-limit.spec.ts — Rate limiting verification (429 after N requests)
// tests/security/input-validation.spec.ts — SQL injection, path traversal, command injection, oversized input
```

### Accessibility Tests (Playwright + axe-core)

```typescript
// tests/a11y/accessibility.spec.ts
import AxeBuilder from "@axe-core/playwright";

const PAGES_TO_TEST = [
  { name: "Homepage", path: "/" },
  { name: "Contact", path: "/contact" },
];

test.describe("Accessibility — WCAG 2.1 AA", () => {
  for (const { name, path } of PAGES_TO_TEST) {
    test(`${name} passes axe-core audit`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(results.violations).toHaveLength(0);
    });
  }

  test("keyboard navigation works", async ({ page }) => { /* Tab navigation */ });
  test("images have alt text", async ({ page }) => { /* Alt attribute check */ });
  test("form inputs have labels", async ({ page }) => { /* Label association */ });
});
```

### Performance Tests (Playwright)

```typescript
// tests/performance/lighthouse.spec.ts
test("LCP under 2500ms", async ({ page }) => { /* Largest Contentful Paint */ });
test("CLS under 0.1", async ({ page }) => { /* Cumulative Layout Shift */ });
test("no oversized images", async ({ page }) => { /* Max 2000px */ });
test("fonts preloaded", async ({ page }) => { /* Font preload check */ });
```

### Snapshot Tests (Vitest — Stable Components Only)

Use snapshot tests only for stable components (Footer, Navbar, ErrorBoundary). Never for components with dynamic data.

```typescript
// tests/unit/components/shared/Footer.snapshot.test.tsx
it("matches snapshot", () => {
  const { container } = render(<Footer />);
  expect(container.innerHTML).toMatchSnapshot();
});
```

---

## Pipeline Integration Testing

### Test Runner Agent (`site-generator-agents/.github/agents/test-runner.agent.md`)

The **test-runner** is a standalone agent that simulates the entire multi-agent pipeline (dispatcher → research → design → schema → codegen → compliance → audit) using predefined test scenarios.

**Execution mode:** Single-chat — runs all phases sequentially without waiting for "procedi" between phases.

**Output:**
- Per scenario: `test/[id]/test-report.md`
- Multi-scenario: `test/aggregate-report.md`

### Test Scenarios (`site-generator-agents/test-scenarios/`)

6 predefined scenarios covering all site types:

| Scenario | siteType | Difficulty | Focus |
|----------|----------|------------|-------|
| `ecommerce-monolingual` | ecommerce | basic | Stripe, seed, catalog sections |
| `saas-bilingual` | saas | advanced | Multilingual, proof DRAFT, competitor, section mapping |
| `portfolio-minimal` | portfolio | basic | Minimal case, no over-engineering |
| `local-business-booking` | local-business | intermediate | Booking schema, GDPR healthcare |
| `corporate-multilang` | corporate | intermediate | Service-led, FAQ, multilingual |
| `landing-simple` | landing | basic | Minimal case, form GDPR |

**Scenario JSON structure:**
```json
{
  "id": "kebab-case",
  "name": "Human-readable name",
  "description": "What this scenario tests",
  "difficulty": "basic | intermediate | advanced",
  "prompt": "User prompt text",
  "expectedSiteType": "siteType",
  "expectedModules": ["auth", "gdpr"],
  "expectedLanguages": ["it", "en"],
  "validationFocus": ["multilingual", "proof-classification"],
  "knownEdgeCases": ["Edge case descriptions"]
}
```

### Integration Test Protocol (`site-generator-agents/protocols/integration-test.md`)

**Version:** 1.1

**Pipeline phases simulated:**
1. Dispatcher → generates `test/[id]/site-output/session-plan.json`
2. Research → generates blueprint + copy bank, validates against Research Gate (15 criteria)
3. Design → generates `design-direction.md`, validates Anti-AI Audit
7 pre-generation checks
4. Schema → generates `schema-prisma.txt` (content, not executed)
5. Codegen → generates manifest (structural description, not actual files)
6. Compliance → generates compliance manifest
7. Audit → executes checklist on artifacts + manifests, structural mode only

**Inter-phase validation:**

| Check | What it verifies |
|-------|------------------|
| Handoff integrity | Single `# Prossimo step:` in handoff.md |
| Handoff ledger | Append-only entries, correct order, no gaps |
| Contract conformance | Artifact conforms to canonical contract |
| Upstream reference | Agent read previous phase artifacts from disk |
| Copy source | No invented text — all from Copy Bank or evidence |

**Manifest Validation Checks (Structural Mode):**

| Check | What it verifies |
|-------|------------------|
| MV-1 | File naming follows framework conventions |
| MV-2 | Every blueprint page has a corresponding route |
| MV-3 | Every blueprint section has a corresponding component |
| MV-4 | Every language has translation files declared |
| MV-5 | Content sections match Copy Bank 1:1 |
| MV-6 | Active modules have corresponding artifacts |

**Audit modes:**
- **Executable mode** — real files exist (`.tsx`, `package.json`, `prisma/schema.prisma`)
- **Structural mode** — manifests only (test runner, dry-run)

**Status taxonomy:**
- `EXECUTION READY` — all checks pass including build/runtime
- `STRUCTURALLY READY` — artifacts coherent, build not tested
- `STRUCTURALLY READY WITH WARNINGS` — partial coherence, minor issues
- `NOT READY` — blocking issues found

**Report structure** (`test/[id]/test-report.md`):
- Summary table (phase status, artifacts, validation results)
- Handoff integrity analysis
- Handoff ledger validation
- Contract version compliance
- Structural analysis (strengths, weaknesses, power metrics)
- Recommendations
- Final verdict (PASS/PASS WITH RESERVES/FAIL with score N/10)

---

## Quality Assurance Agents

### Audit Agent (`.github/agents/audit.agent.md`)

Final validation gate in the standard pipeline. Executes:
- Categories 5.0–5.15 from `protocols/final-audit-checklist.md`
- OWASP 2025 security audit from `modules/security.md`
- Anti-AI Smell Test from `protocols/anti-ai-audit.md`
- Zero `any` TypeScript audit
- Build verification (executable mode) or Manifest Validation (structural mode)

### Quality Check Agent (`.github/agents/quality-check.agent.md`)

Optional standalone agent for independent Enterprise quality analysis. 8 dimensions:

| Dimension | What it checks |
|-----------|----------------|
| QC-1 Architecture | Enterprise segmentation, import boundaries, LOC limits |
| QC-2 TypeScript | Zero `any`, explicit return types, Zod schemas |
| QC-3 Security | OWASP 2025 deep scan (A01–A10) |
| QC-4 Cross-Phase | Session plan vs code vs design coherence |
| QC-5 Performance | Bundle size, image optimization, font preload |
| QC-6 Accessibility | Alt text, heading hierarchy, form labels, ARIA |
| QC-7 Completeness | Route completeness, error boundaries, loading/empty states |
| QC-8 Consistency | Import style uniformity, naming, dead code |

**Severity levels:** CRITICAL → HIGH → MEDIUM → LOW → INFO

**Score system:** A-F letter grade, Enterprise Readiness verdict (READY/READY WITH CAVEATS/NOT READY)

**Output:** `site-output/quality-report.md`

### Anti-AI Audit Protocol (`site-generator-agents/protocols/anti-ai-audit.md`)

**Version:** 3.0

42 total checks:
- **Pre-generation:** 7 checks (hero/font/color/layout/copy/spacing/monotony clichés)
- **Post-generation:** 35 checks across 5 blocks:

| Block | Checks | Focus |
|-------|--------|-------|
| A — Visual | 9 | Hero/font/color/padding/background/button/hero/section monotony |
| B — Code | 9 | Hardcoded colors, placeholder copy, zero motion, responsive gaps, font import, copy cliché, interaction predictability, typography scale, DNA violation |
| C — Accessibility | 6 | Semantic HTML, ARIA, keyboard trap, alt text, color contrast, skip navigation |
| D — Performance | 5 | Image optimization, bundle bloat, font loading, code splitting, layout shift |
| E — Content/SEO | 6 | Meta tags, heading hierarchy, link accessibility, loading states, error states, micro-copy |

**Automated Gate Score:**
```
CRITICAL fails × 10 + HIGH fails × 5 + MEDIUM fails × 2 + LOW fails × 1 = TOTAL
TOTAL = 0      → 🟢 ENTERPRISE READY
TOTAL 1-10    → 🟡 CONSEGNABILE CON RISERVA
TOTAL 11-25   → 🟠 FIX OBBLIGATORI
TOTAL > 25    → 🔴 REVISIONE STRUTTURALE
ANY CRITICAL → 🔴 BLOCCO ASSOLUTO
```

**Meta-criterion:** "Would-Any-AI-Generate-This?" — If the answer is yes/maybe, the site fails regardless of individual check results.

---

## Test Writer Agent (`.github/agents/test-writer.agent.md`)

Standalone agent that generates complete test suites for output projects. Execution phases:

| Phase | What it does |
|-------|--------------|
| Phase 0 | Deep analysis — reads ALL generated code before writing any test |
| Phase 1 | Test infrastructure — Vitest/Playwright/MSW config, setup, mocks, factories |
| Phase 2 | Unit tests — Validators → Utils → Services → Hooks → Components |
| Phase 3 | Integration tests — Loaders, Actions, API routes, Auth flows |
| Phase 4 | E2E tests — Smoke, navigation, i18n, forms, auth, cart, critical paths |
| Phase 5 | Security tests — XSS, headers, auth bypass, rate limiting, input validation |
| Phase 6 | Accessibility tests — axe-core WCAG 2.1 AA, keyboard nav, alt text, labels |
| Phase 7 | Performance tests — LCP, CLS, oversized images, font preload |
| Phase 8 | Regression/snapshot tests — Stable components only |
| Phase 9 | Test data factories — Type-safe mock data generators |

**Key rules:**
- Never write placeholder tests — zero `// TODO`, zero `expect(true).toBe(true)`
- Never modify source code — only writes tests
- Never execute tests — that's for CI/user
- Zero `any` in test files — typed mocks, typed factories
- Test reading source files before writing tests (deep analysis mandatory)
- Uses `data-testid` or ARIA roles for selectors — never fragile CSS selectors

**Output:** Test files in `tests/` + `site-output/test-plan-report.md`

---

## Testing in Anti-AI Audit Context

The Anti-AI Audit protocol includes test-related checks:
- **Loading State Void** (#33): Every async operation needs loading indicator
- **Error State Generic** (#34): Error messages must be context-specific, not generic

---

## Final Audit Checklist — Test-Related Categories

From `protocols/final-audit-checklist.md`:

- **5.13 TypeScript & Build**: `pnpm typecheck`, `pnpm lint`, `pnpm build` must pass
- **5.16 Enterprise Segmentation**: Quality gates (12 automated checks including LOC limits, import boundaries, console.log detection, barrel exports)

---

## Common Test Patterns

### Async Testing

```typescript
// Loader/action tests — always test both success and error paths
it("handles database errors gracefully", async () => {
  vi.mocked(prisma.product.findMany).mockRejectedValue(new Error("DB down"));
  await expect(loader({ request, params: {}, context: {} })).rejects.toThrow();
});
```

### Error Testing

```typescript
// API route tests — verify status codes and error structure
it("POST returns 400 for invalid payload", async () => {
  const request = new Request("http://localhost/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invalid: true }),
  });
  const response = await action({ request, params: {}, context: {} });
  expect(response.status).toBe(400);
});
```

### Auth Guard Testing

```typescript
// Protected route test pattern
it("redirects to /auth when not authenticated", async () => {
  vi.mocked(getUser).mockResolvedValue(null);
  const request = new Request("http://localhost/account");
  const response = await loader({ request, params: {}, context: {} });
  expect(response.status).toBe(302);
  expect(response.headers.get("Location")).toBe("/auth");
});
```

---

## Test Infrastructure Setup

### Vitest Configuration (Generated into output projects)

**File:** `vitest.config.ts`
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html", "lcov"],
      exclude: ["node_modules/", "tests/", "**/*.d.ts", "**/*.config.*", "prisma/", "public/"],
      thresholds: { statements: 80, branches: 75, functions: 80, lines: 80 },
    },
    include: ["tests/**/*.test.{ts,tsx}"],
    globals: true,
    testTimeout: 10_000,
    pool: "forks",
  },
  resolve: { alias: { "~": path.resolve(__dirname, "./app") } },
});
```

### Playwright Configuration (Generated into output projects)

**File:** `playwright.config.ts`
```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { open: "never" }],
    ["json", { outputFile: "tests/e2e/results.json" }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

### Test Setup (Generated into output projects)

**File:** `tests/setup.ts`
```typescript
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll, vi } from "vitest";
import { server } from "./mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  server.resetHandlers();
});
afterAll(() => server.close());

// Mock IntersectionObserver
beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn(),
  }));
  global.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});
```

---

## Key Testing Module References

| File | Purpose |
|------|---------|
| `site-generator-agents/modules/testing.md` | Test technology stack (Vitest, Playwright, MSW), setup templates, React Router 7 loader/action test patterns |
| `site-generator-agents/.github/agents/test-writer.agent.md` | Full test suite generator agent — 9 phases, inviolable rules, naming conventions, test matrix |
| `site-generator-agents/.github/agents/test-runner.agent.md` | Pipeline simulation agent — scenario-based integration testing |
| `site-generator-agents/protocols/integration-test.md` | Integration test protocol — 7 phases, inter-phase validation, report format |
| `site-generator-agents/protocols/final-audit-checklist.md` | Final audit checklist — 17 categories (5.0-5.16), status taxonomy |
| `site-generator-agents/protocols/anti-ai-audit.md` | Anti-AI audit — 42 checks, gate score calculation, severity matrix |
| `site-generator-agents/.github/agents/quality-check.agent.md` | Enterprise quality gate — 8 dimensions, severity classification, score A-F |
| `site-generator-agents/.github/agents/audit.agent.md` | Final validation agent — executable/structural mode, OWASP 2025 |
| `site-generator-agents/modules/enterprise-segmentation.md` | Enterprise quality gates (12 automated checks), import boundaries |
| `site-generator-agents/modules/security.md` | OWASP 2025 reference for security tests |

---

*Testing analysis: 2026-04-02*
