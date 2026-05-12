---
phase: quick-260512-nvl
plan: 01
subsystem: ui
tags: [fonts, typography, bunny-fonts, inria-sans, tanstack-start]

requires: []
provides:
  - "Inria Sans caricato con pesi 300;400;500;600;700 (upright) — niente faux-bold su font-medium/font-semibold del body"
affects: []

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/routes/__root.tsx

key-decisions:
  - "Aggiunti solo i pesi upright 500/600; gli stili italic 500/600 non servono (il body non usa medium/semibold corsivo)"

patterns-established: []

requirements-completed: [QUICK-260512-NVL]

duration: ~4min
completed: 2026-05-12
---

# Quick 260512-nvl: Pesi 500 e 600 di Inria Sans Summary

**Aggiunti i pesi 500 (medium) e 600 (semibold) ai link bunny.net di Inria Sans in `__root.tsx`, eliminando la sintesi faux-bold su `font-medium`/`font-semibold` nel body text.**

## Performance

- **Duration:** ~4 min
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Link preload Inria Sans: `wght@300;400;700` → `wght@300;400;500;600;700`
- Link stylesheet combinato: segmento `inria-sans:ital,wght@0,300;0,400;0,700;...` → `...;0,400;0,500;0,600;0,700;...` (lista upright)
- Cormorant Garamond invariato byte-per-byte

## Task Commits

1. **Task 1: Add wght 500 and 600 to the Inria Sans bunny.net font links** - `e7abce8` (feat)

## Files Created/Modified
- `src/routes/__root.tsx` - aggiornati i due `<link>` font di Inria Sans (preload + stylesheet combinato)

## Decisions Made
- Solo pesi upright 500/600 aggiunti — l'italic medium/semibold non è usato nel body, quindi la lista `1,xxx` resta invariata (come da plan).

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None. Typecheck baseline invariato a 25 errori (tutti pre-esistenti in `scripts/*` e `routes/api/*`, fuori scope per CLAUDE.md). Nessun errore nuovo su `__root.tsx`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Modifica completa. Effetto visibile post-deploy: le risposte CSS bunny.net includeranno i blocchi `@font-face` `font-weight: 500` e `600` per Inria Sans.

## Self-Check: PASSED

- `src/routes/__root.tsx` — present, contains `inria-sans:wght@300;400;500;600;700` and `inria-sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,700`
- Commit `e7abce8` — present in git log
- SUMMARY.md — present

---
*Phase: quick-260512-nvl*
*Completed: 2026-05-12*
