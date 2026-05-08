---
quick_id: 260508-mgz
type: quick
status: complete
completed: 2026-05-08
duration_seconds: 372
tags:
  - branding
  - copy
  - i18n
  - layout
  - chi-siamo
requirements_closed:
  - QUICK-MGZ-01  # Rinomina menu "La Bottega" → "Chi Siamo"
  - QUICK-MGZ-02  # Sostituzione globale "bottega" → "calzoleria" nelle copy display
  - QUICK-MGZ-03  # Restructure pagina Chi Siamo: storia+foto subito dopo hero
files_modified:
  - src/components/shared/MegaMenu.tsx
  - src/components/shared/Footer.tsx
  - public/locales/it/common.json
  - src/routes/la-bottega.tsx
  - src/components/sections/LaBottegaSection.tsx
  - src/components/sections/TestimonialsSection.tsx
  - src/components/sections/PersonalizationSection.tsx
  - src/components/sections/NewsletterSection.tsx
  - src/components/sections/CategoriesSection.tsx
  - src/routes/resi-e-recesso.tsx
  - src/routes/contatti.tsx
  - src/routes/api/site/media.ts
commits:
  - hash: 33ad781
    type: feat
    summary: rinomina menu "La Bottega" → "Chi Siamo"
  - hash: dc73f05
    type: feat
    summary: sostituisci display copy "bottega" → "calzoleria" (12 plan + 4 Rule 2)
  - hash: 3142375
    type: refactor
    summary: sposta storia+foto subito dopo hero su /la-bottega
metrics:
  total_commits: 3
  files_changed: 12
  display_replacements: 16  # 12 da inventory plan + 4 Rule 2 home sections
  typecheck_baseline_in: 8
  typecheck_baseline_out: 8
  typecheck_regressions: 0
---

# Quick 260508-mgz: Rinomina La Bottega → Chi Siamo + restructure pagina

Allineamento nomenclatura al brand "Calzoleria Prevenzano" (rimuovendo "bottega" da tutte le copy display utente) + restructure information architecture pagina Chi Siamo per dare enfasi visiva alla storia 1984 immediatamente dopo l'hero.

## What was done

### Task 1 — Menu rename (commit 33ad781)
- `src/components/shared/MegaMenu.tsx` L537 + L704: testo voce di menu desktop e mobile rinominato "La Bottega" → "Chi Siamo". Slug URL `/la-bottega` invariato (preserva SEO + link esterni esistenti).
- `src/components/shared/Footer.tsx` L18: normalizzata capitalizzazione label `"Chi siamo"` → `"Chi Siamo"` per coerenza con la nuova voce di menu.
- `public/locales/it/common.json` L6: `nav.laBottega` value aggiornato a `"Chi Siamo"`. Chiave i18n `laBottega` invariata per non rompere consumer.

### Task 2 — Display copy "bottega" → "calzoleria" (commit dc73f05)
**Plan inventory (12 sostituzioni autoritative):**
- `src/routes/la-bottega.tsx` (7): paragrafi storia (×2), eyebrow team "La famiglia in calzoleria", paragrafo team "stessa calzoleria", alt foto Nunzio "nella calzoleria di Via Chiaia", heading "La nostra calzoleria", paragrafo info "la nostra calzoleria è il luogo".
- `src/components/sections/LaBottegaSection.tsx` (2): `headline: "La Calzoleria Prevenzano"`, paragrafo "Quando entri in calzoleria".
- `src/routes/resi-e-recesso.tsx` (1): paragrafo Art.59.c "cucito a mano nella nostra calzoleria di Via Chiaia".
- `src/routes/contatti.tsx` (1): `CONTACT_INFO.body` "vieni a trovarci in calzoleria o in laboratorio".
- `src/routes/api/site/media.ts` (1): commento JSDoc.

**Rule 2 auto-aggiunte (4 sostituzioni — vedi sezione Deviazioni):** TestimonialsSection, PersonalizationSection, NewsletterSection, CategoriesSection.

Concordanza grammaticale italiana 1:1 (entrambi i sostantivi "bottega"/"calzoleria" sono femminili singolari, articoli/preposizioni preservati).

**Identifier interni preservati** (esclusioni esplicite plan): `LaBottegaPage`, `LaBottegaSection`, `BottegaInfoBlock`, `BOTTEGA_COPY`, `BOTTEGA_IMAGE`, `LaBottegaSectionProps`, chiave i18n `laBottega`, slug URL `/la-bottega`, nomi file `la-bottega.tsx` / `LaBottegaSection.tsx`, commento `// ─── Bottega Info Block ───`. Out-of-scope: `public/locales/it/home.json` chiave JSON `bottega` con valori vuoti.

### Task 3 — Restructure pagina Chi Siamo (commit 3142375)
Sostituita la sezione `Story content` full-width centrata (paragrafi solo testo) con un blocco a **2 colonne responsive (lg:grid-cols-2)** posizionato immediatamente dopo l'hero:
- **Sinistra (desktop):** foto `/images/nunzio-ritratto.jpg` (stesso asset di `BottegaInfoBlock`, riusato per non fabbricare nuovi asset), aspect-[4/3], rounded-[var(--radius-lg)], animazione motion `whileInView` con `x: -32 → 0`.
- **Destra (desktop):** stitch-divider decorativo + 4 paragrafi `ABOUT_COPY.paragraphs` (primo paragrafo `text-lg`, gli altri `text-base`) + CTA `bg-primary` "Scopri le nostre collezioni" → `/catalogo?category=sandali`. Animazione `x: 32 → 0` con delay 0.15s per cascade.
- **Mobile (<lg):** stacked (foto sopra, testo sotto), gap-12.
- **Design tokens:** tutti i colori via CSS custom properties (`--color-background`, `--color-primary`, `--color-text-secondary`, `--radius-lg`, `--radius-md`, `--text-base`, `--text-lg`, `--leading-relaxed`, `--transition-base`, `--section-padding-y`, `--page-max-width`, `--page-padding-x`). Zero hex hardcoded.
- **Animazioni:** `whileInView` + `viewport={{ once: true, amount: 0.3 }}` (no `useRef` aggiunto per il nuovo blocco; pattern già supportato da `motion/react`).

**Nuovo ordine sezioni `LaBottegaPage`:**
1. Hero "Dal 1984, l'arte del sandalo nel cuore di Napoli" (invariato)
2. **NUOVO** Story content 2-col foto+testo (subito dopo hero)
3. Team section (invariato — eyebrow "La famiglia in calzoleria", grid 2 TeamCard)
4. BottegaInfoBlock 2-col (foto + heading "La nostra calzoleria" + paragrafi info + dl sedi/telefono/P.IVA — invariato come posizionamento)

## Files Modified (12)

| File | Type | Changes |
|------|------|---------|
| `src/components/shared/MegaMenu.tsx` | menu | rename label desktop+mobile |
| `src/components/shared/Footer.tsx` | nav | normalizza label "Chi Siamo" |
| `public/locales/it/common.json` | i18n | nav.laBottega value |
| `src/routes/la-bottega.tsx` | route | 7 copy + restructure 2-col block |
| `src/components/sections/LaBottegaSection.tsx` | section | 2 copy (headline + paragrafo) |
| `src/components/sections/TestimonialsSection.tsx` | section | Rule 2: testimonial L29 |
| `src/components/sections/PersonalizationSection.tsx` | section | Rule 2: paragrafo L118 |
| `src/components/sections/NewsletterSection.tsx` | section | Rule 2: paragrafo L60 |
| `src/components/sections/CategoriesSection.tsx` | section | Rule 2: paragrafo L103 |
| `src/routes/resi-e-recesso.tsx` | route | 1 copy (Art.59.c) |
| `src/routes/contatti.tsx` | route | 1 copy (intro) |
| `src/routes/api/site/media.ts` | api | 1 commento JSDoc |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Copy] Inventario plan incompleto vs must_have Home**
- **Trovato durante:** Task 2 verification (grep finale post-applicazione delle 12 sostituzioni autoritative)
- **Issue:** Il plan dichiara nel must_haves: *"Nessuna copy visibile all'utente nelle pagine Home, Chi Siamo, Contatti, Resi e Recesso contiene la parola 'bottega'/'Bottega'"* — ma l'`<inventory>` enumera solo `LaBottegaSection.tsx` come sezione homepage da modificare. Il grep di verifica plan-driven (`grep -rn "bottega" src/`) ha rivelato 4 ulteriori occorrenze in altre sezioni montate sulla home (`src/routes/index.tsx` riga 24-32 importa CategoriesSection, PersonalizationSection, TestimonialsSection, NewsletterSection — tutte visibili sulla homepage).
- **Fix:** Applicate 4 sostituzioni aggiuntive coerenti con la grammatica del plan:
  - `TestimonialsSection.tsx` L29: `"...è una bottega dove entri..."` → `"...è una calzoleria dove entri..."` (testimonial customer Luca M., Napoli)
  - `PersonalizationSection.tsx` L118: `"Come in bottega: scegli il modello..."` → `"Come in calzoleria: scegli il modello..."`
  - `NewsletterSection.tsx` L60: `"...storie dalla bottega..."` → `"...storie dalla calzoleria..."`
  - `CategoriesSection.tsx` L103: `"...in bottega a Napoli dal 1984..."` → `"...in calzoleria a Napoli dal 1984..."`
- **Files modificati:** 4 file aggiuntivi inclusi nel commit Task 2 (dc73f05).
- **Razionale:** La must_have "truth" è dichiarata gerarchicamente prioritaria rispetto a inventory parziale; CLAUDE.md scope boundary applicato (modifiche solo a copy display home, zero refactor architetturale, identifier interni intoccati).
- **Commit:** dc73f05.

Nessun'altra deviazione (Rule 1/3/4 non applicate).

## Verification

### Automated checks (post-completion)

1. **No "La Bottega" in 3 file Task 1:**
   ```bash
   grep -n "La Bottega" src/components/shared/MegaMenu.tsx src/components/shared/Footer.tsx public/locales/it/common.json | wc -l
   # → 0  ✓
   ```

2. **"Chi Siamo" presente 2× in MegaMenu (desktop + mobile):**
   ```bash
   grep -n "Chi Siamo" src/components/shared/MegaMenu.tsx
   # → 537:Chi Siamo, 704:Chi Siamo  ✓
   ```

3. **No display "bottega" residua (escluso identifier/slug/JSON home.json):**
   ```bash
   grep -rn "bottega\|Bottega\|BOTTEGA" src/ public/locales/ | grep -v routeTree.gen | grep -v "/la-bottega" | grep -vE "(LaBottegaPage|LaBottegaSection|BottegaInfoBlock|BOTTEGA_COPY|BOTTEGA_IMAGE|laBottega|LaBottegaSectionProps|Bottega Info Block|la-bottega.tsx|LaBottegaSection.tsx)" | grep -v 'home.json'
   # → OK (nessuna match)  ✓
   ```

4. **Pagina /la-bottega — ordine sezioni JSX:**
   ```bash
   grep -nE "Page hero|Story content|Team section|Info block" src/routes/la-bottega.tsx
   # → 62: Page hero, 81: Story content (subito dopo hero), 125: Team section, 148: Info block  ✓
   ```

5. **Struttura JSX nuovo blocco:**
   - `grep -c "ABOUT_COPY.paragraphs.map" src/routes/la-bottega.tsx` → 1 ✓ (paragrafi storia compaiono solo nel nuovo blocco, non più in vecchia full-width)
   - `grep -c "BottegaInfoBlock" src/routes/la-bottega.tsx` → 2 ✓ (definizione + invocazione)
   - `grep -c "TeamCard" src/routes/la-bottega.tsx` → 2 ✓ (definizione + invocazione)

6. **TypeScript typecheck (pnpm typecheck):**
   - Baseline pre-task: 8 errori pre-esistenti (admin-functions, product-functions, validators/auth Zod v4 API mismatch, api/admin/media.$id, api/admin/products, api/products — tutti file fuori scope CLAUDE.md, già documentati in STATE.md sessions precedenti vll/h9l/ucj).
   - Baseline post-task: 8 errori (stessi file, stessi codici TS).
   - **Regressioni introdotte: 0** ✓

7. **Build production (`pnpm build`):** non eseguito in questa sessione (executor pattern: typecheck come gate primario, build deferito a CI Railway autodeploy + Task 4 manual checkpoint utente).

8. **Lint (`pnpm lint`):** non eseguito (Biome config-format mismatch pre-existing su `biome.json` chiave `files.ignore` non riconosciuta — issue documentata in deferred-items pre-sessione, fuori scope CLAUDE.md).

### Manual verification — Task 4 checkpoint (DEFERRED a utente)

Il plan include `Task 4` come `checkpoint:human-verify` non automatizzabile. Per constraint orchestratore (`Task 4 is a human-verify checkpoint — do NOT block on it. Execute Tasks 1-3, run typecheck, then leave Task 4 as a documented manual-verification step in SUMMARY.md`), il checkpoint visivo è documentato qui per esecuzione manuale post-deploy:

**Procedura verifica utente** (dopo `git push` Railway autodeploy o `pnpm dev` locale):

1. **Menu desktop** (≥1024px wide): nella navbar in alto deve comparire **"Chi Siamo"** (NON "La Bottega"). Click → `/la-bottega` (URL invariato).
2. **Menu mobile** (≤767px): tap hamburger menu, voce **"Chi Siamo"** visibile → `/la-bottega`.
3. **Footer**: sezione "Informazioni" mostra **"Chi Siamo"** (capitalizzazione coerente).
4. **Pagina `/la-bottega`**:
   - a) Hero invariato: "Dal 1984, l'arte del sandalo nel cuore di Napoli".
   - b) **SUBITO SOTTO** l'hero: blocco 2 colonne desktop (foto Nunzio sinistra + paragrafi storia destra + CTA "Scopri le nostre collezioni"). Su mobile: stacked.
   - c) Team section: eyebrow **"La famiglia in calzoleria"** (NON "in bottega"), 2 TeamCard.
   - d) In fondo: blocco **"La nostra calzoleria"** (NON "La nostra bottega") con foto + dl sedi/telefono/P.IVA.
   - e) Nessuna parola "bottega"/"Bottega" visibile (URL bar `/la-bottega` OK — slug invariato per SEO).
5. **Homepage** `/`: sezione storia mostra headline **"La Calzoleria Prevenzano"** (NON "La Bottega Prevenzano"). Paragrafo: "Quando entri in calzoleria". Sezione testimonianze: testimonial Luca M. dice "...è una calzoleria dove entri...". Sezione personalizzazione: "Come in calzoleria". Sezione newsletter: "storie dalla calzoleria". Sezione categorie: "in calzoleria a Napoli dal 1984".
6. **Pagina `/resi-e-recesso`**: primo paragrafo "...nella nostra calzoleria di Via Chiaia..." (NON "bottega").
7. **Pagina `/contatti`**: intro "...vieni a trovarci in calzoleria o in laboratorio." (NON "in bottega").
8. **Test funzionale link**: click "Chi Siamo" desktop → `/la-bottega` carica correttamente (slug invariato).
9. **Build production check** (opzionale): `pnpm build` deve completare senza errori (errori typecheck pre-esistenti baseline 8 fuori scope; build Vite SSR + tsc --noEmit gate dovrebbe restituire stesso outcome di sessions precedenti).

**Resume signal utente:** rispondere "approvato" se tutti i 9 punti verde, oppure descrivere issue specifici (es: "punto 4b — su mobile manca padding").

## Self-Check: PASSED

**File modificati verificati esistenti:**
- `src/components/shared/MegaMenu.tsx` ✓ (Chi Siamo L537 + L704)
- `src/components/shared/Footer.tsx` ✓ (Chi Siamo L18)
- `public/locales/it/common.json` ✓ (Chi Siamo L6)
- `src/routes/la-bottega.tsx` ✓ (7 sostituzioni + 2-col restructure, 250 LOC)
- `src/components/sections/LaBottegaSection.tsx` ✓ (2 sostituzioni)
- `src/components/sections/TestimonialsSection.tsx` ✓ (Rule 2)
- `src/components/sections/PersonalizationSection.tsx` ✓ (Rule 2)
- `src/components/sections/NewsletterSection.tsx` ✓ (Rule 2)
- `src/components/sections/CategoriesSection.tsx` ✓ (Rule 2)
- `src/routes/resi-e-recesso.tsx` ✓ (1 sostituzione)
- `src/routes/contatti.tsx` ✓ (1 sostituzione)
- `src/routes/api/site/media.ts` ✓ (1 commento)

**Commit verificati su git log:**
- 33ad781 ✓ feat(quick/260508-mgz): rinomina menu "La Bottega" → "Chi Siamo"
- dc73f05 ✓ feat(quick/260508-mgz): sostituisci display copy "bottega" → "calzoleria"
- 3142375 ✓ refactor(quick/260508-mgz): sposta storia+foto subito dopo hero su /la-bottega

Tutti i 12 file modificati esistono su disco; tutti i 3 commit presenti su `git log --all`.
