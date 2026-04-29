---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Completed quick/260429-gbo (Bulk order management admin: selezione massiva + filtri email/data + vista cestino + soft/restore/hard-delete con TypeConfirmDialog "CANCELLA"; mirror 1:1 pattern Product soft-delete; 5 commit atomici italiani, push + Railway deploy SUCCESS commitHash=5047ab1; 8 file impattati, 3 nuovi; smoke-purchase E2E FAIL per APP_URL mancante su Railway env [DEFERRED, out of scope - non regresso da plan])
last_updated: "2026-04-29T10:25:55Z"
last_activity: 2026-04-29 — Completed quick task 260429-gbo: bulk order management nell'admin end-to-end. Esteso listAdminOrdersSchema con view/emailContains/createdFrom/createdTo + nuovo bulkOrderActionSchema. Aggiunte softDeleteOrders/restoreOrders/hardDeleteOrders in src/lib/admin/admin-orders.server.ts (mirror 1:1 pattern Product soft-delete, OrderItem+Payment cascade verificato). Nuovo endpoint POST /api/admin/orders/bulk con action discriminator (soft-delete|restore|hard-delete), error mapping 401/403/422/500 (no stack leak). Nuovo TypeConfirmDialog component (~122 LOC, handcrafted come ConfirmDialog) con typing-gate "CANCELLA". List view (/admin/ordini) con header checkbox select-all-visible, per-row checkbox, sticky bulk toolbar "Cestina", filtri email (debounced 300ms) + date range, link "Cestino (N)" con count refreshato. Vista cestino dedicata (/admin/ordini/cestino, NEW route) con Ripristina (no confirm) + Cancella definitivamente (TypeConfirmDialog). PITFALL §10 RESEARCH (selection set leakage tra page/filter change) implementato esplicitamente: useEffect reset su [page, query, status, email, dateFrom, dateTo, sort] in entrambe le route. 5 commit atomici (7d62f4a, 9d0c9b6, 106fe80, 178ee38, 5047ab1), 8 file (3 nuovi: orders.bulk.ts, TypeConfirmDialog.tsx, admin.ordini.cestino.tsx). Typecheck baseline 25 → 25 (zero nuovi errori). Push su origin, Railway latestDeployment.commitHash=5047ab1 con status=SUCCESS, HTTP 200. Smoke E2E purchase FAIL con net::ERR_CONNECTION_REFUSED dopo Stripe checkout — root cause: process.env.APP_URL non settato su Railway, fallback localhost:3000 in src/lib/orders.server.ts:413. Pre-esistente o regresso infra (yesterday era PASS), totalmente fuori scope da questo plan admin-only (zero touch a checkout/orders.server/env). Documentato in deferred-items.md. Plan eseguito esattamente come scritto, zero deviazioni di Rule 1/2/3.
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
Last activity: 2026-04-29 — Completed quick task 260429-gbo: bulk order management admin (selezione massiva + filtri email/data + vista cestino + soft/restore/hard-delete con TypeConfirmDialog "CANCELLA"). 5 commit atomici italiani (7d62f4a, 9d0c9b6, 106fe80, 178ee38, 5047ab1), 8 file (3 nuovi). Push origin, Railway deploy SUCCESS commitHash=5047ab1. Typecheck baseline preservata (25 → 25). Smoke E2E FAIL per APP_URL env mancante su Railway (DEFERRED - root cause infra, zero touch al public buy flow da questo plan admin-only).

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
| 260429-gbo | Bulk order management admin end-to-end. Esteso `listAdminOrdersSchema` con `view`/`emailContains`/`createdFrom`/`createdTo` + nuovo `bulkOrderActionSchema`. Aggiunte `softDeleteOrders`/`restoreOrders`/`hardDeleteOrders` in `admin-orders.server.ts` (mirror 1:1 pattern Product, `prisma.order.updateMany` con guard idempotenza + `deleteMany` solo su deletedAt:not-null come safety net; `OrderItem`+`Payment` cascade onDelete verificato). Nuovo endpoint `POST /api/admin/orders/bulk` con action discriminator `soft-delete\|restore\|hard-delete`, error mapping 401/403/422/500 senza stack leak. Nuovo `TypeConfirmDialog` component (~122 LOC handcrafted come `ConfirmDialog`, no Radix) con typing-gate "CANCELLA": input + check `typed.trim() === confirmText` sul bottone conferma, focus auto + reset on open, Esc + backdrop click chiudono, isLoading disabilita. List `/admin/ordini` con header checkbox select-all-visible, per-row checkbox, sticky bulk toolbar "Cestina" (rendering condizionale `selected.size > 0`), filtri email (debounced 300ms via `setTimeout`, no nuova dep) + `createdFrom`/`createdTo` date range, link "Cestino (N)" con count refreshato dopo bulk. Nuova route `/admin/ordini/cestino` (`admin.ordini.cestino.tsx`, file-based static segment ha precedenza su `$id` cuid in TanStack Router) con Ripristina (no confirm, azione reversibile) + "Cancella definitivamente" (`TypeConfirmDialog` "CANCELLA"). Stato vuoto "Il cestino è vuoto". PITFALL §10 RESEARCH (selection set leakage tra page/filter change) implementato esplicitamente: `useEffect(() => setSelected(new Set()), [page, query, status, debouncedEmail, createdFrom, createdTo, sort])` su `admin.ordini.tsx:139-141` e `[page, debouncedEmail, createdFrom, createdTo]` su `admin.ordini.cestino.tsx:60-62`. 5 commit atomici italiani, 8 file (3 nuovi: `orders.bulk.ts`, `TypeConfirmDialog.tsx`, `admin.ordini.cestino.tsx`). Typecheck baseline 25 → 25 (zero nuovi errori sui file modificati). Push origin `39dc751..5047ab1`, Railway `latestDeployment.commitHash=5047ab1da4782eb83c2a9bea3914e7017a678578` con `status=SUCCESS`, HTTP probe 200. Smoke E2E purchase FAIL `net::ERR_CONNECTION_REFUSED` dopo Stripe checkout — root cause `process.env.APP_URL` non settato su Railway, fallback `http://localhost:3000` in `orders.server.ts:413` (pre-esistente o regresso infra recente, yesterday smoke era PASS). Documentato in `deferred-items.md`, **NON regresso da questo plan**: zero touch a `orders.server.ts`/checkout/webhook/env, scope strettamente admin (`src/lib/admin/*`, `src/routes/admin.ordini*`, `src/components/admin/*`, `src/routes/api/admin/*`, `src/lib/validators/admin.ts`). Plan eseguito esattamente come scritto, zero deviazioni Rule 1/2/3. | 2026-04-29 | 7d62f4a,9d0c9b6,106fe80,178ee38,5047ab1 | [260429-gbo-bulk-order-management-admin-select-filtr](./quick/260429-gbo-bulk-order-management-admin-select-filtr/) |

## Session Continuity

Last session: 2026-04-29T10:25:55Z
Stopped at: Completed quick/260429-gbo (Bulk order management admin: selezione massiva + filtri email/data + vista cestino + soft/restore/hard-delete con TypeConfirmDialog "CANCELLA"; mirror 1:1 pattern Product soft-delete; 5 commit atomici italiani 7d62f4a..5047ab1, push + Railway deploy SUCCESS commitHash=5047ab1; 8 file impattati, 3 nuovi; smoke-purchase E2E FAIL per APP_URL mancante su Railway env [DEFERRED, out of scope - non regresso da plan])
Resume file: None
