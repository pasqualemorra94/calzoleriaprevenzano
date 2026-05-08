---
quick_id: 260508-pbm
type: execute
status: completed
date_completed: 2026-05-08
duration_minutes: 104
tasks_completed: 4
tasks_total: 4
commits:
  - hash: a30114e
    type: chore
    summary: scarica 10 PDF + foto + video dal vecchio WordPress
  - hash: 545c933
    type: feat
    summary: pagina /guida-alla-taglia con metodi, PDF, video, tabella, CTA
  - hash: 3bef8af
    type: feat
    summary: voce 'Guida alla taglia' nel MegaMenu desktop + mobile
  - hash: 265c132
    type: feat
    summary: link 'Trova la tua taglia' nel VariantSelector
files_created:
  - public/guide-taglia/taglia-33.pdf
  - public/guide-taglia/taglia-34.pdf
  - public/guide-taglia/taglia-35.pdf
  - public/guide-taglia/taglia-36.pdf
  - public/guide-taglia/taglia-37.pdf
  - public/guide-taglia/taglia-38.pdf
  - public/guide-taglia/taglia-39.pdf
  - public/guide-taglia/taglia-40.pdf
  - public/guide-taglia/taglia-41.pdf
  - public/guide-taglia/taglia-42.pdf
  - public/images/foto-piede-misurazione.png
  - public/images/foto-piede-circonferenza.png
  - public/images/piede-tutorial.jpg
  - public/videos/tutorial-misurazione.mp4
  - src/routes/guida-alla-taglia.tsx
  - src/components/sections/GuidaTaglia/SizeGrid.tsx
  - src/components/sections/GuidaTaglia/MeasurementMethods.tsx
  - src/components/sections/GuidaTaglia/TutorialVideo.tsx
  - src/components/sections/GuidaTaglia/SizeTable.tsx
files_modified:
  - src/routes/guida-taglia.tsx
  - src/components/shared/MegaMenu.tsx
  - src/components/product/VariantSelector.tsx
typecheck:
  baseline: 25
  final: 25
  delta: 0
---

# Quick 260508-pbm — Crea pagina guida alla taglia con asset reali

## One-liner

Pagina `/guida-alla-taglia` arricchita con 10 PDF stampabili scaricati dal vecchio WordPress, due foto reali del piede, video tutorial inline, voce nel MegaMenu (desktop + mobile) e link contestuale nel selettore varianti della pagina prodotto.

## Slug Override (Decisione critica utente)

Il PLAN.md originale prevedeva di **mantenere lo slug `/guida-taglia`** (per evitare duplicati e link rotti) e arricchire la pagina esistente. L'utente ha **esplicitamente sovrascritto** questa decisione tramite `<critical_override>` per preservare la **continuità SEO con il vecchio sito WordPress** (l'URL pubblico era `https://calzoleriaprevenzano.it/guida-alla-taglia/`).

### Soluzione applicata

1. **Nuova route canonica** in `src/routes/guida-alla-taglia.tsx` con tutto il contenuto arricchito (hero, SizeGrid, MeasurementMethods, TutorialVideo, SizeTable, FinalCta).
2. **Vecchia route `src/routes/guida-taglia.tsx`** convertita in **redirect TanStack Router**:

   ```tsx
   import { createFileRoute, redirect } from "@tanstack/react-router";
   export const Route = createFileRoute("/guida-taglia")({
     beforeLoad: () => { throw redirect({ to: "/guida-alla-taglia" }); },
   });
   ```

3. **Link interni preservati** senza modifiche — `Footer.tsx:20` e `resi-e-recesso.tsx:49` continuano a funzionare via redirect (UX trasparente, no link rotti).
4. **MegaMenu + VariantSelector** puntano direttamente al nuovo slug canonico `/guida-alla-taglia` (no doppio hop).

### Vantaggi

- ✅ Continuità SEO: Google trova `/guida-alla-taglia` come prima.
- ✅ Continuità UX: tutti i link esistenti continuano a funzionare.
- ✅ Niente breaking change su Footer/resi-e-recesso (zero file toccati lì).

## Tasks Completate

### Task 1 — Download asset (commit `a30114e`)

**Sorgenti scoperte via scraping del HTML originale** (`https://calzoleriaprevenzano.it/guida-alla-taglia/`).
Il PLAN ipotizzava URL `/wp-content/uploads/2024/05/taglia-XX.pdf` ma erano tutti **404**. Gli URL reali sono:

- 9 PDF in `/wp-content/uploads/2021/05/{N}.pdf` (33, 34, 36, 37, 38, 40, 41, 42 + 35-1)
- 1 PDF in `/wp-content/uploads/2023/09/39.pdf`
- Foto piede (lunghezza): `/wp-content/uploads/2021/05/foto-piede2.png`
- Foto piede (circonferenza): `/wp-content/uploads/2021/05/circonferenza.png` *(asset extra rispetto al plan, tornato utile)*
- Video tutorial: `/wp-content/uploads/2021/05/Tutorial-misurazione.mp4` (64MB)

**Tutti i 14 file scaricati con successo** (size >= 1KB validato), nessun fallback necessario.

### Task 2 — Pagina /guida-alla-taglia (commit `545c933`)

Route `src/routes/guida-alla-taglia.tsx` (71 LOC) — composizione di sub-componenti split in `src/components/sections/GuidaTaglia/`:

| File | LOC | Responsabilità |
|---|---|---|
| `SizeGrid.tsx` | 55 | Grid 10 PDF + avviso "stampa al 100%" |
| `MeasurementMethods.tsx` | 90 | 2 card (lunghezza + circonferenze) con foto reali |
| `TutorialVideo.tsx` | 35 | `<video>` con poster + preload metadata |
| `SizeTable.tsx` | 68 | Tabella cm → IT/EU per taglie 33-42 |

**Decisione di splitting:** dopo prima stesura monolitica (315 LOC) ho splittato in `components/sections/GuidaTaglia/` per stare entro il limite 200 LOC del CLAUDE.md. Pattern allineato a quello esistente (`HeroSection.tsx`, `LaBottegaSection.tsx`, ecc.).

Vincoli rispettati:
- ✅ Italian copy throughout
- ✅ Zero hex colors (solo `var(--color-*)` + Tailwind utility)
- ✅ Zero `any` (tipo `ReactNode` esplicito su ogni componente; `as const` per `SIZES`)
- ✅ Wrapping con `<ScrollAnimatedSection variants={fadeInUp}>` su ogni sezione
- ✅ Tutti i sub-componenti < 100 LOC (limite 200)

### Task 3 — MegaMenu (commit `3bef8af`)

Voce "Guida alla taglia" inserita tra "Chi Siamo" e "Contatti" sia nel **desktop nav** che nel **mobile drawer**. 2 occorrenze totali di `to="/guida-alla-taglia"` nel file.

### Task 4 — VariantSelector (commit `265c132`)

Link inline "Trova la tua taglia" allineato a destra, sopra il primo gruppo varianti. Visibile **una sola volta per prodotto** (non dentro il loop dei group). Mostrato per tutti i prodotti con varianti (decisione planner: copy generico utile anche per pelletteria/accessori).

## Verifica end-to-end

| Check | Risultato |
|---|---|
| 10 PDF presenti in `public/guide-taglia/` | ✅ 10/10 (495KB-635KB ciascuno) |
| Foto piede in `public/images/` | ✅ 2 foto (lunghezza + circonferenza) |
| Video in `public/videos/` | ✅ 64MB |
| `/guida-alla-taglia` route esiste | ✅ 71 LOC |
| `/guida-taglia` redirect funziona | ✅ `beforeLoad` throw redirect |
| Avviso "stampa al 100%" | ✅ presente sopra la grid PDF |
| MegaMenu desktop + mobile | ✅ 2 occorrenze `guida-alla-taglia` |
| VariantSelector link | ✅ presente sopra primo group |
| `pnpm typecheck` baseline 25 | ✅ 25 (delta 0) |
| 4 commit atomici italiani | ✅ a30114e, 545c933, 3bef8af, 265c132 |

## Deviazioni dal PLAN

### 1. [Slug override — decisione utente] `/guida-taglia` → `/guida-alla-taglia`

**Trigger:** `<critical_override>` esplicito nel prompt dell'esecutore.
**Impatto:** PLAN.md prevedeva di riscrivere `src/routes/guida-taglia.tsx`. Risultato finale:
- Nuovo file `src/routes/guida-alla-taglia.tsx` (contenuto arricchito).
- File originale `src/routes/guida-taglia.tsx` ridotto a 9 LOC (solo redirect).
- Tutti i link in MegaMenu e VariantSelector puntano al nuovo slug canonico.
- Il pattern di redirect TanStack (`beforeLoad: () => { throw redirect(...) }`) è documentato nel commit + sopra in questo SUMMARY.

### 2. [Rule 3 — blocking] URL PDF errati nel PLAN

**Trigger:** Tutti i 10 URL PDF nel PLAN (`/wp-content/uploads/2024/05/...` e `/2023/09/taglia-XX.pdf`) restituivano 404.
**Fix:** Scraping del HTML del vecchio sito (`https://calzoleriaprevenzano.it/guida-alla-taglia/`) per estrarre gli URL reali. URL effettivi: `/wp-content/uploads/2021/05/{N}.pdf` (no prefisso `taglia-`) + `35-1.pdf` (suffisso) + `39.pdf` in `/2023/09/`.
**Risultato:** 10/10 PDF scaricati con successo.

### 3. [Rule 2 — bonus utile] Asset extra `circonferenza.png`

**Trigger:** Il vecchio sito mostrava DUE foto distinte (lunghezza + circonferenza), il PLAN ne menzionava una sola (`foto-piede-misurazione.png`).
**Decisione:** Scaricato anche `circonferenza.png` → rinominato `foto-piede-circonferenza.png` → usato nella card "2. Circonferenze" della sezione `MeasurementMethods`. La card "1. Lunghezza" usa `foto-piede-misurazione.png` (come da plan).

### 4. [Rule 3 — automatico] Component splitting in `sections/GuidaTaglia/`

**Trigger:** Il PLAN ammetteva splitting "se >200 LOC, sposta sub-componenti in `src/components/sections/GuidaTaglia/`". Versione monolitica era 315 LOC.
**Fix:** Splittato in 4 sub-componenti come previsto dal PLAN (path esatto coincide con quello suggerito). Nessuna scoperta architetturale.

## Known Stubs

Nessuno stub presente. Tutti i componenti sono completamente cablati con asset reali e dati statici (taglie/tabelle hardcoded — appropriato per una pagina informativa).

## Self-Check: PASSED

**File creati verificati:**
- ✅ FOUND: public/guide-taglia/taglia-33.pdf
- ✅ FOUND: public/guide-taglia/taglia-34.pdf
- ✅ FOUND: public/guide-taglia/taglia-35.pdf
- ✅ FOUND: public/guide-taglia/taglia-36.pdf
- ✅ FOUND: public/guide-taglia/taglia-37.pdf
- ✅ FOUND: public/guide-taglia/taglia-38.pdf
- ✅ FOUND: public/guide-taglia/taglia-39.pdf
- ✅ FOUND: public/guide-taglia/taglia-40.pdf
- ✅ FOUND: public/guide-taglia/taglia-41.pdf
- ✅ FOUND: public/guide-taglia/taglia-42.pdf
- ✅ FOUND: public/images/foto-piede-misurazione.png
- ✅ FOUND: public/images/foto-piede-circonferenza.png
- ✅ FOUND: public/videos/tutorial-misurazione.mp4
- ✅ FOUND: src/routes/guida-alla-taglia.tsx (71 LOC)
- ✅ FOUND: src/components/sections/GuidaTaglia/{SizeGrid,MeasurementMethods,TutorialVideo,SizeTable}.tsx

**Commit verificati:**
- ✅ FOUND: a30114e (chore: scarica asset)
- ✅ FOUND: 545c933 (feat: pagina /guida-alla-taglia)
- ✅ FOUND: 3bef8af (feat: MegaMenu)
- ✅ FOUND: 265c132 (feat: VariantSelector link)

**Modifiche verificate:**
- ✅ src/routes/guida-taglia.tsx → 9 LOC (redirect)
- ✅ src/components/shared/MegaMenu.tsx → 2 occorrenze `guida-alla-taglia`
- ✅ src/components/product/VariantSelector.tsx → 1 link "Trova la tua taglia"
- ✅ pnpm typecheck: 25 errori (baseline preservata, delta 0)
