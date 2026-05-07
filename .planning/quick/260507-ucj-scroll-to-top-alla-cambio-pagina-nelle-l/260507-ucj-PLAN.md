---
phase: 260507-ucj
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/routes/catalogo.tsx
  - src/components/catalog/CatalogProductCard.tsx
autonomous: true
requirements:
  - UCJ-01  # scroll-to-top sul cambio pagina/filtri nel catalogo
  - UCJ-02  # transizioni hover/click più fluide (no strappi) sulle card e sui controlli del catalogo

must_haves:
  truths:
    - "Quando l'utente clicca 'Pagina successiva' / 'Pagina precedente' / un numero di pagina nella paginazione del catalogo, la viewport torna automaticamente in cima alla griglia prodotti (non al top assoluto del documento) con uno scroll fluido."
    - "Quando l'utente cambia categoria / sort / esegue una nuova ricerca, la viewport torna in cima alla griglia prodotti."
    - "Lo scroll-to-top NON si attiva al primo mount / hydration (l'utente che arriva con `?page=2` non viene buttato giù né su per nulla)."
    - "L'hover su una card prodotto del catalogo ha transizioni morbide, senza scatti percepibili tra opacity / transform / shadow / colore."
    - "Cliccando una card prodotto o un bottone di paginazione, l'elemento dà un feedback visivo morbido (no snap brusco)."
    - "`prefers-reduced-motion: reduce` è rispettato: niente scroll animato, niente scale/translate sulle card."
  artifacts:
    - path: "src/routes/catalogo.tsx"
      provides: "Catalog page con ref alla griglia + effetto scroll-to-top dopo cambio filtri/page"
      contains: "useRef<HTMLDivElement>"
    - path: "src/components/catalog/CatalogProductCard.tsx"
      provides: "Card prodotto con transizioni hover/click smussate ed easing coerente con i token"
      contains: "motion-safe"
  key_links:
    - from: "src/routes/catalogo.tsx"
      to: "ref della griglia prodotti"
      via: "useEffect che si attiva su cambio fetchProducts deps (page/activeCategory/query/sort), saltando il primo mount"
      pattern: "scrollIntoView\\(|scrollTo\\("
    - from: "src/components/catalog/CatalogProductCard.tsx"
      to: "design tokens"
      via: "var(--transition-base) per hover, active:scale-[0.98]/active:opacity"
      pattern: "transition-(transform|colors|shadow|opacity)"
---

<objective>
Eliminare due frizioni UX nel catalogo prodotti:

1. **Scroll-to-top**: dopo che l'utente clicca avanti/indietro nella paginazione (o cambia categoria / sort / fa una nuova ricerca), la viewport deve riportarsi in cima alla griglia dei prodotti, non restare a metà pagina.

2. **Transizioni più fluide**: rendere hover e click su card prodotto e bottoni di paginazione "soft" — stessa velocità, ma con easing coerente (cubic-bezier dei design token), niente `transition-all`, e con un `:active` morbido invece di scatti improvvisi.

Purpose: il catalogo è il funnel principale di acquisto. Le frizioni durante browse/sfoglia abbassano la fiducia percepita nel brand artigianale.

Output: catalogo con paginazione che scrolla in alto dolcemente + card prodotto e bottoni con feedback hover/click smussati, sempre rispettando `prefers-reduced-motion`.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@src/routes/catalogo.tsx
@src/components/catalog/CatalogProductCard.tsx
@src/styles/design-tokens.css

<interfaces>
<!-- Stato chiave già presente in src/routes/catalogo.tsx -->
<!-- L'esecutore lavora su questi: NON serve esplorare oltre. -->

```ts
// src/routes/catalogo.tsx — stato esistente (NON cambiarlo, solo aggiungere ref + effect):
const [products, setProducts] = useState<ProductListItem[]>(ssrData.items);
const [page, setPage] = useState(ssrData.page);                  // ← cambia su click paginazione
const [query, setQuery] = useState(routeSearch.query ?? "");      // ← cambia su submit ricerca
const [activeCategory, setActiveCategory] = useState<string | undefined>(routeSearch.category);
const [sort, setSort] = useState<SortOption>(...);

const fetchProducts = useCallback(async () => { ... }, [page, activeCategory, query, sort]);
useEffect(() => { fetchProducts(); }, [fetchProducts]);
```

```css
/* src/styles/design-tokens.css — easing curves già definite, USARE QUESTE */
--transition-fast:  150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base:  250ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow:  350ms cubic-bezier(0.22, 1, 0.36, 1);
/* html { scroll-behavior: smooth } è già globale → window.scrollTo / scrollIntoView animano da soli */
```

```tsx
// src/components/catalog/CatalogProductCard.tsx — punti "scattosi" attuali da smussare:
// - transition-all duration-300        ← genericissimo, nessun easing → snappy
// - transition-shadow duration-300     ← nessun easing
// - transition-colors duration-200     ← nessun easing
// - nessun :active state sulle card    ← click "deaf"
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Scroll-to-top alla griglia prodotti dopo cambio page/filtri</name>
  <files>src/routes/catalogo.tsx</files>
  <action>
Implementa lo scroll-to-top in `src/routes/catalogo.tsx` (UCJ-01). NON toccare la logica di fetch/paginazione esistente — aggiungere solo: un ref + un useEffect dedicato + un flag "primo mount".

Step-by-step:

1. **Aggiungi import** `useRef` insieme a `useState, useEffect, useCallback` (riga 3 attuale).

2. **Crea il ref** subito dopo le useState esistenti (vicino a `loading`/`mobileFiltersOpen`):
   ```tsx
   const gridRef = useRef<HTMLDivElement>(null);
   const isFirstRender = useRef(true);
   ```
   Tipo esplicito `HTMLDivElement` — niente `any`.

3. **Aggiungi un useEffect** dopo `useEffect(() => { fetchProducts(); }, [fetchProducts])` (riga 93):
   ```tsx
   // Scroll-to-top della griglia su cambio page/categoria/query/sort.
   // Salta il primo render per non interferire con SSR/hydration.
   useEffect(() => {
     if (isFirstRender.current) {
       isFirstRender.current = false;
       return;
     }
     const el = gridRef.current;
     if (!el) return;

     const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
     // Calcola l'offset top dell'elemento, sottrai l'altezza della navbar così l'utente vede subito "X prodotti" senza il titolo coperto
     const navbarOffset = 96; // ~6rem buffer (navbar fissa) — spazio comodo
     const top = el.getBoundingClientRect().top + window.scrollY - navbarOffset;

     window.scrollTo({
       top: Math.max(0, top),
       behavior: prefersReduced ? "auto" : "smooth",
     });
   }, [page, activeCategory, query, sort]);
   ```
   Nota: si triggera sulle stesse 4 deps di `fetchProducts`, così copre paginazione + cambio categoria + ricerca + sort. Cambiare filtro mentre si è già a `page=1` (dove `setPage(1)` è no-op) viene comunque catturato perché ci sono activeCategory/query/sort nelle deps.

4. **Attacca il ref** al wrapper `<div className="min-w-0 flex-1">` (riga ~190 attuale) — questo è il contenitore di "X prodotti" + sort + griglia + paginazione, e resta stabile sia in stato loading che caricato che vuoto:
   ```tsx
   <div ref={gridRef} className="min-w-0 flex-1">
   ```
   NON attaccare al `<StaggeredGrid>` né alla skeleton grid: cambierebbe target tra loading e loaded.

5. NON usare `scrollIntoView` con `block: "start"`: su alcuni browser ignora `scroll-behavior: smooth` quando il container ha `overflow-x: hidden` (che `html, body` hanno qui — vedi design-tokens.css). `window.scrollTo({ behavior: "smooth" })` con offset calcolato è più affidabile.

6. NON aggiungere mai `any`. Mantieni `strict: true`. Usa `HTMLDivElement` come tipo del ref.

PERCHÉ questa scelta:
- Trigger su `[page, activeCategory, query, sort]` invece che solo su `[page]` → copre TUTTI i casi in cui il contenuto della griglia cambia, non solo paginazione.
- `isFirstRender` ref invece di `useEffect` con check `[]` deps → evita scroll su hydration / quando l'utente arriva con `?page=2&category=sandali`.
- Offset `navbarOffset = 96px` → l'utente atterra sulla intestazione "X prodotti per ..." e non sotto la navbar.
- `prefersReduced` check → niente animazione per chi l'ha disabilitato (rispetta UCJ-02 anche).
  </action>
  <verify>
    <automated>pnpm typecheck</automated>
    <!-- Verifica manuale dopo `pnpm dev`: -->
    <!-- 1. Vai su /catalogo, scrolla in basso fino al fondo, clicca "Pagina successiva" → la pagina deve scrollare in alto fino a "X prodotti" (non al top assoluto). -->
    <!-- 2. Cambia categoria mentre sei in fondo → scroll in alto. -->
    <!-- 3. Ricarica /catalogo?page=2 → NON deve scrollare al cambio iniziale. -->
    <!-- 4. Sistema con prefers-reduced-motion: reduce → scroll istantaneo, non animato. -->
  </verify>
  <done>
- `pnpm typecheck` passa (zero `any`, ref tipato `HTMLDivElement`)
- Click su paginazione/categoria/sort/ricerca → la viewport si riposiziona in cima alla griglia con scroll fluido
- Primo mount / arrivo diretto con `?page=N` → nessuno scroll forzato
- Sistema con reduced-motion → scroll istantaneo
  </done>
</task>

<task type="auto">
  <name>Task 2: Transizioni hover/click più fluide su CatalogProductCard + paginazione</name>
  <files>src/components/catalog/CatalogProductCard.tsx, src/routes/catalogo.tsx</files>
  <action>
Smussare gli "strappi" su hover e click delle card e dei bottoni di paginazione (UCJ-02). **Mantenere le velocità attuali** — l'utente le trova adeguate. Cambiare solo:
- l'easing (usare le curve dei design token, non `ease` di default)
- sostituire `transition-all` con proprietà esplicite (perf + niente effetti collaterali)
- aggiungere `:active` morbido sulle card e sui bottoni di paginazione (feedback al click senza snap)
- avvolgere le micro-trasformazioni in `motion-safe:` per `prefers-reduced-motion`

### A) `src/components/catalog/CatalogProductCard.tsx`

**Riga ~28** — wrapper immagine. Attuale:
```tsx
<div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)] transition-shadow duration-300 group-hover:shadow-[0_8px_30px_rgba(139,94,60,0.12)]">
```
Sostituisci con (aggiunge easing dei token + `motion-safe` + `:active` morbido sull'`<article>` parent — vedi sotto):
```tsx
<div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)] transition-shadow duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:shadow-[0_8px_30px_rgba(139,94,60,0.12)]">
```

**Riga ~30** — `<img>`. Attuale:
```tsx
className="h-full w-full object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-[1.05]"
```
Sostituisci (aggiungi `motion-safe:` al solo scale così con reduced-motion l'immagine resta ferma; l'easing è già nel token `--transition-slow`):
```tsx
className="h-full w-full object-cover transition-transform duration-[var(--transition-slow)] motion-safe:group-hover:scale-[1.05]"
```

**Riga ~44** — pill "Vedi dettaglio" (qui sta il maggior "strappo"). Attuale:
```tsx
<div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full justify-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
```
Sostituisci `transition-all` con proprietà esplicite (transform + opacity), aggiungi easing del token, e wrap in `motion-safe:` (utenti con reduced-motion vedono solo fade, niente translate):
```tsx
<div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full justify-center p-4 opacity-0 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:translate-y-0 group-hover:opacity-100">
```

**Riga ~51** — overlay primary tint. Attuale:
```tsx
<div className="absolute inset-0 bg-[var(--color-primary)]/0 transition-colors duration-300 group-hover:bg-[var(--color-primary)]/[0.03]" />
```
Sostituisci (aggiungi easing):
```tsx
<div className="absolute inset-0 bg-[var(--color-primary)]/0 transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:bg-[var(--color-primary)]/[0.03]" />
```

**Riga ~53** — bordo accent. Attuale:
```tsx
<div className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/0 transition-colors duration-[var(--transition-base)] group-hover:border-[var(--color-accent)]/30" />
```
Sostituisci (`--transition-base` ha già durata + easing nel token CSS; ma `transition-colors duration-[var(--transition-base)]` di Tailwind applica solo la durata: aggiungi easing manualmente):
```tsx
<div className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/0 transition-colors duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:border-[var(--color-accent)]/30" />
```

**Riga ~60** — titolo `<h3>`. Attuale:
```tsx
<h3 className="mt-0.5 text-xs font-medium leading-snug text-[var(--color-text)] transition-colors duration-200 group-hover:text-[var(--color-primary)]">
```
Sostituisci (easing coerente):
```tsx
<h3 className="mt-0.5 text-xs font-medium leading-snug text-[var(--color-text)] transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-[var(--color-primary)]">
```

**Riga ~18** — `<article>` root: aggiungi un `:active` morbido che dà feedback al click senza snap. Attuale:
```tsx
<article className="group relative">
```
Sostituisci (transform soft + transition-transform; `motion-safe` perché è un transform):
```tsx
<article className="group relative transition-transform duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] motion-safe:active:scale-[0.985]">
```
Nota: 0.985 è quasi impercettibile, dà solo un "cedevole" al tap — niente bounce/snap. 150ms = `--transition-fast`.

### B) `src/routes/catalogo.tsx` — bottoni paginazione (righe ~300-332)

I tre bottoni (`prev`, numerici, `next`) attualmente usano `transition-colors` senza durata né easing espliciti (Tailwind default = 150ms ease). Aggiungiamo easing coerente + `:active` morbido.

**Bottone "prev"** (riga ~300):
```tsx
className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-40"
```
Sostituisci con:
```tsx
className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-muted)] transition-[background-color,color,opacity,transform] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[var(--color-surface)] motion-safe:active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
```

**Bottoni numerici** (riga ~310). Attuale:
```tsx
className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
  p === page ? "..." : "..."
}`}
```
Modifica solo le classi statiche (non quelle condizionali) sostituendo `transition-colors` con la stessa lista del prev:
```tsx
className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-sm font-medium transition-[background-color,color,transform] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] motion-safe:active:scale-[0.96] ${
  p === page ? "bg-[var(--color-primary)] text-white" : "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
}`}
```

**Bottone "next"** (riga ~324) — stessa sostituzione del prev:
```tsx
className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-muted)] transition-[background-color,color,opacity,transform] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[var(--color-surface)] motion-safe:active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
```

### Cosa NON toccare
- `CatalogSidebar.tsx` — già usa `--transition-base` correttamente, non sembra sorgente di strappi.
- Lo `StaggeredGrid` / `StaggeredItem` — sono motion components, non hanno effetto sui click hover.
- Il select sort — già ha `transition-colors`, non lamentato.
- I pill dei filtri attivi — già a posto.
- NON cambiare le durate di chi le aveva già esplicite (300ms, --transition-slow): l'utente vuole stessa velocità. Cambiamo solo l'easing e (dove serve) sostituiamo `transition-all` con liste esplicite.
- NON aggiungere nuovi token CSS o nuovi colori.

### Vincoli (CLAUDE.md)
- Zero `any`.
- Niente hex inline → tutti i colori già da tokens, ok.
- Si stanno usando classi Tailwind v4 con arbitrary values per l'easing (`ease-[cubic-bezier(...)]`) — coerente con come lo stesso token viene già scritto altrove nel codebase.
  </action>
  <verify>
    <automated>pnpm typecheck && pnpm biome check src/routes/catalogo.tsx src/components/catalog/CatalogProductCard.tsx</automated>
    <!-- Verifica manuale dopo `pnpm dev`: -->
    <!-- 1. Hover su una card prodotto del catalogo: shadow + scale + pill + colore titolo devono entrare/uscire in modo "morbido", senza scatti percepibili. -->
    <!-- 2. Click sostenuto su una card: la card deve "cedere" leggermente (scale 0.985), non snap. -->
    <!-- 3. Click su un numero di pagina: il bottone deve dare feedback morbido (scale 0.96 brevissimo). -->
    <!-- 4. Sistema con `prefers-reduced-motion: reduce`: hover non deve più causare scale/translate; restano solo cambi colore/opacity/shadow. -->
  </verify>
  <done>
- `pnpm typecheck` passa
- `pnpm biome check` non riporta errori sui due file
- Hover sulle card ha tutte le sub-transizioni con la cubic-bezier dei token (verificabile in DevTools → Computed → transition)
- Click su card e su bottoni di paginazione ha feedback `:active:scale` morbido (non più "deaf"/snappy)
- `transition-all` rimosso dalla card (sostituito con liste esplicite)
- `motion-safe:` correttamente applicato a tutti i transform → reduced-motion non ha più scale/translate
  </done>
</task>

</tasks>

<verification>
End-to-end manuale (post `pnpm dev`):

1. **Scroll-to-top**:
   - Vai su `/catalogo`, scrolla in fondo, clicca "Pagina successiva". → Viewport torna in alto sulla riga "X prodotti per...".
   - Scrolla in fondo, clicca un numero di pagina. → Stesso scroll.
   - Cambia categoria nella sidebar mentre sei in fondo. → Scroll in alto.
   - Cambia il sort. → Scroll in alto.
   - Apri direttamente `/catalogo?page=2` o `/catalogo?category=sandali`. → NESSUNO scroll forzato all'arrivo.
   - Attiva "Riduci movimento" nel sistema (macOS: System Settings → Accessibility → Display → Reduce motion). → Scroll diventa istantaneo, non animato.

2. **Transizioni**:
   - Hover lento sulla prima card del catalogo: shadow, scale immagine, fade-in pill "Vedi dettaglio", e cambio colore titolo entrano in modo coerente (stessa "famiglia" di easing).
   - `transition-all` non è più nel DOM della card (DevTools → Inspect → cerca "transition-all" sulla card → non deve esistere).
   - Tap/click sostenuto su una card: scale-down lieve (0.985) percepibile ma non sgraziato.
   - Click su un numero di pagina: scale-down 0.96 brevissimo come feedback.
   - Reduced motion attivo: niente più scale né translate al hover/click; restano solo opacity, shadow, colore.

3. **Static checks**:
   - `pnpm typecheck` → 0 errori
   - `pnpm biome check src/routes/catalogo.tsx src/components/catalog/CatalogProductCard.tsx` → 0 errori
   - Nessun nuovo `any` introdotto, nessun hex inline, nessuna nuova dipendenza
</verification>

<success_criteria>
- Catalogo: paginazione e cambio filtri scrollano la viewport in cima alla griglia in modo fluido (e istantaneo se reduced-motion attivo)
- Card prodotto: hover e click percepiti come "morbidi", stessa velocità di prima ma con easing dei design token + niente più `transition-all`
- Bottoni paginazione: feedback `:active` morbido al click
- `prefers-reduced-motion` rispettato su tutte le micro-trasformazioni introdotte
- typecheck + biome puliti, nessun `any`, design token preservati
</success_criteria>

<output>
Dopo completamento, crea `.planning/quick/260507-ucj-scroll-to-top-alla-cambio-pagina-nelle-l/260507-ucj-SUMMARY.md` riepilogando:
- File toccati
- Decisioni chiave (perché ref sul wrapper `min-w-0 flex-1` invece che sulla griglia, perché trigger su 4 deps invece che solo `page`, perché `motion-safe:` solo sui transform e non sui colori)
- Snippet "before/after" di una transizione tipo per la card
</output>
