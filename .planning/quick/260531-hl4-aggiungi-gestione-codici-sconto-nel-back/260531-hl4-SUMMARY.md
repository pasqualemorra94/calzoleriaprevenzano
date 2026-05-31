---
phase: quick-260531-hl4
plan: 01
subsystem: admin
tags: [admin, discount-codes, sconti, server-fn, tanstack-form, zod]
requires:
  - "prisma model DiscountCode (già esistente, schema.prisma)"
  - "orders.server.ts discount lookup contract (code uppercase + finestra date + minOrder + maxUses)"
provides:
  - "src/lib/validators/admin.ts → createDiscountCodeSchema + toggleDiscountCodeSchema"
  - "src/lib/admin/admin-discounts.server.ts → listDiscountCodes / createDiscountCode / toggleDiscountCode + DiscountCodeListItem"
  - "src/lib/admin-functions.ts → $listDiscountCodes / $createDiscountCode / $toggleDiscountCode (auth-gated)"
  - "src/routes/admin.sconti.tsx → pagina admin /admin/sconti (form + tabella + toggle)"
  - "src/routes/admin.tsx → voce NAV 'Codici sconto'"
affects:
  - "pannello admin (nuova sezione sidebar)"
  - "checkout (i codici creati sono immediatamente applicabili, nessuna modifica a orders.server.ts)"
tech-stack:
  added: []
  patterns:
    - "createServerFn auth-gated con requireAdmin() (difesa in profondità)"
    - "Zod schema in lib/validators/ con transform .toUpperCase() per il code"
    - "TanStack Form + zodValidator adapter, toggle custom role=switch (no Radix Switch)"
    - "Decimal → Number e Date → ISO string nel server layer per serializzazione createServerFn"
key-files:
  created:
    - "src/lib/admin/admin-discounts.server.ts"
    - "src/routes/admin.sconti.tsx"
  modified:
    - "src/lib/validators/admin.ts"
    - "src/lib/admin-functions.ts"
    - "src/routes/admin.tsx"
decisions:
  - "type fisso 'percentage' hardcoded lato server (UI solo percentuali); il field non è nel form né nello schema"
  - "code sempre salvato UPPERCASE via transform Zod → compatibile con la lookup uppercase di orders.server.ts"
  - "minOrder/maxUses opzionali: il form invia stringa vuota → convertita in undefined prima del submit → null in DB"
  - "validazione finale demandata a createDiscountCodeSchema.parse() lato server (no validators.onSubmit nel form: i valori grezzi del form usano string per i campi opzionali, mismatch col tipo dello schema)"
metrics:
  duration: ~6m
  completed: 2026-05-31
  tasks: 2
  files: 5
---

# Phase quick-260531-hl4 Plan 01: Gestione codici sconto nel backoffice — Summary

Pagina admin `/admin/sconti` per creare ed elencare codici sconto in percentuale (form TanStack + tabella con utilizzi e toggle attiva/disattiva), basata sul modello Prisma `DiscountCode` già esistente — zero migration, zero modifiche a `orders.server.ts`.

## What Was Built

- **Validators** (`src/lib/validators/admin.ts`): `createDiscountCodeSchema` (code 2-50 char `[A-Za-z0-9_-]` con transform `.toUpperCase()`, value percentuale 0<v≤100, finestra `startsAt`/`expiresAt` con `.refine` scadenza > inizio, `minOrder`/`maxUses` opzionali) + `toggleDiscountCodeSchema` (`id` cuid + `isActive` boolean) + relativi tipi inferiti.
- **Server layer** (`src/lib/admin/admin-discounts.server.ts`, ~130 LOC): `listDiscountCodes` (findMany desc), `createDiscountCode` (parse → pre-check univocità via `findUnique` → create con `type:"percentage"`, `minOrder`/`maxUses` `?? null`), `toggleDiscountCode` (update `isActive`). Helper interno `toListItem` per DRY: `Decimal → Number`, `Date → ISO string`. Logging via `createLogger`.
- **Server-fn wrappers** (`src/lib/admin-functions.ts`): `$listDiscountCodes`/`$createDiscountCode`/`$toggleDiscountCode`, tutti `requireAdmin()`-gated, con `satisfies Promise<DiscountCodeListItem...>`. Re-export del tipo `DiscountCodeListItem`.
- **Route page** (`src/routes/admin.sconti.tsx`): `beforeLoad` fetch iniziale → route context; form di creazione (6 campi, input native stilizzati con design token, toggle uppercase su `code`, conversione stringa vuota → undefined per `minOrder`/`maxUses` al submit); tabella codici (Codice mono | Sconto % | Validità IT | Ordine min | Utilizzi `usedCount/maxUses ?? ∞` | toggle `role="switch"`); aggiornamento ottimistico dello state locale senza reload; sub-componente `DiscountRow`.
- **Nav** (`src/routes/admin.tsx`): voce "Codici sconto" (icona `Ticket`) dopo "Spedizione" → `/admin/sconti`.

## Verification

- `npx tsc --noEmit` → **zero errori NUOVI sui 5 file toccati** (`sconti`, `admin-discounts`, `validators/admin`, `admin-functions`, `admin.tsx`). Baseline pre-esistente del worktree fresco invariata.
- grep `prisma.discountCode.(create|findMany|update)` → 3 match; `type: "percentage"` → 1; `toUpperCase` nello schema → 1; `/admin/sconti` in `admin.tsx` → 1.
- Zero `any`/`as any` nei file nuovi; zero hex hardcoded nella route (solo `var(--color-*)`).

## Deviations from Plan

Nessuna deviazione di sostanza. Un solo adattamento tecnico (NON deviazione Rule 1-4): il form NON usa `validators: { onSubmit: createDiscountCodeSchema }` perché i `defaultValues` del form modellano `minOrder`/`maxUses` come `string` (per supportare il valore vuoto degli input native), mentre lo schema attende `number | undefined`; agganciare lo schema come validator del form avrebbe causato un type-mismatch. La validazione completa avviene comunque server-side via `createDiscountCodeSchema.parse()` dentro `createDiscountCode`, e il payload viene normalizzato (stringa vuota → `undefined`) in `onSubmit` prima della chiamata. Stesso spirito del pattern `admin.spedizione.tsx`, che usa validator per-field.

## Known Stubs

Nessuno. Tutti i dati sono cablati al server layer reale (Prisma `discountCode`); nessun valore mock o placeholder.

## Environment Note

Il worktree è fresco: `src/routeTree.gen.ts` (gitignored) e `@tanstack/router-generator` non sono presenti, quindi il totale `tsc` è gonfio da errori a cascata su file di route non generati — artefatti d'ambiente, NON regressioni, risolti dal CI Railway (router generate + prisma generate) al deploy. `pnpm lint` resta deferito (biome.json incompatibile con Biome 2.x, problema pre-esistente project-wide).

## Smoke Test (deferito a deploy/dev, a carico utente)

Login admin → `/admin/sconti` → crea codice `ESTATE10` 10% con inizio oggi e scadenza +30gg → compare in tabella `0/∞` → toggle off/on → al checkout applicare `ESTATE10` su un carrello → sconto del 10% applicato.

## Self-Check: PASSED

- FOUND: src/lib/admin/admin-discounts.server.ts
- FOUND: src/routes/admin.sconti.tsx
- FOUND: .planning/quick/260531-hl4-.../260531-hl4-SUMMARY.md
- FOUND commit: 48c24d9 (Task 1)
- FOUND commit: d8b9081 (Task 2)
