---
phase: quick-260519-kz8
plan: 01
subsystem: ui
tags: [homepage, react, tanstack-router, mobile, barrel-export]

# Dependency graph
requires:
  - phase: quick-260519-iah
    provides: FeaturedProductsSection ("Novita e bestseller") con carosello ristretto ai sandali
provides:
  - Homepage senza la sezione mobile-only buggata "Sandali in evidenza"
  - Barrel src/components/sections/index.ts senza export MobileQuickShop
affects: [homepage, sezioni-mobile]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/routes/index.tsx
    - src/components/sections/index.ts
  deleted:
    - src/components/sections/MobileQuickShop.tsx

key-decisions:
  - "Rimozione completa (file + export + render) invece di hide condizionale: la sezione mostrava prodotti errati e non aveva valore residuo"
  - "Endpoint condiviso /api/products lasciato intatto: usato da catalogo e altri componenti"

patterns-established: []

requirements-completed: [KZ8-01]

# Metrics
duration: 13min
completed: 2026-05-19
---

# Phase quick-260519-kz8: Elimina sezione mobile "Sandali in evidenza" Summary

**Rimossa dalla homepage la sezione mobile-only `MobileQuickShop` ("Sandali in evidenza") che mostrava prodotti errati — eliminati file componente, export dal barrel e render nella route.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-05-19T13:08:00Z
- **Completed:** 2026-05-19T13:21:00Z
- **Tasks:** 2
- **Files modified:** 3 (2 modificati, 1 eliminato)

## Accomplishments
- La sezione mobile-only `<section ... md:hidden aria-label="Sandali in evidenza">` non viene piu renderizzata sulla homepage in nessun viewport
- `MobileQuickShop` rimosso dall'import named e dal JSX di `HomePage` in `src/routes/index.tsx`
- Export `MobileQuickShop` rimosso dal barrel `src/components/sections/index.ts`
- File componente `src/components/sections/MobileQuickShop.tsx` (185 LOC) eliminato — nessun import morto, nessun export pendente
- `FeaturedProductsSection` ("Novita e bestseller") e tutte le altre sezioni della homepage restano invariati

## Task Commits

Each task was committed atomically:

1. **Task 1: Rimuovere MobileQuickShop dalla homepage e dal barrel** - `e02744d` (fix)
2. **Task 2: Eliminare il file del componente e verificare build** - `b89ce69` (fix)

## Files Created/Modified
- `src/routes/index.tsx` - Tolto `MobileQuickShop` dal blocco di import named e dal JSX di `HomePage`
- `src/components/sections/index.ts` - Rimosso `export { MobileQuickShop } from "./MobileQuickShop"`
- `src/components/sections/MobileQuickShop.tsx` - Eliminato (componente dedicato, nessun altro consumatore)

## Decisions Made
- Rimozione completa invece di hide condizionale: la sezione mostrava prodotti errati (articoli Saphir per la cura delle scarpe invece di sandali) e non aveva valore residuo da preservare.
- Endpoint condiviso `/api/products` non toccato: e usato dal catalogo e da altri componenti; `MobileQuickShop` lo consumava client-side via `fetch` ma senza loader/server-fn dedicato.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `pnpm typecheck` riporta 25 errori pre-esistenti (`scripts/*`, `admin-functions.ts`, `product-functions.ts`, `validators/auth.ts`, `api/admin/media.$id.ts`, `api/admin/products.ts`, `api/products.ts`) — baseline nota e fuori scope per CLAUDE.md scope boundary. Nessuno riguarda `index.tsx`, il barrel o `MobileQuickShop`. Zero regressioni introdotte da questo piano.
- `pnpm lint` non eseguibile: `biome.json` incompatibile con Biome 2.x (chiavi sconosciute `ignoreUnknown`/`includes`/`experimentalScannerIgnores`). Problema project-wide pre-esistente e gia documentato come deferred — non e un fallimento di questo task. `pnpm typecheck` resta il gate autoritativo.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Homepage pulita, una sola sezione prodotti mobile/desktop attiva (`FeaturedProductsSection`).
- Nessun blocker.

## Self-Check: PASSED

- FOUND: 260519-kz8-SUMMARY.md
- FOUND: src/routes/index.tsx
- FOUND: src/components/sections/index.ts
- FOUND (deleted): src/components/sections/MobileQuickShop.tsx
- FOUND: commit e02744d (Task 1)
- FOUND: commit b89ce69 (Task 2)

---
*Phase: quick-260519-kz8*
*Completed: 2026-05-19*
