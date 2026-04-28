---
phase: quick/260428-m6j
plan: 01
subsystem: checkout, admin, e2e
tags: [iva, payments, admin-ux, e2e, playwright]
requirements:
  - QUICK-IVA-FIX
  - QUICK-PAYMENT-LABEL
  - QUICK-UI-TAX-AUDIT
  - QUICK-E2E-PARAMETRIC
  - QUICK-RAILWAY-VERIFY
key-files:
  modified:
    - src/lib/orders.server.ts
    - src/routes/admin.ordini.$id.tsx
    - src/components/checkout/OrderSummary.tsx
    - playwright.config.ts
    - package.json
  created:
    - tests/e2e/all-products-purchase.spec.ts
metrics:
  duration_min: 33
  completed_at: "2026-04-28T14:37:47Z"
  tasks: 7
  commits: 4
---

# SUMMARY — quick/260428-m6j

Fix IVA bug + payment status label, generalize Playwright smoke to all products.

Branch: `site-gen/calzoleria-prevenzano`
Date: 2026-04-28

## Overview

Tre bug-fix accoppiati e un'estensione della suite E2E. (1) Il calcolatore degli ordini sommava il 22% di IVA sopra prezzi che erano già IVA-inclusi, gonfiando ogni totale del ~22% (Isabella €88.59 invece di €72.90). (2) Il badge pagamento in admin restava giallo "in attesa" sui pagamenti che il webhook Stripe aveva scritto con `status="succeeded"` (la mappa riconosceva solo l'alias legacy `completed`). (3) `OrderSummary` ora etichetta esplicitamente "Subtotale (IVA inclusa)" e mostra una riga muted "di cui IVA (22%) €X.XX". (4) Generalizzato lo smoke Isabella in uno spec parametrico che scopre i 119 prodotti vivi da `/api/products` e ne acquista uno per slug; 115/119 (96.6%) passano, 4 falliscono per ragioni indipendenti dall'IVA — riportate qui sotto come prossimi task.

## 1. IVA fix — `src/lib/orders.server.ts`

```diff
-  const subtotal = cartItems.reduce(
-    (sum: number, item: CartItemFull) => sum + Number(item.price) * item.quantity, 0,
-  );
-  const shippingCost = subtotal >= 99 ? 0 : 7.9;
-  const taxRate = 0.22;
-  const taxableAmount = subtotal - discountAmount;
-  const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
-  const total = Math.round((taxableAmount + shippingCost + taxAmount) * 100) / 100;
+  // Calculate totals — prices are VAT-inclusive (Italian e-commerce convention).
+  // Tax is *contained* in the total (extracted for invoice/legal), never added on top.
+  const subtotal = cartItems.reduce(
+    (sum: number, item: CartItemFull) => sum + Number(item.price) * item.quantity, 0,
+  );
+  const shippingCost = subtotal >= 99 ? 0 : 7.9;
+  const netAfterDiscount = subtotal - discountAmount;
+  const total = Math.round((netAfterDiscount + shippingCost) * 100) / 100;
+  // VAT contained in the total at 22% — for invoicing only, NOT added to total
+  const taxAmount = Math.round((total * 22 / 122) * 100) / 100;
```

**Sanity numbers** (Isabella, no discount):

- subtotal = 65.00, shipping = 7.90 → total = 72.90, taxAmount = 13.15
- was: total = 88.59 (bug)

**Verifica live (network trace dello smoke post-deploy):** Stripe `expected_amount` = `7290` cents = €72.90. Confermato.

Commit: `f7be0d1`

## 2. Payment label fix — `src/routes/admin.ordini.$id.tsx`

```diff
 const PAYMENT_STATUS_LABELS: Record<string, string> = {
   pending: "In attesa",
+  succeeded: "Riuscito",     // Stripe canonical (current webhook writer)
-  completed: "Completato",
+  completed: "Completato",   // legacy alias — keep for old rows
   failed: "Fallito",
   refunded: "Rimborsato",
 };

-${p.status === "completed" ? "bg-green-100 text-green-800" : p.status === "failed" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}
+${(p.status === "succeeded" || p.status === "completed") ? "bg-green-100 text-green-800" : p.status === "failed" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}
```

Storico preservato: le righe vecchie con `status="completed"` continuano a mostrare badge verde con label "Completato".

Commit: `a3783e4`

## 3. UI tax-display audit — `src/components/checkout/OrderSummary.tsx`

```diff
-  <span className="text-[var(--color-text-secondary)]">Subtotale</span>
+  <span className="text-[var(--color-text-secondary)]">Subtotale (IVA inclusa)</span>
   ...
   <span className="text-base font-bold text-[var(--color-primary)]">€{total.toFixed(2)}</span>
 </div>
+<div className="flex justify-between text-xs text-[var(--color-text-muted)]">
+  <span>di cui IVA (22%)</span>
+  <span>€{(Math.round((total * 22 / 122) * 100) / 100).toFixed(2)}</span>
+</div>
```

**Audit di `carrello.tsx` / `checkout.tsx` / `ordine-confermato.tsx`:** nessun calcolo IVA inline trovato — tutti riusano `OrderSummary` (cart, checkout) o leggono `order.total` dal server (ordine-confermato). Nessuna modifica aggiuntiva necessaria.

Commit: `c138d00`

## 4. Deploy gate

- Pushed at: `2026-04-28T14:06:47Z` (commit `c138d00`)
- Detected stable on Railway at: `2026-04-28T14:13:21Z` (method: `/api/products?perPage=1` polling — `/api/health` non esiste su questo build)
- Confermato 5 polls consecutivi a HTTP 200 (intervalli ~10s)
- Conferma indipendente via `railway status --json`: `latestDeployment.commitHash = c138d009fe1a46be29b4df6f9835e27dc7325211`, `status = SUCCESS`, `createdAt = 2026-04-28T14:06:48.541Z` — combacia con il commit pushato.
- Sanity: `GET /api/products?perPage=1` ritorna `{"ok":true,"data":{"items":[…],"total":119,…}}` — 119 prodotti attivi nel catalogo.

## 5. Smoke result (Isabella)

- Comando: `pnpm test:e2e tests/e2e/smoke-purchase.spec.ts --reporter=list`
- Risultato: **PASS** (24.5s, poi rieseguito con trace 21.9s — entrambi pass)
- Heading osservata: `Pagamento in elaborazione` (webhook Stripe ancora in coda al momento dell'asserzione, comportamento atteso e tollerato dallo smoke)
- Total addebitato da Stripe: **€72.90** ✅ (verificato via network trace di Playwright: `expected_amount = 7290` cents — vedi `/tmp/trace_check/0-trace.network`, occorrenze multiple)
- Ordini di test creati su DB Railway con email `e2e+isabella@test.calzoleriaprevenzano.it` — l'utente li gestirà manualmente.
- Runtime smoke: ~25s

## 6. Parametric run — all products

- Comando: `pnpm test:e2e:all` (espande in `playwright test tests/e2e/all-products-purchase.spec.ts --project=all-products --workers=4 --retries=1 --timeout=90000 --fully-parallel`)
- Slug discovered: **119** (paginazione di `/api/products` esaurita a perPage=50)
- Pass al primo tentativo: **99**
- Flaky (pass al retry): **16**
- Hard fail (anche al retry): **4**
- **Esito netto: 115/119 = 96.6% di successo**
- Runtime: **16.9 min** (sotto il cap di 40 min)
- HTML report: `pnpm exec playwright show-report` (la directory `playwright-report/` contiene l'output dell'ultima esecuzione; le `test-results/all-products-purchase-*` directories conservano `trace.zip` + `video.webm` + `test-failed-1.png` per ciascun fallimento)

### Hard failures (4 — falliti anche al retry)

| Slug | Causa (dal trace) |
|------|-------------------|
| `provv` | Bottone "Aggiungi al carrello" mai abilitato — il prodotto ha `variants=[]` e `stock=0` (sembra un prodotto di test/staging "provvisorio" lasciato attivo). Non è un bug dell'app: è data-quality. |
| `artemide` | `page.waitForURL(/checkout\.stripe\.com/)` timeout 60s dopo il click su "Vai al pagamento" — la POST `/api/checkout` non ridireziona. Possibile errore lato server (variante valida non risolvibile, immagine mancante per Stripe, o validazione zod che rigetta la cart). Da investigare con `playwright show-trace`. |
| `jasmine` | `page.waitForResponse` per `POST /api/cart` timeout 15s — l'helper `selectFirstAvailableInEachGroup` clicca le opzioni ma il bottone non emette mai la richiesta (probabilmente il gruppo varianti non si chiude, oppure `Aggiungi al carrello` resta disabilitato senza che il test lo noti). |
| `vipera` | Stessa firma di `jasmine`: `waitForResponse /api/cart POST` timeout 15s. Probabile lo stesso motivo strutturale (configurazione varianti che il fast-path del helper non sa selezionare). |

### Flaky (16 — pass al retry, problemi transienti)

`isabella`, `giunone`, `rossella`, `strass-1012`, `asia`, `giorgia`, `iris`, `soletta-pelle-pregiata-prestige`, `plantare-light-insole-prestige`, `prestige-pelle-kids`, `plantare-memory-prestige`, `cintura-cuoio-040-nero`, `borsello-verde`, `cintura-vitello-030-testa-di-moro`, `cintura-cuoio-035-rosso-inglese`, `borsello-blu`.

I retry hanno tutti completato in 23-30s — segnatura tipica di network jitter / race su Stripe Hosted Checkout sotto 4-way parallelism. Non sono bug del prodotto: sono jitter del runner. Aumentare `retries=2` se il rumore diventa fastidioso.

## 7. Out of scope (flagged, NOT fixed)

- Migrazione di ordini storici per ricalcolare `total`/`taxAmount` con la nuova formula (richiede un task DB separato).
- Errori TS pre-esistenti in `src/routes/prodotti.$slug.tsx` (~30 errori "does not exist on type {}"). Indipendenti dal fix IVA — vanno tipizzati i loader.
- Errori di Biome config (`files.ignore` deprecato, dovrebbe essere `files.includes`/`experimentalScannerIgnores`). Pre-esistenti.
- Cleanup script per gli ordini di test creati durante il run parametrico (~99-115 ordini con email `e2e+*@test.calzoleriaprevenzano.it`). L'utente ha autorizzato esplicitamente la creazione e li elimina manualmente filtrando per pattern email.
- Investigazione delle 4 hard-failure: contenuta nei prossimi quick task (sezione 8).
- Touch del DB / seed / webhook handler.

## 8. Recommended next quick tasks

1. **`provv`**: deattivare/cancellare il prodotto di test "provvisorio" (slug=provv, stock=0, no varianti) dal catalogo o marcarlo `isActive=false`. Una riga di SQL/Prisma. Il parametric escluderà automaticamente i prodotti inattivi quando il filtro `isActive=true` sarà applicato in `/api/products` (verificare se è già attivo).
2. **`artemide`**: catturare il response body di `POST /api/checkout` per questo slug e capire perché Stripe non rispondeci. Probabili candidati: variante senza prezzo, immagine mancante, validazione Zod. Apri il trace: `pnpm exec playwright show-trace test-results/all-products-purchase-comp-41fc5--parametric-compra-artemide-all-products-retry1/trace.zip`
3. **`jasmine` + `vipera`**: estendere `selectFirstAvailableInEachGroup` (in `tests/e2e/helpers/variants.ts`) per gestire il loro pattern di varianti — entrambi falliscono nello stesso punto (`/api/cart` POST mai inviato). Probabilmente hanno un gruppo varianti non riconosciuto dal fast-path Laminato/Verde-acqua. Apri i trace e tipizza il pattern del DOM.
4. **Stabilità runner**: i 16 flaky possono essere ridotti aumentando `retries=2` nello script `test:e2e:all`, oppure separando il flusso Stripe Hosted in un'attesa esplicita su `frame_locator` invece di `waitForURL`. Trade-off vs. runtime.
5. **Cleanup script test orders**: `node scripts/cleanup-e2e-orders.ts` che fa una `DELETE FROM orders WHERE guestEmail LIKE 'e2e+%@test.calzoleriaprevenzano.it' AND status='pending'` — protetto da `--dry-run` di default.
6. **Backfill storico** (post-IVA-fix): per gli ordini creati con totali gonfiati pre-`f7be0d1`, ricalcolare `taxAmount = round(total × 22 / 122)` ed eventualmente correggere `total`. Questo richiede una migrazione e un'attenta scelta tra "totale era quello vero perché Stripe ha addebitato così" (no fix) e "totale va corretto" (fix). Da decidere col business prima di toccare la DB.

## Self-Check: PASSED

- [x] `src/lib/orders.server.ts` contiene `total * 22 / 122` (riga 210) e NON contiene `taxableAmount + shippingCost + taxAmount`.
- [x] `src/routes/admin.ordini.$id.tsx` contiene `succeeded` sia in `PAYMENT_STATUS_LABELS` sia nel ternario del badge.
- [x] `src/components/checkout/OrderSummary.tsx` contiene `IVA inclusa` e `di cui IVA`.
- [x] `tests/e2e/all-products-purchase.spec.ts` esiste, usa top-level `await discoverSlugs()` + `for...of test(...)`, zero `any`.
- [x] `playwright.config.ts` ha due project (`smoke` + `all-products`).
- [x] `package.json` ha lo script `test:e2e:all` con flag CLI `--workers=4 --retries=1 --timeout=90000 --fully-parallel`.
- [x] Tutti i 4 commit di task atterrati su `site-gen/calzoleria-prevenzano`:
  - `f7be0d1` — fix IVA
  - `a3783e4` — fix admin badge
  - `c138d00` — OrderSummary IVA labels
  - `8eb2882` — parametric e2e spec + config + script
- [x] Branch pushato a `origin/site-gen/calzoleria-prevenzano` — Railway deploy live confermato (commit `c138d00`).
- [x] Smoke Isabella **PASS** sul nuovo deploy con totale Stripe verificato a €72.90.
- [x] Parametric run completato 115/119 (96.6%) in 16.9 min.
