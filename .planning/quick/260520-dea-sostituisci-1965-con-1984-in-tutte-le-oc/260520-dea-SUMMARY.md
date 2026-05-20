---
phase: quick/260520-dea
plan: 01
subsystem: content/branding
tags: [content, copy, branding, seo, og, i18n]
requires: []
provides:
  - "Branding 1984 coerente su tagline, meta description, og:description, i18n home, footer"
affects:
  - src/lib/constants/app.ts
  - src/routes/__root.tsx
  - public/locales/it/home.json
  - src/components/shared/Footer.tsx
tech_stack_added: []
patterns: []
key_files_created: []
key_files_modified:
  - src/lib/constants/app.ts
  - src/routes/__root.tsx
  - public/locales/it/home.json
  - src/components/shared/Footer.tsx
decisions:
  - "Sostituzione mirata stringa-per-stringa (no refactor centrale anno fondazione): rispettato vincolo del plan 'modificare SOLO il numero 1965 → 1984', nessun nuovo costante condivisa introdotta."
metrics:
  duration_minutes: 6
  tasks_completed: 1
  files_modified: 4
  files_created: 0
  commits: 1
  completed_at: "2026-05-20T09:06:00Z"
---

# Quick 260520-dea: Sostituisci 1965 → 1984 (anno fondazione) Summary

Sostituite le 5 occorrenze residue dello scaffolding iniziale dell'anno errato "1965" con l'anno canonico "1984" (anno di fondazione di Calzoleria Prevenzano) in tagline, meta description, og:description, i18n home description, bio footer — eliminata l'incoerenza visibile nelle anteprime di condivisione (Open Graph) e nei contenuti frontend.

## Tasks Completed

| Task | Name                                                                        | Status   | Commit  |
| ---- | --------------------------------------------------------------------------- | -------- | ------- |
| 1    | Sostituire 1965 → 1984 nelle 5 occorrenze e verificare assenza residui      | Complete | a849fff |

## Files Modified

- `src/lib/constants/app.ts` — `tagline: "Sandali artigianali dal 1965"` → `"...dal 1984"` (1 occorrenza)
- `src/routes/__root.tsx` — meta description (linea 27) e og:description (linea 93): `...a Napoli dal 1965.` → `...a Napoli dal 1984.` (2 occorrenze, stessa template string — sostituite con `replace_all` Edit dopo verifica delle due match identiche)
- `public/locales/it/home.json` — campo `meta.description`: `"...fatti a mano a Napoli dal 1965. Pelle italiana..."` → `"...dal 1984. Pelle italiana..."` (1 occorrenza)
- `src/components/shared/Footer.tsx` — bio JSX brand (linea 66): `Sandali artigianali fatti a mano a Napoli dal 1965.` → `...dal 1984.` (1 occorrenza)

Totale: 4 file, 5 stringhe modificate, diff netto +5/-5 (sole cifre dell'anno).

## Files Created

Nessuno.

## Verification Results

- `grep -rn "1965" src/ public/locales/` → 0 match (zero residui dell'anno errato).
- `grep -c "1984" src/lib/constants/app.ts src/routes/__root.tsx public/locales/it/home.json src/components/shared/Footer.tsx` → 1, 2, 1, 1 (totale 5 occorrenze 1984, esattamente le 5 stringhe attese).
- `pnpm typecheck`: 26 errori totali (~baseline 25 pre-esistenti). Zero errori sui 4 file toccati (`app.ts`, `__root.tsx`, `home.json`, `Footer.tsx`). Gli errori restano sui file out-of-scope noti: `validators/auth.ts` (×2), `admin/media.$id.ts`, `admin/products.ts`, `routes/api/products.ts`, `scripts/verify-all-wcpa.ts`, `admin-functions.ts` (×2 incl. unused), `product-functions.ts`. Nessuna regressione introdotta dal task.
- `pnpm lint` NON eseguito (project-wide rotto perché `biome.json` incompatibile con Biome 2.x — deferito come da nota nel constraint del task).
- File NON toccati (out-of-scope): `scripts/apply-variant-configs.ts` (i match "1965" lì sono substring di ID timestamp tipo `1718196501363`, non l'anno); `src/routes/la-bottega.tsx` (già usa 1984); `CLAUDE.md` (già corretto); Footer logo "Calzoleria Since 1984" (già coerente).

## Deviations from Plan

Nessuna. Plan eseguito esattamente come scritto — sostituzione 1:1 sulle 5 occorrenze identificate, nessun refactor, nessun file aggiuntivo toccato, 1 commit atomico in italiano col messaggio richiesto. Nota tecnica minima (non deviazione): le 2 occorrenze in `__root.tsx` (linea 27 e linea 93) usano la stessa identica template string `Sandali artigianali fatti a mano a Napoli dal 1965.` → un singolo `Edit` con `replace_all: true` ha sostituito entrambe in un'unica chiamata, dopo che `grep -n` aveva confermato che erano gli unici due match esatti nel file.

## Decisions Made

- **Sostituzione mirata stringa-per-stringa**: rispettato il vincolo esplicito del plan ("modificare SOLO il numero 1965 → 1984, preservando virgolette/punteggiatura/capitalizzazione/struttura JSX/JSON/TS"). Non introdotta alcuna costante condivisa `FOUNDING_YEAR` né centralizzazione — fuori scope di un quick task da 4 file.
- **`__root.tsx`: uso di `replace_all`**: dopo verifica grep delle 2 match identiche è stato applicato un singolo Edit `replace_all: true` invece di 2 Edit separati con stringhe di contesto diverse. Equivalente al risultato, più sicuro (zero rischio di mismatch su template literals con backtick).

## Self-Check: PASSED

Verifica file modificati:
- FOUND: src/lib/constants/app.ts (contiene "Sandali artigianali dal 1984")
- FOUND: src/routes/__root.tsx (contiene 2× "...a Napoli dal 1984.")
- FOUND: public/locales/it/home.json (contiene "...a Napoli dal 1984.")
- FOUND: src/components/shared/Footer.tsx (contiene "...a Napoli dal 1984.")

Verifica commit:
- FOUND: a849fff (`fix(content): sostituisci anno fondazione 1965 → 1984 in tagline, meta, og, i18n, footer`)

Verifica grep residui:
- FOUND: 0 occorrenze di "1965" in src/ e public/locales/.
