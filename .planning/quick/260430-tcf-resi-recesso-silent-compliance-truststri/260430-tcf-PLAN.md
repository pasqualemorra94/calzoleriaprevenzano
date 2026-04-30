---
quick_id: 260430-tcf
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/sections/TrustStripSection.tsx
  - src/components/sections/TestimonialsSection.tsx
  - src/components/shared/Footer.tsx
  - src/routes/termini.tsx
  - src/routes/resi-e-recesso.tsx
  - public/modulo-recesso.pdf
  - scripts/generate-modulo-recesso.ts
  - package.json
  - src/routes/checkout.tsx
  - src/components/checkout/OrderSummary.tsx
  - src/routes/api/checkout.ts
  - src/lib/validators/products.ts
  - src/lib/orders.server.ts
autonomous: true
requirements:
  - SILENT-COMPLIANCE-01  # Allinea marketing al minimo legale (rimuovi promesse "reso facile")
  - SILENT-COMPLIANCE-02  # Aggiungi frizione legittima ai resi (modulo PDF + raccomandata/email)
  - SILENT-COMPLIANCE-03  # Chiudi buco compliance Art. 49 D.Lgs. 206/2005 (checkbox termini al checkout)
  - SILENT-COMPLIANCE-04  # Pagina dedicata /resi-e-recesso con separazione netta personalizzati vs shop standard
  - SILENT-COMPLIANCE-05  # Allinea termini § 8 al minimo legale (14gg solari + decurtazione + rimborso standard-only)
must_haves:
  truths:
    - "Homepage non promette più reso facile 30 giorni (TrustStrip mostra 'Pellami italiani certificati')"
    - "Sezione testimonianze non menziona reso (testimonianza Giulia P. riscritta)"
    - "Footer mostra 'Spedizioni' e 'Resi e recesso' come voci separate (no più 'Spedizioni e resi')"
    - "Pagina /termini § 8 contiene '14 giorni' (no 'lavorativi'), riferimento al modulo PDF, esclusione rimborso express, decurtazione deprezzamento, link a /resi-e-recesso"
    - "Pagina /resi-e-recesso esiste e contiene 3 sezioni (personalizzati esclusi / shop 14gg / garanzia 24 mesi)"
    - "PDF /modulo-recesso.pdf è scaricabile (HTTP 200, Content-Type application/pdf, ~1 pagina A4 con destinatario precompilato)"
    - "Checkout mostra checkbox 'Ho letto e accetto i Termini di Vendita' sopra il bottone Conferma e paga"
    - "Bottone 'Conferma e paga' è disabled finché checkbox non è spuntato"
    - "POST /api/checkout senza acceptedTerms ritorna 422 VALIDATION_ERROR"
    - "Dopo ordine completato, AuditLog contiene event=terms_accepted_at_checkout con userId/ip/userAgent/orderId metadata"
  artifacts:
    - path: src/components/sections/TrustStripSection.tsx
      provides: "Card 'Pellami italiani certificati' al posto di 'Reso facile'"
      contains: "BadgeCheck"
    - path: src/components/sections/TestimonialsSection.tsx
      provides: "Testimonianza Giulia P. senza menzione reso"
    - path: src/components/shared/Footer.tsx
      provides: "Voci 'Spedizioni' (#spedizioni) e 'Resi e recesso' (/resi-e-recesso) separate"
    - path: src/routes/termini.tsx
      provides: "§ 8 aggiornato (14gg solari, modulo PDF, esclusione express, decurtazione, link /resi-e-recesso) + id='spedizioni' su § 7"
      contains: 'id="spedizioni"'
    - path: src/routes/resi-e-recesso.tsx
      provides: "Nuova pagina legale 3 sezioni (personalizzati / shop 14gg / garanzia)"
      min_lines: 200
    - path: public/modulo-recesso.pdf
      provides: "PDF Allegato I parte B precompilato per Calzoleria Prevenzano"
    - path: scripts/generate-modulo-recesso.ts
      provides: "Script Node + pdfkit per (ri)generare il PDF"
    - path: src/components/checkout/OrderSummary.tsx
      provides: "Bottone 'Conferma e paga' accetta prop disabled controllato da checkbox accept"
    - path: src/routes/checkout.tsx
      provides: "Stato acceptedTerms + checkbox UI sopra OrderSummary, body POST include acceptedTerms"
    - path: src/lib/validators/products.ts
      provides: "checkoutSchema e checkoutGuestSchema con campo acceptedTerms: z.literal(true)"
    - path: src/routes/api/checkout.ts
      provides: "Validazione acceptedTerms via Zod (422 su mancanza), trigger AuditLog post-create"
    - path: src/lib/orders.server.ts
      provides: "Insert AuditLog event=terms_accepted_at_checkout dopo createOrder success (userId opzionale, metadata orderId)"
  key_links:
    - from: src/routes/termini.tsx
      to: /modulo-recesso.pdf
      via: "anchor href con download"
      pattern: 'href="/modulo-recesso\\.pdf"'
    - from: src/routes/termini.tsx
      to: /resi-e-recesso
      via: "anchor link finale § 8"
      pattern: 'href="/resi-e-recesso"'
    - from: src/routes/resi-e-recesso.tsx
      to: /termini
      via: "footer link 'Torna ai Termini'"
      pattern: 'href="/termini"'
    - from: src/components/shared/Footer.tsx
      to: /termini#spedizioni
      via: "anchor con frammento"
      pattern: 'href="/termini#spedizioni"'
    - from: src/components/shared/Footer.tsx
      to: /resi-e-recesso
      via: "anchor diretto nuova pagina"
      pattern: 'href="/resi-e-recesso"'
    - from: src/routes/checkout.tsx
      to: src/components/checkout/OrderSummary.tsx
      via: "prop disabled o acceptedTerms passato a OrderSummary"
      pattern: "acceptedTerms"
    - from: src/routes/checkout.tsx
      to: /api/checkout
      via: "fetch POST con body.acceptedTerms"
      pattern: "acceptedTerms: true"
    - from: src/routes/api/checkout.ts
      to: src/lib/validators/products.ts
      via: "schema Zod con acceptedTerms"
      pattern: "z.literal\\(true\\)"
    - from: src/lib/orders.server.ts
      to: prisma.auditLog
      via: "create con event terms_accepted_at_checkout"
      pattern: 'event:\\s*"terms_accepted_at_checkout"'
---

<objective>
Allineare il marketing del sito al minimo legale rimuovendo ogni promessa di "reso facile", aggiungere frizione legittima (modulo PDF + raccomandata/email), separare nettamente i prodotti personalizzati (esclusi dal recesso ex Art. 59 lett. c) dai prodotti Shop (14gg ex Art. 52), chiudere il buco di compliance Art. 49 D.Lgs. 206/2005 al checkout (checkbox accettazione termini con audit trail).

Purpose: il cliente artigiano non concepisce il reso e non vuole comunicare "reso facile". Lo stato attuale è incoerente (TrustStrip "30gg facile" + testimonianza "reso semplicissimo" + footer "Spedizioni e resi") e il checkout non ha il checkbox di accettazione termini, indebolendo la difesa in caso di chargeback Stripe.

Output: 7 commit atomici italiani in ordine spec, tutto in un'unica deploy unit (le modifiche sono interdipendenti per coerenza messaggistica). Pagina nuova /resi-e-recesso (~250 LOC), PDF statico /modulo-recesso.pdf, checkbox checkout funzionante con audit trail server-side.
</objective>

<execution_context>
@docs/superpowers/specs/2026-04-30-resi-policy-silent-compliance-design.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/STATE.md
@docs/superpowers/specs/2026-04-30-resi-policy-silent-compliance-design.md

<!-- File toccati o consultati per contratti -->
@src/components/sections/TrustStripSection.tsx
@src/components/sections/TestimonialsSection.tsx
@src/components/shared/Footer.tsx
@src/routes/termini.tsx
@src/routes/checkout.tsx
@src/routes/api/checkout.ts
@src/components/checkout/OrderSummary.tsx
@src/lib/validators/products.ts
@src/lib/orders.server.ts
@src/lib/api-response.ts
@src/routes/cookie.tsx
@src/routes/privacy.tsx
@prisma/schema.prisma
@prisma/seed.ts
@package.json

<interfaces>
<!-- Contratti già esistenti che la plan deve rispettare -->

Da src/lib/api-response.ts:
```typescript
export function apiSuccess<T>(data: T, status?: number, headers?: Record<string, string>): Response;
export function apiError(code: string, message: string, status: number, details?: Array<{field: string; message: string}>, headers?: Record<string, string>): Response;
```

Da src/lib/validators/products.ts:
```typescript
export const checkoutSchema = z.object({
  addressId: z.string().min(1, "L'indirizzo di spedizione è obbligatorio"),
  shippingMethod: z.string().default("standard"),
  notes: z.string().max(1000).optional(),
  discountCode: z.string().max(50).optional(),
});

export const checkoutGuestSchema = z.object({
  email: z.string().email("Email non valida"),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  address: z.object({...}),
  shippingMethod: z.string().default("standard"),
  notes: z.string().max(1000).optional(),
  discountCode: z.string().max(50).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutGuestInput = z.infer<typeof checkoutGuestSchema>;
```

Da src/lib/orders.server.ts:
```typescript
export async function createOrder(
  userId: string | null,
  sessionId: string | null,
  input: CheckoutInput | CheckoutGuestInput,
  ipAddress: string | null,
  userAgent: string | null,
): Promise<
  | { ok: true; order: OrderCreatedData }
  | { ok: false; error: string }
>;
```

Da prisma/schema.prisma:
```prisma
model AuditLog {
  id        String    @id @default(cuid())
  userId    String?
  event     String
  ip        String?
  userAgent String?
  metadata  Json?
  createdAt DateTime  @default(now())
}
```

Pattern uso AuditLog (da src/routes/api/user/delete.ts:96):
```typescript
prisma.auditLog.create({
  data: {
    userId: user.id,        // opzionale (Order può essere guest)
    event: "account_deleted",
    ip,
    userAgent,
    metadata: { anonymizedEmail: anonEmail },
  },
});
```

Da src/components/checkout/OrderSummary.tsx (firma componente):
```typescript
interface OrderSummaryProps {
  items: CartItemDetail[];
  subtotal: number;
  shippingCost: number;
  freeShippingThreshold: number;
  submitStatus?: "idle" | "loading" | "success" | "error";
  isCheckout?: boolean;
}
// Bottone submit interno: <button type="submit" disabled={submitStatus === "loading"}>
```

Categorie Prisma canoniche (da prisma/seed.ts):
- **Personalizzati (NO recesso)**: parent slug `sandali` con figli `classici`, `gioiello`, `bambini` (e nipoti `con-infradito`, `schiava`, `cavigliera`, `con-infradito-gioiello`, `aggiunta-ciondolo`, `fasce`, `strass`, `infradito-bambini`, `no-infradito-bambini`)
- **Shop standard (SÌ recesso 14gg)**: parent `pelletteria` (figli `borselli`, `cinture`, `agende`, `accessori-calzoleria`), parent `articoli-calzature` (figlio `solette`)

Lucide icons disponibili (verificato in node_modules): `BadgeCheck`, `ShieldCheck`, `RotateCcw`, `Truck`, `CreditCard` (già importate dove serve).

Esistenti checkout flow:
- Bottone Conferma e Paga vive in `OrderSummary` (riga 105-109), non in checkout.tsx
- Per disabilitare il bottone, OrderSummary deve accettare nuova prop `disabled?: boolean`
- Pattern handleSubmit in checkout.tsx:70-95 — body JSON include shippingMethod, discountCode, notes
- POST `/api/checkout` ha branch guest e auth con due Zod schemas distinti

Pacchetto pdfkit NON installato (verificato grep package.json): da aggiungere come devDep `pdfkit` + `@types/pdfkit`.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: TrustStrip — sostituire card "Reso facile" con "Pellami italiani certificati"</name>
  <files>src/components/sections/TrustStripSection.tsx</files>
  <action>
    Editare l'array `TRUST_ITEMS` (righe 14-37):

    1. Rimuovere `RotateCcw` dall'import lucide-react alla riga 4 (ora unused) e aggiungere `BadgeCheck`. Risultato finale import: `import { ShieldCheck, Truck, BadgeCheck, CreditCard } from "lucide-react";`

    2. Sostituire l'oggetto card "Reso facile" (righe 20-25) con:
       ```typescript
       {
         icon: BadgeCheck,
         title: "Pellami italiani certificati",
         description: "Materiali selezionati da concerie italiane di alta qualità",
         // No counter — la nuova card non mostra numerazione
       },
       ```

    Mantenere invariate le altre 3 card (Made in Italy, Spedizione rapida, Pagamento sicuro). Layout grid `md:grid-cols-4` continua a funzionare con 4 elementi totali.

    Verifica: il rendering condizionale `{item.counter ? ... : null}` (righe 64-72) gestisce già correttamente l'assenza di `counter` su questa card.

    Per SILENT-COMPLIANCE-01: rimossa promessa "30 giorni reso facile" dal marketing pubblico.
  </action>
  <verify>
    <automated>pnpm typecheck 2>&1 | grep -E "TrustStripSection|RotateCcw" ; test $? -ne 0 && echo "OK no errors"</automated>
  </verify>
  <done>
    `RotateCcw` non più importato in TrustStripSection.tsx (verificato `grep -c "RotateCcw" src/components/sections/TrustStripSection.tsx` → 0). `BadgeCheck` importato e usato. Array `TRUST_ITEMS` ha 4 elementi con seconda card titolo "Pellami italiani certificati". Typecheck baseline 25 → 25 (nessun nuovo errore).
  </done>
</task>

<task type="auto">
  <name>Task 2: Testimonial — riscrivere testimonianza eliminando riferimento al reso</name>
  <files>src/components/sections/TestimonialsSection.tsx</files>
  <action>
    Editare l'array `TESTIMONIALS` riga 33-37 (testimonianza di Giulia P., Torino).

    Sostituire il valore `text` da:
    > `"Ordino online da due anni ormai. Sempre puntuali, sempre ben confezionati. L'anno scorso ho fatto un reso ed è stato semplicissimo."`

    a:
    > `"Ordino online da due anni ormai. Sempre puntuali, sempre ben confezionati. La cura nei dettagli si vede dal primo paio."`

    Stessa lunghezza, stesso tono, nessun cambio strutturale (autore, città, ordine nell'array invariati). Nessun apostrofo speciale: usare `'` semplice come nel testo originale (verificato il file usa apostrofo curly `'` per "L'anno" — usare lo stesso glyph nel sostituto: NON applicabile nel testo nuovo perché niente apostrofo. Stringa risultante deve essere ASCII-safe + accenti italiani standard).

    Per SILENT-COMPLIANCE-01: eliminato messaggio contraddittorio rispetto alla strategia "no reso facile".
  </action>
  <verify>
    <automated>grep -c "ho fatto un reso" src/components/sections/TestimonialsSection.tsx</automated>
  </verify>
  <done>
    Output del grep `verify` deve essere `0` (nessuna menzione di reso nel file). Testimonianza Giulia P. contiene "La cura nei dettagli si vede dal primo paio". Typecheck baseline 25 → 25.
  </done>
</task>

<task type="auto">
  <name>Task 3: Footer — split "Spedizioni e resi" + ancora #spedizioni in /termini</name>
  <files>src/components/shared/Footer.tsx, src/routes/termini.tsx</files>
  <action>
    **Parte A — `src/components/shared/Footer.tsx`** (oggetto `FOOTER_LINKS.info.items`, righe 17-22):

    Rimuovere la voce attuale `{ label: "Spedizioni e resi", href: "/termini" }` (riga 21).

    Sostituire con DUE voci distinte:
    ```typescript
    { label: "Spedizioni", href: "/termini#spedizioni" },
    { label: "Resi e recesso", href: "/resi-e-recesso" },
    ```

    L'array `info.items` finale ha 5 voci: Chi siamo, Contatti, Guida taglie, Spedizioni, Resi e recesso.

    **Parte B — `src/routes/termini.tsx`** (sezione "7. Spedizione e Consegna", righe 251-297):

    Aggiungere `id="spedizioni"` al tag `<section>` apertura riga 252:
    - Da: `<section>`
    - A: `<section id="spedizioni">`

    NON modificare il contenuto della sezione, NON modificare l'h2 "7. Spedizione e Consegna".

    Per SILENT-COMPLIANCE-01: footer non invita più al reso (rimossa CTA "Spedizioni e resi"). Per SILENT-COMPLIANCE-04: footer ha link discreto a `/resi-e-recesso` (raggruppato in "Informazioni", non in mega menu).
  </action>
  <verify>
    <automated>grep -c "Spedizioni e resi" src/components/shared/Footer.tsx && grep -q 'id="spedizioni"' src/routes/termini.tsx && grep -q '"/resi-e-recesso"' src/components/shared/Footer.tsx && echo "OK"</automated>
  </verify>
  <done>
    Primo grep deve essere `0` (zero menzioni "Spedizioni e resi"). `id="spedizioni"` presente in termini.tsx. `/resi-e-recesso` linkato nel Footer. Typecheck baseline 25 → 25. Verificare visivamente con dev server: footer mostra "Spedizioni" + "Resi e recesso" come voci separate, click "Spedizioni" porta a `/termini` ancorato alla sezione 7.
  </done>
</task>

<task type="auto">
  <name>Task 4: Termini § 8 — 5 modifiche legali + link a /resi-e-recesso</name>
  <files>src/routes/termini.tsx</files>
  <action>
    Effettuare 6 edit puntuali alla sezione "8. Diritto di Recesso" (righe 299-361).

    **4a — Riga 307**: sostituire `"14 giorni lavorativi dalla data"` con `"14 giorni dalla data"` (rimuovere "lavorativi"; il termine corretto ex Art. 52 D.Lgs. 206/2005 è 14 giorni solari).

    **4b — Dopo riga 326** (chiusura del `<p>` "L'Acquirente deve restituire i Prodotti..."), aggiungere nuovo paragrafo:
    ```jsx
    <p className="mt-4">
      Per facilitare l&apos;esercizio del diritto, l&apos;Acquirente pu&ograve; scaricare e utilizzare il
      {" "}<a href="/modulo-recesso.pdf" target="_blank" rel="noopener" className="text-[var(--color-primary)] underline underline-offset-2">modulo di recesso ufficiale</a>{" "}
      (Allegato I, parte B, D.Lgs. 206/2005), da inviare via email a
      {" "}<a href="mailto:resi@calzoleriaprevenzano.it" className="text-[var(--color-primary)] underline underline-offset-2">resi@calzoleriaprevenzano.it</a>{" "}
      o tramite raccomandata A/R all&apos;indirizzo sopra indicato.
    </p>
    ```

    **4c — Aggiungere SUBITO PRIMA del blocco h3 "Eccezioni al diritto di recesso"** (riga 328) un nuovo paragrafo per la decurtazione deprezzamento (collocazione spec § 4e):
    ```jsx
    <p className="mt-4">
      In caso di prodotti restituiti privi dell&apos;imballaggio originale, con segni d&apos;uso evidenti,
      sporchi, danneggiati o privi di etichette, il Venditore si riserva di applicare una decurtazione
      proporzionale al rimborso a copertura del deprezzamento, ai sensi dell&apos;art. 57 comma 2
      D.Lgs. 206/2005.
    </p>
    ```

    **4d — Riga 351-352** (paragrafo Rimborso): sostituire la stringa esatta:
    > `comprensivo delle spese di spedizione sostenute per la consegna del prodotto, entro 14 giorni dalla ricezione dei Prodotti resi.`

    con:
    > `comprensivo delle spese di spedizione standard sostenute per la consegna del prodotto, ai sensi dell&apos;art. 56 comma 2 D.Lgs. 206/2005. Eventuali costi aggiuntivi per opzioni di spedizione espressa o non standard scelti dall&apos;Acquirente non saranno rimborsati. Il rimborso sar&agrave; effettuato entro 14 giorni decorrenti dalla data in cui il Venditore riceve i Prodotti restituiti, integri, completi di tutti gli accessori e nelle condizioni descritte sopra.`

    NOTA: questo edit unisce le modifiche spec 4c + 4d in un'unica sostituzione coerente. Mantenere `verr&agrave; effettuato utilizzando lo stesso mezzo di pagamento` come frase successiva nel paragrafo (riga 353-354), invariata.

    **4e — Aggiungere DOPO la riga 360** (`</p>` finale prima di `</section>` riga 361), nuovo paragrafo finale:
    ```jsx
    <p className="mt-4">
      Per dettagli operativi e categoria di prodotti, consulta la nostra
      {" "}<a href="/resi-e-recesso" className="text-[var(--color-primary)] underline underline-offset-2">pagina dedicata Resi e Recesso</a>.
    </p>
    ```

    Per SILENT-COMPLIANCE-05: § 8 ora minimo legale + frizione legittima. Per SILENT-COMPLIANCE-02: link al modulo PDF + email + raccomandata. Per SILENT-COMPLIANCE-04: link finale alla nuova pagina.

    NB: l'aggiornamento al timestamp "Ultimo aggiornamento" alla riga 26 può essere lasciato com'è (1 aprile 2026) — fuori scope.
  </action>
  <verify>
    <automated>grep -c "14 giorni lavorativi" src/routes/termini.tsx && grep -q "modulo-recesso.pdf" src/routes/termini.tsx && grep -q "art. 56 comma 2" src/routes/termini.tsx && grep -q "art. 57 comma 2" src/routes/termini.tsx && grep -q "/resi-e-recesso" src/routes/termini.tsx && echo "OK"</automated>
  </verify>
  <done>
    Primo grep `14 giorni lavorativi` deve dare `0` matches (la stringa è stata rimossa nel § 8 — verificare che non ci siano altre occorrenze residue: NB la sezione 7 Spedizione usa "giorni lavorativi" per le tempistiche di consegna, è OK e va lasciato). Tutti gli altri grep restituiscono OK. Typecheck 25 → 25.
  </done>
</task>

<task type="auto">
  <name>Task 5: Nuova pagina /resi-e-recesso</name>
  <files>src/routes/resi-e-recesso.tsx</files>
  <action>
    Creare file nuovo `src/routes/resi-e-recesso.tsx` (~250 LOC) seguendo esattamente il pattern stilistico di `src/routes/termini.tsx` e `src/routes/privacy.tsx`:
    - Wrapper `<div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-16">`
    - Link "&larr; Torna alla homepage" in alto
    - `<h1 className="text-lg font-semibold text-[var(--color-text)] mb-2">` titolo
    - Stitch divider `<div className="mb-12 h-[var(--stitch-width)] w-16 bg-[var(--color-accent)]" />`
    - `<article className="prose-custom max-w-none">` + `<div className="space-y-8 text-[var(--color-text-secondary)] leading-relaxed">`
    - Paragrafo "Ultimo aggiornamento: 30 aprile 2026" come `<p className="text-sm text-[var(--color-muted)]">`

    Skeleton route:
    ```tsx
    import { createFileRoute } from "@tanstack/react-router";
    import type { ReactNode } from "react";

    export const Route = createFileRoute("/resi-e-recesso")({
      component: ResiERecessoPage,
    });

    function ResiERecessoPage(): ReactNode {
      return ( /* ... struttura ... */ );
    }
    ```

    **3 sezioni in ordine strategico** (testi esatti da spec § 5):

    **Sezione A — "I nostri sandali sono cuciti per te"** (~150 parole):
    - `<h2>` "I nostri sandali sono cuciti per te"
    - 3 paragrafi:
      1. "Ogni sandalo della Collezione Classica, Gioiello e Bambini viene cucito a mano nella nostra bottega di Via Chiaia dopo che tu hai scelto pelle, colore, tacco e gioiello. Per noi non esiste un magazzino di "sandali pronti": ogni paio nasce su tua richiesta."
      2. "Per questo motivo, e ai sensi dell'Art. 59 lettera c del Codice del Consumo (D.Lgs. 206/2005), i sandali personalizzati e tutti i prodotti realizzati su misura sono **esclusi dal diritto di recesso**." (usare `<strong className="text-[var(--color-text)]">esclusi dal diritto di recesso</strong>`)
      3. "Ti chiediamo di scegliere con cura — il nostro Servizio Clienti è disponibile prima dell'acquisto per consigli sulla taglia e sui materiali. Puoi scriverci a [info@calzoleriaprevenzano.it](mailto:info@calzoleriaprevenzano.it) o consultare la nostra [Guida alle Taglie](/guida-taglia)."
    - `<h3>` "Categorie escluse dal recesso" + `<ul>` con 4 bullet:
      - Sandali Collezione Classica (categorie: Classici, Con infradito, Schiava)
      - Sandali Collezione Gioiello (Cavigliera, Con infradito Gioiello, Aggiunta ciondolo, Fasce, Strass)
      - Sandali Bambini (Infradito Bambini, No infradito Bambini)
      - Prodotti con incisione o monogramma personalizzato

    **Sezione B — "Prodotti Shop pronti — Diritto di recesso 14 giorni"** (~200 parole, asciutta):
    - `<h2>` "Prodotti Shop pronti — Diritto di recesso 14 giorni"
    - `<h3>` "Categorie incluse" + `<ul>`:
      - Pelletteria stock: Borselli, Cinture, Agende
      - Accessori in pelle non personalizzati (slug `accessori-calzoleria`)
      - Articoli per calzature: Solette, prodotti per cura
    - `<h3>` "Termine" + `<p>`: 14 giorni solari dalla data di consegna (Art. 52 D.Lgs. 206/2005)
    - `<h3>` "Procedura" + `<p>`: scaricare il modulo recesso ufficiale (link `/modulo-recesso.pdf` target=_blank), compilarlo, inviarlo via email a `resi@calzoleriaprevenzano.it` oppure raccomandata A/R a Calzoleria Prevenzano, Via Chiaia, 104 — 80132 Napoli (NA)
    - `<h3>` "Restituzione" + `<p>`: entro 14 giorni dalla comunicazione del recesso, a mezzo corriere tracciabile
    - `<h3>` "Spese di restituzione" + `<p>`: a carico dell'Acquirente (default ex Art. 57 D.Lgs. 206/2005)
    - `<h3>` "Stato dei prodotti" + `<p>`: integri, non indossati, etichette intatte, imballo originale. Decurtazione legittima per deprezzamento se restituiti in condizioni inferiori (Art. 57 comma 2)
    - `<h3>` "Rimborso" + `<p>`: stesso metodo di pagamento, entro 14 giorni dalla ricezione dei prodotti integri e completi. Esclusi i costi extra per spedizione espressa scelta dall'Acquirente (Art. 56 comma 2)
    - `<h3>` "Trattenuta legittima" + `<p>`: il Venditore si riserva di trattenere il rimborso fino a verifica integrità prodotti

    **Sezione C — "Difetti e garanzia"** (~100 parole):
    - `<h2>` "Difetti e garanzia"
    - `<p>`: garanzia legale di conformità 24 mesi (Art. 128-135 D.Lgs. 206/2005), su tutti i prodotti inclusi i personalizzati
    - `<p>`: garanzia artigianale aggiuntiva 12 mesi su difetti di fabbricazione (cuciture, incollature, chiusure)
    - `<p>`: procedura — contatto via email a `info@calzoleriaprevenzano.it` con prove di acquisto
    - `<p>`: esclusioni standard — usura, danni accidentali, uso improprio
    - `<p>` finale: "Per il testo legale completo, consulta la sezione [Garanzia dei Termini di Vendita](/termini#garanzia)." Aggiungere id="garanzia" alla sezione 9 di termini.tsx? NO — out of scope, lasciare il link senza ancora ed eventualmente la pagina termini scrollerà in cima (acceptable).

    **Footer della pagina**: link `<a href="/termini" className="...">&larr; Torna ai Termini di Vendita</a>` come al top, posizionato a fine `<article>`.

    File-based routing: TanStack Router auto-registra la route dal nome file `resi-e-recesso.tsx` → `/resi-e-recesso` (verificato pattern in `src/routes/cookie.tsx` → `/cookie`). Dopo `pnpm dev`, `routeTree.gen.ts` viene rigenerato automaticamente.

    **NESSUN uso di `any`**, **NESSUN apostrofo non-escaped** (usare `&apos;`, `&egrave;`, `&agrave;`, `&ograve;`, `&mdash;`, `&ldquo;` `&rdquo;` come negli altri file legali — verificato in termini.tsx).

    Per SILENT-COMPLIANCE-04: pagina dedicata con tono onesto, nessun "facile/semplice", separazione netta personalizzati vs shop standard.
  </action>
  <verify>
    <automated>test -f src/routes/resi-e-recesso.tsx && grep -q "createFileRoute(\"/resi-e-recesso\")" src/routes/resi-e-recesso.tsx && grep -q "modulo-recesso.pdf" src/routes/resi-e-recesso.tsx && grep -q "Art. 59" src/routes/resi-e-recesso.tsx && grep -q "Art. 52" src/routes/resi-e-recesso.tsx && wc -l src/routes/resi-e-recesso.tsx | awk '{exit ($1<150)?1:0}' && echo "OK"</automated>
  </verify>
  <done>
    File `src/routes/resi-e-recesso.tsx` esiste, ≥150 LOC, route registrata `/resi-e-recesso`, contiene riferimenti a Art. 59 (esclusione personalizzati), Art. 52 (14gg shop), link al modulo PDF. Typecheck baseline 25 → 25 (regen `routeTree.gen.ts` via `pnpm dev` ~10s; gitignored). Smoke browser: `curl http://localhost:3000/resi-e-recesso` HTTP 200; visualizzare le 3 sezioni, link PDF e link `/termini` funzionanti.
  </done>
</task>

<task type="auto">
  <name>Task 6: PDF modulo recesso (script generator + asset committed)</name>
  <files>scripts/generate-modulo-recesso.ts, public/modulo-recesso.pdf, package.json</files>
  <action>
    **Step 6a — Aggiungere devDeps a package.json**:
    ```bash
    pnpm add -D pdfkit @types/pdfkit
    ```

    Aggiungere uno script in `package.json` `scripts` section (dopo `db:cleanup-e2e`):
    ```json
    "modulo:gen": "tsx scripts/generate-modulo-recesso.ts"
    ```

    **Step 6b — Creare `scripts/generate-modulo-recesso.ts`** (~80 LOC):

    Script Node + pdfkit che genera 1 pagina A4 con il testo dell'Allegato I parte B D.Lgs. 206/2005, precompilato con destinatario Calzoleria Prevenzano. Output statico in `public/modulo-recesso.pdf`.

    Schema script:
    ```typescript
    import PDFDocument from "pdfkit";
    import { createWriteStream } from "node:fs";
    import { join } from "node:path";
    import { fileURLToPath } from "node:url";
    import { dirname } from "node:path";

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const outputPath = join(__dirname, "..", "public", "modulo-recesso.pdf");

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(createWriteStream(outputPath));

    // Intestazione
    doc.font("Times-Bold").fontSize(16).text("Modulo di recesso", { align: "center" });
    doc.moveDown(0.5);
    doc.font("Times-Roman").fontSize(10).text(
      "(Allegato I, parte B, D.Lgs. 6 settembre 2005, n. 206 — Codice del Consumo)",
      { align: "center" },
    );
    doc.moveDown(1.5);

    // Istruzioni
    doc.fontSize(10).text(
      "Compilare e restituire il presente modulo solo se si desidera recedere dal contratto.",
      { align: "left" },
    );
    doc.moveDown();

    // Destinatario precompilato
    doc.font("Times-Bold").text("Destinatario:");
    doc.font("Times-Roman").text("Calzoleria Prevenzano di Prevenzano Antonio");
    doc.text("Via Chiaia, 104 — 80132 Napoli (NA)");
    doc.text("P.IVA 04590921211");
    doc.text("Email: resi@calzoleriaprevenzano.it");
    doc.moveDown(1.5);

    // Corpo dichiarazione
    doc.text(
      "Con la presente io/noi (*) notifico/notifichiamo (*) il recesso dal mio/nostro (*) contratto di vendita dei seguenti beni/servizi (*):",
    );
    doc.moveDown();
    doc.text("________________________________________________________________________________");
    doc.text("________________________________________________________________________________");
    doc.text("________________________________________________________________________________");
    doc.moveDown(1);

    // Campi vuoti
    const fields: Array<[string, number]> = [
      ["Numero ordine: ", 1],
      ["Ordinato il (data ordine): ", 1],
      ["Ricevuto il (data consegna): ", 1],
      ["Nome del/dei consumatore/i: ", 1],
      ["Indirizzo del/dei consumatore/i: ", 2],
      ["Firma del/dei consumatore/i (solo se invio cartaceo): ", 2],
      ["Data: ", 1],
    ];
    for (const [label, blanks] of fields) {
      doc.font("Times-Bold").text(label, { continued: false });
      doc.font("Times-Roman");
      for (let i = 0; i < blanks; i++) {
        doc.text("________________________________________________________________________________");
      }
      doc.moveDown(0.5);
    }

    doc.moveDown(1);
    doc.fontSize(8).text("(*) Cancellare la dicitura inutile.", { align: "left" });

    doc.end();
    console.log(`PDF generato: ${outputPath}`);
    ```

    **Step 6c — Eseguire lo script una volta**:
    ```bash
    pnpm modulo:gen
    ```

    Verifica output:
    ```bash
    ls -la public/modulo-recesso.pdf
    file public/modulo-recesso.pdf  # deve dire "PDF document"
    ```

    Il PDF generato (~5-10 KB) viene committato come asset statico in `public/`.

    **NB**: TanStack Start serve i file in `public/` direttamente al root URL → `/modulo-recesso.pdf` accessibile in produzione (verificato pattern: `public/images/...` viene servito a `/images/...`).

    Per SILENT-COMPLIANCE-02: modulo PDF è la frizione legittima principale, allinea ad Art. 49 lett. h.
  </action>
  <verify>
    <automated>test -f public/modulo-recesso.pdf && test -f scripts/generate-modulo-recesso.ts && grep -q "pdfkit" package.json && file public/modulo-recesso.pdf | grep -q "PDF document" && echo "OK"</automated>
  </verify>
  <done>
    `public/modulo-recesso.pdf` esiste e `file` lo riconosce come PDF. Script `scripts/generate-modulo-recesso.ts` esiste e esegue senza errori (`pnpm modulo:gen` exit 0). `pdfkit` e `@types/pdfkit` in `devDependencies` package.json. `pnpm modulo:gen` script in `package.json`. `pnpm typecheck` baseline 25 → 25 (script tipizzato con `@types/pdfkit`). Smoke verifica con dev server: `curl -I http://localhost:3000/modulo-recesso.pdf` → HTTP 200 + Content-Type application/pdf.
  </done>
</task>

<task type="auto">
  <name>Task 7: Checkbox checkout + validazione server-side + AuditLog</name>
  <files>src/routes/checkout.tsx, src/components/checkout/OrderSummary.tsx, src/lib/validators/products.ts, src/routes/api/checkout.ts, src/lib/orders.server.ts</files>
  <action>
    Implementazione end-to-end checkbox accettazione termini.

    **Step 7a — `src/lib/validators/products.ts`** (estendere entrambi gli schemi checkout):

    Aggiungere `acceptedTerms: z.literal(true, { error: "Devi accettare i Termini di Vendita per procedere" })` come campo obbligatorio in:
    - `checkoutSchema` (riga 132-137) — schema authenticated
    - `checkoutGuestSchema` (riga 142-158) — schema guest

    NB: Zod v4 syntax per error messages: `z.literal(true, { error: "..." })`. Verificare con la versione installata (`zod ^4.3.6` da package.json).

    **Step 7b — `src/components/checkout/OrderSummary.tsx`** (props): aggiungere `disabled?: boolean` a `OrderSummaryProps` (interfaccia riga 15-22). Modificare `<button type="submit" disabled={submitStatus === "loading"}>` (riga 105-106) in `<button type="submit" disabled={submitStatus === "loading" || disabled}>`. Aggiungere `disabled = false` al destructuring riga 25.

    **Step 7c — `src/routes/checkout.tsx`** (UI checkbox + submit body):

    1. Aggiungere stato locale all'inizio della funzione `CheckoutPage` (dopo riga 36, prima di `validateForm`):
       ```typescript
       const [acceptedTerms, setAcceptedTerms] = useState(false);
       const [acceptedTermsError, setAcceptedTermsError] = useState<string | null>(null);
       ```

    2. In `validateForm` (riga 38-50), aggiungere check finale prima di `setErrors(errs)`:
       ```typescript
       if (!acceptedTerms) {
         setAcceptedTermsError("Devi accettare i Termini di Vendita per procedere");
         return false;
       } else {
         setAcceptedTermsError(null);
       }
       ```

    3. In `handleSubmit` body POST `/api/checkout` (riga 76-83), aggiungere `acceptedTerms: true` al body JSON:
       ```typescript
       body: JSON.stringify({
         email: form.email, firstName: form.firstName, lastName: form.lastName,
         address: { ... },
         shippingMethod: "standard", discountCode: discountCode || undefined, notes: notes || undefined,
         acceptedTerms: true,
       }),
       ```

    4. Inserire il checkbox UI dentro il `<div className="lg:sticky lg:top-24">` (riga 212), SOPRA `<OrderSummary>` riga 213-217:
       ```jsx
       <label htmlFor="checkout-accept-terms" className="mb-4 flex items-start gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
         <input
           id="checkout-accept-terms"
           type="checkbox"
           checked={acceptedTerms}
           onChange={(e) => {
             setAcceptedTerms(e.target.checked);
             if (e.target.checked) setAcceptedTermsError(null);
           }}
           required
           aria-required="true"
           aria-describedby={acceptedTermsError ? "checkout-accept-terms-error" : undefined}
           className="mt-1 h-4 w-4 cursor-pointer accent-[var(--color-primary)]"
         />
         <span>
           Ho letto e accetto i{" "}
           <a href="/termini" target="_blank" rel="noopener" className="text-[var(--color-primary)] underline underline-offset-2">
             Termini di Vendita
           </a>
         </span>
       </label>
       {acceptedTermsError && (
         <p id="checkout-accept-terms-error" className="mb-4 -mt-2 text-xs text-[var(--color-destructive)]">
           {acceptedTermsError}
         </p>
       )}
       ```

    5. Passare la prop `disabled` a `<OrderSummary ... disabled={!acceptedTerms} />`.

    **Step 7d — `src/routes/api/checkout.ts`** (validazione server già automatica via Zod):

    Lo schema Zod aggiornato in 7a rifiuta automaticamente le richieste senza `acceptedTerms: true` con 422. NON serve logica aggiuntiva qui — il flow `parsed.success` esistente gestisce già il caso (riga 36-39 guest, riga 115-118 auth).

    **Step 7e — `src/lib/orders.server.ts`** (insert AuditLog dopo create order success):

    Dopo la creazione dell'ordine (alla fine del flow `createOrder`, immediatamente PRIMA del `return { ok: true, order: ... }` finale — verificare la posizione esatta nel file ~440 LOC), inserire:

    ```typescript
    // Audit trail compliance Art. 49 D.Lgs. 206/2005 (terms acceptance)
    try {
      await prisma.auditLog.create({
        data: {
          userId: userId ?? null,        // null per guest
          event: "terms_accepted_at_checkout",
          ip: ipAddress,
          userAgent,
          metadata: { orderId: order.id, orderNumber: order.orderNumber },
        },
      });
    } catch (err) {
      // Best-effort: non bloccare l'ordine se l'audit fallisce
      log.warn("Failed to insert terms_accepted_at_checkout audit", {
        orderId: order.id,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    }
    ```

    NB: lettura preliminare del file completo richiesta per identificare il return finale. Verificare nome del logger esistente (`log` o crearne uno se non esiste). Verificare nome variabile dell'ordine appena creato (`order` vs `newOrder` etc.).

    Per SILENT-COMPLIANCE-03: chiuso buco Art. 49 D.Lgs. 206/2005 con checkbox + audit trail server-side. Il checkbox singolo verso `/termini` copre Art. 49 lett. b/c/d/e/f/g/h tramite link unico (massimo nascondimento, scelta esplicita utente come da spec § Decisioni chiave).
  </action>
  <verify>
    <automated>grep -q "acceptedTerms: z.literal(true" src/lib/validators/products.ts && grep -q "acceptedTerms" src/routes/checkout.tsx && grep -q "disabled" src/components/checkout/OrderSummary.tsx && grep -q "terms_accepted_at_checkout" src/lib/orders.server.ts && pnpm typecheck 2>&1 | tail -3    <automated>grep -q "acceptedTerms" src/lib/validators/products.ts && grep -q "acceptedTerms" src/routes/checkout.tsx && grep -q "terms_accepted_at_checkout" src/lib/orders.server.ts && echo "OK"</automated>
  </verify>
  <done>
    Tutti i grep restituiscono OK. Typecheck baseline 25 → 25 (zero nuovi errori). Smoke browser checkout: bottone "Conferma e paga" disabilitato senza checkbox; cliccando il checkbox il bottone diventa abilitato; click sul link "Termini di Vendita" apre `/termini` in nuova tab. Smoke API: `curl -X POST http://localhost:3000/api/checkout -H "Content-Type: application/json" -d '{"email":"x@y.it",...,"acceptedTerms":false}'` ritorna 422 VALIDATION_ERROR. Smoke DB post-ordine: `psql "$DATABASE_URL" -c "SELECT id, event, metadata FROM audit_logs WHERE event='terms_accepted_at_checkout' ORDER BY \"createdAt\" DESC LIMIT 1"` mostra row con metadata `{orderId, orderNumber}`.
  </done>
</task>

</tasks>

<verification>
**Smoke test end-to-end (eseguire prima di committare ogni atomic commit, full sequence prima del push)**:

1. **Homepage TrustStrip**: visitare `/` con `pnpm dev`. Verificare che la card "Reso facile 30 giorni" sia sostituita da "Pellami italiani certificati" con icona `BadgeCheck`. Le altre 3 card (Made in Italy, Spedizione rapida, Pagamento sicuro) invariate.

2. **Homepage Testimonianze**: scrollare alla sezione "Cosa dicono di noi". Verificare che la testimonianza di Giulia P. (Torino) NON menzioni più "reso" — testo nuovo: "Ordino online da due anni ormai. Sempre puntuali, sempre ben confezionati. La cura nei dettagli si vede dal primo paio."

3. **Footer**: verificare che il gruppo "Informazioni" mostri 5 voci (Chi siamo, Contatti, Guida taglie, Spedizioni, Resi e recesso). Cliccare "Spedizioni" → carica `/termini` ancorato a sezione 7 (Spedizione e Consegna). Cliccare "Resi e recesso" → carica `/resi-e-recesso` (nuova pagina).

4. **/termini § 8**: visitare `/termini`, scrollare al § 8 "Diritto di Recesso". Verificare:
   - Riga 307 dice "14 giorni" (NON più "14 giorni lavorativi")
   - Presente paragrafo con link al modulo PDF (`/modulo-recesso.pdf`) + email `resi@calzoleriaprevenzano.it` + raccomandata
   - Presente paragrafo decurtazione deprezzamento (Art. 57 c.2)
   - Paragrafo Rimborso menziona "spese di spedizione standard" + esclusione express (Art. 56 c.2)
   - Frase "decorrenti dalla data in cui il Venditore riceve i Prodotti restituiti, integri, completi"
   - Link finale a `/resi-e-recesso`

5. **/resi-e-recesso**: visitare `/resi-e-recesso`. Verificare:
   - Page render OK (HTTP 200)
   - 3 sezioni visibili: "I nostri sandali sono cuciti per te" / "Prodotti Shop pronti — Diritto di recesso 14 giorni" / "Difetti e garanzia"
   - Categorie esplicite per esclusi (Classica/Gioiello/Bambini) e inclusi (Pelletteria/Accessori/Articoli per calzature)
   - Link al modulo PDF clickabile
   - Link a `/termini` funzionante in fondo

6. **PDF download**: `curl -I http://localhost:3000/modulo-recesso.pdf` → HTTP 200 + Content-Type `application/pdf`. Apertura in browser → PDF leggibile, 1 pagina A4 con destinatario Calzoleria Prevenzano + campi vuoti per recesso.

7. **Checkout UI**: aggiungere prodotto al carrello, andare a `/checkout`, compilare form. Verificare:
   - Sopra il blocco "Riepilogo ordine" appare il checkbox "Ho letto e accetto i Termini di Vendita"
   - Bottone "Conferma e paga" disabled (cursor-not-allowed, opacity ridotta)
   - Click su "Termini di Vendita" → apre `/termini` in nuova tab
   - Spuntare il checkbox → bottone diventa abilitato
   - Submit con checkbox spuntato → flow checkout normale (redirect Stripe)

8. **API checkout validation**:
   ```bash
   curl -X POST http://localhost:3000/api/checkout \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.it","firstName":"Mario","lastName":"Rossi","address":{"address1":"Via Test 1","city":"Napoli","province":"NA","postalCode":"80100","country":"IT"},"shippingMethod":"standard","acceptedTerms":false}'
   ```
   → HTTP 422 con `{"ok":false,"error":{"code":"VALIDATION_ERROR","message":"Dati non validi"}}`. Stessa request con `acceptedTerms:true` → flow normale (assumendo cart valido).

9. **AuditLog DB query**: dopo aver completato un ordine end-to-end (anche guest):
   ```bash
   psql "$DATABASE_URL" -c "SELECT id, \"userId\", event, ip, metadata, \"createdAt\" FROM audit_logs WHERE event='terms_accepted_at_checkout' ORDER BY \"createdAt\" DESC LIMIT 1"
   ```
   → ritorna 1 row con `event='terms_accepted_at_checkout'`, `metadata` contiene `orderId` e `orderNumber`, `ip` e `userAgent` popolati.

10. **TypeScript baseline**: `pnpm typecheck 2>&1 | tail -5` mostra "Found 25 errors" (baseline preservata, NESSUN nuovo errore introdotto).

11. **Build production**: `pnpm build` exit 0, no warnings critici.

12. **E2E smoke**: `pnpm test:e2e` (smoke purchase) → PASS, nessuna regressione checkout flow.
</verification>

<success_criteria>
- [ ] 7 commit atomici italiani in ordine (vedi spec § "Atomic commits previsti")
- [ ] Tutti i 12 smoke test della sezione `<verification>` passano
- [ ] Zero `any` introdotti (`grep -rn ": any\|as any\|<any>" src/routes/resi-e-recesso.tsx scripts/generate-modulo-recesso.ts` → 0 matches)
- [ ] Typecheck baseline 25 → 25 (zero nuovi errori)
- [ ] Coerenza messaggistica: nessuna menzione "reso facile" / "reso semplice" / "30 giorni reso" anywhere in src/components o src/routes (`grep -rin "reso facile\|reso semplice\|30 giorni reso" src/` → 0 matches)
- [ ] Categorie escluse/incluse coerenti tra `/termini` § 8 e `/resi-e-recesso` (slug Prisma corretti dalla seed: classici/gioiello/bambini personalizzati, pelletteria/articoli-calzature shop)
- [ ] PDF /modulo-recesso.pdf accessibile via HTTP 200, Content-Type application/pdf
- [ ] Checkbox checkout funzionante UI + validazione server 422 + AuditLog inserito post-ordine
- [ ] Push autorizzato esplicitamente per Railway autodeploy (chiedere conferma prima di `git push`)

## Atomic commits previsti (in ordine)

1. `chore(marketing): rimuovi card "Reso facile 30gg" da TrustStrip` — Task 1
2. `chore(marketing): riscrivi testimonianza eliminando riferimento al reso` — Task 2
3. `feat(footer): split "Spedizioni e resi" in voci separate, link discreto a /resi-e-recesso` — Task 3
4. `feat(legal): allinea termini § 8 al minimo legale + frizione legittima + modulo recesso` — Task 4
5. `feat(legal): nuova pagina /resi-e-recesso con tono artigiano (3 sezioni)` — Task 5
6. `feat(legal): aggiungi PDF modulo recesso (Allegato I parte B D.Lgs. 206/2005)` — Task 6 (file: package.json + scripts/generate-modulo-recesso.ts + public/modulo-recesso.pdf)
7. `feat(checkout): checkbox accettazione termini obbligatorio (Art. 49 D.Lgs. 206/2005)` — Task 7

## Setup utente post-deploy (out-of-scope per questo plan)

- Confermare che la mailbox `resi@calzoleriaprevenzano.it` sia attiva e monitorata (l'utente NON ha richiesto cambio a `info@`, ma se la casella non esiste ancora va creata su Aruba/Google Workspace o redirect aliasato a `info@`).
- Opzionalmente: caricare un PDF "modulo recesso" con logo/branding manuale in `public/modulo-recesso.pdf` se l'utente vorrà sostituire la versione minimal generata dallo script.
</success_criteria>

<output>
Dopo completamento, aggiornare `.planning/STATE.md` Quick Tasks Completed table:

```
| 260430-tcf | Resi & recesso "silent compliance": TrustStrip card sostituita + testimonianza riscritta + Footer split + termini § 8 allineato (5 modifiche) + nuova /resi-e-recesso (3 sezioni) + PDF /modulo-recesso.pdf + checkbox checkout Art. 49 con AuditLog. 7 commit atomici, ~13 file impattati (3 nuovi: src/routes/resi-e-recesso.tsx, scripts/generate-modulo-recesso.ts, public/modulo-recesso.pdf) | 2026-04-30 | <commits> | [260430-tcf-resi-recesso-silent-compliance-truststri](./quick/260430-tcf-resi-recesso-silent-compliance-truststri/) |
```

Creare `260430-tcf-SUMMARY.md` nella stessa directory con dettagli implementazione, deviazioni (se nessuna: "zero deviazioni Rule 1/2/3"), commit hash range, file impattati con LOC delta, smoke test results.
</output>
