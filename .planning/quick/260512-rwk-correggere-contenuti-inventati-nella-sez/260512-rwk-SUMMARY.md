---
phase: quick
plan: 260512-rwk
subsystem: content
tags: [copy, la-bottega, content-cleanup]

provides:
  - "Sezione 'La Bottega' / pagina /la-bottega: rimossi i dettagli inventati (Accademia della Moda di Napoli, sede storica nel centro nel 2018); badge '70+ Anni' corretto in '40+ Anni' (fondazione 1984); Nunzio e Francesca descritti come fratelli figli del fondatore (non 'seconda' vs 'terza generazione')"
affects: [eventuale ulteriore revisione copy con dati veri forniti dal cliente]

key-files:
  created: []
  modified:
    - src/components/sections/LaBottegaSection.tsx
    - src/routes/la-bottega.tsx

key-decisions:
  - "Vincolo utente: NON inventare nuovi dettagli al posto di quelli rimossi — dove l'informazione manca, frase generica e vera invece di un dettaglio fabbricato"
  - "Mantenuti i fatti non controversi: fondazione 1984 da Vincenzo Prevenzano (inizio: riparazioni), prima linea di sandali su misura, il figlio Nunzio entra e impara l'arte del sandalo al fianco del padre, poi la sorella Francesca si specializza in restauro/pulizia, export + materiali Made in Italy (pellami, cuoio toscano certificato, Swarovski)"
  - "Ruoli del team invariati ('Sandal Maker & Modellista' / 'Restauro & Pulizia')"
  - "Modifica minore: sotto-titolo sezione Team 'di padre in figlio' → 'di padre in figli'"

requirements-completed: [QUICK-260512-rwk]

duration: ~10min
completed: 2026-05-12
---

# Quick 260512-rwk: Rimozione contenuti inventati sezione "La Bottega" — Summary

**Badge homepage "70+ Anni" → "40+ Anni" (fondazione 1984); su `/la-bottega` rimossi i dettagli inventati ("Accademia della Moda di Napoli", "sede storica nel centro storico aperta nel 2018 vicino a Piazza del Plebiscito") da paragrafi storia e bio team; Nunzio e Francesca riscritti come fratelli figli del fondatore (non "seconda" vs "terza generazione"). Solo copy, nessun cambio strutturale.**

## Accomplishments
- `src/components/sections/LaBottegaSection.tsx`: badge fluttuante `<p>70+</p>` → `<p>40+</p>` (resta "Anni di tradizione").
- `src/routes/la-bottega.tsx` — paragrafi storia: par. 1 e 4 invariati; par. 2 riscritto (rimossa "Accademia della Moda di Napoli" — Nunzio "impara al fianco del padre l'arte del sandalo, formandosi come modellista di calzature"); par. 3 riscritto (rimossa la storia della "sede del 2018 nel centro storico / Piazza del Plebiscito"; Francesca esplicitamente "sorella di Nunzio").
- `src/routes/la-bottega.tsx` — `TEAM_MEMBERS`: bio Nunzio riscritta ("Seconda generazione dell'arte calzolaia, figlio del fondatore. Crea e personalizza i sandali a mano, portando avanti la tradizione del padre con cura artigianale."); bio Francesca riscritta ("Sorella di Nunzio. Si occupa del restauro e della cura di scarpe e borse in pelle, con competenza e passione nell'arte del recupero della pelletteria.") — rimosso il claim errato "La terza generazione della famiglia".
- `src/routes/la-bottega.tsx` — sotto-titolo sezione Team: "di padre in figlio" → "di padre in figli".

## Task Commits
1. **Task 1: badge 70+→40+ + riscrittura copy storia/team** — `0dd2a83` (fix)

## Verification
- `grep "Accademia della Moda\|terza generazione\|Nel 2018 Nunzio\|nuova sede nel centro storico" src/` → 0 risultati.
- `LaBottegaSection.tsx`: badge "40+", zero "70+".
- `pnpm typecheck`: 25 errori, tutti pre-esistenti out-of-scope (scripts/*, validators/auth, api/admin/products, api/products, api/admin/media.$id, lib/admin-functions, lib/product-functions). Zero nuovi errori nei file toccati.
- Checkpoint human-verify (Task 2): testi riscritti mostrati all'utente; **approvato** ("pusha direttamente").

## Deviations from Plan
Nessuna deviazione sostanziale. Solo copy, nessun nuovo `any`, nessun cambio strutturale/DB/API.

## Follow-ups (non in scope)
- Eventuale ulteriore revisione del copy `/la-bottega` se il cliente fornisce dettagli veri da reintegrare (es. formazione reale di Nunzio, eventi della calzoleria) — per ora i testi sono volutamente sobri e privi di dettagli non confermati.

## Self-Check: PASSED
- `src/components/sections/LaBottegaSection.tsx` — modificato (badge 40+)
- `src/routes/la-bottega.tsx` — modificato (storia + bio)
- Commit `0dd2a83` — FOUND
- Checkpoint Task 2 — approvato dall'utente

---
*Phase: quick/260512-rwk*
*Completed: 2026-05-12*
