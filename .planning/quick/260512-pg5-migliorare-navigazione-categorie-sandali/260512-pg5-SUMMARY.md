---
phase: quick
plan: 260512-pg5
subsystem: ui
tags: [search-overlay, navigation, mobile, categories]

provides:
  - "Overlay di ricerca mobile: card 'Sandali' in 'Sfoglia per categoria' espandibile al tap → mostra le sotto-categorie come pillole cliccabili + 'Vedi tutti i sandali'"
  - "Nuovo componente riusabile src/components/shared/CategoryBrowseList.tsx (186 LOC)"
affects: [eventuali chip sotto-categoria sulla pagina /catalogo da mobile (follow-up), mega-menu desktop SHOP (non toccato)]

key-files:
  created:
    - src/components/shared/CategoryBrowseList.tsx
  modified:
    - src/components/shared/MobileSearchOverlay.tsx
    - src/components/shared/index.ts

key-decisions:
  - "L'overlay con 'Sfoglia per categoria' / 'Più cercati' è MobileSearchOverlay.tsx (mobile-only md:hidden, montato in __root.tsx, aperto via evento open-mobile-search da MobileBottomNav) — NON QuickSearch.tsx (che è solo un dropdown autocomplete)"
  - "Le 3 card categoria erano un array hardcoded (SUGGESTED_CATEGORIES); le sotto-categorie ora vengono da fetch /api/categories al mount (AbortController), shape gerarchica già disponibile (children[].slug + productCount) — nessun cambio DB/API"
  - "Solo la card 'Sandali' (gating per slug) si espande; Pelletteria/Accessori restano <Link> diretti come prima (scelta utente)"
  - "Estratto il blocco 'Sfoglia per categoria' in CategoryBrowseList.tsx per stare entro i 200 LOC del CLAUDE.md (MobileSearchOverlay 405 → 349 LOC)"

requirements-completed: [QUICK-260512-pg5]

duration: ~10min
completed: 2026-05-12
---

# Quick 260512-pg5: Sotto-categorie Sandali espandibili nell'overlay di ricerca mobile — Summary

**Nell'overlay di ricerca mobile (sezione "Sfoglia per categoria"), la card "Sandali" si espande al tap mostrando le sotto-categorie dei sandali come pillole `<Link>` + "Vedi tutti i sandali"; Pelletteria/Accessori invariati; blocco estratto nel nuovo `CategoryBrowseList`.**

## Accomplishments
- Nuovo `src/components/shared/CategoryBrowseList.tsx` (186 LOC): rende la lista "Sfoglia per categoria"; per la sola categoria `sandali` un `<button aria-expanded>` (chevron `ChevronRight` che ruota di 90°) espande sul posto le sotto-categorie come pillole `<Link to="/catalogo" search={{ category: child.slug }}>` (`flex-wrap`, touch target comodi) + voce "Vedi tutti i sandali" (→ `/catalogo?category=sandali`). I `children` di `sandali` vengono da `fetch("/api/categories")` al mount con `AbortController`; fallback degradato (solo "Vedi tutti i sandali") finché i dati non arrivano. Le altre categorie restano `<Link>` diretti. `onNavigate` callback chiude l'overlay al click.
- `MobileSearchOverlay.tsx`: montato `<CategoryBrowseList onNavigate={close} />` al posto del vecchio markup + costanti estratte; sezione "Più cercati" e logica di ricerca invariate. 405 → 349 LOC.
- `src/components/shared/index.ts`: aggiunto export di `CategoryBrowseList`.

## Task Commits
1. **Task 1: CategoryBrowseList con card Sandali espandibile** — `802bfa6` (feat)
2. **Task 2: monta CategoryBrowseList in MobileSearchOverlay + rimuove codice estratto** — `9e929fc` (refactor)

## Verification
- `npx tsc --noEmit`: nessun errore nuovo nei file toccati; baseline pre-esistente (25 errori out-of-scope: scripts/*, validators/auth, api/admin/products, api/products, api/admin/media.$id) invariata.
- LOC: `CategoryBrowseList.tsx` = 186 (≤ 200); `MobileSearchOverlay.tsx` calato di 56 LOC.
- Checkpoint human-verify (Task 3): smoke mobile ~375px eseguito e **approvato dall'utente** (tap "Sandali" → espande con pillole + "Vedi tutti i sandali"; tap sotto-categoria → listing giusta + overlay chiuso; ri-tap richiude; Pelletteria/Accessori invariati; desktop non toccato).

## Issues Encountered
- `npx biome check` fallisce a livello globale: il `biome.json` del repo contiene chiavi sconosciute (`ignoreUnknown`, `includes`, `experimentalScannerIgnores`) → `biome check` errora su qualsiasi file. Problema PRE-ESISTENTE fuori scope; annotato in `deferred-items.md`. Lint deferito al CI Railway.

## Deviations from Plan
Nessuna deviazione sostanziale. Il file dell'overlay confermato come `MobileSearchOverlay.tsx` (il plan lo aveva già identificato come ipotesi principale). Nessun nuovo `any`, nessun cambio DB/API.

## Follow-ups (non in scope)
- Eventuali chip/pillole sotto-categoria sulla pagina `/catalogo` da mobile (oggi le sotto-categorie sulla listing sono solo dentro il pannello "Filtri"/CatalogSidebar).
- `biome.json` da sistemare (chiavi non riconosciute) — pre-esistente, fuori scope.

## Self-Check: PASSED
- `src/components/shared/CategoryBrowseList.tsx` — FOUND
- Commit `802bfa6` (Task 1) — FOUND
- Commit `9e929fc` (Task 2) — FOUND
- Checkpoint Task 3 — approvato dall'utente

---
*Phase: quick/260512-pg5*
*Completed: 2026-05-12*
