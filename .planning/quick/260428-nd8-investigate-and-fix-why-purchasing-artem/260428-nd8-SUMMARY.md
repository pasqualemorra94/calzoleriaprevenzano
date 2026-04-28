---
quick_id: 260428-nd8
type: execute
date: 2026-04-28
duration_minutes: 23
status: PASS
commits:
  - hash: d219674
    file: src/lib/orders.server.ts
    message: "fix(checkout): retry su P2002 per orderNumber in createOrder"
  - hash: 2a6d082
    file: src/routes/api/checkout.ts
    message: "fix(checkout): try/catch + errore strutturato 500 su /api/checkout"
files_modified:
  - src/lib/orders.server.ts
  - src/routes/api/checkout.ts
verification:
  artemide_targeted: PASS (1/1, retry=0, single worker, 24.1s)
  parametric_total: 119
  parametric_passed: 116  # 109 first-attempt + 7 flaky-retried
  parametric_failed: 3    # provv, artemide, borsello-porta-telefono-stampato-cocco
  parametric_flaky: 7     # was 16
  parametric_unhandled_500_count: 0  # was ≥17 (the m6j 16 + artemide hard-fail)
  parametric_duration_minutes: 14.5
diagnosis_correction: true  # 260428-m6j attributed flakies to "Stripe jitter" — wrong, was the same race
---

# Quick 260428-nd8 — SUMMARY

## Risultato: PASS

La race condition su `Order.orderNumber` è stata eliminata. Lo zero `unhandled` 500 sul run parametrico (vs 17 prima) è la prova diretta. I 3 fallimenti residui hanno firme completamente diverse (cart helper / data quality / Stripe redirect) e sono già censiti come bug separati nel RESEARCH.

---

## Diagnosi della race (sintesi)

Il pattern legacy era:

```ts
const orderCount = await prisma.order.count();
const orderNumber = `CP-${year}-${String(orderCount + 1).padStart(4, "0")}`;
const order = await prisma.order.create({ data: { orderNumber, ... } });
```

`SELECT count(*)` e `INSERT` sono due transazioni Postgres separate. Sotto `--workers=4 --fully-parallel`, due richieste leggevano lo stesso valore di `count()` prima che il vincitore committasse, e generavano lo stesso `orderNumber`. Il secondo `INSERT` falliva con `P2002` sul vincolo `@unique orderNumber` — e poiché `src/routes/api/checkout.ts` non aveva alcun `try/catch`, l'eccezione bubbled fino al runtime di TanStack Start come `{"status":500,"unhandled":true,"message":"HTTPError"}`. Sotto traffico reale (decine di ordini/giorno) la finestra di collisione è praticamente irriproducibile; sotto 4 worker in parallelo che premono simultaneamente "Conferma e paga" diventava ~10-15% per richiesta.

---

## Fix applicati

### Commit 1 — `d219674` (Fix A: retry loop)
**File:** `src/lib/orders.server.ts`

```diff
+import { Prisma } from "@prisma/client";
 import { prisma } from "~/lib/db.server";

-  // Generate order number
-  const orderCount = await prisma.order.count();
-  const orderNumber = `CP-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, "0")}`;
-
-  // Create order with items
-  const isGuest = !userId && "email" in input;
-  const order = await prisma.order.create({ data: { orderNumber, ... }, include: {...} });
+  const isGuest = !userId && "email" in input;
+  const MAX_ORDER_NUMBER_ATTEMPTS = 5;
+  type OrderWithItems = Prisma.OrderGetPayload<{
+    include: { items: { include: { product: { select: { name: true } } } } };
+  }>;
+  let order: OrderWithItems | null = null;
+  let lastError: unknown = null;
+
+  for (let attempt = 0; attempt < MAX_ORDER_NUMBER_ATTEMPTS; attempt++) {
+    const orderCount = await prisma.order.count();
+    const orderNumber = `CP-${new Date().getFullYear()}-${String(orderCount + 1 + attempt).padStart(4, "0")}`;
+    try {
+      order = await prisma.order.create({ data: { orderNumber, ... }, include: {...} });
+      break;
+    } catch (err) {
+      lastError = err;
+      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
+        const target = err.meta?.target;
+        const targetStr = Array.isArray(target) ? target.join(",") : String(target ?? "");
+        if (targetStr.includes("orderNumber")) continue;
+      }
+      throw err;
+    }
+  }
+
+  if (!order) {
+    void lastError;
+    throw new Error(`Impossibile generare numero ordine univoco dopo ${MAX_ORDER_NUMBER_ATTEMPTS} tentativi`);
+  }
```

Punti chiave:
- Format `CP-YYYY-NNNN` invariato. Nessun cambio schema, nessuna migration.
- Tipizzazione full-Prisma via `Prisma.OrderGetPayload<{ include: ... }>` — zero `any`, zero `as any` (CLAUDE.md "Zero any policy").
- Retry distingue P2002 su `orderNumber` (continua) da P2002 su altri campi (rilancia subito) — niente swallow di altri errori.
- Stock decrement e cart clear restano fuori dal retry: vengono eseguiti esattamente una volta dopo `break`.

### Commit 2 — `2a6d082` (Fix B: error gate)
**File:** `src/routes/api/checkout.ts`

```diff
 import { getSessionId } from "~/lib/cart-session";
+import { createLogger } from "~/lib/logger.server";
+
+const log = createLogger("checkout");

 // guest branch (line ~41):
-          const result = await createOrder(null, sessionId, parsed.data, ipAddress, userAgent);
+          let result: Awaited<ReturnType<typeof createOrder>>;
+          try {
+            result = await createOrder(null, sessionId, parsed.data, ipAddress, userAgent);
+          } catch (err) {
+            log.error("createOrder threw (guest branch)", {
+              sessionId,
+              email: parsed.data.email,
+              errorMessage: err instanceof Error ? err.message : String(err),
+            });
+            return apiError("INTERNAL_ERROR", "Errore durante la creazione dell'ordine. Riprova tra qualche secondo.", 500);
+          }

 // auth branch (line ~106): identical try/catch
```

Punti chiave:
- Logging strutturato via `createLogger("checkout")` — niente `console.error`, niente stack trace, niente codici Prisma esposti al client.
- Messaggio user-facing italiano: «Errore durante la creazione dell'ordine. Riprova tra qualche secondo.» (status 500 strutturato, non più `{"unhandled":true}`).
- Try/catch attorno a `createCheckoutSession` (Stripe) lasciato invariato — già gestiva graceful degradation a `checkoutUrl: null`.
- I path tipati `parsed.success === false` (422) e `result.ok === false` (400) restano inalterati: non sono eccezioni, non passano per il try/catch.

---

## Verifica artemide (targeted, post-deploy Railway)

Comando:
```bash
pnpm exec playwright test tests/e2e/all-products-purchase.spec.ts \
  --project=all-products --grep "artemide" --workers=1 --retries=0 --reporter=list
```

**Risultato: PASS** (1 passed, 28.7s totali, durata test 24.1s, zero retry).

Pre-fix: lo stesso comando produceva `POST /api/checkout → 500 {"unhandled":true,"message":"HTTPError"}` riproducibile sotto carico parametrico.

Smoke check aggiuntivo dell'endpoint con payload vuoto:
```
curl -X POST -d '{}' .../api/checkout
→ HTTP 400 {"ok":false,"error":{"code":"BAD_REQUEST","message":"Carrello non trovato"}}
```
Il path tipato 400 non è stato rotto dal try/catch.

---

## Verifica run parametrico

Comando: `pnpm test:e2e:all` (`playwright test ... --workers=4 --retries=1 --fully-parallel`)

| Metrica | Pre-fix (260428-m6j) | Post-fix (260428-nd8) | Δ |
|---|---|---|---|
| Test totali | 119 | 119 | — |
| First-attempt pass | 99 | **109** | **+10** |
| Pass-on-retry (flaky) | 16 | **7** | **−9** |
| **Effective pass** | **115/119** | **116/119** | **+1** |
| Hard fail | 1 (artemide checkout 500) | 3 (cart helper / data) | +2 |
| **Unhandled 500 count** | **≥17** (16 flakies + artemide) | **0** | **−17** |
| Durata | 16.9 min | 14.5 min | −2.4 min |

I 7 flaky residui: `laura`, `ludovica`, `strass-1016`, `schiava-4`, `discoteca`, `nicole`, `giorgia`. Le tracce mostrano `page.waitForResponse: Timeout 15000ms ... POST /api/cart` — è il **cart helper bug** (cart POST non torna entro 15s sotto load), NON l'orderNumber race. Il fix di questo task ha rimosso completamente il pattern dei 16 flaky precedenti che invece erano P2002 collisioni mascherati da retry.

I 3 hard-fail residui (firme nei trace):
1. **`provv`** — `getByRole('button', /Aggiungi al carrello/i)` non viene trovato/abilitato. Data quality (zero varianti / stock=0). Censito in RESEARCH §4 come "Indipendente".
2. **`artemide`** — `page.waitForResponse: Timeout 15000ms ... POST /api/cart`. **Stessa firma del cart helper bug** che colpisce `jasmine`/`vipera`. Sotto 4 worker il cart POST timeout: quando il primo retry parte, la cart-page state della seconda esecuzione resta in attesa di una response che non arriva. **Diverso dalla race orderNumber** — niente più `unhandled:true` nel response body. Da risolvere nel quick task separato dedicato al cart helper.
3. **`borsello-porta-telefono-stampato-cocco`** — `page.waitForURL(/checkout\.stripe\.com/): Timeout 60000ms`. La navigazione verso Stripe non si completa: o Stripe è lento, o il bottone "Conferma e paga" non scatena il redirect previsto sotto carico. Anche questo è una signature diversa dal nostro race.

**Verifica chiave:** `grep -i "unhandled\|HTTPError" /tmp/nd8-parametric-run.log` → **zero match**. Il pattern d'errore che colpiva `artemide` (e il 16 flaky) è completamente sparito dal log.

---

## Diagnosi corretta del summary precedente (260428-m6j)

Il SUMMARY di `260428-m6j` (sezione 6, "Network/Stripe jitter") attribuiva i 16 test flaky alla "Stripe Hosted Checkout jitter / SSE warm-up". **Era una diagnosi errata.** I 16 retry erano la stessa race condition `orderNumber` di artemide, solo statisticamente meno frequenti per slug. La prova:

1. **Riproduzione curl singola di artemide → HTTP 201**: il problema non era nei dati artemide, era nel timing concorrente.
2. **Trace artemide pre-fix**: response body è `{"status":500,"unhandled":true,"message":"HTTPError"}`, generato server-side **prima** del redirect Stripe — niente a che vedere con jitter di rete su `checkout.stripe.com`.
3. **Post-fix run parametrico**: i flaky scendono da 16 a 7 e cambiano firma (timeout su `POST /api/cart`, non più 500 su `/api/checkout`). Se fosse stato Stripe jitter il numero sarebbe rimasto sui 16.

Lascio questa nota per i futuri lettori del ledger: **non rincorrere "Stripe Hosted SSE warm-up"** quando la signature è un 500 server-side prima del redirect. La root cause di quel pattern è stata `orderNumber` count+1 race, e il fix è in questo quick task.

---

## Out of scope (flaggato, NON fissato qui)

| Item | Riferimento | Owner |
|---|---|---|
| `provv` data quality (zero varianti, stock=0) | RESEARCH §4 | Quick task separato (data fix) |
| `jasmine`, `vipera`, `artemide` (parallel), `laura`, `ludovica`, `strass-1016`, `schiava-4`, `discoteca`, `nicole`, `giorgia`, `borsello-porta-telefono-stampato-cocco` — cart helper / `POST /api/cart` timeout sotto 4 worker | RESEARCH §4 + nuova evidenza in questo run | Quick task separato (cart helper bug) |
| Postgres `nextval` sequence migration (Opzione B in RESEARCH) | RESEARCH §2 Opzione B | Future hardening (prossima fase quando si tocca lo schema) |
| Cleanup ordini di test in prod DB | task_specifics constraint | User handles |
| Schema change su `orderNumber` | task_specifics constraint | Esplicitamente fuori scope |

---

## Self-Check: PASSED

- File `src/lib/orders.server.ts` modificato (retry loop): **FOUND** (commit `d219674`).
- File `src/routes/api/checkout.ts` modificato (try/catch entrambi i branch): **FOUND** (commit `2a6d082`).
- Pattern `Prisma.PrismaClientKnownRequestError` + `P2002` + `MAX_ORDER_NUMBER_ATTEMPTS`: 7 match in `orders.server.ts`.
- Pattern `createOrder threw` + `INTERNAL_ERROR` + `createLogger("checkout")`: 4 match in `checkout.ts`.
- `pnpm typecheck` su file modificati: **0 errori** (errori pre-esistenti in `src/routes/prodotti.$slug.tsx` non correlati).
- Both commits pushed to `site-gen/calzoleria-prevenzano` (origin updated `c652ac3..2a6d082`).
- Railway redeploy verificato live (logs: "Listening on http://localhost:8080/", `/api/products?perPage=1` → 200, `/api/checkout` malformed body → structured 400).
- Targeted artemide E2E: **PASS retry=0**.
- Run parametrico: 0 unhandled 500, 116/119 effective pass, 7 flaky (vs 16).
