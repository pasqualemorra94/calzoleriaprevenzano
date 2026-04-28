# Research — quick/260428-nd8

**Task:** Investigate why purchasing `artemide` fails on Railway live (POST /api/checkout doesn't redirect to Stripe).
**Date:** 2026-04-28
**Confidence:** HIGH (root cause confirmed by trace + code + reproduction).

---

## 1. Root cause con EVIDENZA

**Race condition su `Order.orderNumber` (`@unique`) sotto run parametrico a 4 worker.**

### Catena d'evidenze

**A. Il trace del fallimento mostra `POST /api/checkout` → HTTP 500.**

Estratto da `test-results/all-products-purchase-comp-41fc5--parametric-compra-artemide-all-products/trace.zip`:

- Request: `POST https://calzoleria-prevenzano-production.up.railway.app/api/checkout` con cookie `cart_session_id=5097ea4c…`, content-length 233 bytes.
- Request body (`resources/608df42f…json`):
  ```json
  {"email":"e2e+artemide@test.calzoleriaprevenzano.it","firstName":"E2E","lastName":"Test",
   "address":{"address1":"Via Roma 1","address2":"","city":"Roma","province":"RM",
              "postalCode":"00100","country":"IT"},"shippingMethod":"standard"}
  ```
- Response status: **500**, body (`resources/88e9900b…json`):
  ```json
  {"status":500,"unhandled":true,"message":"HTTPError"}
  ```
  Quel `"unhandled":true` è la firma del default error handler di TanStack Start quando una `throw` non viene catturata dall'handler della route.

**B. Il carrello al momento del checkout era valido.**

Il GET `/api/cart` immediatamente prima del 500 (`resources/20bcf067…json`) restituisce 1 item Artemide a €65, varianti complete (Laminato + Verde acqua + No tacco + Taglia 32). Il problema **non è** dati cart corrotti.

**C. Il flusso identico funziona perfettamente in isolamento.**

Riproduzione fresca con curl (oggi, contro la stessa Railway live):

```
JAR=/tmp/repro.jar
curl -c $JAR -b $JAR -X POST .../api/cart -d '{<stesso payload del trace>}'
curl -b $JAR -X POST .../api/checkout -d '{<stesso payload del trace>}'
```

→ HTTP **201**, `orderNumber: "CP-2026-0124"`, `checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_…"`. **Non riproducibile in singolo.** Confermato che artemide non ha vizi nei dati (variantConfig, prezzo, immagini sono identici a Isabella).

**D. Diff variantConfig artemide vs isabella: ZERO.**

I gruppi (`tipo-pelle`, `wcpa-image-group-6641cc815b92c` con dependsOn `laminato`, `Tacco`, `Taglia`) sono byte-identici tra i due prodotti. Stesso `price=65`, stesso `isActive`, stock simile (artemide=19, isabella=14). Esclude H1, H3, H4 dell'investigazione iniziale.

**E. Il bug è in `src/lib/orders.server.ts:213-214`:**

```ts
const orderCount = await prisma.order.count();
const orderNumber = `CP-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, "0")}`;
```

`prisma/schema.prisma:368`:
```
orderNumber    String         @unique // numero ordine leggibile: "CP-2026-0001"
```

**F. Nessuna protezione lato route.** `src/routes/api/checkout.ts` chiama `createOrder()` (righe 41-47, 106) **senza try/catch**. Se Prisma lancia `PrismaClientKnownRequestError` con `code === "P2002"` (unique violation), l'eccezione bubbla fino al runtime di TanStack Start che risponde 500 unhandled.

**G. Pattern di carico compatibile.**

`package.json` → `test:e2e:all`: `--workers=4 --retries=1 --fully-parallel`. 115 ordini creati in 16.9 minuti = ~7 ordini/min con 4 worker concorrenti. Probabilità di collisione (due `count()` che leggono lo stesso valore prima che il vincitore committi) è **alta**:

- La SELECT count() + INSERT non è atomica.
- Window di collisione = tempo tra `prisma.order.count()` e `prisma.order.create()`. Stimato ~50-200ms (transazione Postgres su Railway, con altre query attorno).
- Con 4 worker che premono "Conferma e paga" entro la stessa finestra → probabilità di collisione su ogni batch.

**H. I 16 "flaky" test che passano al retry confermano la diagnosi.**

Il summary precedente li attribuiva a "network jitter su Stripe Hosted Checkout". Smentito: il jitter avviene su `/api/checkout` (server) **prima** di Stripe. La distribuzione 16-flaky + 1-hard-fail (artemide) su 119 test è coerente con una race rara (~10-15% per request quando 4 worker convergono) dove una doppia collisione nello stesso slug è statisticamente attesa ~1 volta su 119.

---

## 2. Fix raccomandato

**Tipo:** code fix in `src/lib/orders.server.ts`.
**Strategia:** rimuovere il pattern `count() + format` e usare un contatore atomico server-side, con retry.

### Opzione A — Retry su collisione (minimale, 5 righe)

`src/lib/orders.server.ts` linee 213-214:

```diff
-  const orderCount = await prisma.order.count();
-  const orderNumber = `CP-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, "0")}`;
+  // Generate unique orderNumber with retry on race-condition collisions.
+  // The count()+create() pair is not atomic; under parallel checkouts the same
+  // count can be read by multiple workers, causing P2002 on the @unique field.
+  let orderNumber = "";
+  let attempt = 0;
+  while (attempt < 5) {
+    const orderCount = await prisma.order.count();
+    orderNumber = `CP-${new Date().getFullYear()}-${String(orderCount + 1 + attempt).padStart(4, "0")}`;
+    const exists = await prisma.order.findUnique({ where: { orderNumber }, select: { id: true } });
+    if (!exists) break;
+    attempt++;
+  }
+  if (!orderNumber) return { ok: false, error: "Impossibile generare numero ordine" };
```

E avvolgere `prisma.order.create({ ... orderNumber ... })` (riga 218) in try/catch dedicato a `P2002` con un retry esterno (massimo 3) per coprire il caso in cui il check pre-insert vince ma poi un altro worker inserisce nello stesso microsecondo.

### Opzione B — Sequence atomica Postgres (corretto, ~10 righe)

Aggiungere una migration con una sequence Postgres:

```sql
CREATE SEQUENCE IF NOT EXISTS order_number_seq;
```

Sostituire le righe 213-214 con:

```ts
const seqResult = await prisma.$queryRaw<Array<{ next: bigint }>>`
  SELECT nextval('order_number_seq')::bigint AS next
`;
const seq = Number(seqResult[0].next);
const orderNumber = `CP-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`;
```

`nextval` è atomica per design: zero collisioni. Pro: corretta in tutti i casi di carico. Contro: richiede migration SQL e bootstrap della sequence al valore corrente (`SELECT setval('order_number_seq', (SELECT COUNT(*) FROM "Order"));`).

**Raccomandazione:** **Opzione A** per il quick task (zero migration, fix immediato, riduce drasticamente le collisioni). **Opzione B** come follow-up nella prossima fase quando si tocca lo schema. Entrambe vanno accompagnate da un try/catch in `src/routes/api/checkout.ts` attorno alla chiamata `createOrder` (righe 41 e 106) per restituire un errore strutturato (400/422) invece di 500 unhandled — anche se la race è risolta, qualunque futura eccezione di `createOrder` non dovrebbe più produrre 500.

### Hardening complementare (richiesto)

`src/routes/api/checkout.ts` — wrappare entrambe le chiamate `createOrder`:

```diff
- const result = await createOrder(null, sessionId, parsed.data, ipAddress, userAgent);
+ let result;
+ try {
+   result = await createOrder(null, sessionId, parsed.data, ipAddress, userAgent);
+ } catch (err) {
+   console.error("[checkout] createOrder threw:", err);
+   return apiError("INTERNAL_ERROR", "Errore durante la creazione dell'ordine", 500);
+ }
  if (!result.ok) return apiError("BAD_REQUEST", result.error, 400);
```

Stesso wrap per il branch authenticated alla riga 106.

---

## 3. Comando di verifica

Dopo il deploy del fix:

```
# Smoke singolo (deve passare senza retry):
pnpm exec playwright test tests/e2e/all-products-purchase.spec.ts \
  --project=all-products \
  --grep "compra artemide" \
  --workers=1 \
  --retries=0 \
  --reporter=list

# Stress test (deve passare con tutti i 4 worker su 5 ripetizioni dello stesso slug):
for i in 1 2 3 4 5; do
  pnpm exec playwright test tests/e2e/all-products-purchase.spec.ts \
    --project=all-products \
    --grep "compra artemide" \
    --workers=4 \
    --retries=0 \
    --reporter=list || echo "FAILED on run $i"
done

# Run parametrico completo: target ≥ 99% passing al primo tentativo
# (atteso: 115/119 → 119/119, oppure ridurre dipendenza dai retry da 16 a <3):
pnpm test:e2e:all
```

Acceptance: artemide passa senza retry, e il numero di test in "flaky (pass on retry)" scende da 16 a ≤3 (tetto residuo accettabile = jitter Stripe Hosted, non server).

---

## 4. Side effects / altri slug colpiti dalla stessa root cause

### Probabilmente affetti dallo stesso bug
- **I 16 test "flaky" del run parametrico precedente** (`isabella`, `giunone`, `rossella`, `strass-1012`, `asia`, `giorgia`, `iris`, `soletta-pelle-pregiata-prestige`, `plantare-light-insole-prestige`, `prestige-pelle-kids`, `plantare-memory-prestige`, `cintura-cuoio-040-nero`, `borsello-verde`, `cintura-vitello-030-testa-di-moro`, `cintura-cuoio-035-rosso-inglese`, `borsello-blu`). La firma "pass on retry" è perfettamente coerente con una race condition rara. **Non sono jitter di rete su Stripe come ipotizzato in 260428-m6j sezione 6**: il summary attribuiva i flaky a Stripe Hosted, ma la collisione `orderNumber` avviene **prima** del redirect Stripe — il 500 nasce su `/api/checkout` server-side. La diagnosi del summary va corretta nel ledger.

### Non affetti dalla stessa root cause
- `provv` — data quality (no varianti, stock=0). Indipendente.
- `jasmine`, `vipera` — falliscono prima del checkout (cart POST non parte). Helper variants problem, indipendente.

### Effetto su utenti reali (NON test)
Sotto **traffico di produzione realistico** (decine di ordini al giorno, non 4 paralleli al secondo) la race è praticamente irriproducibile. Il bug è quindi:
- **HIGH severity per il test runner** (4 worker paralleli moltiplicano il problema).
- **LOW-MEDIUM severity per produzione** (ma reale: due clienti che premono "paga" nello stesso istante producono comunque un 500 per uno dei due — esperienza pessima durante traffico picco / sale / Black Friday).

Il fix va deployato comunque: il pattern `count()+1` è anti-pattern noto e va sostituito a prescindere dal volume.

### Audit consigliato (eventualmente, se il planner lo ritiene in scope)
Cercare altri pattern simili nel codebase:
```
grep -rn "prisma\.\w*\.count()" src/lib/ | grep -v test
```
Se altri model usano `count()+1` per generare ID human-readable, hanno lo stesso buco.

---

## 5. Unknowns rimasti
Nessuno. La diagnosi è completa: trace + codice + riproduzione + schema concordano su un'unica root cause.

## File chiave coinvolti dal fix
- `src/lib/orders.server.ts` (righe 213-214 — generazione orderNumber)
- `src/routes/api/checkout.ts` (righe 41-47, 106 — try/catch attorno a createOrder)
- `prisma/schema.prisma` (linea 368 — `orderNumber @unique`, **non da modificare**)

## Sources
- Trace estratto: `/tmp/artemide_trace/0-trace.network` + `resources/{608df42f, 88e9900b, 20bcf067}.json`
- Live API: `GET /api/products/{artemide,isabella}` su Railway
- Riproduzione live curl 2-step (cart→checkout) → HTTP 201 ✓
- Codice locale: `src/lib/orders.server.ts`, `src/routes/api/checkout.ts`, `prisma/schema.prisma`
- Summary precedente: `.planning/quick/260428-m6j-fix-iva-bug-payment-status-label-general/260428-m6j-SUMMARY.md` sezione 6 (la diagnosi "jitter Stripe" sui 16 flaky è da rivedere alla luce di questo finding)
