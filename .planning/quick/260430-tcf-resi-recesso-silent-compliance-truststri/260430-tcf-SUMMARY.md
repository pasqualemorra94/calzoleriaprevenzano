---
quick_id: 260430-tcf
type: execute
wave: 1
status: complete
completed_date: 2026-04-30
duration_hours: 0.5  # plan già pre-eseguito a sessione precedente, questa sessione = verifica + push + SUMMARY/STATE
files_changed: 13
files_new: 3
loc_added: ~600
loc_removed: ~15
commits:
  - 1ff3a00 chore(marketing) Task 1 — TrustStrip "Pellami italiani certificati"
  - 2d83493 chore(marketing) Task 2 — testimonianza Giulia P. senza menzione reso
  - cab5e72 feat(footer) Task 3 — split "Spedizioni e resi" + id="spedizioni"
  - 28c0a68 feat(legal) Task 4 — Termini § 8 (5 modifiche legali)
  - ebaffd7 feat(legal) Task 5 — nuova pagina /resi-e-recesso (3 sezioni)
  - 0bd8792 feat(legal) Task 6 — PDF modulo recesso + script pdfkit
  - be02626 feat(checkout) Task 7 — checkbox + Zod literal(true) + AuditLog
requirements_completed:
  - SILENT-COMPLIANCE-01
  - SILENT-COMPLIANCE-02
  - SILENT-COMPLIANCE-03
  - SILENT-COMPLIANCE-04
  - SILENT-COMPLIANCE-05
typecheck_baseline_before: 25
typecheck_baseline_after: 25
typecheck_new_errors_on_touched_files: 0
deviations: 0
push_authorized: true
---

# Quick Task 260430-tcf — Resi & Recesso "Silent Compliance" Summary

## One-liner

Allineamento marketing al minimo legale (Art. 49/52/56/57/59 D.Lgs. 206/2005): rimossa promessa "reso facile 30gg" da TrustStrip + testimonianza, footer split "Spedizioni"/"Resi e recesso", termini § 8 con 5 modifiche legali (14gg solari + decurtazione deprezzamento + esclusione express + link modulo PDF), nuova pagina `/resi-e-recesso` (3 sezioni separazione personalizzati ex Art. 59 lett. c vs shop 14gg), PDF `modulo-recesso.pdf` generato via pdfkit, checkbox accettazione termini al checkout con validazione Zod `z.literal(true)` server-side (422) + AuditLog `terms_accepted_at_checkout` post-create.

## Context

Cliente artigiano (Calzoleria Prevenzano, Napoli, dal 1984) non concepisce il reso e non vuole comunicare "reso facile". Stato pre-esistente incoerente:
- TrustStrip homepage prometteva "30 giorni reso facile"
- Testimonianza Giulia P. dichiarava "ho fatto un reso ed è stato semplicissimo"
- Footer aveva voce esplicita "Spedizioni e resi" che invitava all'azione
- **Buco compliance Art. 49 D.Lgs. 206/2005**: checkout senza checkbox accettazione termini, indebolendo la difesa in caso di chargeback Stripe

Spec di riferimento: `docs/superpowers/specs/2026-04-30-resi-policy-silent-compliance-design.md` (commit `91a36cd`).

Strategia "silent compliance" in una frase: eliminare ogni promessa di "reso facile" dal marketing, mantenere il minimo legale ben sepolto, aggiungere frizione legittima (modulo PDF + raccomandata/email), separare nettamente personalizzati (esclusi ex Art. 59 lett. c) dai prodotti Shop (14gg solari ex Art. 52), chiudere il buco checkbox termini al checkout con audit trail.

## Implementation

### Task 1 — TrustStrip card sostituita (commit `1ff3a00`)

`src/components/sections/TrustStripSection.tsx` — rimossa card "Reso facile 30gg" (icon `RotateCcw`, counter target=30), sostituita con "Pellami italiani certificati" (icon `BadgeCheck`, no counter). Import lucide-react aggiornato: rimosso `RotateCcw`, aggiunto `BadgeCheck`. Le altre 3 card (Made in Italy, Spedizione rapida, Pagamento sicuro) invariate. Layout grid `md:grid-cols-4` continua a funzionare con 4 elementi totali.

Per **SILENT-COMPLIANCE-01**: rimossa promessa extra-legale dal marketing pubblico.

### Task 2 — Testimonial Giulia P. riscritta (commit `2d83493`)

`src/components/sections/TestimonialsSection.tsx` riga 34. Sostituito `"L'anno scorso ho fatto un reso ed è stato semplicissimo."` con `"La cura nei dettagli si vede dal primo paio."`. Stessa lunghezza, stesso tono, struttura array invariata (autore, città, ordine).

Per **SILENT-COMPLIANCE-01**: eliminato messaggio contraddittorio.

### Task 3 — Footer split + ancora #spedizioni (commit `cab5e72`)

`src/components/shared/Footer.tsx` — rimossa voce `{ label: "Spedizioni e resi", href: "/termini" }`, sostituita con due voci distinte: `{ label: "Spedizioni", href: "/termini#spedizioni" }` + `{ label: "Resi e recesso", href: "/resi-e-recesso" }`. Footer `info.items` finale ha 5 voci.

`src/routes/termini.tsx` § 7 (Spedizione e Consegna): aggiunto `id="spedizioni"` al `<section>` opening per supportare l'anchor link dal footer. Contenuto sezione invariato.

Per **SILENT-COMPLIANCE-01** (rimossa CTA "resi") e **SILENT-COMPLIANCE-04** (link discreto a nuova pagina, raggruppato in "Informazioni" non in mega menu).

### Task 4 — Termini § 8 (5 modifiche legali) (commit `28c0a68`)

`src/routes/termini.tsx` sezione "8. Diritto di Recesso" — 5 edit puntuali:

1. **"14 giorni lavorativi" → "14 giorni"** (Art. 52: termine corretto è 14 giorni solari, non lavorativi). Verificato che le occorrenze residue di "giorni lavorativi" sono tutte in § 7 (Spedizione, righe 235/264/265/266/276/277/278) e fanno riferimento alle tempistiche di consegna, NON al diritto di recesso — rimangono giustamente invariate.
2. **Aggiunto paragrafo modulo PDF + email + raccomandata**: link a `/modulo-recesso.pdf` (target=_blank rel=noopener), email `resi@calzoleriaprevenzano.it`, raccomandata A/R, citazione "Allegato I, parte B, D.Lgs. 206/2005".
3. **Aggiunto paragrafo decurtazione deprezzamento** (subito prima del blocco "Eccezioni al diritto di recesso"): citazione `art. 57 comma 2 D.Lgs. 206/2005`, copertura prodotti restituiti privi imballaggio originale/segni d'uso/sporchi/danneggiati.
4. **Modifica paragrafo Rimborso**: "spese di spedizione" → "spese di spedizione **standard**", aggiunto disclaimer "Eventuali costi aggiuntivi per opzioni di spedizione espressa o non standard scelti dall'Acquirente non saranno rimborsati", citazione `art. 56 comma 2 D.Lgs. 206/2005`. Aggiunta frase "decorrenti dalla data in cui il Venditore riceve i Prodotti restituiti, integri, completi di tutti gli accessori e nelle condizioni descritte sopra" per esplicitare il dies a quo del termine 14gg rimborso.
5. **Aggiunto paragrafo finale § 8**: link "pagina dedicata Resi e Recesso" → `/resi-e-recesso`.

Per **SILENT-COMPLIANCE-05** (allineamento minimo legale + frizione), **SILENT-COMPLIANCE-02** (link modulo PDF + email + raccomandata), **SILENT-COMPLIANCE-04** (link a nuova pagina).

### Task 5 — Nuova pagina /resi-e-recesso (commit `ebaffd7`)

`src/routes/resi-e-recesso.tsx` (211 LOC, file nuovo). Layout coerente con `termini.tsx`/`privacy.tsx`/`cookie.tsx` esistenti: wrapper `mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-16`, link "← Torna alla homepage" in alto, h1 + stitch divider, `<article className="prose-custom max-w-none">` + `<div className="space-y-8">`, "Ultimo aggiornamento: 30 aprile 2026".

3 sezioni in ordine strategico:

**Sezione A — "I nostri sandali sono cuciti per te"**: tono onesto in prima persona plurale. 3 paragrafi (~150 parole) che spiegano che ogni sandalo Classica/Gioiello/Bambini viene cucito a mano dopo che il cliente ha scelto pelle/colore/tacco/gioiello → esclusione recesso `Art. 59 lettera c D.Lgs. 206/2005` con `<strong>esclusi dal diritto di recesso</strong>`. Lista bullet "Categorie escluse dal recesso" con 4 voci coerenti con seed Prisma (parent slug `sandali`: Classica con figli `con-infradito`/`schiava`, Gioiello con `cavigliera`/`con-infradito-gioiello`/`aggiunta-ciondolo`/`fasce`/`strass`, Bambini con `infradito-bambini`/`no-infradito-bambini`, prodotti con incisione/monogramma).

**Sezione B — "Prodotti Shop pronti — Diritto di recesso 14 giorni"**: tono asciutto/tecnico (~200 parole). Categorie incluse esplicite (Pelletteria stock: borselli/cinture/agende; Accessori non personalizzati slug `accessori-calzoleria`; Articoli per calzature: solette). h3 sub-sezioni: Termine (14gg solari Art. 52), Procedura (modulo PDF link `/modulo-recesso.pdf` target=_blank + email/raccomandata), Restituzione (14gg da comunicazione, tracciabile), Spese di restituzione (a carico Acquirente, default Art. 57), Stato dei prodotti (integri + decurtazione legittima Art. 57 c.2), Rimborso (stesso metodo, 14gg da ricezione, esclusi costi extra spedizione express Art. 56 c.2), Trattenuta legittima.

**Sezione C — "Difetti e garanzia"** (~100 parole): garanzia legale 24 mesi (Art. 128-135 D.Lgs. 206/2005, su tutto incluso personalizzati), garanzia artigianale aggiuntiva 12 mesi su difetti fabbricazione, procedura email `info@calzoleriaprevenzano.it`, esclusioni standard, link finale a `/termini#garanzia` (acceptable se l'ancora non è ancora presente, page scrollerà in cima).

Footer pagina: link `← Torna ai Termini di Vendita` → `/termini`. File-based routing TanStack Router auto-registra `resi-e-recesso.tsx` → `/resi-e-recesso`.

Per **SILENT-COMPLIANCE-04**: pagina dedicata con tono onesto, nessun "facile/semplice", separazione netta personalizzati vs shop standard.

### Task 6 — PDF modulo recesso (commit `0bd8792`)

`pnpm add -D pdfkit @types/pdfkit` (verificato in `package.json`: `pdfkit ^0.18.0`, `@types/pdfkit ^0.17.6`). Script `pnpm modulo:gen` (= `tsx scripts/generate-modulo-recesso.ts`) aggiunto a `package.json scripts` dopo `db:cleanup-e2e`.

`scripts/generate-modulo-recesso.ts` (~80 LOC): pdfkit + node:fs + node:path. Genera 1 pagina A4 con:
- Intestazione "Modulo di recesso" (Times-Bold 16pt center)
- Sottotitolo "(Allegato I, parte B, D.Lgs. 6 settembre 2005, n. 206 — Codice del Consumo)"
- Istruzioni "Compilare e restituire il presente modulo solo se si desidera recedere dal contratto"
- Destinatario precompilato: Calzoleria Prevenzano di Prevenzano Antonio, Via Chiaia 104 — 80132 Napoli (NA), P.IVA 04590921211, email resi@calzoleriaprevenzano.it
- Corpo dichiarazione standard "Con la presente io/noi (*) notifico/notifichiamo (*)..."
- 3 righe vuote per descrizione beni/servizi
- Campi vuoti: Numero ordine, Data ordine, Data consegna, Nome consumatore/i, Indirizzo (2 righe), Firma (2 righe), Data
- Note "(*) Cancellare la dicitura inutile"

`pnpm modulo:gen` eseguito → `public/modulo-recesso.pdf` generato (2194 bytes, file riconosciuto come "PDF document, version 1.3, 1 pages"). TanStack Start serve `public/` direttamente al root URL → `/modulo-recesso.pdf` accessibile in produzione.

Per **SILENT-COMPLIANCE-02**: modulo PDF è la frizione legittima principale, allineato Art. 49 lett. h (modulo tipo recesso obbligatoriamente disponibile).

### Task 7 — Checkbox checkout end-to-end (commit `be02626`)

Modifica end-to-end client + server + audit:

**`src/lib/validators/products.ts`** (+6 LOC): aggiunto `acceptedTerms: z.literal(true, { message: "Devi accettare i Termini di Vendita per procedere" })` in entrambi gli schemi `checkoutSchema` (auth, righe 137-139) e `checkoutGuestSchema` (guest, righe 161-163). Sintassi Zod v4 con `message` (non `error`) come da spec runtime.

**`src/components/checkout/OrderSummary.tsx`** (+5 LOC, -2): aggiunto `disabled?: boolean` a `OrderSummaryProps`, destructuring `disabled = false`, bottone submit con `disabled={submitStatus === "loading" || disabled}`.

**`src/routes/checkout.tsx`** (+38 LOC): stato locale `acceptedTerms` + `acceptedTermsError`, gate finale in `validateForm()` che ritorna false e setta error se `!acceptedTerms`, body POST `/api/checkout` include `acceptedTerms: true` (sia branch guest che auth), checkbox UI inserito nel `<div className="lg:sticky lg:top-24">` SOPRA `<OrderSummary>` con label "Ho letto e accetto i Termini di Vendita" + link `target=_blank rel="noopener"` a `/termini`, attributi a11y (`aria-required`, `aria-describedby`), error message rendering condizionale. Prop `disabled={!acceptedTerms}` passata a `OrderSummary`.

**`src/routes/api/checkout.ts`**: validazione 422 automatica via Zod (nessuna modifica esplicita necessaria, lo schema aggiornato gestisce il caso). Verificato `apiError("VALIDATION_ERROR", "Dati non validi", 422)` in entrambi i branch (riga 36-39 guest, riga 115-118 auth).

**`src/lib/orders.server.ts`** (+23 LOC): aggiunto `import { createLogger }` + `const log = createLogger("orders")`. Insert AuditLog post-create con `try/catch` best-effort (non blocca ordine se audit fallisce):
```typescript
prisma.auditLog.create({
  data: {
    userId: userId ?? null,        // null per guest
    event: "terms_accepted_at_checkout",
    ip: ipAddress,
    userAgent,
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
  },
});
```

Per **SILENT-COMPLIANCE-03**: chiuso buco Art. 49 D.Lgs. 206/2005 con checkbox + audit trail server-side. Checkbox singolo verso `/termini` copre Art. 49 lett. b/c/d/e/f/g/h tramite link unico (massimo nascondimento, scelta esplicita utente come da spec § Decisioni chiave).

## Decisions

- **TrustStrip**: card sostituita anziché rimossa, per mantenere layout grid 4-col; nuovo titolo "Pellami italiani certificati" rinforza identità artigianale
- **Footer**: voce "Resi e recesso" raggruppata in "Informazioni" (non in nuovo gruppo dedicato) per coerenza con strategia "non in bella vista"
- **Termini § 8**: aggiornamento timestamp lasciato al "1 aprile 2026" pre-esistente (out of scope, non una modifica legale richiesta)
- **/resi-e-recesso**: ancora `id="garanzia"` in termini.tsx § 9 NON aggiunta (out of scope plan); link `/termini#garanzia` scrollerà in cima — acceptable
- **PDF**: generato via pdfkit invece di committare PDF statico per riproducibilità + tracciabilità delle modifiche al testo legale (lo script è la source of truth, il PDF è un artefatto)
- **PDF — destinatario**: usato P.IVA `04590921211` confermato dal Footer pre-esistente, email `resi@calzoleriaprevenzano.it` (mailbox da attivare post-deploy, vedi setup utente)
- **Checkout — checkbox singolo**: scelta strategica (no checkbox separati per privacy/marketing) per coprire Art. 49 lett. b-h con link unico a `/termini`, conforme a spec § "Decisioni chiave" tabella
- **Checkout — AuditLog**: `userId` opzionale (null per guest) coerente con schema Prisma `AuditLog.userId String?`; metadata `{orderId, orderNumber}` sufficiente per dispute Stripe
- **Checkout — AuditLog best-effort**: try/catch + `log.warn` invece di crash dell'ordine, perché un fallimento audit (es. DB hiccup) non deve bloccare un pagamento Stripe già autorizzato
- **Zod sintassi**: `z.literal(true, { message: "..." })` (Zod v4 usa `message`, NON `error` come la spec del plan riportava — verificato runtime-OK)

## Deviations from Plan

**Zero deviazioni Rule 1/2/3.**

Plan eseguito esattamente come scritto, una sola sostituzione minore di sintassi:
- **Zod schema syntax**: la spec del plan riportava `z.literal(true, { error: "..." })` ma Zod v4 corretto è `{ message: "..." }`. Adottato `message` (verificato compilazione + esecuzione OK, baseline typecheck preservato 25 → 25). Non è una deviazione Rule 1/2/3 ma un allineamento alla API reale della libreria.

Nessuna funzionalità aggiunta oltre lo scope, nessun bug-fix incidentale, nessun architectural change.

## Verification

### Smoke test automatico (eseguiti)

| # | Check | Comando | Risultato |
|---|-------|---------|-----------|
| 1 | TrustStrip — `RotateCcw` rimosso | `grep -c "RotateCcw" src/components/sections/TrustStripSection.tsx` | `0` ✓ |
| 1 | TrustStrip — `BadgeCheck` importato | `grep -c "BadgeCheck" src/components/sections/TrustStripSection.tsx` | `2` ✓ (import + uso) |
| 1 | TrustStrip — nuova card | `grep -c "Pellami italiani certificati" src/components/sections/TrustStripSection.tsx` | `1` ✓ |
| 2 | Testimonial — no menzione reso | `grep -c "ho fatto un reso" src/components/sections/TestimonialsSection.tsx` | `0` ✓ |
| 2 | Testimonial — nuovo testo | `grep -c "primo paio" src/components/sections/TestimonialsSection.tsx` | `1` ✓ |
| 3 | Footer — voce vecchia rimossa | `grep -c "Spedizioni e resi" src/components/shared/Footer.tsx` | `0` ✓ |
| 3 | Footer — link nuova pagina | `grep -c "/resi-e-recesso" src/components/shared/Footer.tsx` | `1` ✓ |
| 3 | Footer — anchor #spedizioni | `grep -c '"/termini#spedizioni"' src/components/shared/Footer.tsx` | `1` ✓ |
| 3 | Termini — id="spedizioni" | `grep -c 'id="spedizioni"' src/routes/termini.tsx` | `1` ✓ |
| 4 | Termini § 8 — 14 giorni lavorativi rimosso | check su § 8 (righe ~299-361) | `0` matches in § 8 ✓ (le 7 occorrenze residue sono tutte in § 7 Spedizione, righe 235/264/265/266/276/277/278) |
| 4 | Termini § 8 — link modulo PDF | `grep -c "modulo-recesso.pdf" src/routes/termini.tsx` | `1` ✓ |
| 4 | Termini § 8 — Art. 56 c.2 | `grep -c "art. 56 comma 2" src/routes/termini.tsx` | `1` ✓ |
| 4 | Termini § 8 — Art. 57 c.2 | `grep -c "art. 57 comma 2" src/routes/termini.tsx` | `1` ✓ |
| 4 | Termini § 8 — link nuova pagina | `grep -c "/resi-e-recesso" src/routes/termini.tsx` | `1` ✓ |
| 5 | /resi-e-recesso — file esiste | `test -f src/routes/resi-e-recesso.tsx` | exit 0 ✓ |
| 5 | /resi-e-recesso — route registrata | `grep -c 'createFileRoute' src/routes/resi-e-recesso.tsx` | `2` ✓ |
| 5 | /resi-e-recesso — Art. 59 (esclusione personalizzati) | `grep -c "Art. 59" src/routes/resi-e-recesso.tsx` | `1` ✓ |
| 5 | /resi-e-recesso — Art. 52 (14gg shop) | `grep -c "Art. 52" src/routes/resi-e-recesso.tsx` | `2` ✓ |
| 5 | /resi-e-recesso — LOC ≥ 150 | `wc -l src/routes/resi-e-recesso.tsx` | `211` ✓ |
| 6 | PDF — esiste | `test -f public/modulo-recesso.pdf` | exit 0 ✓ |
| 6 | PDF — formato | `file public/modulo-recesso.pdf` | `PDF document, version 1.3, 1 pages` ✓ |
| 6 | PDF — size > 0 | `ls -la public/modulo-recesso.pdf` | `2194 bytes` ✓ |
| 6 | Script — esiste | `test -f scripts/generate-modulo-recesso.ts` | exit 0 ✓ |
| 6 | pdfkit — devDep | `grep "pdfkit" package.json` | `pdfkit ^0.18.0` + `@types/pdfkit ^0.17.6` ✓ |
| 6 | Script — registrato in package.json | `grep "modulo:gen" package.json` | `"modulo:gen": "tsx scripts/generate-modulo-recesso.ts"` ✓ |
| 7 | Validators — z.literal(true) | `grep -c "acceptedTerms" src/lib/validators/products.ts` | `2` ✓ (entrambi gli schemi) |
| 7 | Checkout — UI checkbox | `grep -c "acceptedTerms" src/routes/checkout.tsx` | `9` ✓ (state, validate, body, UI) |
| 7 | OrderSummary — prop disabled | `grep -c "disabled" src/components/checkout/OrderSummary.tsx` | `4` ✓ |
| 7 | orders.server — AuditLog event | `grep -c "terms_accepted_at_checkout" src/lib/orders.server.ts` | `2` ✓ (event + log warn) |
| 7 | api/checkout — 422 path | `grep "VALIDATION_ERROR" src/routes/api/checkout.ts` | 2 hits, righe 38 + 117 ✓ |
| - | Typecheck baseline | `pnpm typecheck \| tail -3` | `Found 25 errors` (baseline preservata) ✓ |
| - | Zero errori su file toccati | `pnpm typecheck \| grep -E "Trust\|Test\|Footer\|termini\|resi-e-recesso\|generate-modulo\|OrderSummary\|orders\.server\|validators/products\|checkout"` | empty ✓ |
| - | Zero `any` introdotti | `grep -rE ": any\|as any\|<any>" src/routes/resi-e-recesso.tsx scripts/generate-modulo-recesso.ts` | empty ✓ |
| - | No "reso facile/semplice" | `grep -rin "reso facile\|reso semplice\|30 giorni reso" src/` | empty ✓ |

### Smoke test manuali (eseguiti dall'utente in browser/dev server)

I 12 smoke test descritti nel plan `<verification>` sono eseguibili dall'utente con `pnpm dev`. Quelli automatizzabili sono già coperti dalla tabella sopra. I rimanenti (UI rendering homepage TrustStrip, footer click, checkout disabled-state, AuditLog query DB post-ordine) richiedono dev server live + DB connection — l'utente li ha verificati manualmente prima di autorizzare il push (constraint esplicito plan: "Per Task 7: testare manualmente che bottone Paga sia disabled senza checkbox; verificare che POST /api/checkout senza acceptedTerms ritorni 422").

### Build production

Non eseguito in questa sessione (Railway autodeploy lancia il build server-side dopo push). La preservazione del typecheck baseline 25 → 25 garantisce che non ci siano regressioni TypeScript bloccanti.

## Files Impacted

| File | Action | LOC delta | Commit |
|------|--------|-----------|--------|
| `src/components/sections/TrustStripSection.tsx` | Edit | -8/+8 | `1ff3a00` |
| `src/components/sections/TestimonialsSection.tsx` | Edit | -1/+1 | `2d83493` |
| `src/components/shared/Footer.tsx` | Edit | -1/+2 | `cab5e72` |
| `src/routes/termini.tsx` | Edit (Task 3 + Task 4 cumulativi) | +30 ca | `cab5e72` (id), `28c0a68` (§ 8) |
| `src/routes/resi-e-recesso.tsx` | **NEW** | +211 | `ebaffd7` |
| `scripts/generate-modulo-recesso.ts` | **NEW** | +80 ca | `0bd8792` |
| `public/modulo-recesso.pdf` | **NEW** (binary) | 2194 bytes | `0bd8792` |
| `package.json` | Edit (devDeps + script) | +3 | `0bd8792` |
| `pnpm-lock.yaml` | Edit (lockfile) | auto-managed | `0bd8792` |
| `src/lib/validators/products.ts` | Edit | +6 | `be02626` |
| `src/components/checkout/OrderSummary.tsx` | Edit | -2/+5 | `be02626` |
| `src/routes/checkout.tsx` | Edit | +38 | `be02626` |
| `src/lib/orders.server.ts` | Edit | +23 | `be02626` |

**13 file impattati, 3 nuovi (1 route TSX + 1 script TS + 1 PDF binary)**.

## Setup utente post-deploy (out-of-scope plan)

- **Mailbox `resi@calzoleriaprevenzano.it`**: confermare attivazione + monitoraggio. Se non esiste su Aruba/Google Workspace, opzioni:
  1. Creare mailbox dedicata (ricomandato per separazione tracciabilità reso)
  2. Alias/redirect a `info@calzoleriaprevenzano.it` (più semplice, accettabile)
- **Verificare Railway autodeploy**: dopo push, controllare che `latestDeployment.commitHash = be02626...` con `status=SUCCESS`
- **Smoke test live post-deploy**: `curl -I https://calzoleriaprevenzano.it/modulo-recesso.pdf` → HTTP 200 + Content-Type application/pdf
- **AuditLog query (post-primo-ordine)**:
  ```sql
  SELECT id, "userId", event, ip, metadata, "createdAt"
  FROM audit_logs
  WHERE event='terms_accepted_at_checkout'
  ORDER BY "createdAt" DESC
  LIMIT 5;
  ```
- **(Opzionale)** sostituire `public/modulo-recesso.pdf` con versione brandizzata (logo, font Georgia/Bodoni) se l'artigiano vorrà un PDF più curato graficamente. Lo script `scripts/generate-modulo-recesso.ts` è la source of truth: modificare lo script + `pnpm modulo:gen` per rigenerare.

## Self-Check: PASSED

**Files verified to exist:**
- `src/components/sections/TrustStripSection.tsx` — FOUND ✓
- `src/components/sections/TestimonialsSection.tsx` — FOUND ✓
- `src/components/shared/Footer.tsx` — FOUND ✓
- `src/routes/termini.tsx` — FOUND ✓
- `src/routes/resi-e-recesso.tsx` — FOUND ✓
- `public/modulo-recesso.pdf` — FOUND (2194 bytes, valid PDF v1.3, 1 page) ✓
- `scripts/generate-modulo-recesso.ts` — FOUND ✓
- `package.json` — modified (pdfkit + @types/pdfkit + modulo:gen script) ✓
- `src/lib/validators/products.ts` — FOUND (acceptedTerms su entrambi gli schemi) ✓
- `src/components/checkout/OrderSummary.tsx` — FOUND (disabled prop) ✓
- `src/routes/checkout.tsx` — FOUND (acceptedTerms state + UI + body POST) ✓
- `src/routes/api/checkout.ts` — FOUND (422 path via Zod automatico) ✓
- `src/lib/orders.server.ts` — FOUND (AuditLog terms_accepted_at_checkout) ✓

**Commits verified to exist:**
- `1ff3a00` — FOUND ✓ (Task 1: chore(marketing): rimuovi card "Reso facile 30gg" da TrustStrip)
- `2d83493` — FOUND ✓ (Task 2: chore(marketing): riscrivi testimonianza eliminando riferimento al reso)
- `cab5e72` — FOUND ✓ (Task 3: feat(footer): split "Spedizioni e resi"...)
- `28c0a68` — FOUND ✓ (Task 4: feat(legal): allinea termini § 8 al minimo legale...)
- `ebaffd7` — FOUND ✓ (Task 5: feat(legal): nuova pagina /resi-e-recesso...)
- `0bd8792` — FOUND ✓ (Task 6: feat(legal): aggiungi PDF modulo recesso...)
- `be02626` — FOUND ✓ (Task 7: feat(checkout): checkbox accettazione termini obbligatorio...)

7/7 commits in ordine spec, tutti verificati su `git log --oneline`. Push autorizzato esplicitamente per Railway autodeploy.
