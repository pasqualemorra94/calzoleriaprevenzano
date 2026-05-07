---
phase: 260507-ucj
plan: 01
subsystem: catalogo
tags: [ux, scroll-behavior, transitions, motion-safe, accessibility, design-tokens]
requires: []
provides:
  - "scroll-to-top automatico al cambio page/categoria/query/sort sul catalogo"
  - "feedback hover/click smussato su card prodotto e bottoni paginazione catalogo"
  - "rispetto prefers-reduced-motion su tutte le micro-trasformazioni introdotte"
affects:
  - src/routes/catalogo.tsx
  - src/components/catalog/CatalogProductCard.tsx
tech_stack:
  added: []
  patterns:
    - "useRef<HTMLDivElement> + isFirstRender ref-flag per skippare scroll su SSR/hydration"
    - "window.scrollTo({behavior: 'smooth' | 'auto'}) con offset navbar invece di scrollIntoView (più affidabile con overflow-x:hidden globale)"
    - "transition-[prop1,prop2] esplicite invece di transition-all (perf + niente effetti collaterali)"
    - "easing cubic-bezier dei design token (--transition-base/--transition-slow) applicato manualmente con classe Tailwind ease-[...] perché transition-duration non accetta token combinati durata+easing"
    - "motion-safe: prefix solo sui transform (scale/translate) e non sui colori — coerente col fatto che reduced-motion riguarda movimento, non cambi cromatici"
key_files:
  created: []
  modified:
    - src/routes/catalogo.tsx
    - src/components/catalog/CatalogProductCard.tsx
decisions:
  - "Ref attaccato al wrapper `min-w-0 flex-1` invece che alla griglia: il wrapper è stabile in tutti gli stati (loading skeleton / loaded StaggeredGrid / vuoto), mentre la griglia stessa cambia tipo tra skeleton e loaded e perderebbe il ref a metà transizione."
  - "Trigger su [page, activeCategory, query, sort] invece che solo su [page]: copre paginazione + cambio categoria + nuova ricerca + cambio sort senza necessità di handler dedicati su ogni evento. Sfrutta le stesse 4 deps di fetchProducts."
  - "isFirstRender ref-flag invece di useEffect-with-empty-deps: l'utente che arriva con `?page=2&category=sandali` non deve essere buttato giù né su; il flag scatta ON-MOUNT-only e abilita lo scroll dal secondo render in poi."
  - "Offset navbar di 96px sottratto dal getBoundingClientRect().top: l'utente atterra sull'intestazione 'X prodotti per...' invece di vedere la navbar fissa coprire il titolo."
  - "window.scrollTo invece di el.scrollIntoView: scrollIntoView ignora `scroll-behavior: smooth` su alcuni browser quando il container ha `overflow-x: hidden` (che html/body hanno qui). scrollTo con offset calcolato è cross-browser stabile."
  - "duration-250 → duration-[250ms] (Rule 1 - bug): il plan suggeriva `duration-250` ma Tailwind v4 non ha questa scala (default: 75/100/150/200/300/500/700/1000) e silently produce nessuna durata. duration-[var(--transition-base)] non funziona perché il token contiene durata+easing combinati ('250ms cubic-bezier(...)') e transition-duration rifiuta valori non puri-tempo. Usato `duration-[250ms]` direttamente per matchare l'intent del plan."
  - "motion-safe: applicato a SCALE/TRANSLATE ma NON a opacity/colore/shadow: coerente col significato di prefers-reduced-motion (riduzione movimento, non cambi cromatici/illuminazione). Con reduced-motion attivo l'utente vede comunque feedback hover (colore + ombra + opacity) ma senza scale né translate."
  - "Velocità mantenute identiche al pre-task (l'utente le trova adeguate): cambiati SOLO l'easing (cubic-bezier dei token vs 'ease' default di Tailwind) e l'esplicitazione delle proprietà (transition-all → transition-[transform,opacity] etc). Click feedback resta a 150ms = `--transition-fast`."
  - "active:scale-[0.985] sulle card e active:scale-[0.96] sui bottoni paginazione: scale quasi impercettibili (1.5% / 4%) per dare 'cedevole' al tap senza bounce/snap. disabled:active:scale-100 sui bottoni prev/next disabilitati per non far sembrare cliccabili."
metrics:
  duration_seconds: 381
  duration_human: "6m 21s"
  tasks: 2
  commits: 2
  files_modified: 2
  files_created: 0
  loc_added: 41
  loc_removed: 12
  typecheck_baseline: 25
  typecheck_after: 25
  any_introduced: 0
completed: "2026-05-07T20:23:35Z"
---

# Quick Task 260507-ucj: Scroll-to-top + transizioni catalogo Summary

Eliminate due frizioni UX nel catalogo prodotti: (1) scroll-to-top automatico alla griglia su cambio pagina/categoria/query/sort, (2) easing coerente sui design token + feedback `:active` morbido su card prodotto e bottoni paginazione, sempre rispettando `prefers-reduced-motion`.

## Files Modified

| File | Changes | Purpose |
|------|---------|---------|
| `src/routes/catalogo.tsx` | +33/-5 | useRef HTMLDivElement + isFirstRender flag + useEffect scroll-to-top su [page,activeCategory,query,sort] + ref attaccato al wrapper main; bottoni paginazione prev/next/numerici con easing cubic-bezier + motion-safe:active:scale + disabled:active:scale-100 |
| `src/components/catalog/CatalogProductCard.tsx` | +7/-7 | <article> root con motion-safe:active:scale-[0.985]; shadow + img scale + pill + overlay + bordo + h3 con easing cubic-bezier dei design token; transition-all sostituito con transition-[transform,opacity] esplicito; motion-safe: applicato ai soli transform |

## Commits

| Hash | Message |
|------|---------|
| `e9f2927` | feat(260507-ucj): scroll-to-top griglia prodotti su cambio page/filtri |
| `77439a0` | feat(260507-ucj): smussa hover/click su CatalogProductCard + paginazione catalogo |

## Verification

- **Typecheck:** baseline 25 → 25 (zero regressioni). Gli 11 errori pre-esistenti (scripts/* + admin-functions:21,77 + product-functions:80 + validators/auth:35,38 + api/admin/products:51 + api/products:52 + api/admin/media.$id:8) restano invariati e fuori scope come da CLAUDE.md scope boundary.
- **Zero `any`:** verificato `grep -nE ": any|as any|<any>"` su entrambi i file → 0 hit.
- **Zero hex inline:** tutti i colori già da design tokens, nessuno introdotto.
- **Design tokens preservati:** `--transition-base`, `--transition-slow`, `--transition-fast` referenziati correttamente; nessun nuovo token CSS.
- **Biome check:** non eseguibile in questa sessione per problema pre-esistente di config (`biome.json` ha la chiave `ignore` non riconosciuta dalla versione installata di Biome — config-format mismatch dal commit `4064639` di foundation, fuori scope quick task). I file rispettano la convention del progetto (2-space indent, double quotes, semicolons always).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `duration-250` → `duration-[250ms]` su CatalogProductCard.tsx riga 53**
- **Found during:** Task 2 (immediate review post-edit)
- **Issue:** Il plan istruiva di usare `duration-250` come durata del bordo accent. Tailwind v4 non ha `duration-250` nello scale di default (gli step sono 75/100/150/200/300/500/700/1000) e nessun custom theme override è presente in `src/styles/`. La classe sarebbe stata silenziosamente ignorata, lasciando una durata di transizione "0s" sulla proprietà `border-color`.
- **Alternative considerata:** `duration-[var(--transition-base)]`. Scartata perché i token `--transition-*` in `design-tokens.css` (riga 124-127) contengono durata+easing combinati (`'250ms cubic-bezier(0.4, 0, 0.2, 1)'`). Tailwind, generando `transition-duration: 250ms cubic-bezier(...)`, produrrebbe CSS invalido (transition-duration accetta solo valori `<time>` puri). Il browser scarterebbe la dichiarazione.
- **Fix:** Usato `duration-[250ms]` con valore numerico puro tra parentesi quadre — coerente con l'intent del plan ("base" = 250ms) e CSS-valido. L'easing è già fornito esplicitamente dalla classe `ease-[cubic-bezier(0.4,0,0.2,1)]` adiacente.
- **Files modified:** `src/components/catalog/CatalogProductCard.tsx`
- **Commit:** `77439a0` (incluso nello stesso commit di Task 2)
- **Nota:** lo stesso anti-pattern `duration-[var(--transition-slow)]` è presente sull'`<img>` riga 31 dal commit foundation; è invariato (fuori scope quick task come da scope boundary CLAUDE.md). Probabilmente quella transizione non sta funzionando come previsto da prima del task. Loggato in `deferred-items.md`.

Nessuna deviazione Rule 2/3/4. Plan eseguito esattamente come scritto, ad eccezione della correzione ortogonale del bug Rule 1 sopra.

## Snippet "before/after"

### Card prodotto — pill "Vedi dettaglio" (riga 44)

**Before:**
```tsx
<div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full
                justify-center p-4 opacity-0 transition-all duration-300
                group-hover:translate-y-0 group-hover:opacity-100">
```

**After:**
```tsx
<div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full
                justify-center p-4 opacity-0 transition-[transform,opacity] duration-300
                ease-[cubic-bezier(0.22,1,0.36,1)]
                motion-safe:group-hover:translate-y-0 group-hover:opacity-100">
```

**Cambi:**
1. `transition-all` → `transition-[transform,opacity]` — anima solo le 2 proprietà che cambiano davvero, evita effetti collaterali (es. shadow del parent in cascade) e migliora la perf.
2. Aggiunto `ease-[cubic-bezier(0.22,1,0.36,1)]` — curva "expo-out" che parte veloce e rallenta dolcemente in chiusura, coerente con `--transition-slow`/`--transition-reveal` dei design token.
3. `group-hover:translate-y-0` → `motion-safe:group-hover:translate-y-0` — utenti con prefers-reduced-motion vedono solo il fade, niente più slide-up. `opacity` resta sempre attiva (motion-safe non si applica all'opacity perché reduced-motion riguarda movimento, non opacità).

### Catalogo paginazione — bottone numerico (riga ~340)

**Before:**
```tsx
className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]
            text-sm font-medium transition-colors ${...}`}
```

**After:**
```tsx
className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]
            text-sm font-medium transition-[background-color,color,transform]
            duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
            motion-safe:active:scale-[0.96] ${...}`}
```

**Cambi:**
1. `transition-colors` → `transition-[background-color,color,transform]` — esplicita le proprietà incluso `transform` per il feedback `:active:scale`.
2. `duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]` — curva "linear-out" coerente con `--transition-base`/`--transition-fast`, durata quasi impercettibile (200ms) per non rallentare il click.
3. `motion-safe:active:scale-[0.96]` — feedback "cedevole" al click (4% scale-down) solo per chi non ha reduced-motion. Senza questo, il click su un numero di pagina è "deaf" (nessun feedback prima dello scroll-to-top).

## Manual Verification (post-deploy)

L'utente deve verificare smoke browser su Railway:

1. **Scroll-to-top:**
   - `/catalogo`, scroll giù, click "Pagina successiva" → viewport torna su "X prodotti".
   - Cambio categoria sidebar mentre in fondo → scroll su.
   - Cambio sort → scroll su.
   - Apri direttamente `/catalogo?page=2` → nessuno scroll forzato.
   - macOS Reduce Motion attivo → scroll istantaneo, non animato.

2. **Transizioni:**
   - Hover lento card: shadow + scale + pill + colore titolo entrano coerenti, niente scatti.
   - Tap/click sostenuto card: scale-down 0.985 percepibile.
   - Click numero pagina: scale-down 0.96 brevissimo.
   - DevTools → Inspect card → cerca `transition-all` → non deve esistere.
   - Reduce Motion attivo: niente più scale né translate al hover/click; restano opacity, shadow, colore.

## Self-Check: PASSED

- [x] `src/routes/catalogo.tsx` modificato (verificato `git log -p --since='10 minutes ago' -- src/routes/catalogo.tsx`)
- [x] `src/components/catalog/CatalogProductCard.tsx` modificato (verificato `git log -p --since='10 minutes ago' -- src/components/catalog/CatalogProductCard.tsx`)
- [x] Commit `e9f2927` esiste: `git log --oneline | grep e9f2927` → FOUND
- [x] Commit `77439a0` esiste: `git log --oneline | grep 77439a0` → FOUND
- [x] Typecheck baseline 25 = post 25, zero errori sui due file toccati
- [x] Zero `any` introdotti (grep verificato)
- [x] Plan execution complete: 2/2 tasks
