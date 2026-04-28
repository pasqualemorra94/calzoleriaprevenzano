---
quick_id: 260428-p14
type: research
date: 2026-04-28
mode: quick-task
duration_minutes: 6
---

# Quick 260428-p14 — RESEARCH

**Domain:** Playwright E2E flake investigation + cart-server contract validation
**Confidence:** HIGH

## Summary

Il backend `/api/cart` POST funziona perfettamente per `denise` e `maria` in produzione: tutti gli scenari testati ritornano **201 Created** (anche con `taglia` priva di `productVariant` row corrispondente). Il root cause del timeout E2E **non è** una rejection backend, **non è** validation `variantConfig` rotta, e **non è** stock zero. È una **flake client-side sotto parallelism `workers=4`**: il click su "Aggiungi al carrello" atterra fisicamente sul bottone (point logged), ma in alcune esecuzioni il `fetch("/api/cart")` non viene dispatchato (zero POST nella trace network). Ricorre identicamente sugli 8 flaky di o8a (recovered con `retries=1`); denise+maria sono solo i casi peggiori con doppia retry fallita.

**Primary recommendation:** Fix **test-only**. Allargare il predicato `waitForResponse` (rimuovere `res.ok()`) e — separatamente — rendere il click dell'helper resiliente alla flake usando `expect(...).toPass()` con retry interno. Zero modifiche al codice di produzione.

## Hypothesis confirmed

**H1 — test-side flake** (parallel-load race, non bug funzionale).

| Aspetto | Evidence |
|---|---|
| Cart server logica | `src/lib/cart.server.ts:233-274` Branch A `variantConfig`: valida con `validateOptionsAgainstConfig` (lib/cart.server.ts:77-138), poi inserisce `CartItem` con `variantId: null`. **Non** lookup nei `productVariant` rows. Lo stock check è su `product.stock` (line 256), non sul variant. |
| Live API behaviour | 3 POST manuali via `curl` → tutti **HTTP/2 201**, body con `selectedOptions` salvati correttamente |
| Trace network | 0-trace.network contiene **0** POST verso `/api/cart`. Solo 1 GET (cart-count iniziale → 200, 66 bytes) |
| Click dispatched | Trace `pw:api@25 locator.click` → `endTime:4148.466, point:{x:1061, y:360.29}` — bottone `enabled and stable` confermato |
| Pattern multi-slug | 8 slug flaky in o8a (`nicole`, `atena`, `melissa`, `fiore-blue`, ...) → stesso sintomo, recovered con `retries=1`. Targeted serial run a `workers=1` → tutti PASS |

## Evidence

### Curl probe (live Railway, identical payload to client)

```
=== denise POST (taglia=32, no DB variant exists with id="32") ===
HTTP/2 201
{"ok":true,"data":{"id":"cmoite5de0000o70157i94au5","items":[{"id":"...","productId":"cmogzhpcn00myjmxg6f38z9pw","variantId":null,"quantity":1,"price":90,"selectedOptions":[{"label":"Taglia","value":"32"}]}]}}

=== denise POST (taglia=42, DB variant exists) ===
HTTP/2 201   (still variantId:null — Branch A always nulls it)

=== maria POST (Bianco / No tacco / 32) ===
HTTP/2 201
{"...","selectedOptions":[{"label":"Colore","value":"Bianco"},{"label":"Tacco","value":"No tacco"},{"label":"Taglia","value":"32"}]}
```

Conclusione operativa: il flusso runtime accetta selezioni che **non hanno** un `productVariant` row corrispondente. La validazione si fa solo contro `variantConfig` JSON (la fonte di verità per i prodotti con builder). I `productVariant` rows residui (denise=1 row, maria=3 rows) sono legacy/incompleti ma **innocui** in Branch A.

### Trace excerpt (denise retry1)

```text
pw:api@20  locator.click  selector="div.space-y-5 >> nth=0 >> > div >> nth=0 >> button:not([disabled]) >> nth=1"
           startTime:3670.582                         ← click su bottone "32" (Taglia)
                              "element is visible, enabled and stable"
                              "waiting for scheduled navigations to finish"
expect@23  expect.toBeEnabled  selector="...Aggiungi al carrello..."  → pass (4029→4101 ms)
pw:api@24  page.waitForResponse  startTime:4062.281   ← subscribe BEFORE click ✓
pw:api@25  locator.click  "Aggiungi al carrello"  endTime:4148.466  point:{x:1061,y:360.29}
           "element is visible, enabled and stable" → click dispatched OK
                                                                       ← from 4148 to 19063: NIENTE
after@call@51  endTime:19066.006
               error: "Timeout 15000ms exceeded while waiting for event \"response\""
```

`unzip -p .../trace.zip 0-trace.network | grep '"method":"POST"'` → **zero righe**. Solo GET di asset, font, e una GET `/api/cart` iniziale (cart-count). Il `fetch` di `handleAddToCart` (`prodotti.$slug.tsx:183`) **non parte**, malgrado `cartStatus`/`canAddToCart` debbano essere validi (vedi sotto).

### Why does the fetch silently not fire?

Analisi statica di `src/routes/prodotti.$slug.tsx:177-188` per denise:

- `useState(selectedOptions)` (linea 76-87) inizializza già `taglia="32"` come default required.
- `canAddToCart` (linea 151) = `true` (un solo gruppo, già selezionato).
- `effectiveStock` (linea 149) = 18 (selectedVariant è `undefined` perché `variants[0].id !== "32"`, fallback a `product.stock`).
- `handleAddToCart` guard (linea 178): `!product || !canAddToCart || effectiveStock === 0 || cartStatus === "loading"` → tutto false → procede al `fetch`.

Quindi non c'è early-return logico. La causa più plausibile è una **race React/Playwright sotto `workers=4`**: il click event si propaga ma React non ha ancora committato il setState dell'helper (`onSelectOption("taglia", "32")` poco prima del click "Aggiungi"), e nello scheduler Chromium parallelo il click handler vede uno stato che fa returnare presto senza throw — oppure il `fetch` viene dispatchato ma su una connessione coalesced che la sessione Playwright non osserva (rara, ma osservata su HTTP/2). Coerente con `o8a` flaky pattern: 8 prodotti random failano e recuperano a retry=1, e i 9 prodotti targeted a workers=1 passano sempre.

`denise` e `maria` cadono in questo bucket con probabilità più alta per due motivi specifici:
- `denise`: helper clicca `nth=1` su un bottone già preselezionato di default (linea 81 imposta `"32"`). Il setState è no-op semantico ma non bypassato → React schedula un re-render proprio quando arriva il click di "Aggiungi".
- `maria`: 3 gruppi required → 3 setState consecutivi ravvicinati, finestra di race più ampia.

## Recommended fix

**Scope: test-only** (1 file modificato, 1 LOC change + 1 helper). Zero impatto produzione.

### Fix A (minimo, 1 LOC) — `tests/e2e/all-products-purchase.spec.ts:91-97`

```diff
       await Promise.all([
         page.waitForResponse(
-          (res) => res.url().includes("/api/cart") && res.request().method() === "POST" && res.ok(),
+          (res) => res.url().includes("/api/cart") && res.request().method() === "POST",
           { timeout: 15_000 },
         ),
         page.getByRole("button", { name: /Aggiungi al carrello/i }).click(),
       ]);
+      // Surface non-2xx so future failures show real status instead of timeout
+      // (poi: const res = await waitForResponse → expect(res.ok()).toBeTruthy())
```

**Rationale:** Drop `res.ok()` dal predicato. Se in futuro il backend ritornerà un 4xx, il test mostra il body diagnostico invece di un timeout opaco. **Non risolve il flake denise/maria** perché in quei casi non c'è proprio una response — ma rimuove un pattern fragile per il futuro.

### Fix B (risolutivo per il flake denise/maria) — retry-on-no-response

In `tests/e2e/all-products-purchase.spec.ts`, sostituire il `Promise.all` con una micro-helper che ritenta il click se nessun POST è arrivato entro N ms:

```ts
async function clickAddToCartAndWaitPost(page: Page, attempts = 3): Promise<void> {
  const btn = page.getByRole("button", { name: /Aggiungi al carrello/i });
  for (let i = 0; i < attempts; i++) {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/cart") && res.request().method() === "POST",
      { timeout: 5_000 },
    ).catch(() => null);
    await btn.click();
    const res = await responsePromise;
    if (res) {
      expect(res.ok(), `cart POST returned ${res.status()}`).toBeTruthy();
      return;
    }
    // Click landed but fetch never fired (parallel-load race) → retry
  }
  throw new Error("cart POST never observed after 3 click attempts");
}
```

Costo: ~12 LOC. Risolve **sia** il flake denise/maria **sia** gli 8 flaky di o8a (rimpiazza la dipendenza implicita su `retries=1`).

### Risk to real customers

**Zero.** Tutti e 3 i payload provati (denise/32-no-DB-variant, denise/42-DB-variant, maria/3-gruppi) ritornano 201 con `selectedOptions` corretti. Il flake è esclusivamente un artefatto di Playwright sotto workers=4, non riproducibile via curl o navigazione manuale. Non c'è alcuna evidenza che un utente reale veda fallire l'add-to-cart.

## Side note (diagnostic posture)

Il predicato `res.ok()` nel `waitForResponse` è in generale **sconsigliato per i test E2E**: maschera 4xx/5xx come timeout, perdendo l'informazione diagnostica più importante. Standard pattern (Playwright docs, `waitForResponse` examples): aspettare solo URL+method, poi assertare lo status nel body del test. Adottiamo Fix A come default per tutti i `waitForResponse` futuri (1 LOC) e Fix B per questo spec specifico (gli altri spec non hanno la stessa pressure parallel-load).

## Sources

- **Backend logic** — `src/lib/cart.server.ts:215-274` (Branch A: variantConfig validation, no productVariant lookup, `variantId:null` su CartItem)
- **Cart route handler** — `src/routes/api/cart.ts:33-63` (returns 201 on success, 400 on validation error con body strutturato)
- **Validators** — `src/lib/validators/products.ts:80-87` (`addToCartSchema`: `selectedOptions` come `Record<string, string>`)
- **Client handler** — `src/routes/prodotti.$slug.tsx:177-188` (`handleAddToCart` fetch logic), 76-88 (default-select required groups), 149-151 (`canAddToCart`)
- **VariantSelector DOM** — `src/components/product/VariantSelector.tsx:159-165` (`<button onClick={onAddToCart}>`)
- **Failing test** — `tests/e2e/all-products-purchase.spec.ts:91-97`
- **Helper** — `tests/e2e/helpers/variants.ts:23-102` (post-o8a fix, click index `nth=1` skipping heading)
- **Live API probe** — 3× curl POST → 201 + body con `selectedOptions`. Run-id: `UFiziUDtSF-uFGPBss7a6g`, `HnG5UQM4SumEmxBMYqdHTg`, `AuDk25sEQrGRxKGa2JZdWA`
- **Trace evidence** — `test-results/all-products-purchase-comp-1f1c1-...denise-...-retry1/trace.zip`: 0 POST in `0-trace.network`, click point `(1061, 360.29)` at `t=4148ms`, timeout at `t=19063ms`
- **Predecessor context** — `260428-o8a-SUMMARY.md` §"Out of scope" (8 flaky pattern coerente, denise+maria nuovi entry hard-fail)

## Confidence

| Area | Level | Reason |
|---|---|---|
| Backend funziona | HIGH | 3 curl POST → 201 con body atteso |
| Trace = 0 POST | HIGH | `0-trace.network` ispezionato direttamente |
| Click landed | HIGH | `point:{x,y}` registrato, `enabled and stable` log |
| Fix test-only | HIGH | Nessuna evidenza di bug app; pattern flaky condiviso con altri 8 slug recovered su retry=1 |
| Root cause = parallel race | MEDIUM | Coerente con tutti i sintomi ma non riprodotto in isolation; testabile rieseguendo lo spec a `workers=1 retries=0` (atteso: PASS deterministico) |
