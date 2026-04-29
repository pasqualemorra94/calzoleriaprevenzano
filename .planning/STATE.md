---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Completed quick/260429-eev (tipizzazione esplicita beforeLoad in prodotti.$slug.tsx + cast as Promise<ProductDetail|null> / Promise<ProductListItem[]> — bypass dell'inferenza RPC rotta su Record<string,unknown>; -34 errori TS, smoke E2E PASS)
last_updated: "2026-04-28T18:00:00Z"
last_activity: 2026-04-28 — Completed quick task 260429-eev: tipizzata return type di `beforeLoad` in `src/routes/prodotti.$slug.tsx` (5 LOC change: 3 righe cambiate + 2 cast `as Promise<...>` aggiunti). Eliminati tutti i 34 errori TS nel file (totale repo 60→26, drop di 34). Causa a monte: il serializzatore RPC TanStack Start non gestisce `Record<string, unknown>` in `ProductDetail.variantConfig`, facendo collassare il return inferito di `$getProductBySlug` a `Promise<{}>` e avvelenando `Route.useRouteContext()`. Smoke purchase E2E PASS (30s). Commit `6059e60` pushato su origin. Stesso pattern affligge `admin-functions.ts:66` (1 errore residuo) — lasciato come quick task futura.
progress:
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-02)

**Core value:** I clienti possono sfogliare, personalizzare e acquistare sandali artigianali italiani e prodotti in pelletteria di qualità, con un'esperienza di acquisto fluida che rispecchia l'eccellenza artigianale del brand.
**Current focus:** Phase 1 — Foundation & Data Model

## Current Position

Phase: 1 of 10 (Foundation & Data Model)
Plan: 0 of ? in current phase
Status: Ready to plan
Last activity: 2026-04-28 — Completed quick task 260429-eev: tipizzata return type di `beforeLoad` in `src/routes/prodotti.$slug.tsx` (5 LOC change: 3 righe cambiate + 2 cast `as Promise<...>` aggiunti). Eliminati tutti i 34 errori TS nel file (totale repo 60→26, drop di 34). Causa a monte: il serializzatore RPC TanStack Start non gestisce `Record<string, unknown>` in `ProductDetail.variantConfig`, facendo collassare il return inferito di `$getProductBySlug` a `Promise<{}>` e avvelenando `Route.useRouteContext()`. Smoke purchase E2E PASS (30s). Commit `6059e60` pushato su origin. Stesso pattern affligge `admin-functions.ts:66` (1 errore residuo) — lasciato come quick task futura.

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: none
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: AUTH requirements split into core auth (Phase 2) and account features (Phase 8) — account features depend on orders existing
- Roadmap: Legal/SEO combined into single Phase 10 — both are "production readiness" concerns

### Pending Todos

None yet.

### Blockers/Concerns

- TanStack Start is RC-stage — pin exact versions, never upgrade mid-phase
- Customization UX needs design validation during Phase 4 planning (multi-zone sandal configurator is unusual)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260428-la3 | Setup Playwright E2E + smoke test for one product purchase on live Railway site | 2026-04-28 | 3527675 | [260428-la3-setup-playwright-e2e-smoke-test-for-one-](./quick/260428-la3-setup-playwright-e2e-smoke-test-for-one-/) |
| 260428-m6j | Fix IVA double-tax + admin "succeeded" badge + parametric E2E spec (115/119 slugs pass) | 2026-04-28 | 8eb2882 | [260428-m6j-fix-iva-bug-payment-status-label-general](./quick/260428-m6j-fix-iva-bug-payment-status-label-general/) |
| 260428-nd8 | Race fix on Order.orderNumber (P2002 retry) + try/catch + structured 500 on /api/checkout — artemide hard-fail + flaky retries 16→7 resolved, 0 unhandled 500s in parametric run | 2026-04-28 | d219674,2a6d082 | [260428-nd8-investigate-and-fix-why-purchasing-artem](./quick/260428-nd8-investigate-and-fix-why-purchasing-artem/) |
| 260428-o8a | Fix Playwright variant helper to handle plain-button groups (Tacco/Taglia) — recovers 9 cart-helper sandali (jasmine, vipera, laura, ludovica, strass-1016, schiava-4, discoteca, nicole, giorgia) at retries=0; targeted 9/9 PASS, full parametric 116/119 effective | 2026-04-28 | 480333e | [260428-o8a-investigate-cart-failure-pattern-affecti](./quick/260428-o8a-investigate-cart-failure-pattern-affecti/) |
| 260428-p14 | Fix flake denise/maria con retry-click helper inline + drop res.ok() dal predicato waitForResponse — full parametric 118/119 PASS first-pass (0 flaky, era 108+8 flaky in o8a). Solo provv resta hard-fail (data-quality, fuori scope) | 2026-04-28 | 66470c2 | [260428-p14-diagnose-denise-and-maria-cart-post-time](./quick/260428-p14-diagnose-denise-and-maria-cart-post-time/) |
| 260429-dwz | IVA admin order detail — rimossa riga additiva, aggiunta riga informativa muted "di cui IVA (22%)" sotto il Totale a specchio del pattern in OrderSummary.tsx (fix double-display visivo, zero impatto su computation). 4+/4- LOC, 1 file. Railway redeploy verificato HTTP 200 | 2026-04-29 | 58322c2 | [260429-dwz-move-iva-from-additive-list-to-informati](./quick/260429-dwz-move-iva-from-additive-list-to-informati/) |
| 260429-e6n | Cleanup script E2E orders — `scripts/cleanup-e2e-orders.ts` (267 LOC) + `pnpm db:cleanup-e2e`. CLI locale per cancellare dal DB Railway gli ordini di test via marker email guest hard-coded `e2e+%@test.calzoleriaprevenzano.it`. Default dry-run + preview, `--execute` opt-in con countdown 5s, `DATABASE_URL` obbligatorio. Cascade FK Order→OrderItem/Payment confermato in schema (Address NON toccato). Nessun redeploy richiesto. | 2026-04-29 | c12f8d4 | [260429-e6n-cleanup-script-for-e2e-test-orders-marke](./quick/260429-e6n-cleanup-script-for-e2e-test-orders-marke/) |
| 260429-eev | Tipizzazione `beforeLoad` in `src/routes/prodotti.$slug.tsx` — 5 LOC change (return type esplicita `Promise<{ product: ProductDetail \| null; relatedProducts: ProductListItem[] }>` + 2 cast `as Promise<...>` sulle chiamate `createServerFn`). Bypass dell'inferenza rotta del serializzatore RPC TanStack Start su `Record<string, unknown>` in `ProductDetail.variantConfig` che faceva collassare il return tipo a `Promise<{}>`. Errori TS nel file 34→0; totale repo 60→26 (-34). Smoke purchase E2E PASS in 30s. Zero modifiche runtime. Stesso root cause affligge `admin-functions.ts:66` — lasciato come futuro task. | 2026-04-28 | 6059e60 | [260429-eev-fix-pre-existing-typescript-errors-in-pr](./quick/260429-eev-fix-pre-existing-typescript-errors-in-pr/) |

## Session Continuity

Last session: 2026-04-28T18:00:00Z
Stopped at: Completed quick/260429-eev (tipizzazione esplicita beforeLoad in prodotti.$slug.tsx + cast as Promise<ProductDetail|null> / Promise<ProductListItem[]> — bypass dell'inferenza RPC rotta su Record<string,unknown>; -34 errori TS, smoke E2E PASS)
Resume file: None
