---
phase: quick/260512-rwk
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/sections/LaBottegaSection.tsx
  - src/routes/la-bottega.tsx
autonomous: false
requirements: [QUICK-260512-rwk]
must_haves:
  truths:
    - "Il badge fluttuante nella sezione La Bottega mostra '40+' (non '70+'), coerente con la fondazione 1984"
    - "Nessun testo del sito frontend cita l'inesistente 'Accademia della Moda di Napoli'"
    - "Nessun testo del sito frontend afferma che Nunzio ha aperto una sede nel centro storico nel 2018"
    - "Francesca è descritta come sorella di Nunzio (stessa generazione), non come 'terza generazione'"
    - "I paragrafi della storia raccontano solo fatti veri/non controversi: fondazione 1984 da Vincenzo (riparazioni), prima linea di sandali su misura, ingresso del figlio Nunzio, poi della sorella Francesca (restauro), export + materiali Made in Italy certificati"
    - "Typecheck baseline invariato (25 errori pre-esistenti out-of-scope)"
  artifacts:
    - path: "src/components/sections/LaBottegaSection.tsx"
      provides: "Badge '40+' / 'Anni di tradizione'"
      contains: "40+"
    - path: "src/routes/la-bottega.tsx"
      provides: "ABOUT_COPY.paragraphs riscritti + TEAM_MEMBERS bio riscritte (Nunzio, Francesca)"
      contains: "Francesca Prevenzano"
  key_links:
    - from: "src/components/sections/LaBottegaSection.tsx"
      to: "homepage section La Bottega"
      via: "badge proof"
      pattern: "40\\+"
    - from: "src/routes/la-bottega.tsx"
      to: "pagina /la-bottega (storia + team)"
      via: "ABOUT_COPY + TEAM_MEMBERS"
      pattern: "Francesca"
---

<objective>
Correggere i contenuti generici/inventati nella sezione "La Bottega" (homepage) e nella pagina storia `/la-bottega`:
- Badge "70+ Anni di tradizione" → "40+ Anni di tradizione" (Calzoleria Prevenzano fondata nel 1984 → ~42 anni nel 2026).
- Rimuovere dalla storia e dalle bio del team i dettagli inventati: "Accademia della Moda di Napoli" (non esiste) e "sede storica nel centro storico aperta nel 2018 a pochi passi da Piazza del Plebiscito" (inventata).
- Correggere la relazione tra Nunzio e Francesca: sono FRATELLI, entrambi figli del fondatore Vincenzo Prevenzano (stessa generazione), NON "seconda" vs "terza generazione".

Purpose: Eliminare claim falsi/inventati dal sito pubblico, mantenendo un tono sobrio e artigianale e SENZA inventare dettagli sostitutivi (vincolo esplicito dell'utente: se un'informazione non c'è, meglio una frase generica e vera).
Output: 2 file modificati (solo copy, nessun cambio strutturale), checkpoint umano sui nuovi testi.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md

<interfaces>
File `src/components/sections/LaBottegaSection.tsx` — il badge è alle righe ~97-100:
```tsx
<div className="absolute -bottom-4 -left-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] px-5 py-3 shadow-lg md:-bottom-6 md:-left-6 md:px-6 md:py-4">
  <p className="font-display text-lg font-bold text-[var(--color-primary)]">70+</p>
  <p className="text-xs font-medium text-[var(--color-text-muted)]">Anni di tradizione</p>
</div>
```
(Il `BOTTEGA_COPY` in cima al file NON contiene riferimenti da correggere — solo il badge "70+".)

File `src/routes/la-bottega.tsx`:
- `ABOUT_COPY.paragraphs` (array di 4 stringhe, righe ~18-23). Da riscrivere il paragrafo 3 (indice 1, riga ~20: contiene "Accademia della Moda di Napoli") e il paragrafo 4 (indice 2, riga ~21: contiene "Nel 2018 Nunzio apre una nuova sede nel centro storico... a pochi passi da Piazza del Plebiscito"). Paragrafi 1 (riga ~19, fondazione 1984) e 4-bis (riga ~22, export + materiali) sono OK — non toccarli.
- `TEAM_MEMBERS` (array, righe ~38-55): bio di Nunzio (`description`, riga ~43: cita "Accademia della Moda" + "sede storica in centro nel 2018") e di Francesca (`description`, riga ~51: "La terza generazione della famiglia"). I campi `name`, `role`, `image`, `imageAlt` restano invariati (i `role` possono essere ritoccati solo se la riformulazione li rende più chiari — a discrezione, ma di default lasciarli).
- Riga ~145 (sezione Team, sotto-titolo): `"Due generazioni a tramandarsi, di padre in figlio, l'arte calzolaia napoletana — la stessa calzoleria, le stesse mani, dal 1984."` — "Due generazioni" è OK; "di padre in figlio" è ora leggermente impreciso (citiamo anche la figlia). Modifica minima a discrezione (es. "di padre in figli", o lasciare). Non obbligatorio.
- ATTENZIONE: riga ~117 contiene già "a due passi da Via Chiaia e Piazza del Plebiscito" come riferimento generico alla zona della calzoleria — questo va bene, NON è il claim inventato. Il claim da rimuovere è specificamente "Nel 2018 Nunzio apre una NUOVA SEDE nel centro storico ... a pochi passi da Piazza del Plebiscito".
</interfaces>

<facts_disponibili>
Solo questi fatti sono confermati — usare SOLO questi, non inventare altro:
- 1984: fondazione da parte del maestro Vincenzo Prevenzano. Attività iniziale: riparazione di scarpe, borse, valigie. Diventa punto di riferimento del quartiere.
- Poi crea la prima linea di sandali su misura, con successo.
- Il figlio Nunzio Prevenzano, da piccolo, frequenta la calzoleria; al termine del liceo decide di entrare nell'attività e impara/porta avanti l'arte del sandalo al fianco del padre (modellista di calzature — il ruolo va bene, l'Accademia no).
- Successivamente entra a far parte dell'attività anche Francesca Prevenzano, sorella di Nunzio (la "piccola di casa" → sorella minore), che si distingue per la bravura nel restauro di scarpe e borse.
- Calzoleria Prevenzano esporta il marchio in tutto il mondo, con accuratezza nei dettagli. Materiali dal territorio nazionale: pellami pregiati per la tomaia, cuoio toscano certificato per le suole, cristalli Swarovski e pietre preziose. "Il tutto certificato."
- Nunzio: seconda generazione / figlio del fondatore.
- Francesca: sorella di Nunzio (stessa generazione, seconda).
</facts_disponibili>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Badge "70+"→"40+" + riscrittura copy storia/team in la-bottega.tsx</name>
  <files>src/components/sections/LaBottegaSection.tsx, src/routes/la-bottega.tsx</files>
  <action>
Modifiche di solo testo (nessun cambio JSX/struttura/className, nessun nuovo componente, nessun import nuovo):

1) `src/components/sections/LaBottegaSection.tsx` — nel badge fluttuante (riga ~98): `<p ...>70+</p>` → `<p ...>40+</p>`. Lasciare invariato `<p ...>Anni di tradizione</p>`.

2) `src/routes/la-bottega.tsx` — `ABOUT_COPY.paragraphs`:
   - Paragrafo che contiene "Accademia della Moda di Napoli" (indice 1, riga ~20): riscrivere rimuovendo l'Accademia. Mantenere il senso: Nunzio, dopo il liceo, decide di entrare nella calzoleria e impara/porta avanti l'arte del sandalo al fianco del padre, come modellista di calzature. NON inventare un'alternativa all'Accademia (no altre scuole/credenziali). Esempio accettabile: «...Al termine degli studi al liceo decide di entrare anch'egli nella calzoleria, dove impara al fianco del padre l'arte del sandalo, formandosi come modellista di calzature.»
   - Paragrafo che contiene "Nel 2018 Nunzio apre una nuova sede nel centro storico di Napoli, a pochi passi da Piazza del Plebiscito" (indice 2, riga ~21): rimuovere completamente la frase sulla sede del 2018 (data + "nuova sede" + "centro storico" + "a pochi passi da Piazza del Plebiscito"). Mantenere e riformulare in modo che resti chiaro che: Nunzio porta avanti la creatività e la manualità dell'arte del sandalo, e successivamente entra nell'attività anche la sorella di Nunzio, Francesca Prevenzano, che si distingue per la bravura nel restauro di scarpe e borse. (Va bene tenere "la piccola di casa, Francesca Prevenzano" se affianchi "sorella di Nunzio" o lo rendi chiaro dal contesto.) Esempio accettabile: «Nunzio porta avanti la tradizione paterna mettendo al centro la creatività e la manualità dell'arte del sandalo. Successivamente entra a far parte dell'attività anche la sorella di Nunzio, Francesca Prevenzano, che si distingue subito per la sua bravura nel restauro di scarpe e borse.»
   - Paragrafo 1 (fondazione 1984) e paragrafo 4 (export + materiali certificati): NON toccare.
   - Mantenere il file un valido TS: `ABOUT_COPY` resta `as const`, l'array `paragraphs` resta un array di stringhe (puoi cambiare il numero di paragrafi se la riformulazione lo richiede, ma è preferibile restare 4).

3) `src/routes/la-bottega.tsx` — `TEAM_MEMBERS`:
   - Nunzio (`description`, riga ~43): rimuovere "Formatosi presso l'Accademia della Moda di Napoli" e "Ha aperto la sede storica in centro nel 2018". Riscrivere sobrio, p.es.: «Seconda generazione dell'arte calzolaia, figlio del fondatore. Crea e personalizza i sandali a mano, portando avanti la tradizione del padre con cura artigianale.» — NON inventare credenziali/date. `name`/`role`/`image`/`imageAlt` invariati.
   - Francesca (`description`, riga ~51): rimuovere "La terza generazione della famiglia." (errato). Riscrivere senza il claim sbagliato, p.es.: «Sorella di Nunzio. Si occupa del restauro e della cura di scarpe e borse in pelle, con competenza e passione nell'arte del recupero della pelletteria.» `name`/`role`/`image`/`imageAlt` invariati.

4) `src/routes/la-bottega.tsx` — riga ~145 (sotto-titolo Team "Due generazioni a tramandarsi, di padre in figlio..."): modifica minima a discrezione (es. "di padre in figli") oppure lasciare invariato. Non obbligatorio; se in dubbio, lasciare.

Tono per tutte le riscritture: sobrio, artigianale, italiano corretto, coerente col resto del sito (calzoleria napoletana dal 1984). Vincolo non negoziabile: NON inventare dettagli sostitutivi (niente nuove scuole, date, sedi, premi). Se un'informazione non c'è → frase generica e vera. Rispettare CLAUDE.md (zero `any` — qui non si tocca logica; design token — qui solo copy).
  </action>
  <verify>
    <automated>grep -rn "Accademia della Moda\|terza generazione\|Nel 2018 Nunzio\|nuova sede nel centro storico" src/ ; test $? -ne 0 && grep -rn "70+" src/components/sections/LaBottegaSection.tsx ; echo "expect: nessun match per i claim inventati, e nessun '70+' nel badge"</automated>
  </verify>
  <done>
- `src/components/sections/LaBottegaSection.tsx` mostra `40+` nel badge (zero occorrenze di `70+` nel file).
- `grep -rn "Accademia della Moda" src/` → nessun risultato.
- `grep -rn "terza generazione" src/` → nessun risultato.
- `grep -rn "Nel 2018 Nunzio\|nuova sede nel centro storico" src/` → nessun risultato.
- `src/routes/la-bottega.tsx` compila (file TS valido, `as const` preservato); `ABOUT_COPY.paragraphs` mantiene fondazione 1984, prima linea di sandali, ingresso di Nunzio (senza Accademia), ingresso di Francesca come sorella (senza sede 2018), export + materiali certificati.
- Bio di Nunzio e Francesca riscritte senza claim inventati; Francesca = sorella di Nunzio (non "terza generazione").
- `pnpm typecheck` (o `pnpm exec tsc --noEmit`): conteggio errori invariato a 25 (errori pre-esistenti out-of-scope: scripts/*, validators/auth, api/admin/products, api/products, api/admin/media.$id). Zero nuovi errori.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
Corretti i contenuti inventati nella sezione "La Bottega" (homepage) e nella pagina `/la-bottega`:
- Badge "70+ Anni di tradizione" → "40+ Anni di tradizione".
- Rimossi: riferimenti all'"Accademia della Moda di Napoli" (inesistente) e alla "sede storica nel centro aperta nel 2018 a pochi passi da Piazza del Plebiscito" (inventata), sia nei paragrafi della storia (`ABOUT_COPY.paragraphs`) sia nelle bio del team (`TEAM_MEMBERS`).
- Francesca ridescritta come sorella di Nunzio (stessa generazione), non più "terza generazione".
  </what-built>
  <how-to-verify>
1. Avvia il dev server (`pnpm dev`) e apri `http://localhost:3000/la-bottega`.
2. Leggi i nuovi paragrafi della sezione "La nostra calzoleria" (storia) e le due bio del team (Nunzio, Francesca): verifica che (a) NON ci siano dettagli inventati, (b) il tono sia sobrio/artigianale, (c) l'italiano sia corretto, (d) sia chiaro che Nunzio e Francesca sono fratelli, figli del fondatore Vincenzo.
3. Apri la homepage `http://localhost:3000/` e scorri fino alla sezione "La nostra storia / La Calzoleria Prevenzano": verifica che il badge fluttuante sulla foto dica "40+ / Anni di tradizione".
4. Se vuoi ritoccare una frase, indicalo qui (riportando il testo desiderato) e l'executor la aggiorna prima di chiudere.
  </how-to-verify>
  <resume-signal>Scrivi "approvato" oppure indica i testi da ritoccare.</resume-signal>
</task>

</tasks>

<verification>
- `grep -rn "Accademia della Moda" src/` → 0 risultati.
- `grep -rn "terza generazione" src/` → 0 risultati.
- `grep -rn "Nel 2018 Nunzio\|nuova sede nel centro storico" src/` → 0 risultati.
- `grep -n "70+" src/components/sections/LaBottegaSection.tsx` → 0 risultati; `grep -n "40+" src/components/sections/LaBottegaSection.tsx` → 1 risultato (il badge).
- `pnpm typecheck`: 25 errori (baseline), zero regressioni.
- Checkpoint umano sui nuovi testi: approvato.
</verification>

<success_criteria>
- Badge homepage "La Bottega": "40+ Anni di tradizione".
- Pagina `/la-bottega`: storia e bio del team prive di claim inventati (Accademia della Moda, sede 2018), con relazione corretta Nunzio↔Francesca (fratelli, figli di Vincenzo).
- Nessun cambio strutturale ai componenti; nessun nuovo componente; solo testo.
- Typecheck baseline invariato (25).
- Utente ha rivisto e approvato i nuovi testi.
</success_criteria>

<output>
After completion, create `.planning/quick/260512-rwk-correggere-contenuti-inventati-nella-sez/260512-rwk-SUMMARY.md`
</output>
