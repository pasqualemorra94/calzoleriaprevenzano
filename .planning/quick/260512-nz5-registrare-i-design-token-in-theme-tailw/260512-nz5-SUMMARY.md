---
phase: quick
plan: 260512-nz5
subsystem: ui
tags: [tailwindcss, design-tokens, typography, css, theme]

requires:
  - phase: quick/260512-nvl
    provides: pesi 500/600 di Inria Sans caricati (font-medium/font-semibold non più faux-bold)
provides:
  - "Token tipografici registrati in @theme Tailwind v4 (--font-display/--font-body, --text-xs..7xl con line-height accoppiati, --color-*)"
  - "Utility Tailwind reali: font-display/font-body, text-xs..text-7xl derivate dai token, bg-primary/text-accent/border-border ecc."
  - "Scala alta 2xl→7xl ammorbidita (titoli non crescono vs prima)"
  - "@layer base h1-h6 riallineato alla nuova scala (h1→5xl, h2→3xl, h3→2xl, h4→xl, h5→lg, h6→base)"
affects: [sweep heading sezioni, admin/auth token alignment, --spacing-*/--radius- in @theme]

tech-stack:
  added: []
  patterns:
    - "Tailwind v4 @theme come unica fonte di verità per i token che devono generare utility (font, text scale, colori)"

key-files:
  created: []
  modified:
    - src/styles/design-tokens.css

key-decisions:
  - "@theme posizionato in design-tokens.css PRIMA del :root, in modo da overrideare la scala text-* di default e abilitare le utility — i :root mantengono solo i token NON in @theme (--space-*, --radius-*, shadow, transition, z-index, tracking, leading, layout, stitch, font-weights)"
  - "Scala 2xl→7xl ammorbidita con clamp() meno estremi calibrati sull'uso de-facto delle sezioni; xs/sm/base/lg/xl sostanzialmente invariati"
  - "L'@layer base h1-h6 risiede in design-tokens.css, non in app.css come indicato nel plan — modificato lì (deviazione Rule 3)"
  - "--text-* e --color-* rimossi dal :root per evitare duplicati; @theme li espone comunque come CSS var (var(--text-lg) ecc.) quindi i ~43 usi text-[var(--text-*)] continuano a funzionare"

patterns-established:
  - "Token-driven Tailwind utilities: aggiungere nuovi token che devono generare utility va fatto in @theme, non in :root"

requirements-completed: [QUICK-260512-nz5]

duration: ~10min
completed: 2026-05-12
---

# Quick 260512-nz5: Design token in @theme Tailwind v4 Summary

**Token tipografici (Cormorant/Inria + scala text-* fluida con line-height accoppiati + colori) registrati in `@theme` Tailwind v4 con scala alta 2xl→7xl ammorbidita; `@layer base` h1-h6 riallineato — niente componenti React nuovi.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-12
- **Completed:** 2026-05-12
- **Tasks:** 2 auto completati (Task 3 = checkpoint:human-verify, in attesa)
- **Files modified:** 1 (`src/styles/design-tokens.css`)

## Accomplishments
- Blocco `@theme` aggiunto a `design-tokens.css` con `--font-display`/`--font-body`, le 10 size `--text-xs..--text-7xl` ciascuna con `--text-N--line-height`, e tutte le `--color-*`
- Scala alta `2xl→7xl` ammorbidita (clamp meno estremi) per non far crescere i titoli del frontend rispetto a oggi
- `--text-*` e `--color-*` rimossi dal `:root` (nessun duplicato; unica fonte di verità in `@theme`)
- `@layer base` h1-h6 riallineato: h1→5xl, h2→3xl, h3→2xl, h4→xl, h5→lg, h6→base
- Ora le ~94 className `font-display` (e `font-body`) funzionano davvero (i ~17 elementi decorativi non-heading renderizzano in Cormorant invece di Inria)
- Typecheck baseline invariato (25 → 25, zero regressioni)

## Task Commits

1. **Task 1: blocco @theme (font + scala tipografica ammorbidita + colori)** - `9d77348` (feat)
2. **Task 2: @layer base h1-h6 allineato alla nuova scala** - `c53fd8e` (refactor)

**Plan metadata:** _(commit docs separato dopo SUMMARY)_

## Files Created/Modified
- `src/styles/design-tokens.css` - aggiunto blocco `@theme` (font families, scala `--text-*` con line-height, colori); rimossi `--text-*`/`--color-*` duplicati dal `:root`; `@layer base` h1-h6 rimappato sulla nuova scala

## Decisions Made
- `@theme` posizionato in `design-tokens.css` prima del `:root` (i due coesistono): override della scala `text-*` default di Tailwind + abilitazione di `font-display`/`font-body`/`bg-primary` ecc.
- Mantenuti `xs/sm/base/lg/xl` sostanzialmente come prima; ammorbiditi solo `2xl→7xl` (criterio: titoli non crescono vs oggi)
- `@layer base` h1-h6 vive in `design-tokens.css` (non `app.css`, che è solo 2 `@import`) → modificato lì invece che in `app.css`

## Deviations from Plan

### Adattamento (Rule 3 - file di destinazione errato nel plan)

**1. [Rule 3 - Blocking/plan inaccuracy] `@layer base` h1-h6 in `design-tokens.css`, non `app.css`**
- **Found during:** Task 2
- **Issue:** Il plan indica `src/styles/app.css` come file da modificare per `@layer base` h1-h6, ma `app.css` contiene solo `@import "tailwindcss"; @import "./design-tokens.css";`. Il vero `@layer base { h1..h6 }` è in `design-tokens.css`.
- **Fix:** Modificato `@layer base` h1-h6 in `src/styles/design-tokens.css` (h1→5xl, h2→3xl, h3→2xl, h4→xl, h5→lg, h6→base). Il mapping richiesto dal plan è applicato esattamente; cambia solo il file fisico.
- **Files modified:** src/styles/design-tokens.css
- **Verification:** `grep "h[1-6].*text-" src/styles/design-tokens.css` mostra il mapping corretto; typecheck 25→25.
- **Committed in:** c53fd8e (Task 2 commit)

---

**Total deviations:** 1 adattamento (file di destinazione corretto vs plan).
**Impact on plan:** Nessuno scope creep. Tutti gli obiettivi/mapping del plan raggiunti; cambia solo dove fisicamente vive `@layer base`. `app.css` non andava toccato.

## Issues Encountered
- `pnpm build` fallisce sui 25 errori `tsc` pre-esistenti (out-of-scope: `scripts/*`, `validators/auth`, `api/admin/products`, `api/products`, `api/admin/media.$id`) — è la baseline nota, non una regressione delle modifiche CSS. Come previsto dal plan, build verificata al deploy Railway. `pnpm typecheck` confermato 25→25.

## Known Stubs
Nessuno stub introdotto.

## User Setup Required
None - nessuna configurazione di servizi esterni richiesta. (Deploy Railway eseguirà il build con le nuove utility CSS generate.)

## Follow-ups (non in scope, da plan)
- Sweep mirato dei ~166 heading di sezione con classi disomogenee (`text-[var(--text-lg)] md:text-[var(--text-xl)]`, `text-[1.3rem]`, `text-base`, `text-[13px]`, ...) — eventuale componente leggero `SectionTitle`/`Eyebrow`
- Pulizia caso-per-caso delle ~975 utility `text-*` fisse (ora già più coerenti perché derivano dai token)
- Pagine `/admin/*` e `/auth/*`: usano `text-gray-900` ecc. → task separato
- `--space-*` → `--spacing-*` (namespace Tailwind v4) e/o `--radius-*` in `@theme` — basso valore finché il codice usa `var(--space-md)` arbitrario; deciso di NON farlo ora

## Next Phase Readiness
- Token tipografici e colori ora generano utility Tailwind reali — base pronta per lo sweep heading e per l'allineamento admin/auth.
- **Blocker:** Task 3 è un checkpoint `human-verify` (blocking). Serve ispezione visiva post-deploy (mobile ~375px / tablet ~768px / desktop ~1280px): titolo hero non più grande di prima, titoli di sezione coerenti, elementi `font-display` decorativi ora in Cormorant. Se i clamp risultano troppo grandi/piccoli, vanno rifiniti.

## Self-Check: PASSED

- `src/styles/design-tokens.css` — FOUND
- `260512-nz5-SUMMARY.md` — FOUND
- Commit `9d77348` (Task 1) — FOUND
- Commit `c53fd8e` (Task 2) — FOUND

---
*Phase: quick/260512-nz5*
*Completed: 2026-05-12*
