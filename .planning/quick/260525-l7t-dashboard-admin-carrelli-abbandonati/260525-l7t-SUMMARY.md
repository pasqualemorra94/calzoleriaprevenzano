---
phase: quick-260525-l7t
plan: 01
subsystem: admin-panel
tags: [admin, carrelli, view-only, observability, gdpr-safe]
one_liner: "Dashboard admin view-only per carrelli abbandonati con KPI aggregati (count/valore €/loggati-ospiti), filtri URL-driven (4 soglie temporali × 3 tipi utente) e drill-in dettaglio con tutti gli item (varianti + selectedOptions + thumbnail)"
requires: [prisma Cart/CartItem/Product/ProductVariant/ProductImage/user models, admin-functions.ts pattern createServerFn+requireAdmin, admin.tsx layout adminGuard sidebar NAV_ITEMS]
provides: [/admin/carrelli-abbandonati list, /admin/carrelli-abbandonati/$id detail, 3 wrapper $serverFn auth-gated]
affects: [admin sidebar nav +1 voce ShoppingBag]
tech_stack_added: []
tech_stack_patterns: [admin-returns.server.ts pattern (server-only listX/getX + Decimal→Number), admin.ordini.tsx URL-driven via validateSearch, admin.index.tsx KPI cards 3-grid, admin.resi.tsx tabella read-only + paginazione, JSON.parse(JSON.stringify(...)) defensive serialize JsonValue + type guard runtime]
files_created:
  - src/lib/admin/admin-carts.server.ts
  - src/routes/admin.carrelli-abbandonati.tsx
  - src/routes/admin.carrelli-abbandonati.$id.tsx
files_modified:
  - src/lib/admin-functions.ts
  - src/routes/admin.tsx
decisions:
  - "Soft-link Order: nessuna cross-check con Order (verificato orders.server.ts:310-312 cancella cartItem post-checkout → cart convertiti hanno items vuoti, naturalmente esclusi da items.some)"
  - "Stats userFilter-aware: i KPI loggedCount/guestCount usano OVERRIDE userFilter (sempre N totali per categoria), solo totalCount + totalPotentialValue riflettono il filtro attivo — coerente con spec"
  - "Type guard runtime parseSelectedOptions: zero any, ritorna null su shape inattesa (defense in depth)"
  - "search prop su Link da $id → padre: TanStack Router richiede esplicito quando il padre ha validateSearch obbligatori (default safe {threshold:'1h', userFilter:'all', page:1})"
metrics:
  duration: "~25 minuti"
  tasks: 3
  files_touched: 5
  commits: 3
  loc_added: 1006
  loc_deleted: 2
completed_date: "2026-05-25"
---

# Phase quick-260525-l7t Plan 01: Dashboard admin carrelli abbandonati — Summary

Dashboard admin **view-only** per visualizzare i carrelli abbandonati dell'e-commerce, accessibile da `/admin/carrelli-abbandonati`. Mostra KPI aggregati (count totale, valore potenziale €, ripartizione loggati/ospiti), una tabella filtrabile per range temporale (1h/24h/7gg/30gg) + tipo utente (tutti/loggati/ospiti) URL-driven, e un drill-in di dettaglio con tutti gli item del cart (varianti, selectedOptions con swatch color, prezzi, immagini thumbnail).

## Deliverables

### File creati (3)

1. **`src/lib/admin/admin-carts.server.ts`** (288 LOC, server-only)
   - 3 funzioni esportate: `listAbandonedCarts(input)`, `getAbandonedCart(id)`, `getAbandonedCartsStats(threshold, userFilter)`
   - 5 interfacce esportate: `ThresholdRange`, `UserFilter`, `AbandonedCartListItem`, `AbandonedCartDetail` (con sotto-type `AbandonedCartDetailItem`), `AbandonedCartsStats`
   - Helper interno `buildWhereClause(threshold, userFilter, now)` con definizione operativa "abbandonato" (`items.some + updatedAt < threshold + expiresAt > now`)
   - Helper interno `thresholdToMs` con mapping {1h: 3.6M ms, 24h: 86.4M, 7gg: 604.8M, 30gg: 2.592G}
   - Type guard runtime `parseSelectedOptions(unknown)`: ritorna `Array<{label, value, color?}> | null`, mai any
   - Header commento documenta cross-check Order non necessario (orders.server.ts:310-312 cancella cartItem post-checkout) + volume <1000 → no indice DB

2. **`src/routes/admin.carrelli-abbandonati.tsx`** (~395 LOC, view-only)
   - `validateSearch` con guard typed su threshold (4 valori) + userFilter (3 valori) + page (positive int)
   - `beforeLoad` Promise.all([$listAbandonedCarts, $getAbandonedCartsStats])
   - `AdminAbandonedCartsPage` wrapper Outlet condizionale su pathname (necessario per sub-route $id)
   - `AdminAbandonedCartsList`: 3 KPI cards (ShoppingBag/Euro/Users, blu/verde/viola) + 2 select filtri URL-driven via `navigate({search: {...}})` con reset page a 1 su cambio filtro, refetch in useEffect su [threshold, userFilter, page], tabella + paginazione URL-driven
   - Helper `formatRelative(iso)` + `formatAbsolute(iso)` inline (it-IT locale)
   - Stati vuoto/loading/error tradotti

3. **`src/routes/admin.carrelli-abbandonati.$id.tsx`** (~252 LOC, view-only)
   - `beforeLoad` carica detail via `$getAbandonedCart`
   - Stato `detail === null`: card centrata "Carrello non trovato" + icon PackageX + back link (no redirect — admin può aver bookmarkato cart cancellato)
   - Header: back link + eyebrow + ID monospace
   - Card "Info carrello" grid 2-col: utente/session, createdAt, updatedAt+relative, expiresAt, totale potenziale
   - Card "Prodotti nel carrello": tabella con thumbnail (placeholder grigio se null) + nome prodotto (link pubblico target=_blank) + variante + selectedOptions inline con swatch color via `style={{ backgroundColor: o.color }}` (no hex hardcoded, viene dal DB) + quantità + prezzo unitario + subtotale
   - Footer tabella con totale potenziale grande
   - Stato vuoto difensivo "Questo carrello non ha articoli"

### File modificati (2)

1. **`src/lib/admin-functions.ts`**: aggiunti 3 wrapper auth-gated `$listAbandonedCarts`, `$getAbandonedCart`, `$getAbandonedCartsStats` con `inputValidator` + `requireAdmin()` + `satisfies Promise<...>`. Default `threshold="1h"`, `userFilter="all"`, `perPage=20`. Re-export 5 tipi.

2. **`src/routes/admin.tsx`**: import `ShoppingBag` da lucide-react + entry `{ label: "Carrelli abbandonati", href: "/admin/carrelli-abbandonati", icon: ShoppingBag, matchPath: "/admin/carrelli-abbandonati" as const }` in `NAV_ITEMS` posizionata dopo "Ordini" e prima di "Spedizione".

## Commit atomici (3)

1. `d1d42bb` — `feat(quick-260525-l7t): server layer carrelli abbandonati admin`
   - File: `src/lib/admin/admin-carts.server.ts` (NEW), `src/lib/admin-functions.ts` (MODIFIED)
2. `75026e9` — `feat(quick-260525-l7t): pagina lista carrelli abbandonati + KPI + sidebar nav`
   - File: `src/routes/admin.tsx` (MODIFIED), `src/routes/admin.carrelli-abbandonati.tsx` (NEW)
3. `04a7ede` — `feat(quick-260525-l7t): pagina dettaglio drill-in carrello abbandonato`
   - File: `src/routes/admin.carrelli-abbandonati.$id.tsx` (NEW), `src/routes/admin.carrelli-abbandonati.tsx` (fix search prop su Link)

## Verifica

| Check | Risultato |
| --- | --- |
| `pnpm typecheck` errori totali | 26 (baseline pre-esistente invariata) |
| `pnpm typecheck` errori sui 5 file toccati | **0** |
| `grep -cE ": any\|as any\|<any>" src/lib/admin/admin-carts.server.ts` | 0 |
| `grep -cE ": any\|as any\|<any>" src/routes/admin.carrelli-abbandonati.tsx` | 0 |
| `grep -cE ": any\|as any\|<any>" src/routes/admin.carrelli-abbandonati.\$id.tsx` | 0 |
| `grep -cE "#[0-9a-fA-F]{3,6}\b" src/routes/admin.carrelli-abbandonati*.tsx` | 0 (solo `style={{ backgroundColor: o.color }}` da DB) |
| `grep -cE "prisma\.cart\.(create\|update\|delete\|upsert)\|prisma\.cartItem\." admin-carts.server.ts` | 0 (zero mutazioni) |

## Deviazioni Rule 1/2/3/4

**Zero deviazioni Rule 1/2/3/4** — plan eseguito esattamente come scritto.

### Adattamento tecnico (NON deviazione)

**TanStack Router search prop obbligatorio sui Link verso route con `validateSearch`** — il plan non specificava esplicitamente che i `<Link to="/admin/carrelli-abbandonati">` dal detail (`$id`) e i `<Link to="/admin/carrelli-abbandonati/$id">` dalla lista necessitano il prop `search` esplicito perché la route padre ha 3 search params obbligatori (`threshold`, `userFilter`, `page`). Risolto passando:
- Da lista → detail: `search={search}` (eredita filtri correnti per back navigation coerente)
- Da detail → lista: `search={{ threshold: "1h", userFilter: "all", page: 1 }}` (default safe)

Pattern coerente con TanStack Router type-safe routing, segnalato come errore TS2741. Soluzione zero `any`, zero cast.

**Rigenerazione routeTree.gen.ts** — il file `src/routeTree.gen.ts` è gitignored (auto-generato a build/dev time dal plugin Vite di TanStack Router). Per validare il typecheck dopo aggiunta di nuove rotte è stato necessario rigenerarlo manualmente con `Generator` + `getConfig` di `@tanstack/router-generator` (~2s). Non committato (rispetta `.gitignore`), verrà rigenerato dal CI Railway al deploy.

## Deferred / Out-of-scope

- **`pnpm lint`**: NON eseguito — `biome.json` del repo è incompatibile con Biome 2.x (chiavi sconosciute `ignoreUnknown`/`includes`/`experimentalScannerIgnores`) → `pnpm lint` rotto a livello project-wide, pre-esistente, fuori scope (documentato in STATE.md ultime 10+ task quick). I file scritti rispettano Biome 1.x conventions a vista (2-space indent, double quotes, semicolons sempre).
- **Smoke browser**: deferito al deploy Railway. Setup utente richiesto post-deploy:
  1. Login admin → visita `/admin/carrelli-abbandonati`.
  2. Verifica i 3 KPI mostrano numeri plausibili (anche 0 OK se DB prod non ha cart abbandonati).
  3. Cambia threshold "Oltre 1 ora" → "Oltre 24 ore" → URL aggiornato a `?threshold=24h&userFilter=all&page=1`.
  4. Cambia "Tutti gli utenti" → "Solo loggati" → KPI "Loggati / Ospiti" mostra `N / 0` (perché filtro forza loggati nella sub-count `totalCount`).
  5. Se almeno 1 cart abbandonato presente: clicca "Apri" → atterra su detail con thumbnail + selectedOptions inline + swatch color funzionante.
  6. Test guard admin: utente non-admin che visita `/admin/carrelli-abbandonati` viene redirezionato a `/auth/login` (eredita `adminGuard` da `/admin` layout).

## Self-Check: PASSED

- `src/lib/admin/admin-carts.server.ts` esiste: FOUND
- `src/routes/admin.carrelli-abbandonati.tsx` esiste: FOUND
- `src/routes/admin.carrelli-abbandonati.$id.tsx` esiste: FOUND
- `src/lib/admin-functions.ts` modificato: FOUND (3 nuovi `$serverFn` + 5 tipi re-exportati)
- `src/routes/admin.tsx` modificato: FOUND (1 import icon + 1 entry NAV_ITEMS)
- Commit `d1d42bb`: FOUND
- Commit `75026e9`: FOUND
- Commit `04a7ede`: FOUND
