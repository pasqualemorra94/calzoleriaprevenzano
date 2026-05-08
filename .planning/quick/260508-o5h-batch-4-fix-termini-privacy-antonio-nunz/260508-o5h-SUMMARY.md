---
phase: quick/260508-o5h
plan: 01
subsystem: legal-pages + about-page + contact-page
tags: [legal, content-fix, refactor, layout, copy]
requires: []
provides:
  - "termini.tsx con denominazione titolare corretta (Prevenzano Nunzio)"
  - "privacy.tsx con denominazione titolare corretta (Prevenzano Nunzio)"
  - "la-bottega.tsx unificata (no duplicazione foto, info calzoleria integrata)"
  - "contatti.tsx con sedi rinominate Negozio 1/2 e cards full-width"
affects:
  - "src/routes/termini.tsx"
  - "src/routes/privacy.tsx"
  - "src/routes/la-bottega.tsx"
  - "src/routes/contatti.tsx"
tech-stack:
  added: []
  patterns: ["text-replace puntuali", "JSX block restructure", "Tailwind grid simplification"]
key-files:
  created: []
  modified:
    - "src/routes/termini.tsx"
    - "src/routes/privacy.tsx"
    - "src/routes/la-bottega.tsx"
    - "src/routes/contatti.tsx"
key-decisions:
  - "h2 'La nostra calzoleria' usa mt-12 per separazione visiva chiara dalla storia (non mt-10 per dare aria a contenuto piu denso)"
  - "items-center -> items-start sul grid storia per evitare che la foto galleggi al centro con colonna destra piu lunga"
  - "Rimosso completamente BottegaInfoBlock (funzione + comment + ScrollAnimatedSection wrapper) — niente piu duplicazione foto nunzio-ritratto.jpg"
metrics:
  duration: ~6min
  completed: 2026-05-08
  tasks: 4
  commits: 4
  files-modified: 4
  loc: "+37/-71"
---

# Quick 260508-o5h: Batch 4 fix termini/privacy/la-bottega/contatti Summary

Batch 4 micro-fix pre-go-live: aggiornata denominazione titolare ad "Prevenzano Nunzio" in termini.tsx e privacy.tsx (era erroneamente "Antonio"), unificata la pagina /la-bottega rimuovendo la duplicazione dell'immagine `nunzio-ritratto.jpg` con merge del vecchio `BottegaInfoBlock` dentro la colonna destra della sezione storia, e in /contatti rinominate le sedi "Negozio"/"Laboratorio" in "Negozio 1"/"Negozio 2" + fix layout cards stretchate (rimosso `md:grid-cols-2` interno che squashava le cards dentro la colonna sinistra `1fr` del grid `lg:grid-cols-[1fr_2fr]`).

## What was built

### Task 1: termini.tsx — Antonio -> Nunzio (commit `bafccbd`)
2 sostituzioni text-replace puntuali:
- Line 57 (sezione Definizioni): `Prevenzano di Prevenzano Antonio` -> `Prevenzano di Prevenzano Nunzio`
- Line 541 (sezione Contatti box): `Calzoleria Prevenzano di Prevenzano Antonio` -> `Calzoleria Prevenzano di Prevenzano Nunzio`

Verifica: `grep "Prevenzano Antonio" src/routes/termini.tsx` -> 0 risultati. `grep "Prevenzano Nunzio"` -> 2 risultati.

### Task 2: privacy.tsx — Antonio -> Nunzio (commit `bc3a9b3`)
2 sostituzioni text-replace puntuali:
- Line 41 (box Titolare): `<p>di Prevenzano Antonio</p>` -> `<p>di Prevenzano Nunzio</p>`
- Line 414 (sezione Contatti box): `Calzoleria Prevenzano di Prevenzano Antonio` -> `Calzoleria Prevenzano di Prevenzano Nunzio`

Verifica: `grep "Prevenzano Antonio" src/routes/privacy.tsx` -> 0 risultati. `grep "Prevenzano Nunzio"` -> 2 risultati.

### Task 3: la-bottega.tsx — merge BottegaInfoBlock dentro storia (commit `f512a6b`)
Refactor strutturale 4 modifiche atomiche:

1. **Grid alignment** (line 84): `items-center` -> `items-start` sul container `.grid grid-cols-1 ... lg:grid-cols-2` — con contenuto piu lungo nella colonna destra, allineamento in alto evita che l'immagine "galleggi" al centro verticalmente.

2. **Insert h2 + paragraphs + dl** dentro `<m.div>` colonna destra, dopo `</div>` di chiusura del wrapper `space-y-5` dei paragrafi storia e prima del CTA `<a>`:
   - `<h2 className="mt-12 ...">La nostra calzoleria</h2>` con `mt-12` per separazione visiva chiara dalla fine della storia (constraint plan: "use mt-12 or mt-10 margin on the h2", scelto mt-12 per piu aria visto che la colonna destra ha 4 paragrafi di storia + h2 + 2 paragrafi sub-section + dl + CTA).
   - `<hr className="stitch-divider stitch-divider--left my-4" />` divisore visivo coerente
   - 2 paragrafi descrittivi calzoleria (cuore di Napoli + servizi recrafting Church's/Edward Green/Tricker's)
   - `<dl className="mt-8 space-y-4">` con 4 entries: Sede principale (Via Chiaia 104), Seconda sede (Via Schipa 111), Telefono, P.Iva

3. **Remove `<ScrollAnimatedSection>` wrapping `<BottegaInfoBlock />`** (was lines 148-151) — completamente eliminato il blocco "Info block" dal page component.

4. **Remove function `BottegaInfoBlock`** (was lines 193-250) — eliminata la funzione con tutto il commento separator. Il contenuto e' stato spostato 1:1 dentro la colonna destra della prima sezione storia.

**Imports invariati:** tutti gli import correnti (createFileRoute, ReactNode, ScrollAnimatedSection, fadeInUp/slideInLeft/slideInRight, m/useInView, useRef) restano necessari perche' TeamCard usa useRef + useInView + slideInLeft + slideInRight, e LaBottegaPage usa ScrollAnimatedSection + fadeInUp + m + ReactNode.

**Sanity check finale:**
- `grep -c 'nunzio-ritratto.jpg' src/routes/la-bottega.tsx` -> 1 (era 2 prima)
- `grep "function BottegaInfoBlock"` -> 0 risultati
- `grep "<BottegaInfoBlock"` -> 0 risultati
- `grep "La nostra calzoleria"` -> 1 risultato (e' stata spostata, non eliminata)

**LOC:** 250 -> 216 LOC (file ridotto di 34 LOC, +29/-63).

### Task 4: contatti.tsx — rename sedi + fix layout (commit `1a75973`)
2 modifiche puntuali:

1. **Rinomina sedi** in `CONTACT_INFO.locations`:
   - Line 42: `name: "Negozio"` -> `name: "Negozio 1"`
   - Line 47: `name: "Laboratorio"` -> `name: "Negozio 2"`
   - `address` e `hours` invariati per entrambe.

2. **Fix layout cards stretchate** (line 138):
   - `<div className="grid grid-cols-1 gap-6 md:grid-cols-2">` -> `<div className="grid grid-cols-1 gap-6">`
   - Comment aggiornato: `{/* Sedi: 2 card affiancate (md:) */}` -> `{/* Sedi: card impilate verticalmente */}`

**Motivazione layout fix:** il grid esterno (line 129) e' `lg:grid-cols-[1fr_2fr]` (sedi 1/3 width, form 2/3). Il grid interno `md:grid-cols-2` faceva stare 2 cards affiancate dentro 1/3 della pagina su md+ -> cards troppo strette/squashate. Rimuovendo `md:grid-cols-2` le cards si impilano verticalmente sempre, occupando l'intera larghezza della colonna sinistra (piu leggibili).

## How it works

- **termini.tsx + privacy.tsx:** zero impatto runtime, zero impatto su comportamento — pure text content fix per allineare denominazione titolare al nome reale (Prevenzano Nunzio, non Antonio).
- **la-bottega.tsx:** la pagina ora ha 3 sezioni invece di 4 (hero -> storia+info-fusi -> team), con una sola istanza dell'immagine nunzio-ritratto.jpg. Visual hierarchy: hero, poi sezione 2-col con foto a sinistra e (storia + h2 calzoleria + paragrafi + dl + CTA) a destra, poi team Nunzio + Francesca, fine.
- **contatti.tsx:** sedi rinominate per coerenza con realta' (entrambe sono negozi+laboratori, non c'e' una distinzione netta vendita/produzione). Layout cards full-width nella colonna sinistra del 2-col grid form.

## Edge Cases Tested

- **Imports inutilizzati:** verificato che dopo la rimozione di BottegaInfoBlock tutti gli import esistenti sono ancora usati (TeamCard usa useRef/useInView/slideInLeft/slideInRight; LaBottegaPage usa ScrollAnimatedSection/fadeInUp/m/ReactNode). Nessun import da rimuovere.
- **Animazioni:** la sezione storia conserva la sua animazione `m.div` con whileInView x:32->0 + delay 0.15 sulla colonna destra. La foto sinistra ha `m.img` con whileInView x:-32->0. Il vecchio BottegaInfoBlock aveva una animazione separata via useInView ref locale; ora il nuovo contenuto eredita la stessa animazione del wrapper colonna destra (single fade-in coerente, niente staggering separato).
- **Stitch divider:** la nuova h2 "La nostra calzoleria" ha il suo `<hr stitch-divider stitch-divider--left my-4 />` come nel BottegaInfoBlock originale per coerenza visiva con i divider sparsi nella pagina.
- **Mobile responsive:** grid `lg:grid-cols-2` resta — su mobile foto sopra, contenuto sotto; il `mt-12` sull'h2 funziona sia su mobile (separazione paragrafi storia <-> h2) sia su desktop.

## Deviations from Plan

**None — plan executed exactly as written.**

Adattamento minore (non deviazione, scelta esplicita dal constraint utente):
- **mt-12 vs mt-10 sull'h2:** il plan diceva "use mt-10 or mt-12 margin on the h2" — scelto `mt-12` per dare piu aria visto che la colonna destra ha contenuto denso (4 paragrafi storia + h2 + 2 paragrafi sub-section + dl 4-row + CTA). Coerente con costrutto plan + constraint user "Make sure visual hierarchy is clear (proper spacing between story end and 'La nostra calzoleria' heading)".

## Authentication Gates

None.

## Deferred Issues

- **biome.json config mismatch (pre-existing):** `pnpm biome check` fallisce con errore "Known keys: ... ignore not recognized" per il blocco `"files": { "ignore": [...] }` in biome.json. Errore pre-existing dal commit foundation `4064639`, gia' documentato in SUMMARY 260507-ucj. Out-of-scope per questo plan (file biome.json non toccato). Lint deferito a CI Railway autodeploy come pattern executor precedenti.

- **Smoke browser visivo:** verifica visiva (Cmd+F "Antonio" su /termini e /privacy = 0 risultati, /la-bottega 1 sola foto nunzio-ritratto, /contatti cards Negozio 1/2 impilate full-width su desktop largo) deferita a smoke post-deploy come pattern executor precedenti (vll/h9l/ucj/n1f).

## Commits Created

1. `bafccbd` fix(quick/260508-o5h): aggiorna denominazione titolare in termini.tsx (Antonio -> Nunzio) — 1 file, +2/-2
2. `bc3a9b3` fix(quick/260508-o5h): aggiorna denominazione titolare in privacy.tsx (Antonio -> Nunzio) — 1 file, +2/-2
3. `f512a6b` refactor(quick/260508-o5h): unifica sezione storia e info calzoleria in la-bottega.tsx — 1 file, +29/-63
4. `1a75973` fix(quick/260508-o5h): rinomina sedi a Negozio 1/2 e impila cards verticalmente in contatti.tsx — 1 file, +4/-4

**Total:** 4 commit atomici, 4 file modificati, +37/-71 LOC netti.

## Test Plan / Setup utente post-deploy

- Apri `/termini` -> Cmd+F "Antonio" -> 0 risultati. Cmd+F "Nunzio" -> 2 risultati (Definizioni + Contatti).
- Apri `/privacy` -> Cmd+F "Antonio" -> 0 risultati. Cmd+F "Nunzio" -> 2 risultati (Titolare + Contatti).
- Apri `/la-bottega` -> verifica unica immagine grande di Nunzio (nunzio-ritratto.jpg), sotto i 4 paragrafi storia c'e' h2 "La nostra calzoleria" con divider, poi 2 paragrafi calzoleria + dl sedi/telefono/P.Iva + CTA "Scopri le nostre collezioni". NON c'e' una seconda sezione separata sotto il team con la stessa foto.
- Apri `/la-bottega` su mobile -> foto sopra, contenuto sotto stacked, h2 con mt-12 visibile come separazione tra storia e info calzoleria.
- Apri `/contatti` su desktop largo (>1024px) -> nella colonna sinistra (1/3 width del grid `1fr_2fr`) le 2 cards "Negozio 1" e "Negozio 2" sono impilate verticalmente, occupano tutta la larghezza disponibile (non piu' squashate side-by-side).
- Apri `/contatti` su mobile -> stesso layout (sempre stacked).

## Verification Results

- `pnpm typecheck` -> 25 errori (baseline 25, zero regressioni). Tutti pre-existing su `admin-functions.ts:21,68`, `product-functions.ts:80`, `validators/auth.ts:35,38`, `api/admin/products.ts:51`, `api/products.ts:52`, `api/admin/media.$id.ts:8`, `scripts/*` — fuori scope CLAUDE.md scope boundary, gia' documentati in STATE.md sessions vll/h9l/ucj/mgz/n1f.
- `pnpm biome check src/routes/termini.tsx src/routes/privacy.tsx src/routes/la-bottega.tsx src/routes/contatti.tsx` -> fallisce per pre-existing biome.json config issue (vedi Deferred Issues).
- Build/smoke browser deferiti CI Railway autodeploy.

## Self-Check: PASSED

- File creato: `.planning/quick/260508-o5h-batch-4-fix-termini-privacy-antonio-nunz/260508-o5h-SUMMARY.md` (this file) — FOUND
- Commits in git log:
  - `bafccbd` — FOUND
  - `bc3a9b3` — FOUND
  - `f512a6b` — FOUND
  - `1a75973` — FOUND
- Files modified:
  - `src/routes/termini.tsx` — modified, "Prevenzano Antonio" assente, "Prevenzano Nunzio" presente 2x
  - `src/routes/privacy.tsx` — modified, "Prevenzano Antonio" assente, "Prevenzano Nunzio" presente 2x
  - `src/routes/la-bottega.tsx` — modified, BottegaInfoBlock rimosso, "La nostra calzoleria" presente 1x, nunzio-ritratto.jpg presente 1x
  - `src/routes/contatti.tsx` — modified, "Negozio 1"/"Negozio 2" presenti, "md:grid-cols-2" assente
- Typecheck baseline 25 -> 25 invariato dopo Task 3 e Task 4.
