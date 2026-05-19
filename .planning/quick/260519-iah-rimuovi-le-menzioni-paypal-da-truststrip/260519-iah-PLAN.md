---
phase: quick-260519-iah
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/sections/TrustStripSection.tsx
  - src/components/shared/Footer.tsx
  - src/components/sections/FeaturedProductsSection.tsx
autonomous: false
requirements: [QUICK-260519-IAH]

must_haves:
  truths:
    - "Nessuna menzione di PayPal appare nella TrustStripSection"
    - "Nessuna menzione di PayPal appare nel Footer (badge metodi di pagamento)"
    - "Il carosello 'Novità' in homepage mostra soltanto sandali"
    - "La griglia/badge dei metodi di pagamento nel footer resta visivamente bilanciata"
  artifacts:
    - path: "src/components/sections/TrustStripSection.tsx"
      provides: "Trust strip senza menzione PayPal"
      contains: "Pagamento sicuro"
    - path: "src/components/shared/Footer.tsx"
      provides: "Footer con PAYMENT_METHODS senza PayPal"
      contains: "PAYMENT_METHODS"
    - path: "src/components/sections/FeaturedProductsSection.tsx"
      provides: "Carosello Novità filtrato per categoria sandali"
      contains: "category"
  key_links:
    - from: "src/components/sections/FeaturedProductsSection.tsx"
      to: "/api/products"
      via: "fetch con param category=sandali per tab nuove"
      pattern: "category.*sandali"
---

<objective>
Rimuovere ogni menzione di PayPal dalle due aree della UI dove compare (TrustStripSection e Footer), e modificare il carosello "Novità" della homepage perché mostri soltanto sandali invece di tutte le novità di ogni categoria.

Purpose: Il negozio non accetta più PayPal come metodo di pagamento, quindi la sua menzione è fuorviante. Inoltre la sezione "Novità" deve valorizzare il prodotto core (i sandali artigianali) e non mescolare pelletteria/articoli per calzature.
Output: Tre file componenti aggiornati — due puliti dalle menzioni PayPal, uno con filtro categoria sul carosello Novità.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

<interfaces>
<!-- Contratti già esistenti — usare direttamente, nessuna esplorazione necessaria. -->

TrustStripSection.tsx — array `TRUST_ITEMS` (riga 14-36). L'item "Pagamento sicuro"
(icona CreditCard) ha description: "Carta di credito, PayPal, bonifico". La griglia
è `grid-cols-2 ... md:grid-cols-4` con 4 item: rimuovere SOLO la parola "PayPal"
dalla description, NON l'intero item (altrimenti la griglia si sbilancia da 4 a 3 card).

Footer.tsx — costante `PAYMENT_METHODS` (riga 40-45):
```typescript
const PAYMENT_METHODS = ["Visa", "Mastercard", "PayPal", "Contrassegno"] as const;
```
Renderizzata come riga di badge nella bottom bar (riga 173-182). Rimuovere la
stringa "PayPal" dall'array → restano 3 badge, layout flex-gap si adatta da solo.

FeaturedProductsSection.tsx — `fetchProducts` (riga 110-129) costruisce URLSearchParams
e chiama `/api/products`. Il tab "nuove" usa `sort=newest`. L'endpoint `/api/products`
accetta già un param `category` (slug) validato da `listProductsSchema`
(src/lib/validators/products.ts riga 12: `category: z.string().optional()`).
`getProducts` → `buildProductWhere` (src/lib/products.server.ts riga 315-321) filtra
per la categoria E tutte le sue discendenti. La categoria "Sandali" ha slug `"sandali"`
(prisma/seed.ts riga 27) ed è genitore di `classici`, `gioiello`, `bambini`. Quindi
`category=sandali` include automaticamente tutte le sottocategorie di sandali.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rimuovere menzioni PayPal da TrustStripSection e Footer</name>
  <files>src/components/sections/TrustStripSection.tsx, src/components/shared/Footer.tsx</files>
  <action>
In TrustStripSection.tsx: nell'array `TRUST_ITEMS`, modificare la `description`
dell'item "Pagamento sicuro" da "Carta di credito, PayPal, bonifico" a
"Carta di credito, bonifico, contrassegno". NON rimuovere l'intero item — la griglia
deve restare a 4 card per mantenere il layout `md:grid-cols-4` bilanciato.

In Footer.tsx: nella costante `PAYMENT_METHODS` rimuovere la stringa `"PayPal"`,
lasciando `["Visa", "Mastercard", "Contrassegno"] as const`. Il rendering dei badge
(`PAYMENT_METHODS.map(...)`) usa flex con gap, quindi 3 badge invece di 4 si
adattano senza modifiche di stile.

Non toccare nessun'altra logica o markup in questi file.
  </action>
  <verify>
    <automated>! grep -ri "paypal" src/components/sections/TrustStripSection.tsx src/components/shared/Footer.tsx</automated>
  </verify>
  <done>Nessuna occorrenza (case-insensitive) di "paypal" nei due file. TrustStripSection mantiene 4 item in TRUST_ITEMS. Footer.PAYMENT_METHODS ha 3 elementi.</done>
</task>

<task type="auto">
  <name>Task 2: Filtrare il carosello Novità per categoria sandali</name>
  <files>src/components/sections/FeaturedProductsSection.tsx</files>
  <action>
Nella funzione `fetchProducts` (riga 110-129), aggiungere il filtro per categoria
sandali quando il tab attivo è "nuove". Subito dopo `params.set("sort", ...)` e prima
del blocco `if (tab === "bestseller")`, aggiungere:

```typescript
if (tab === "nuove") params.set("category", "sandali");
```

Questo fa sì che il tab "Novità" chiami `/api/products?...&category=sandali`, e
`buildProductWhere` lato server filtri i prodotti sulla categoria "sandali" e tutte
le sue sottocategorie (classici, gioiello, bambini). Il tab "bestseller" resta
invariato (continua a mostrare tutti i bestseller).

Opzionale ma consigliato per coerenza testuale: aggiornare la `description` del tab
"nuove" in `TABS` (riga 22-28) se necessario — il testo attuale parla già di
"modelli ... le pelli nuove" ed è compatibile con i soli sandali, quindi può
restare invariato. Non modificare altro.
  </action>
  <verify>
    <automated>grep -n 'params.set("category", "sandali")' src/components/sections/FeaturedProductsSection.tsx</automated>
  </verify>
  <done>Il tab "nuove" del carosello include il param `category=sandali` nella fetch a /api/products. Il tab "bestseller" resta invariato.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
Rimosse le menzioni PayPal da TrustStripSection (description "Pagamento sicuro") e dal
Footer (badge metodi di pagamento). Il carosello "Novità" in homepage ora filtra i
prodotti per categoria sandali tramite il param `category=sandali` su /api/products.
  </what-built>
  <how-to-verify>
1. Avviare il dev server (`pnpm dev`) e aprire la homepage.
2. Scorrere fino alla TrustStrip: la card "Pagamento sicuro" NON deve menzionare PayPal,
   e devono esserci ancora 4 card allineate.
3. Scorrere fino al Footer: i badge metodi di pagamento devono essere Visa, Mastercard,
   Contrassegno — nessun badge PayPal — e la riga deve restare bilanciata.
4. Nella sezione "Novità e bestseller", tab "Novità" selezionato: tutti i prodotti
   mostrati devono essere sandali (controllare il label categoria sopra ogni card —
   deve essere una categoria sandali: Classici / Gioiello / Bambini / Sandali).
5. Cliccare il tab "Bestseller": deve continuare a mostrare i bestseller di tutte le
   categorie (comportamento invariato).
  </how-to-verify>
  <resume-signal>Scrivi "approved" o descrivi i problemi riscontrati</resume-signal>
</task>

</tasks>

<verification>
- `grep -ri "paypal" src/` non restituisce risultati nei componenti TrustStripSection e Footer
- Il carosello Novità chiama /api/products con `category=sandali`
- Build/typecheck passa: `pnpm typecheck`
- Verifica visiva del checkpoint umano confermata
</verification>

<success_criteria>
- Nessuna menzione di PayPal in TrustStripSection.tsx e Footer.tsx
- TrustStripSection mantiene 4 trust card (layout invariato)
- Footer mostra 3 badge metodi di pagamento bilanciati
- Tab "Novità" del carosello homepage mostra esclusivamente sandali
- Tab "Bestseller" invariato
</success_criteria>

<output>
After completion, create `.planning/quick/260519-iah-rimuovi-le-menzioni-paypal-da-truststrip/260519-iah-SUMMARY.md`
</output>
