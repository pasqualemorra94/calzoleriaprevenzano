---
phase: quick-260519-iah
plan: 01
subsystem: storefront-ui
tags: [ui, payments, homepage, content]
requires: []
provides:
  - "TrustStripSection senza menzione PayPal"
  - "Footer PAYMENT_METHODS senza PayPal"
  - "Carosello Novita filtrato per categoria sandali"
affects:
  - src/components/sections/TrustStripSection.tsx
  - src/components/shared/Footer.tsx
  - src/components/sections/FeaturedProductsSection.tsx
tech-stack:
  added: []
  patterns:
    - "Filtro categoria lato server via param /api/products?category=sandali (buildProductWhere include sottocategorie)"
key-files:
  created:
    - .planning/quick/260519-iah-rimuovi-le-menzioni-paypal-da-truststrip/deferred-items.md
  modified:
    - src/components/sections/TrustStripSection.tsx
    - src/components/shared/Footer.tsx
    - src/components/sections/FeaturedProductsSection.tsx
decisions:
  - "Mantenuto l'item 'Pagamento sicuro' (4 trust card) modificando solo la description, per non sbilanciare la griglia md:grid-cols-4"
  - "Tab 'Novita' filtra category=sandali sfruttando il filtro gerarchico esistente che include classici/gioiello/bambini"
metrics:
  duration: ~5min
  completed: 2026-05-19
  tasks: 3
  files: 3
---

# Phase quick-260519-iah Plan 01: Rimozione menzioni PayPal e filtro carosello Novita Summary

Rimosse le menzioni PayPal da TrustStripSection e Footer e ristretto il carosello "Novita" della homepage ai soli sandali tramite il param `category=sandali` su `/api/products`.

## What Was Built

- **TrustStripSection**: la `description` dell'item "Pagamento sicuro" passa da "Carta di credito, PayPal, bonifico" a "Carta di credito, bonifico, contrassegno". L'item resta presente, la griglia mantiene 4 trust card e il layout `md:grid-cols-4` invariato.
- **Footer**: la costante `PAYMENT_METHODS` perde la stringa `"PayPal"` e diventa `["Visa", "Mastercard", "Contrassegno"] as const`. La riga di badge nella bottom bar usa flex+gap, quindi 3 badge restano bilanciati senza modifiche di stile.
- **FeaturedProductsSection**: in `fetchProducts`, quando il tab attivo e' "nuove" viene aggiunto `params.set("category", "sandali")`. La fetch chiama `/api/products?...&category=sandali`; `buildProductWhere` lato server filtra la categoria "sandali" e tutte le sue discendenti (classici, gioiello, bambini). Il tab "bestseller" resta invariato.

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Rimuovere menzioni PayPal da TrustStripSection e Footer | 08d0000 | TrustStripSection.tsx, Footer.tsx |
| 2 | Filtrare il carosello Novita per categoria sandali | ae1f590 | FeaturedProductsSection.tsx |
| 3 | Checkpoint verifica visiva | (checkpoint) | — verificato e approvato dall'utente |

## Verification

- `grep -ri "paypal"` su TrustStripSection.tsx e Footer.tsx: nessuna occorrenza.
- `grep -n 'params.set("category", "sandali")'` su FeaturedProductsSection.tsx: presente (riga 117).
- Typecheck: nessun errore nei tre file modificati dal piano (`pnpm typecheck` filtrato sui file del piano = pulito).
- Verifica visiva del checkpoint umano: approvata dall'utente.

## Deviations from Plan

None - plan executed exactly as written.

## Deferred Issues

`pnpm typecheck` (eseguito per la verifica del piano) riporta errori pre-esistenti in file NON toccati da questo piano. Sono fuori scope e tracciati in `deferred-items.md`:

- `src/lib/validators/auth.ts` (Zod overload `errorMap`)
- `src/routes/api/admin/media.$id.ts` (import inutilizzato)
- `src/routes/api/admin/products.ts` e `src/routes/api/products.ts` (`compareAtPrice` null vs undefined)

Da risolvere con una quick fix separata. Si conferma inoltre che `pnpm lint` resta non eseguibile (biome.json incompatibile con Biome 2.x — deferred gia' noto da plan precedenti).

## Self-Check: PASSED

- FOUND: src/components/sections/TrustStripSection.tsx
- FOUND: src/components/shared/Footer.tsx
- FOUND: src/components/sections/FeaturedProductsSection.tsx
- FOUND: commit 08d0000
- FOUND: commit ae1f590
