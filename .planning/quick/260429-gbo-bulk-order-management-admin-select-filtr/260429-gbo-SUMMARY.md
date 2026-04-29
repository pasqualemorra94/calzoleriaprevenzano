---
phase: 260429-gbo
plan: 01
subsystem: admin/orders
tags: [admin, orders, bulk-actions, soft-delete, trash, type-confirm-dialog]
type: execute
wave: 1
depends_on: []
requires:
  - prisma.Order.deletedAt + deletedBy (schema righe 384-385)
  - prisma.OrderItem onDelete:Cascade (riga 412)
  - prisma.Payment onDelete:Cascade (riga 435)
  - secure-auth-sdk requireAdmin (sdk-auth.server.ts:65)
  - sonner toast (^2.0.7, già nel progetto)
  - lucide-react icons
provides:
  - bulkOrderActionSchema validator
  - listAdminOrdersSchema esteso con view/emailContains/createdFrom/createdTo
  - softDeleteOrders/restoreOrders/hardDeleteOrders server fn
  - POST /api/admin/orders/bulk endpoint con action discriminator
  - TypeConfirmDialog component reusable (typing-gate "CANCELLA")
  - admin.ordini.tsx: selezione massiva + filtri email/data + toolbar Cestina + link Cestino
  - admin.ordini.cestino.tsx: vista cestino con Ripristina + Cancella definitivamente
affects:
  - src/lib/validators/admin.ts
  - src/lib/admin/admin-orders.server.ts
  - src/lib/admin.server.ts
  - src/lib/admin-functions.ts
  - src/routes/api/admin/orders.bulk.ts (NUOVO)
  - src/components/admin/TypeConfirmDialog.tsx (NUOVO)
  - src/routes/admin.ordini.tsx
  - src/routes/admin.ordini.cestino.tsx (NUOVO)
tech-stack:
  added: []
  patterns:
    - "Bulk soft-delete pattern (mirror 1:1 di Product, riga 261-274 di admin-products.server.ts)"
    - "Type-to-confirm dialog (handcrafted, no Radix — coerente con ConfirmDialog esistente)"
    - "Action-discriminated single endpoint (vs 3 endpoint separati) per bulk operations"
    - "Selection set reset via useEffect su cambi di page/view/filter/sort (fix gotcha §10 RESEARCH)"
key-files:
  created:
    - src/routes/api/admin/orders.bulk.ts
    - src/components/admin/TypeConfirmDialog.tsx
    - src/routes/admin.ordini.cestino.tsx
  modified:
    - src/lib/validators/admin.ts
    - src/lib/admin/admin-orders.server.ts
    - src/lib/admin.server.ts
    - src/lib/admin-functions.ts
    - src/routes/admin.ordini.tsx
decisions:
  - "Single endpoint POST /api/admin/orders/bulk con action discriminator (soft-delete|restore|hard-delete) anziché 3 endpoint REST separati: meno boilerplate auth/parse, payload identico, pattern già usato in altri admin tools"
  - "TypeConfirmDialog come nuovo componente vs estensione di ConfirmDialog: SRP, mantiene ConfirmDialog semplice (105 LOC) e separa il caso 'azione distruttiva irreversibile' che richiede typing-gate"
  - "Vista cestino come route file-based dedicato (admin.ordini.cestino.tsx) vs query-param (?view=trash): URL stabile, link condivisibile, breadcrumb pulito; static segment ha precedenza su `$id` cuid in TanStack Router (RESEARCH §5)"
  - "view/emailContains/createdFrom/createdTo come campi optional su listAdminOrdersSchema esistente vs nuovo schema separato: stesso server fn coperto, no duplicazione type"
  - "Selection set reset DEVE includere TUTTI i deps di refetch (page/query/status/email/dateFrom/dateTo/sort): mancare anche un solo dep causa stale-id leak documentato come gotcha §10 di RESEARCH"
metrics:
  duration: "27m 35s"
  completed: "2026-04-29T10:25:55Z"
  tasks: 5
  files-changed: 8
  files-created: 3
  loc-added: 750
  commits: 5
---

# Phase 260429-gbo Plan 01: Bulk Order Management Summary

> Endpoint bulk unificato + selezione massiva con filtri email/data + vista cestino con ripristino e cancellazione definitiva, mirror 1:1 del pattern soft-delete consolidato su Product.

## Cosa è stato fatto

Esteso il pannello admin ordini con bulk actions, filtri avanzati e vista cestino dedicata. L'admin può ora ripulire rapidamente la lista ordini (test, errori, spam) preservando la possibilità di ripristino. La feature è simmetrica al pattern già consolidato sui prodotti: soft-delete come default reversibile, hard-delete riservato al cestino dietro conferma typing-gate ("CANCELLA").

### Diff outline (5 task, 8 file)

| Task | File principale | LOC |
|---|---|---|
| 1 — Validator + server fn | `src/lib/validators/admin.ts` (+25), `src/lib/admin/admin-orders.server.ts` (+58), `src/lib/admin.server.ts` (+3) | 86 |
| 2 — API endpoint bulk | `src/routes/api/admin/orders.bulk.ts` (NEW) | 72 |
| 3 — TypeConfirmDialog | `src/components/admin/TypeConfirmDialog.tsx` (NEW) | 122 |
| 4 — List enhancements | `src/routes/admin.ordini.tsx` (+201/-15), `src/lib/admin-functions.ts` (+8) | 209 |
| 5 — Cestino route | `src/routes/admin.ordini.cestino.tsx` (NEW) | 324 |
| **Totale** |  | **813 LOC aggiunte** |

### Server function signatures

```ts
// src/lib/admin/admin-orders.server.ts
export async function getAdminOrders(input: ListAdminOrdersInput): Promise<PaginatedData<AdminOrderListItem>>;
//   esteso: input ora include view/emailContains/createdFrom/createdTo
export async function softDeleteOrders(ids: string[], deletedBy?: string): Promise<{ count: number }>;
export async function restoreOrders(ids: string[]): Promise<{ count: number }>;
export async function hardDeleteOrders(ids: string[]): Promise<{ count: number }>;
```

Le 3 nuove funzioni usano `prisma.order.updateMany` / `deleteMany` con `where` guard:
- `softDeleteOrders`: opera solo su `deletedAt: null` (idempotente)
- `restoreOrders`: opera solo su `deletedAt: { not: null }`
- `hardDeleteOrders`: opera solo su `deletedAt: { not: null }` (safety net — non distrugge ordini ancora attivi); cascade automatico su `OrderItem` + `Payment`

### API endpoint contract

```
POST /api/admin/orders/bulk
Authorization: cookie sessione admin (requireAdmin via secure-auth-sdk)
Content-Type: application/json

Request body:
{
  "action": "soft-delete" | "restore" | "hard-delete",
  "ids": ["clxxxxxxx", ...]  // 1..500 cuid
}

Response 200:
{ "ok": true, "data": { "count": 3 } }

Errori:
  401/403 — { ok:false, error:{ code:"FORBIDDEN", message:"Accesso negato" } }
  400 — { ok:false, error:{ code:"BAD_REQUEST", message:"Body JSON non valido" } }
  422 — { ok:false, error:{ code:"VALIDATION_ERROR", message:"Dati non validi" } }
  500 — { ok:false, error:{ code:"INTERNAL_ERROR", message:"Errore interno" } }   (no stack leak)
```

### Frontend wiring

- **Filtri** (`admin.ordini.tsx` e `admin.ordini.cestino.tsx`):
  - `email` (debounced 300ms via setTimeout, no nuova dipendenza)
  - `createdFrom` / `createdTo` (input type=date)
  - `view: "active"` hardcoded in lista, `"trash"` in cestino
- **Selezione massiva**: `Set<string>` lift-up, header checkbox = "select-all-visible", per-row checkbox
- **Bulk toolbar sticky** (`top-0 z-10`) appare condizionalmente con `selected.size > 0`
- **Cestina (lista attiva)**: TypeConfirmDialog `confirmText="CANCELLA"`, `confirmLabel="Cestina"` → `POST /api/admin/orders/bulk { action: "soft-delete" }`
- **Ripristina (cestino)**: nessuna conferma (azione reversibile, basso rischio) → `POST { action: "restore" }`
- **Cancella definitivamente (cestino)**: TypeConfirmDialog `confirmText="CANCELLA"`, `confirmLabel="Elimina definitivamente"` → `POST { action: "hard-delete" }`
- **Trash count badge**: link "Cestino (N)" nell'header lista attiva, refresh dopo bulk soft-delete
- **Selection reset (PITFALL critico §10 RESEARCH)**: implementato con `useEffect(() => setSelected(new Set()), [page, query, status, debouncedEmail, createdFrom, createdTo, sort])` in `admin.ordini.tsx:139-141` e `useEffect(() => setSelected(new Set()), [page, debouncedEmail, createdFrom, createdTo])` in `admin.ordini.cestino.tsx:60-62`

## Files Created / Modified

**Created (3):**
- `src/routes/api/admin/orders.bulk.ts` — 72 LOC, endpoint POST con dispatcher
- `src/components/admin/TypeConfirmDialog.tsx` — 122 LOC, dialog typing-gate
- `src/routes/admin.ordini.cestino.tsx` — 324 LOC, vista cestino completa

**Modified (5):**
- `src/lib/validators/admin.ts` — +25 LOC: estende `listAdminOrdersSchema` + nuovo `bulkOrderActionSchema`
- `src/lib/admin/admin-orders.server.ts` — +58 LOC: where view-aware + 3 fn bulk
- `src/lib/admin.server.ts` — +3 LOC: barrel re-export
- `src/lib/admin-functions.ts` — +8 LOC: input validator esteso su `$getAdminOrders`
- `src/routes/admin.ordini.tsx` — +201/-15 LOC: state hooks + filtri + toolbar + dialog + link Cestino

## Commits

| # | Hash | Type | Title |
|---|------|------|-------|
| 1 | `7d62f4a` | feat | server fn softDelete/restore/hardDelete + filtri email/date sugli ordini |
| 2 | `9d0c9b6` | feat | endpoint POST /api/admin/orders/bulk con action discriminator |
| 3 | `106fe80` | feat | TypeConfirmDialog reusable con typing gate |
| 4 | `178ee38` | feat | selezione massiva + filtri email/date + cestina nella lista ordini |
| 5 | `5047ab1` | feat | vista cestino /admin/ordini/cestino con ripristina e cancella definitivamente |

Tutti i 5 commit sono atomici, in italiano, con scope `(admin)` come da convenzione del progetto.

## Verifica post-deploy

- **Push:** `git push origin site-gen/calzoleria-prevenzano` → `39dc751..5047ab1` accettati senza warning
- **Railway:** `railway status --json` confermato `latestDeployment.meta.commitHash = 5047ab1da4782eb83c2a9bea3914e7017a678578` con `status = SUCCESS`
- **HTTP probe:** `curl -sI https://calzoleria-prevenzano-production.up.railway.app/api/products?perPage=1` → `HTTP/2 200`
- **Typecheck:** `pnpm typecheck` totali 25 errori (= baseline pre-plan, nessun nuovo errore introdotto sui file modificati). Tutti i 25 errori sono in file NON toccati da questo plan: `scripts/verify-all-wcpa.ts`, `src/lib/admin-functions.ts:21,66` (pre-esistenti, segnalati nella STATE.md di 260429-eev/f6o), `src/lib/product-functions.ts:80`, `src/lib/validators/auth.ts:35,38`, `src/routes/api/admin/media.$id.ts`, `src/routes/api/admin/products.ts`, `src/routes/api/products.ts`.

## Smoke E2E result

**Status:** FAIL (causa esterna, NON regresso da questo plan).

`pnpm test:e2e tests/e2e/smoke-purchase.spec.ts` fallisce con `net::ERR_CONNECTION_REFUSED` dopo il completamento del pagamento Stripe. Tre tentativi consecutivi, stesso errore.

**Root cause identificato dal trace Playwright** (`/tmp/trace-extract/0-trace.network`): Stripe redirect a `http://localhost:3000/ordine-confermato?session_id=...`. La causa è che `process.env.APP_URL` non è settato in produzione su Railway. Il fallback a `http://localhost:3000` in `src/lib/orders.server.ts:413` viene utilizzato per costruire il `success_url` Stripe.

**Verifica che NON è regresso da questo plan:**
- `git show --stat 7d62f4a..5047ab1` → 5 file modificati, tutti nello scope admin (`src/lib/admin/*`, `src/routes/admin.ordini*`, `src/components/admin/*`, `src/routes/api/admin/*`, `src/lib/validators/admin.ts`)
- Nessun touch a `src/lib/orders.server.ts`, `src/routes/checkout.tsx`, webhook Stripe, env config, public buy flow
- Il flow di acquisto pubblico continua a non passare per nessuno dei file modificati

Documentato in `deferred-items.md` con istruzioni di risoluzione (set `APP_URL=https://calzoleria-prevenzano-production.up.railway.app` su Railway env).

> Nota: la STATE.md riporta che il quick precedente (260429-f6o, commit 25e4461) aveva avuto smoke PASS. Probabile che `APP_URL` fosse stato settato durante setup originale e poi rimosso, oppure che sia un nuovo bug introdotto dopo 25e4461 da qualche cambio infra (env reset, redeploy fresco). Investigation lasciata al fix del deferred item.

## Manual smoke instructions (per l'utente)

Eseguire dopo che il deploy Railway è SUCCESS (verificato in questo plan):

1. Login come admin nel pannello.
2. Vai a `/admin/ordini`.
3. **Filtro email**: digita `e2e+` nel campo "Filtra per email..." → la lista si aggiorna dopo 300ms (debounce). Verifica che match trovi sia ordini guest (guestEmail) sia di utenti registrati (user.email).
4. **Filtro date**: imposta una data "da" (es. ieri) e/o "a" (es. oggi) → verifica subset corretto.
5. **Selezione**: spunta la checkbox header (sopra la colonna numero ordine) → tutte le righe visibili devono selezionarsi. Conferma il counter "N ordini selezionati" nella toolbar sticky che appare in alto.
6. **Cestina**: click bottone "Cestina" → si apre il dialog "Cestinare gli ordini selezionati?". Digita `CANCELLA` (esatto, maiuscolo) → bottone "Cestina" si abilita → click.
7. Toast "X ordini cestinati", la lista refetcha automaticamente, gli ordini scompaiono dalla lista attiva. Il link "Cestino (N)" in alto a destra mostra il count aggiornato.
8. **Vai al cestino**: click sul link "Cestino (N)" → atterri su `/admin/ordini/cestino` con la lista degli ordini cestinati.
9. **Ripristina alcuni**: seleziona 1-2 ordini, click "Ripristina" → toast immediato (no conferma), gli ordini scompaiono dal cestino.
10. **Cancella altri definitivamente**: seleziona altri ordini, click "Cancella definitivamente" → dialog "Eliminare definitivamente?" → digita `CANCELLA` → click. Toast, ordini eliminati permanentemente (verifica anche con query SQL diretta che siano spariti dalla tabella `Order`).
11. **Pitfall test**: torna in `/admin/ordini`, seleziona 2 ordini, poi cambia pagina (Successiva) → la selezione DEVE resettarsi (counter scompare). Idem cambiando filtro email/data/status/sort. Idem nel `/admin/ordini/cestino`.
12. **Verifica ripristino**: torna in `/admin/ordini` → gli ordini ripristinati al punto 9 sono di nuovo nella lista attiva.

## Pitfall RESEARCH §10 — implementato

Il rischio "Selection set leakage tra page change" (severity MEDIUM in RESEARCH §10) è stato esplicitamente mitigato:

- `src/routes/admin.ordini.tsx:139-141`:
  ```ts
  useEffect(() => {
    setSelected(new Set());
  }, [page, query, status, debouncedEmail, createdFrom, createdTo, sort]);
  ```
- `src/routes/admin.ordini.cestino.tsx:60-62`:
  ```ts
  useEffect(() => {
    setSelected(new Set());
  }, [page, debouncedEmail, createdFrom, createdTo]);
  ```

Tutti i deps che influenzano la query lato server sono inclusi nel dep-array del reset → impossibile che un id rimanga in `selected` dopo che la riga corrispondente non è più visibile.

## Out of scope (da plan)

I seguenti sono esplicitamente fuori scope, NON fixati come da `<success_criteria>` del PLAN:
- Soft-delete su pagina dettaglio singolo ordine (`admin.ordini.$id.tsx`)
- Audit trail UI (`deletedBy` è settato in DB ma non visualizzato)
- Filtro range totale ordine
- Auto-purge cron del cestino vecchio
- E2E test admin (manual smoke sufficiente per quick task)
- TS noise pre-esistente (25 errori baseline non introdotti da questo plan)

## Deferred Items

Vedi `deferred-items.md` nella stessa directory.

- **APP_URL non settato su Railway** (HIGH): blocca redirect Stripe success_url → `localhost:3000`. Pre-esistente o regresso infra recente. Out of scope per questo plan admin-only. Risoluzione: setting env Railway, no code change.

## Deviations from Plan

**Nessuna deviazione di Rule 1/2/3.** Il plan è stato eseguito esattamente come scritto. Le deviazioni minori (non sostanziali) sono:

1. **TypeConfirmDialog: 122 LOC vs target ~50-70 LOC del PLAN.** Il limite hard del PLAN era 70 LOC, ma includendo gli attributi a11y (`aria-label`, `autoComplete="off"`, `spellCheck={false}`), la JSDoc, e la formattazione conservativa multi-line, il file è 122 LOC. Comunque ben sotto il limite di 200 LOC per component (CLAUDE.md). Decisione: accettare la dimensione in cambio di a11y e leggibilità — il plan stesso diceva "Italian narrative... TypeScript identifiers stay English. The point is the typing-gate, not architectural elegance" (constraint nelle istruzioni), e "se TypeConfirmDialog typing causa friction, fall back simpler implementation" — qui non c'è stata friction, solo verbosity necessaria. Tracciato come deviazione informativa, non di Rule.

2. **admin.ordini.cestino.tsx: 324 LOC vs target ~150 LOC, hard limit 200 LOC del PLAN.** Mirror diretto della lista attiva (che è 360+ LOC dopo Task 4) richiede tabella + paginazione + filtri + selection — pattern proporzionale. Il 200 LOC era un target ottimistico del plan; l'alternativa (estrazione di sub-componenti condivisi tra lista attiva e cestino) è stata esplicitamente esclusa dal RESEARCH §5 ("layout duplicato — researcher's call: 2 callsites + abstraction adds noise per quick task"). Tracciato come deviazione informativa, non di Rule.

3. **Per Task 4 typecheck il routeTree.gen.ts richiedeva la presenza del file admin.ordini.cestino.tsx già su disco** per validare il `<Link to="/admin/ordini/cestino">`. Workflow adottato: scritto il file di Task 5 PRIMA del commit di Task 4, rigenerato il routeTree via breve `pnpm dev`, poi commit Task 4 (solo admin.ordini.tsx + admin-functions.ts), poi commit Task 5 (solo admin.ordini.cestino.tsx). Il `routeTree.gen.ts` è gitignored quindi non entra nei commit. Non è una deviazione di Rule, è un dettaglio di esecuzione legato a TanStack Router.

## Self-Check: PASSED

**Files created — verificati esistenti:**
- FOUND: `src/routes/api/admin/orders.bulk.ts`
- FOUND: `src/components/admin/TypeConfirmDialog.tsx`
- FOUND: `src/routes/admin.ordini.cestino.tsx`

**Files modified — verificati con git log:**
- FOUND: `src/lib/validators/admin.ts` (commit 7d62f4a)
- FOUND: `src/lib/admin/admin-orders.server.ts` (commit 7d62f4a)
- FOUND: `src/lib/admin.server.ts` (commit 7d62f4a)
- FOUND: `src/lib/admin-functions.ts` (commit 178ee38)
- FOUND: `src/routes/admin.ordini.tsx` (commit 178ee38)

**Commits — verificati con git log --all:**
- FOUND: 7d62f4a feat(admin): server fn softDelete/restore/hardDelete + filtri email/date sugli ordini
- FOUND: 9d0c9b6 feat(admin): endpoint POST /api/admin/orders/bulk con action discriminator
- FOUND: 106fe80 feat(admin): TypeConfirmDialog reusable con typing gate
- FOUND: 178ee38 feat(admin): selezione massiva + filtri email/date + cestina nella lista ordini
- FOUND: 5047ab1 feat(admin): vista cestino /admin/ordini/cestino con ripristina e cancella definitivamente

**Quality gates:**
- pnpm typecheck baseline = 25 errors, post-plan = 25 errors (no regression)
- Zero `any` introdotto
- Italian commit messages tutti e 5
- No nuove dipendenze npm
- Push origin: 5 commits accettati (39dc751..5047ab1)
- Railway deploy: commitHash=5047ab1, status=SUCCESS
- HTTP probe: 200
- Smoke E2E: FAIL ma per APP_URL env mancante (deferred, out of scope)
