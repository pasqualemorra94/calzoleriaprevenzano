# Resi & Recesso — "Silent Compliance" Design Spec

**Data**: 2026-04-30
**Stato**: Approvato (in attesa review utente)
**Owner**: Pasquale
**Tipo**: Legal / UX / Conversion

## Contesto

Il cliente (artigiano calzolaio) non concepisce il reso e non vuole che il sito comunichi "reso facile". Lo stato attuale del sito è incoerente: la pagina `/termini` § 8 è formalmente conforme al Codice del Consumo, ma il marketing pubblico promette **30 giorni di reso facile** (TrustStripSection, hero) e una testimonianza dichiara "ho fatto un reso ed è stato semplicissimo". Il footer ha una voce esplicita "Spedizioni e resi" che invita all'azione.

Manca inoltre un buco di compliance preesistente: **al checkout non c'è alcun checkbox di accettazione termini** (Art. 49 D.Lgs. 206/2005 lo richiede), il che indebolisce la difesa in caso di chargeback Stripe.

Obiettivo: allineare il marketing al minimo legale, eliminare ogni promessa "reso facile", aggiungere frizione legittima per scoraggiare richieste opportunistiche, mantenere la conformità per i prodotti Shop standard (14gg per legge), separare nettamente il "no reso personalizzati" (Art. 59 lett. c) dal "14gg Shop", chiudere il buco compliance del checkout.

## Inquadramento legale

| Categoria prodotto | Diritto di recesso | Base normativa |
|---------------------|--------------------|-----------------|
| Sandali personalizzati (Classica, Gioiello, Bambini con configuratore: pelle/colore/tacco/gioiello/note) | **NESSUNO** | Art. 59 lett. c D.Lgs. 206/2005 (beni confezionati su misura) |
| Pelletteria stock, Accessori, Articoli per calzature (no personalizzazione) | **14 giorni solari** | Art. 52 D.Lgs. 206/2005 |
| Difetti di conformità (qualsiasi prodotto) | Garanzia 24 mesi obbligatoria | Art. 128-135 D.Lgs. 206/2005 |

L'artigiano ha legalmente ragione per il personalizzato (probabilmente >90% del catalogo); per lo Shop standard la legge è inderogabile, ma è possibile **aggiungere frizione legittima** che scoraggia richieste opportunistiche senza violare la norma.

## Strategia in una frase

Eliminare ogni promessa di "reso facile" dal marketing, mantenere il minimo legale ben sepolto, aggiungere frizione legittima (modulo PDF + raccomandata/email), separare con chiarezza "no reso personalizzati" (forte) dal "14gg Shop" (basso profilo), chiudere il buco checkbox termini al checkout.

## Decisioni chiave

| Decisione | Scelta | Motivazione |
|-----------|--------|-------------|
| Card "Reso facile 30gg" nel TrustStrip | **Rimossa**, sostituita con "Pellami italiani certificati" | Promette un beneficio extra-legale che il cliente non vuole offrire |
| Testimonianza "reso semplicissimo" | **Riscritta** senza menzione reso | Comunicava messaggio opposto alla strategia |
| Voce "Spedizioni e resi" nel footer | **Rimossa**; sostituita con "Spedizioni" senza "resi" | Eliminare ogni inviting CTA al reso |
| Termini § 8 — "14 giorni lavorativi" | Allineato a "14 giorni solari" (Art. 52) | Solari sono meno generosi (scadono prima); attuale era a favore del cliente |
| Termini § 8 — Rimborso "comprensivo spedizioni" | Aggiunta esclusione del surplus express (Art. 56 c.2) | Rimborsiamo solo standard, non opzioni express scelte dal cliente |
| Termini § 8 — Tempi rimborso 14gg | Esplicitato "decorrono dalla ricezione dei prodotti integri e completi" | Buffer legittimo |
| Termini § 8 — Stato prodotti al rientro | Aggiunta clausola decurtazione per deprezzamento (Art. 57 c.2) | Scoraggia "lo provo per una sera e lo rendo" |
| Modulo recesso ufficiale | PDF scaricabile (Allegato I parte B Codice Consumo) | Compliance Art. 49 lett. h + frizione legittima + auditabilità |
| Pagina `/resi-e-recesso` | Nuova, tono "artigiano onesto" | Documenta il diritto in modo chiaro senza marketing |
| Disclaimer pagina prodotto personalizzato | **Nessuno** | Hurts conversion nel momento decisionale |
| Checkout: checkbox "accetto termini" | **Nuovo**, singolo link a `/termini` | Chiude buco compliance Art. 49; copertura legale ottenuta tramite link unico (massimo nascondimento) |
| Visibilità `/resi-e-recesso` nel sito | Footer raggruppamento "Informazioni" (discreto) + dentro § 8 termini | Nascondimento ragionevole + accessibilità mantenuta |
| Mega menu | **Nessun** riferimento a resi | Coerente con strategia "non in bella vista" |

## Scope di consegna

Singolo quick task GSD. Tutto in un'unica deploy unit perché le modifiche sono interdipendenti dal punto di vista della coerenza messaggistica (rimuovere il TrustStrip "30gg facile" mentre lascio la testimonianza "reso semplicissimo" sarebbe contraddittorio).

---

## Modifiche dettagliate

### 1. `src/components/sections/TrustStripSection.tsx`

**Azione**: rimuovere completamente la card "Reso facile" (riga ~20-25, oggetto con `icon: RotateCcw`, `counter: { target: 30 }`).

**Sostituire** con nuova card:

```typescript
{
  icon: BadgeCheck, // o equivalente lucide-react (verificare disponibilità in execute phase)
  title: "Pellami italiani certificati",
  description: "Materiali selezionati da concerie italiane di alta qualità",
  // No counter
}
```

Mantenere le altre 3 card invariate (Made in Italy, Spedizione rapida, Pagamento sicuro). Layout grid già funzionante con 4 elementi.

### 2. `src/components/sections/TestimonialsSection.tsx`

**Azione**: riga ~34, modificare il testo della testimonianza:

- **Prima**: *"Ordino online da due anni ormai. Sempre puntuali, sempre ben confezionati. L'anno scorso ho fatto un reso ed è stato semplicissimo."*
- **Dopo**: *"Ordino online da due anni ormai. Sempre puntuali, sempre ben confezionati. La cura nei dettagli si vede dal primo paio."*

Stessa lunghezza, stesso tono, nessun cambio strutturale.

### 3. `src/components/shared/Footer.tsx`

**Azioni multiple**:

a) **Rimuovere** voce attuale `{ label: "Spedizioni e resi", href: "/termini" }` (riga ~21).

b) **Aggiungere** nello stesso gruppo "Servizio Clienti" (o equivalente, in base alla struttura attuale del footer):
- `{ label: "Spedizioni", href: "/termini#spedizioni" }` (asciutto, senza "resi"; ancora a sezione spedizioni dei termini esistenti)
- `{ label: "Resi e recesso", href: "/resi-e-recesso" }` (link discreto alla nuova pagina dedicata)

c) Aggiungere `id="spedizioni"` alla sezione "Spedizioni e Consegna" di `termini.tsx` (verificare se già esiste un `id`, sennò aggiungerlo).

### 4. `src/routes/termini.tsx` § 8 (Diritto di Recesso, riga ~299-361)

5 modifiche al testo esistente, nessun cambio strutturale:

a) **Riga 307** — sostituire "14 giorni lavorativi" con "14 giorni" (dalla data di ricevimento).

b) **Aggiungere paragrafo** dopo riga 326 (dopo "Esercizio del diritto di recesso"):

> *Per facilitare l'esercizio del diritto, l'Acquirente può scaricare e utilizzare il [modulo di recesso ufficiale](/modulo-recesso.pdf) (Allegato I, parte B, D.Lgs. 206/2005), da inviare via email a `resi@calzoleriaprevenzano.it` o tramite raccomandata A/R all'indirizzo sopra indicato.*

c) **Riga 351-352** — modificare il paragrafo Rimborso, sostituire:

- **Prima**: *"comprensivo delle spese di spedizione sostenute per la consegna del prodotto"*
- **Dopo**: *"comprensivo delle spese di spedizione standard sostenute per la consegna del prodotto, ai sensi dell'art. 56 comma 2 D.Lgs. 206/2005. Eventuali costi aggiuntivi per opzioni di spedizione espressa o non standard scelti dall'Acquirente non saranno rimborsati."*

d) **Riga 354-355** — modificare la frase "entro 14 giorni dalla ricezione dei Prodotti resi":

- **Prima**: *"entro 14 giorni dalla ricezione dei Prodotti resi"*
- **Dopo**: *"entro 14 giorni decorrenti dalla data in cui il Venditore riceve i Prodotti restituiti, integri, completi di tutti gli accessori e nelle condizioni descritte di seguito"*

e) **Aggiungere** dopo riga 326 (sezione "Esercizio del diritto di recesso", subito prima delle eccezioni):

> *In caso di prodotti restituiti privi dell'imballaggio originale, con segni d'uso evidenti, sporchi, danneggiati o privi di etichette, il Venditore si riserva di applicare una decurtazione proporzionale al rimborso a copertura del deprezzamento, ai sensi dell'art. 57 comma 2 D.Lgs. 206/2005.*

f) **Aggiungere** alla fine del § 8 (dopo riga 360, prima del § 9):

> *Per dettagli operativi e categoria di prodotti, consulta la nostra [pagina dedicata Resi e Recesso](/resi-e-recesso).*

### 5. Nuova pagina `/resi-e-recesso` (`src/routes/resi-e-recesso.tsx`)

File nuovo, ~250 LOC. Layout coerente con `/termini`, `/cookie`, `/privacy` esistenti (stesso wrapper, hero, sezioni tipografiche).

**Struttura — 3 sezioni in ordine strategico**:

#### Sezione A — "I nostri sandali sono cuciti per te"

Tono onesto, prima persona plurale. ~150 parole. Testo esatto:

> *Ogni sandalo della Collezione Classica, Gioiello e Bambini viene cucito a mano nella nostra bottega di Via Chiaia dopo che tu hai scelto pelle, colore, tacco e gioiello. Per noi non esiste un magazzino di "sandali pronti": ogni paio nasce su tua richiesta.*
>
> *Per questo motivo, e ai sensi dell'Art. 59 lettera c del Codice del Consumo (D.Lgs. 206/2005), i sandali personalizzati e tutti i prodotti realizzati su misura sono **esclusi dal diritto di recesso**.*
>
> *Ti chiediamo di scegliere con cura — il nostro Servizio Clienti è disponibile prima dell'acquisto per consigli sulla taglia e sui materiali. Puoi scriverci a [info@calzoleriaprevenzano.it](mailto:info@calzoleriaprevenzano.it) o consultare la nostra [Guida alle Taglie](/guida-taglia).*

Categorie escluse esplicite (lista bullet): Sandali Collezione Classica, Sandali Collezione Gioiello, Sandali Bambini, prodotti con incisione/monogramma personalizzato.

#### Sezione B — "Prodotti Shop pronti — Diritto di recesso 14 giorni"

Asciutta, tecnica, ~200 parole. Niente "facile" o "semplice". Contenuto:

- **Categorie incluse** (lista esplicita): Pelletteria stock (borselli, cinture, agende), Accessori in pelle non personalizzati, Articoli per calzature (solette, prodotti cura)
- **Termine**: 14 giorni solari dalla data di consegna (Art. 52 D.Lgs. 206/2005)
- **Procedura**: scaricare il [modulo di recesso ufficiale](/modulo-recesso.pdf), compilarlo, inviarlo via email a `resi@calzoleriaprevenzano.it` oppure raccomandata A/R a Via Chiaia, 104 — 80132 Napoli (NA)
- **Restituzione**: entro 14 giorni dalla comunicazione del recesso, a mezzo corriere tracciabile
- **Spese di restituzione**: a carico dell'Acquirente (default ex Art. 57)
- **Stato prodotti**: integri, non indossati, etichette, imballo originale. Decurtazione legittima per deprezzamento se restituiti in condizioni inferiori
- **Rimborso**: stesso metodo di pagamento, entro 14 giorni dalla ricezione dei prodotti integri e completi. Esclusi i costi extra per spedizione espressa scelta dall'Acquirente
- **Trattenuta legittima**: il Venditore si riserva di trattenere il rimborso fino a verifica integrità prodotti

#### Sezione C — "Difetti e garanzia"

~100 parole. Sempre garantita, su tutto (anche personalizzati). Riprende sintesi del § 9 di `termini.tsx`:

- Garanzia legale di conformità: 24 mesi (Art. 128-135 D.Lgs. 206/2005)
- Garanzia artigianale aggiuntiva: 12 mesi su difetti di fabbricazione (cuciture, incollature, chiusure)
- Procedura: contatto via email a `info@calzoleriaprevenzano.it`, conserveremo prove di acquisto
- Esclusioni standard: usura, danni accidentali, uso improprio
- Link al testo completo: `/termini#garanzia`

**Footer della pagina**: link "Torna ai Termini di Vendita" → `/termini`.

### 6. PDF "Modulo di recesso" — `public/modulo-recesso.pdf`

Documento statico generato una volta, ~1 pagina A4, contenuto dell'Allegato I parte B del Codice del Consumo (D.Lgs. 206/2005), precompilato con:

- Destinatario: Calzoleria Prevenzano, Via Chiaia 104 — 80132 Napoli (NA), P.IVA 04590921211, email resi@calzoleriaprevenzano.it
- Campi vuoti per: data, numero ordine, descrizione prodotto, nome+indirizzo Acquirente, firma (solo se cartaceo), data di firma

Generazione: l'executor può creare il PDF al volo via `pdfkit`/`puppeteer` se già installato, oppure usare un PDF generato esternamente da committare staticamente. **Decisione preferita**: PDF statico committato in `public/`, generato off-line dall'esecutore con strumento a sua scelta (anche LibreOffice → export PDF), così evitiamo nuove dipendenze runtime.

### 7. `src/routes/checkout.tsx` — checkbox "accetto termini"

**Verifica preliminare** (in plan phase): leggere `checkout.tsx` per identificare dove sta il bottone finale "Paga" / "Conferma ordine" / equivalente, e dove integrare il checkbox.

**Implementazione**:

a) Aggiungere stato locale `const [acceptedTerms, setAcceptedTerms] = useState(false)`.

b) Inserire sopra il bottone di conferma pagamento, in `<div>` semplice:

```jsx
<label className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
  <input
    type="checkbox"
    checked={acceptedTerms}
    onChange={(e) => setAcceptedTerms(e.target.checked)}
    required
    aria-required="true"
    className="mt-1"
  />
  <span>
    Ho letto e accetto i{" "}
    <a href="/termini" target="_blank" rel="noopener" className="text-[var(--color-primary)] underline">
      Termini di Vendita
    </a>
  </span>
</label>
```

c) Disabilitare il bottone "Paga" se `!acceptedTerms`.

d) Validazione anche server-side al `POST /api/checkout` (verificare se esiste e rifiutare con 422 se manca; aggiungere campo `acceptedTerms: z.literal(true)` allo schema Zod del checkout).

e) Se possibile, salvare un audit log: `auditLog.create({ event: "terms_accepted_at_checkout", userId, ip, userAgent, metadata: { orderId } })` — utile per future dispute Stripe.

### 8. Coerenza dichiarazioni tra le pagine

- `termini.tsx` § 8 deve linkare `/resi-e-recesso` (modifica 4f sopra)
- `/resi-e-recesso` deve linkare `/termini` per il testo legale completo
- Entrambe devono dichiarare le **stesse categorie escluse** ed **stesse categorie incluse** (sourced dalle Categorie Prisma; verificare in plan phase la lista canonica)
- Email di contatto consistente: `resi@calzoleriaprevenzano.it` (verificare se mailbox attiva — nota out-of-scope)

---

## Scope esplicitamente escluso

- ~~Disclaimer sotto il bottone "Aggiungi al carrello"~~ — hurts conversion, eliminato
- ~~Tooltip "info" sul bottone "Aggiungi"~~ — non necessario data la copertura via checkbox checkout
- ~~Modal di conferma all'aggiunta al carrello~~ — frizione superflua
- ~~Checkbox dedicato "personalizzati non rimborsabili" al checkout~~ — l'utente preferisce massimo nascondimento, copertura via accettazione `/termini` standard
- ~~Mega menu link a `/resi-e-recesso`~~ — strategia "non in bella vista"
- ~~Eliminazione completa della pagina `/resi-e-recesso`~~ — Art. 49 Codice Consumo richiede informativa accessibile
- ~~Cambio policy 14gg → 30gg o riduzione sotto i 14gg~~ — primo è regalia gratuita, secondo è illegale
- ~~Sistema online di gestione resi (form web, RMA tracking)~~ — frizione legittima richiede modulo PDF + email/raccomandata, no automazione che riduca la frizione
- ~~Modifica struttura categorie Prisma per identificare "personalizzati" vs "standard"~~ — la distinzione è già nota a schema (presenza configuratore) e va verificata in plan phase

## File toccati (riepilogo)

| File | Azione | Wave |
|------|--------|------|
| `src/components/sections/TrustStripSection.tsx` | Edit (sostituire card) | unica |
| `src/components/sections/TestimonialsSection.tsx` | Edit (riscrivere testimonianza) | unica |
| `src/components/shared/Footer.tsx` | Edit (rimuovi voce, aggiungi 2 voci) | unica |
| `src/routes/termini.tsx` | Edit (5 modifiche al § 8 + id="spedizioni" alla sezione spedizioni) | unica |
| `src/routes/resi-e-recesso.tsx` | NEW (~250 LOC) | unica |
| `public/modulo-recesso.pdf` | NEW (statico) | unica |
| `src/routes/checkout.tsx` | Edit (checkbox + disable bottone) | unica |
| `src/routes/api/checkout.ts` o equivalente | Edit (validazione `acceptedTerms`) | unica |

8 file impattati, 2 nuovi (1 route + 1 asset PDF).

## Atomic commits previsti

1. `chore(marketing): rimuovi card "Reso facile 30gg" da TrustStrip`
2. `chore(marketing): riscrivi testimonianza eliminando riferimento al reso`
3. `feat(footer): split "Spedizioni e resi" in voci separate, link discreto a /resi-e-recesso`
4. `feat(legal): allinea termini § 8 al minimo legale + frizione legittima + modulo recesso`
5. `feat(legal): nuova pagina /resi-e-recesso con tono artigiano (3 sezioni: personalizzati, shop, garanzia)`
6. `feat(legal): aggiungi PDF modulo recesso (Allegato I parte B D.Lgs. 206/2005)`
7. `feat(checkout): checkbox accettazione termini obbligatorio (Art. 49 D.Lgs. 206/2005)`

7 commit atomici, in ordine di modificazione visibile dal cliente (dal più impattante per il messaggio al più tecnico).

## Verification

- **Smoke browser homepage**: card "Pellami italiani certificati" appare al posto di "Reso facile"; testimonianza non menziona reso
- **Smoke browser footer**: nessuna voce "Spedizioni e resi"; presenti "Spedizioni" e "Resi e recesso" separate
- **Smoke browser `/termini` § 8**: testo aggiornato con "14 giorni" (no lavorativi), modulo PDF link funzionante (HTTP 200), frasi su decurtazione/rimborso standard presenti
- **Smoke browser `/resi-e-recesso`**: pagina render OK, 3 sezioni presenti, PDF link OK, link `/termini` funzionante
- **Smoke browser checkout**: bottone "Paga" disabilitato senza checkbox; con checkbox spuntato → bottone abilitato; click "Termini di Vendita" apre `/termini` in nuova tab
- **Smoke API checkout**: POST senza `acceptedTerms` → 422 VALIDATION_ERROR
- **Audit DB**: dopo ordine completato, query `AuditLog WHERE event='terms_accepted_at_checkout'` restituisce row con userId/ip/timestamp
- **`pnpm typecheck`**: baseline preservata (25 → 25)
- **PDF download**: `curl -I https://calzoleriaprevenzano.it/modulo-recesso.pdf` → HTTP 200 + `Content-Type: application/pdf`
- **SEO check**: `/resi-e-recesso` indicizzabile (no `noindex` meta), accessibile da `/termini` ma non da mega menu

## Cosa ti serve da te post-deploy

- Confermare che la mailbox `resi@calzoleriaprevenzano.it` sia attiva e monitorata, oppure sostituirla con `info@calzoleriaprevenzano.it` durante il plan
- Se hai un PDF "modulo recesso" già esistente in formato grafico (con logo Prevenzano), puoi caricarlo tu in `public/modulo-recesso.pdf`. Altrimenti l'executor ne genera uno minimal compliance-only

## Riferimenti normativi

- D.Lgs. 206/2005 (Codice del Consumo):
  - Art. 49 — Obblighi informativi nei contratti a distanza (incluso modulo tipo recesso)
  - Art. 52 — Diritto di recesso (14 giorni)
  - Art. 56 — Rimborso (escluso surplus modalità spedizione non standard)
  - Art. 57 — Restituzione, spese a carico, decurtazione per deprezzamento
  - Art. 59 lett. c — Esclusione recesso per beni confezionati su misura
  - Art. 128-135 — Garanzia legale di conformità
- Allegato I parte B — Modulo tipo di recesso

