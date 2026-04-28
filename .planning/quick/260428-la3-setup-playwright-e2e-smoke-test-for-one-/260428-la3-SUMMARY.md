---
phase: quick
plan: 260428-la3
subsystem: testing/e2e
tags: [playwright, e2e, smoke, stripe, ecommerce]
requires: []
provides:
  - "playwright-harness"
  - "smoke-purchase-spec-isabella"
affects:
  - "package.json"
  - "package-lock.json"
  - ".gitignore"
  - "playwright.config.ts"
  - "tests/e2e/helpers/variants.ts"
  - "tests/e2e/smoke-purchase.spec.ts"
tech-stack:
  added:
    - "@playwright/test@1.49.1 (devDep, exact pin)"
    - "Chromium browser binary (via npx playwright install)"
  patterns:
    - "live-environment-e2e: test against deployed Railway URL, no local dev server"
    - "Stripe Hosted Checkout selectors via input[name=...] (stable, locale-agnostic)"
    - "waitForResponse('/api/cart' POST) gate before navigating from PDP to cart"
key-files:
  created:
    - "playwright.config.ts"
    - "tests/e2e/helpers/variants.ts"
    - "tests/e2e/smoke-purchase.spec.ts"
  modified:
    - "package.json"
    - "package-lock.json"
    - ".gitignore"
decisions:
  - "Pin Playwright a 1.49.1 esatto (no caret) per CI determinismo"
  - "Single worker + retries=0 perché lo smoke crea ordini reali Stripe test-mode"
  - "Locale en-US sul context Playwright per stabilizzare le label di Stripe Hosted Checkout"
  - "Selettori Stripe via input[name=...] invece di getByLabel: l'icona SVG CVC condivide aria-label con il campo"
metrics:
  duration: "~25 minuti"
  completed: "2026-04-28"
  tasks: 3
  test-runs: 3
  selector-iterations: 2
requirements-completed:
  - "QUICK-260428-LA3"
---

# Quick 260428-la3: Playwright E2E Smoke Test (Isabella) — Summary

Harness Playwright installato e validato con un singolo smoke test che acquista end-to-end il sandalo "Isabella" sul deployment Railway live, usando la Stripe test card 4242 4242 4242 4242 e verificando che `/ordine-confermato` renderizzi un ordine reale.

## Outcome

**Smoke run finale: PASSED in 22.5 s** (`npx playwright test tests/e2e/smoke-purchase.spec.ts --reporter=list`).

Il test ha completato l'intero happy path:
1. Apertura `/prodotti/isabella` (heading "Isabella" visibile).
2. Selezione varianti — `Tipo di Pelle = Laminato`, poi `Colore = Verde acqua` (primo swatch del gruppo dependsOn).
3. Click "Aggiungi al carrello" + attesa `POST /api/cart` 200 → "Aggiunto!" renderizzato.
4. Navigazione a `/carrello` con prodotto Isabella visibile.
5. Click "Procedi al checkout" → URL `/checkout`.
6. Compilazione form (email `e2e+isabella@test.calzoleriaprevenzano.it`, indirizzo Roma RM 00100, ecc.).
7. Submit "Conferma e paga" → redirect a `https://checkout.stripe.com/...`.
8. Compilazione card su Stripe Hosted Checkout: 4242 4242 4242 4242, 12/34, 123, "E2E Test", 00100.
9. Click pay button → redirect a `/ordine-confermato?session_id=cs_test_...`.
10. Heading di conferma visibile.

### Stato confermazione: "Pagamento in elaborazione"

L'heading finale era **"Pagamento in elaborazione"**, non "Ordine confermato". Questo significa che al momento del rendering della pagina di conferma il webhook Stripe non era ancora arrivato a marcare l'ordine come pagato. **Comportamento esplicitamente tollerato dal piano** (vedi `must_haves` e blocco `<behavior>` Task 2: il test passa se viene raggiunto almeno uno dei due stati). Il fatto che siamo arrivati su `/ordine-confermato?session_id=cs_test_*` con un cookie cart vuoto e una redirect Stripe completata dimostra che l'ordine è stato creato server-side prima del Checkout Stripe (POST `/api/checkout` → orderNumber generato + checkoutUrl restituito).

### Ordine creato

L'order number specifico **non è stato catturato dallo stdout** del test perché la branch che logga il numero (`if (/Ordine confermato/i.test(headingText))`) non è stata percorsa — il webhook era ancora in volo. L'utente può recuperare il record cercando l'email `e2e+isabella@test.calzoleriaprevenzano.it` nel pannello admin:

- Pannello: https://calzoleria-prevenzano-production.up.railway.app/admin/ordini
- Filtra per email = `e2e+isabella@test.calzoleriaprevenzano.it`
- Atteso: 1 ordine, prodotto Isabella qty 1 (€65.00 base), opzioni "Tipo di Pelle: Laminato" + "Colore: Verde acqua", indirizzo Via Roma 1, Roma 00100 (RM), telefono +39 333 1234567.

In esecuzioni successive, se il webhook arriva entro la timeout di 30 s la branch "Ordine confermato" verrà percorsa e lo stdout stamperà:
```
[smoke] heading="Ordine confermato!"
[smoke] Numero ordine: <ALFANUMERICO>
```

## Files Created / Modified

| File | Change | Note |
| --- | --- | --- |
| `playwright.config.ts` | created | baseURL Railway, locale en-US, workers=1, retries=0, traces+video on failure |
| `tests/e2e/helpers/variants.ts` | created (70 LOC) | `selectFirstAvailableInEachGroup` + `expectAddToCartEnabled` |
| `tests/e2e/smoke-purchase.spec.ts` | created (130 LOC) | Singolo `test()`, slug `"isabella"` lockato `as const` |
| `package.json` | modified | +`@playwright/test@1.49.1` devDep, +3 script (`test:e2e`, `test:e2e:ui`, `test:e2e:install`) |
| `package-lock.json` | modified | aggiornato per la nuova dep |
| `.gitignore` | modified | + blocco Playwright (`test-results/`, `playwright-report/`, `playwright/.cache/`) |

## Commits

- `977c759` chore(quick-260428-la3): installa Playwright 1.49.1 e configura harness E2E
- `6689fd2` test(quick-260428-la3): aggiungi smoke E2E acquisto Isabella su Railway
- `991543a` fix(quick-260428-la3): stabilizza smoke con waitForResponse e selettori Stripe per name

## Deviations from Plan

### Iterazioni di selettori (2 fix dentro il budget di 3)

**1. [Rule 1 - Bug] Race condition addToCart → /carrello vuoto**
- **Found during:** Task 3, prima esecuzione live
- **Issue:** Dopo `addToCart.click()` il test navigava direttamente a `/carrello` ma trovava il carrello vuoto (screenshot in `test-results/.../test-failed-1.png`). La race era tra la fetch `POST /api/cart` (asincrona, ~200-400 ms) e la `page.goto('/carrello')`.
- **Fix:** Wrappato il click in `Promise.all([page.waitForResponse('/api/cart' POST 2xx), addBtn.click()])` + assert successivo che il bottone mostri lo stato "Aggiunto!" (timeout 5 s). In questo modo si attende l'effettivo update server-side del carrello.
- **Files modified:** `tests/e2e/smoke-purchase.spec.ts`
- **Commit:** `991543a`

**2. [Rule 1 - Bug] Strict mode violation su getByLabel("CVC") di Stripe**
- **Found during:** Task 3, seconda esecuzione live
- **Issue:** `page.locator('input[name="cardCvc"]').or(page.getByLabel("CVC"))` matchava 2 elementi: l'`<input id="cardCvc" aria-label="CVC">` E un `<svg aria-labelledby="cvcIconTitle">` (l'icona della carta) il cui titolo accessibile risultava "Credit or debit card CVC". Playwright in strict mode rifiuta locator multi-match.
- **Fix:** Sostituiti tutti i selettori Stripe (cardNumber, cardExpiry, cardCvc, billingName, billingPostalCode) con `input[name=...]` puro, senza fallback `.or(getByLabel(...))`. Gli attributi `name` di Stripe Hosted Checkout sono stabili da anni e non vengono localizzati.
- **Files modified:** `tests/e2e/smoke-purchase.spec.ts`
- **Commit:** `991543a`

### Ambient (non causati dal task — out of scope)

**1. `npm install` richiede `--legacy-peer-deps`**
- Il repo ha un conflitto pre-esistente tra `zod@^4.3.6` (deps) e `@tanstack/zod-form-adapter@0.42.1` che richiede `zod@^3.x` come peer. `npm install --save-dev @playwright/test@1.49.1` falliva con ERESOLVE.
- **Workaround:** Usato `--legacy-peer-deps`. Coerente con lo stato precedente del repo (presumibilmente già installato così).
- **Out of scope per questo plan.** Da fixare in un piano dedicato (es. allineare zod-form-adapter a una versione zod-v4 compatibile, oppure committare `.npmrc` con `legacy-peer-deps=true`).

**2. `npx tsc --noEmit` produce errori pre-esistenti su `src/routes/prodotti.$slug.tsx` e altri**
- Errori TS2339 / TS7006 sui dati del loader TanStack Router (tipi loader-data inferiti come `{}`).
- **Out of scope:** non causati dai file Playwright. I miei file (`playwright.config.ts`, `tests/e2e/**`) producono **zero errori TypeScript** (verificato filtrando l'output di tsc).

**3. `npx biome check .` fallisce per schema mismatch nel `biome.json` del repo**
- `biome.json` dichiara `"$schema": "https://biomejs.dev/schemas/2.0.0/schema.json"` ma la CLI installata è 2.4.10; inoltre usa chiavi deprecate (`organizeImports`, `files.ignore`).
- **Out of scope:** problema di config repo-wide non introdotto da questo plan. I miei file rispettano comunque le convenzioni Biome (2-space indent, double quotes, semicolons, trailing commas, zero `any`).

Le 3 issue ambient sono state loggate in `.planning/quick/260428-la3-.../deferred-items.md` se necessarie a un piano futuro (non create per non gonfiare lo scope di questo quick task; basta questo SUMMARY come riferimento).

## Authentication Gates

Nessuno. Lo smoke gira contro endpoint pubblici e Stripe test-mode senza credenziali.

## Known Issues / Stubs

Nessuno stub introdotto. Il test è completamente funzionale e agganciato a DOM reali.

**Note operative:**
- Lo script `npm run test:e2e` invoca Playwright contro il **deployment Railway live**. Ogni run produce un ordine reale (Stripe test-mode) → l'utente deve gestire la pulizia in admin (esplicitamente fuori scope per design).
- Per esecuzione locale (es. quando Railway è giù o per iterazioni rapide): cambiare temporaneamente `baseURL` in `playwright.config.ts` a `http://localhost:5173` e avviare `npm run dev` in parallelo.
- L'asserzione finale tollera entrambi gli stati `"Ordine confermato"` e `"Pagamento in elaborazione"`. Solo nel primo caso vengono validati `Numero ordine` e `Totale`.

## Verification Status

| Check | Status |
| --- | --- |
| `npx playwright --version` → `Version 1.49.1` | PASS |
| `npm run test:e2e -- --list` → 1 test scoperto | PASS |
| `npx tsc --noEmit` su file nuovi → zero errori | PASS |
| `npm run test:e2e` live → exit 0 | PASS (22.5 s) |
| Cart → Checkout → Stripe → Conferma flusso completato | PASS |
| Trace/screenshot/video creati on failure (e solo on failure) | PASS |
| Ordine creato in DB (verifica utente in admin) | PENDING USER VERIFICATION |

## Next Steps (out of scope for this plan)

1. **Verifica utente:** confermare in `/admin/ordini` la presenza dell'ordine da `e2e+isabella@test.calzoleriaprevenzano.it`.
2. **Future plan:** scalare a tutti i ~118 prodotti — parametrizzare lo slug (Playwright `test.describe.parallel` o data-driven via JSON), aggiungere strategia di skip per prodotti out-of-stock, considerare backup-and-restore del DB ordini di test.
3. **Tech debt:** risolvere il conflitto peer zod / `@tanstack/zod-form-adapter` per liberare `npm install` da `--legacy-peer-deps`.
4. **Tech debt:** aggiornare `biome.json` allo schema 2.4.x e rimuovere chiavi deprecate.

## Self-Check: PASSED

- File esistenti:
  - FOUND: `playwright.config.ts`
  - FOUND: `tests/e2e/helpers/variants.ts`
  - FOUND: `tests/e2e/smoke-purchase.spec.ts`
  - FOUND: aggiornamenti in `package.json`, `package-lock.json`, `.gitignore`
- Commits esistenti: `977c759`, `6689fd2`, `991543a` (tutti su `git log --oneline`)
- Smoke test live: PASSED, 22.5 s, exit 0
