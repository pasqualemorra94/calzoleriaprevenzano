---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Completed quick/260429-f6o (Duplica prodotto admin end-to-end: adminDuplicateProduct server fn + endpoint POST /api/admin/products/:id/duplicate + bottoni in lista e editor con ConfirmDialog + toast con action "Apri"; slug auto-suffix -copia[-N], N=50 max → 409; variants sku=null + isActive=false; 4 commit, smoke E2E PASS, Railway redeploy SUCCESS)
last_updated: "2026-04-29T09:15:00Z"
last_activity: 2026-04-29 — Completed quick task 260429-f6o: feature "Duplica prodotto" admin end-to-end. Aggiunte adminDuplicateProduct(id) in src/lib/admin/admin-products.server.ts con slug/SKU auto-suffix (-copia[-N], hard limit N=50 → 409), Prisma.$transaction per clonare Product + images + variants (sku=null per evitare unique conflict, isActive=false di default sul duplicato). Nuovo endpoint POST /api/admin/products/:id/duplicate con mappatura errori 403/404/409/500. Bottone "Duplica" in lista admin (fra Modifica ed Elimina) e bottone secondario "Duplica prodotto" nell'editor (gated !isNew, sticky header), entrambi con ConfirmDialog non distruttivo + toast.success con action "Apri" per navigare al duplicato. 4 commit atomici (0b05363, 5118f49, 5f31bb5, 25e4461), 5 file impattati (1 nuovo). Typecheck baseline 26 → 25 (-1, side effect: risolto TS6133 pre-esistente su `navigate` unused). Push su origin, Railway latestDeployment.commitHash=25e4461 con status=SUCCESS. Smoke E2E purchase Isabella PASS in 32.6s — public buy flow non regresso.
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
Last activity: 2026-04-29 — Completed quick task 260429-f6o: feature "Duplica prodotto" admin end-to-end. Aggiunte adminDuplicateProduct(id) in src/lib/admin/admin-products.server.ts con slug/SKU auto-suffix (-copia[-N], hard limit N=50 → 409), Prisma.$transaction per clonare Product + images + variants (sku=null per evitare unique conflict, isActive=false di default sul duplicato). Nuovo endpoint POST /api/admin/products/:id/duplicate con mappatura errori 403/404/409/500. Bottone "Duplica" in lista admin (fra Modifica ed Elimina) e bottone secondario "Duplica prodotto" nell'editor (gated !isNew, sticky header), entrambi con ConfirmDialog non distruttivo + toast.success con action "Apri" per navigare al duplicato. 4 commit atomici (0b05363, 5118f49, 5f31bb5, 25e4461), 5 file impattati (1 nuovo). Typecheck baseline 26 → 25 (-1, side effect: risolto TS6133 pre-esistente su `navigate` unused). Push su origin, Railway latestDeployment.commitHash=25e4461 con status=SUCCESS. Smoke E2E purchase Isabella PASS in 32.6s — public buy flow non regresso.

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
| 260429-f6o | Feature "Duplica prodotto" admin end-to-end. `adminDuplicateProduct(id)` con slug/SKU auto-suffix `-copia[-N]` (hard limit N=50 → 409), `Prisma.$transaction` per clonare Product + images + variants (sku=null su variants per evitare unique conflict, `isActive=false` + `isFeatured=false` di default sul duplicato). Nuovo endpoint `POST /api/admin/products/:id/duplicate` con mappatura errori 403/404/409/500 e fallback Prisma `P2002`. Bottone "Duplica" in lista admin (icona Copy, fra Modifica ed Elimina) + bottone secondario "Duplica prodotto" nell'editor (gated `!isNew`, sticky header fra Annulla e Salva), entrambi con `ConfirmDialog` non distruttivo + `toast.success` con action "Apri"/"Apri duplicato" che naviga all'editor del duplicato. 4 commit atomici, 5 file impattati (1 nuovo route file `products.$id.duplicate.ts`). Typecheck 26→25 (side effect: risolto TS6133 pre-esistente su `navigate` declared but never read in admin.prodotti.$id.tsx). Smoke E2E PASS 32.6s, Railway redeploy SUCCESS. | 2026-04-29 | 0b05363,5118f49,5f31bb5,25e4461 | [260429-f6o-implementa-funzionalit-duplica-prodotto-](./quick/260429-f6o-implementa-funzionalit-duplica-prodotto-/) |

## Session Continuity

Last session: 2026-04-29T09:15:00Z
Stopped at: Completed quick/260429-f6o (Duplica prodotto admin end-to-end: adminDuplicateProduct server fn + endpoint POST /api/admin/products/:id/duplicate + bottoni in lista e editor con ConfirmDialog + toast con action "Apri"; slug auto-suffix -copia[-N], N=50 max → 409; variants sku=null + isActive=false; 4 commit, smoke E2E PASS, Railway redeploy SUCCESS)
Resume file: None
