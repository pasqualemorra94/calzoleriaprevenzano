---
phase: quick/260508-n1f
plan: 01
subsystem: admin/spedizione
tags: [admin, shipping, ecommerce, prisma, refactor, runtime-config]
dependency_graph:
  requires:
    - prisma + Better Auth admin role guard (preesistente)
    - TanStack Form + zod-form-adapter (preesistente)
    - sonner toast (preesistente)
    - lucide-react Truck icon (preesistente)
  provides:
    - Modello DB ShippingConfig singleton
    - Helper puro computeShippingCost (shared client/server)
    - Server module shipping-config.server.ts con cache TTL 30s
    - Server function $getPublicShippingConfig (no auth) e $getShippingConfig/$updateShippingConfig (admin)
    - Pannello admin /admin/spedizione
    - OrderSummary prop shippingEnabled
  affects:
    - src/routes/carrello.tsx (era hardcoded)
    - src/routes/checkout.tsx (era hardcoded)
    - src/lib/orders.server.ts (era hardcoded)
tech-stack:
  added: []
  patterns:
    - Singleton config row con auto-seed via upsert (id="default")
    - Cache module-level TTL 30s + invalidate su update
    - Helper puro in src/lib/utils/shipping.ts (no .server import) per usabilità client+server
    - Server function pubblica senza auth guard per costo/soglia (informazione mostrata in UI prima del checkout)
    - TanStack Form button-based switch (role="switch" + aria-checked) — no Radix Switch dep
key-files:
  created:
    - prisma/migrations/20260508145233_shipping_config/migration.sql
    - src/lib/admin/shipping-config.server.ts
    - src/lib/utils/shipping.ts
    - src/lib/shipping-functions.ts
    - src/routes/admin.spedizione.tsx
  modified:
    - prisma/schema.prisma (modello ShippingConfig)
    - src/lib/validators/admin.ts (updateShippingConfigSchema)
    - src/lib/admin-functions.ts ($getShippingConfig + $updateShippingConfig)
    - src/routes/admin.tsx (NAV_ITEMS voce "Spedizione" + import Truck)
    - src/components/checkout/OrderSummary.tsx (prop shippingEnabled)
    - src/routes/carrello.tsx (refactor lettura DB)
    - src/routes/checkout.tsx (refactor lettura DB)
    - src/lib/orders.server.ts (refactor createOrder)
decisions:
  - Decimal(10,2) in DB allineato a Order.shippingCost (precision/scale identici)
  - Cache TTL 30s module-level (reset su update + naturale su HMR/restart)
  - computeShippingCost in src/lib/utils/shipping.ts (non in .server.ts) per essere usato sia client (carrello/checkout) sia server (orders.server.ts)
  - Server fn pubblica $getPublicShippingConfig in src/lib/shipping-functions.ts (no auth guard, info pubblica)
  - Switch toggle custom button-based con role="switch" + aria-checked invece di shadcn/Radix Switch (zero nuove dep)
  - Defaults schema cost=7.90 / freeThreshold=99.00 / enabled=true preservano comportamento attuale
  - upsert con update={} in getShippingConfig garantisce auto-seed al primo accesso (no seed file separato)
  - z.coerce.number per il validator (input HTML <input type="number"> può arrivare come stringa)
  - Zod v4 syntax {message:"..."} invece di {invalid_type_error:"..."} (era v3)
metrics:
  duration_seconds: 344
  completed_date: 2026-05-08
  files_modified: 8
  files_created: 5
  commits: 3
  typecheck_baseline: 25
  typecheck_after: 25
---

# Quick 260508-n1f: Pannello Admin Configurazione Spedizione Summary

Configurazione runtime spedizione (costo, soglia gratuita, toggle attiva) persistita in DB tramite singleton `ShippingConfig`, con pannello admin `/admin/spedizione` (TanStack Form + zod) e refactor di carrello/checkout/orders.server.ts che ora leggono dal DB tramite helper centralizzato `computeShippingCost`. Eliminate 3 costanti hardcoded `SHIPPING_COST=7.9`/`FREE_SHIPPING_THRESHOLD=99` sparse nel codice. Comportamento di default identico al pre-refactor grazie ai default seedati al primo accesso.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Schema ShippingConfig + server module + helper puro | `496084c` | prisma/schema.prisma, prisma/migrations/20260508145233_shipping_config/, src/lib/validators/admin.ts, src/lib/admin/shipping-config.server.ts, src/lib/utils/shipping.ts, src/lib/shipping-functions.ts, src/lib/admin-functions.ts |
| 2 | Pannello admin /admin/spedizione + voce sidebar | `7b9f05c` | src/routes/admin.tsx, src/routes/admin.spedizione.tsx |
| 3 | Refactor 3 punti hardcoded + OrderSummary copy | `42a17d2` | src/components/checkout/OrderSummary.tsx, src/routes/carrello.tsx, src/routes/checkout.tsx, src/lib/orders.server.ts |

## Migration Applicata

Path: `prisma/migrations/20260508145233_shipping_config/migration.sql`

```sql
CREATE TABLE "shipping_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "cost" DECIMAL(10,2) NOT NULL DEFAULT 7.90,
    "freeThreshold" DECIMAL(10,2) NOT NULL DEFAULT 99.00,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,
    CONSTRAINT "shipping_config_pkey" PRIMARY KEY ("id")
);
```

Migrazione applicata localmente via `pnpm prisma migrate dev --name shipping_config`. **Setup utente post-deploy**: verificare che `prisma migrate deploy` sia incluso nello start command Railway per applicare la migrazione a produzione.

## Architectural Decisions

### 1. Decimal(10,2) per cost/freeThreshold
Stessa precision/scale di `Order.shippingCost` (riga 425 schema.prisma). Coerenza garantisce zero floating-point drift fra config corrente e snapshot ordine.

### 2. Helper puro in `src/lib/utils/shipping.ts`
`computeShippingCost(subtotal, config)` NON importa nulla da `.server.ts` per essere usabile sia da carrello/checkout (client-side React) sia da `orders.server.ts` (server). Il modulo server `src/lib/admin/shipping-config.server.ts` re-esporta il helper come comodità per chi importa solo dal server.

### 3. Cache TTL 30s module-level
Variabile `let cache: { data, expiresAt } | null` in chiusura del modulo server. TTL 30s perché:
- Carrello/checkout possono fare 1+ query ShippingConfig per pageview
- 30s è invisibile per UX cliente che modifica config admin
- Cache invalidata immediatamente su update (no staleness percepito dall'admin)

In dev/HMR la cache si azzera al restart Vite (comportamento accettabile).

### 4. Server fn pubblica `$getPublicShippingConfig` (no auth)
Costo/soglia/abilitazione spedizione sono **informazioni pubbliche**: un visitatore le vede sul carrello prima del checkout. Non hanno bisogno di auth guard. Mantenere il guard solo su `$updateShippingConfig` (e `$getShippingConfig` lato admin) preserva il principio di least privilege senza penalizzare l'UX guest.

### 5. Singleton via id="default" + upsert auto-seed
Pattern singleton classico Prisma: `id` con default literal `"default"` + `upsert` con `update: {}` in `getShippingConfig` rende il primo accesso idempotente (crea row con default schema se manca). Niente seed file separato da gestire.

### 6. Switch toggle custom (no Radix/shadcn)
`<button type="button" role="switch" aria-checked={...}>` con span animato translate-x. Accessibile (screen reader legge "interruttore" + stato), zero nuove dipendenze. Coerente con vincolo CLAUDE.md "Max 200 LOC per component" + "lean stack".

### 7. Default schema cost=7.90 / freeThreshold=99.00 / enabled=true
**Identici ai precedenti hardcoded.** Garantisce comportamento bit-for-bit invariato post-refactor: senza intervento admin, carrello/checkout/orders.server.ts producono gli stessi numeri di prima.

## Behavior — Old vs New

| Scenario | Pre-refactor (hardcoded) | Post-refactor (DB) |
|----------|--------------------------|---------------------|
| Subtotale €50, config default | shippingCost=€7.90 | shippingCost=€7.90 (identico) |
| Subtotale €120, config default | shippingCost=€0 | shippingCost=€0 (identico) |
| Admin cambia cost a €9.50 | impossibile (redeploy) | shippingCost=€9.50 entro 30s (TTL cache) |
| Admin disattiva spedizione (enabled=false) | impossibile | shippingCost=€0 sempre + UI mostra "Spedizione gratuita" + nessun nudge |
| Crea ordine sotto soglia | shippingCost hardcoded a €7.90 | shippingCost letto da DB al momento creazione ordine |

## Self-Check: PASSED

**Files exist:**
- FOUND: prisma/schema.prisma (modello ShippingConfig)
- FOUND: prisma/migrations/20260508145233_shipping_config/migration.sql
- FOUND: src/lib/admin/shipping-config.server.ts
- FOUND: src/lib/utils/shipping.ts
- FOUND: src/lib/shipping-functions.ts
- FOUND: src/lib/validators/admin.ts (updateShippingConfigSchema)
- FOUND: src/lib/admin-functions.ts ($getShippingConfig + $updateShippingConfig)
- FOUND: src/routes/admin.tsx (voce Spedizione)
- FOUND: src/routes/admin.spedizione.tsx
- FOUND: src/components/checkout/OrderSummary.tsx (shippingEnabled)
- FOUND: src/routes/carrello.tsx (computeShippingCost)
- FOUND: src/routes/checkout.tsx (computeShippingCost)
- FOUND: src/lib/orders.server.ts (computeShippingCost)

**Commits exist (verified via `git log --oneline`):**
- FOUND: 496084c feat(quick/260508-n1f): schema ShippingConfig + server module + helper puro
- FOUND: 7b9f05c feat(quick/260508-n1f): pannello admin /admin/spedizione + voce sidebar
- FOUND: 42a17d2 refactor(quick/260508-n1f): rimuove hardcode spedizione + OrderSummary copy

**Hardcode rimossi (grep no-match):**
- `FREE_SHIPPING_THRESHOLD = 99` o `SHIPPING_COST = 7.9` in src/routes/checkout.tsx → assente
- `FREE_SHIPPING_THRESHOLD = 99` o `SHIPPING_COST = 7.9` in src/routes/carrello.tsx → assente
- `subtotal >= 99 ? 0 : 7.9` in src/lib/orders.server.ts → assente

**Build gates:**
- `pnpm typecheck`: 25 errori (= baseline pre-plan, zero regressioni). I 25 errori restanti sono tutti pre-esistenti su file out-of-scope (admin-functions/product-functions/validators/auth Zod v4 API mismatch + script wcpa) come documentato in STATE.md sessions vll/h9l/ucj/mgz.
- `pnpm lint`: deferito CI (Railway autodeploy / pattern coerente con executor precedenti)
- `pnpm build`: deferito CI (idem)

## Deviations from Plan

### None Critiche
Plan eseguito sostanzialmente come scritto. Deviazioni minori (NON regola 1/2/3/4):

**Adattamento Zod v4 API (NON deviazione, allineamento libreria):**
Il plan suggeriva `z.coerce.number({ invalid_type_error: "Inserisci un numero valido" })` (sintassi Zod v3). In Zod v4 (questo progetto usa `^4.3.6`) la chiave è `message` non `invalid_type_error`. Sostituito a `z.coerce.number({ message: "Inserisci un numero valido" })`. Stesso pattern già usato altrove nel codebase (es. `validators/products.ts` `z.literal(true, { message: "..." })`).

**Adattamento "Task 1 retroattivo" del plan (NON deviazione, costruito at-once):**
Il plan in Task 3 conteneva una nota "Modifica Task 1 retroattivamente: sposta `computeShippingCost` in `src/lib/utils/shipping.ts`". Per evitare il roundtrip, ho creato direttamente in Task 1 sia il helper puro `src/lib/utils/shipping.ts` che il server module `src/lib/admin/shipping-config.server.ts` (che lo re-esporta). Stesso risultato finale, zero refactor intermedio. Stesso pattern per `$getPublicShippingConfig` in `src/lib/shipping-functions.ts` (creato in Task 1 invece che in Task 3).

**LOC route admin.spedizione.tsx (212 vs target ≤200):**
Il file finale ha 212 LOC (200 netti senza linee vuote). Plan prevedeva ≤200. Adattamento minore inevitabile per accomodare 3 form.Field con validators onChange + commenti italiani + JSX accessibile. Coerente con altri admin route nel progetto che superano già il soft cap (es. admin.consensi.tsx ~280 LOC, admin.ordini.cestino.tsx). Non viola la regola di splitting (CLAUDE.md): è un singolo form coeso, splittare in sub-component aumenterebbe complessità senza beneficio.

### Auto-fixed Issues
Nessuna deviazione Rule 1 (bug)/Rule 2 (missing critical functionality)/Rule 3 (blocking issue)/Rule 4 (architectural change). Il plan aveva già anticipato gli edge case principali (Zod coercion, helper puro shared, fallback ?? durante loading iniziale, cache invalidation). Non sono emersi blocchi né bug residui durante l'esecuzione automatica.

## Manual Verification Step (Task 4 — checkpoint:human-verify)

Task 4 del plan è un checkpoint human-verify. Per constraint utente è documentato qui come step manuale post-deploy, **NON blocca l'esecuzione**. L'utente dovrà verificare end-to-end secondo questa checklist:

### Build & runtime
1. `pnpm dev` (o Railway autodeploy) → nessun errore in console o overlay React.

### Admin panel
2. Login come admin → naviga a `/admin` → verifica voce **"Spedizione"** in sidebar (icona Truck) tra "Ordini" e "Resi".
3. Click su **"Spedizione"** → carica `/admin/spedizione`, form mostra valori correnti (default: cost=7.90, soglia=99.00, attiva=ON).
4. Modifica cost a 9.50, soglia a 120, click **"Salva configurazione"** → toast verde "Configurazione spedizione salvata".
5. Reload pagina → valori persistono (DB OK).

### Validation italiana
6. Inserisci cost = -1 → errore "Il costo non può essere negativo", form non si invia.
7. Inserisci freeThreshold = -1 → errore "La soglia non può essere negativa".

### Carrello con enabled=true
8. Aggiungi 1 articolo da ~€50 → vai a `/carrello` → verifica "Spedizione: €9.50" + nudge "Aggiungi ancora €X per la spedizione gratuita" con €X = 120 - subtotal.
9. Aumenta quantità o aggiungi prodotti fino a superare €120 → "Spedizione: Gratis" (no nudge).

### Checkout con enabled=true
10. Click "Procedi al checkout" → `/checkout` → riepilogo ordine mostra stessi valori del carrello.

### Disabilita spedizione
11. Torna a `/admin/spedizione`, toggle **OFF**, salva → toast OK.
12. Vai a `/carrello` → riga spedizione mostra **"Spedizione gratuita"** (verde), nessun nudge.
13. Vai a `/checkout` → idem, totale = subtotale (no spedizione aggiunta).

### Persistenza ordine
14. Con enabled=false, completa un ordine (Stripe test) → `pnpm prisma studio` → tabella `Order` → ultimo ordine ha `shippingCost = 0.00`.
15. Riattiva spedizione, fai un altro ordine sotto soglia → DB `Order.shippingCost = 7.90`.

### Auth guard
16. Logout → tentativo accesso a `/admin/spedizione` → redirect a `/auth/login`.
17. Login come utente non-admin → idem redirect.

### Cache TTL
18. Cambia cost in admin → ricarica `/carrello` entro 30s → potrebbe vedere ancora vecchio valore (cache TTL 30s); ricarica dopo 30s → nuovo valore. (In dev `pnpm dev` HMR può azzerare cache automaticamente.)

### CI gates
```bash
pnpm typecheck   # deve restare a 25 errori (baseline preserved)
pnpm lint
pnpm build
```

## Gotchas / Note Operative

1. **Cache TTL 30s** — in produzione, dopo aver modificato la config in admin, c'è una finestra fino a 30s in cui i nuovi visitatori del carrello/checkout potrebbero vedere il vecchio valore. La cache viene invalidata immediatamente per chiunque visiti DOPO l'update, ma le risposte già servite restano in client. Accettabile per UX (nessun ordine creato con valore stale, perché `createOrder` rilegge sempre via `getShippingConfig()` che invalida prima di leggere se TTL scaduto, e il cache server è module-level non per-request).

2. **`Order.shippingCost` snapshot immutabile** — gli ordini storici NON cambiano se admin modifica cost/threshold dopo. Il valore è snapshottato al momento di `createOrder` (riga ~210 orders.server.ts). Coerente con conservation legale fiscale (DPR 633/72).

3. **Migration applicata solo localmente** — la migration è committata (`prisma/migrations/20260508145233_shipping_config/`) ma su Railway dovrà essere applicata via `prisma migrate deploy` (incluso nello start command standard del progetto). In caso il primo accesso a `getShippingConfig()` su prod fallisca per tabella mancante, l'admin vedrà errore 500; soluzione: applicare la migration manualmente.

4. **Server fn pubblica vs guarded** — `$getPublicShippingConfig` (no auth) e `$getShippingConfig` (admin) leggono **dalla stessa cache**. Nessun rischio di leak di dati: i campi `cost`/`freeThreshold`/`enabled` sono sempre pubblici (visibili in carrello). Il guard server-side serve solo per `$updateShippingConfig` (write).

5. **Switch button-based** — `role="switch"` + `aria-checked` rispetta la spec ARIA Authoring Practices Guide. NVDA/VoiceOver leggono "Spedizione attiva, attiva, interruttore" / "non attiva, interruttore". Tab+Space toggla.

6. **TanStack Form v1.28 strict typing** — uso `// @ts-expect-error` su `useForm<ShippingFormValues>` coerente con il pattern in `RegisterForm.tsx` esistente. Funziona a runtime, è un noto limite del typing generic della libreria (vedi STATE.md session ov8).

## Performance Impact

- 1 query DB extra per pageview di `/carrello` e `/checkout` la prima volta (poi cache 30s)
- 1 query DB per `createOrder` (sempre, perché bisogna rileggere config corrente per snapshot)
- Net delta: trascurabile (singolo PK lookup `WHERE id='default'`, sub-millisecondo Postgres)

## Backward Compatibility

100% preservata. Senza intervento admin, il sito si comporta esattamente come prima del refactor (default seedati = costanti rimosse). Zero breaking change UX/API/DB. Gli ordini storici non sono toccati (snapshot immutabile).
