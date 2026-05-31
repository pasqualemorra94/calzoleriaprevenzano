---
phase: quick-260531-i1g
plan: 01
subsystem: checkout
tags: [discount, checkout, server-fn, single-source-of-truth]
requires:
  - prisma DiscountCode model (esistente)
  - createServerFn pattern pubblico (shipping-functions.ts)
provides:
  - validateDiscountCode (helper puro condiviso server-side)
  - $validateDiscount (server fn pubblica per anteprima live)
  - OrderSummary riga sconto + totale ricalcolato
affects:
  - src/lib/orders.server.ts (createOrder ora delega all'helper)
  - src/routes/checkout.tsx (pulsante Applica cablato)
tech-stack:
  added: []
  patterns:
    - "Helper puro server-only come single source of truth fra createOrder e server fn pubblica"
    - "createServerFn pubblica (no requireAdmin) per anteprima read-only"
key-files:
  created:
    - src/lib/discount.server.ts
    - src/lib/checkout-functions.ts
  modified:
    - src/lib/orders.server.ts
    - src/lib/validators/products.ts
    - src/components/checkout/OrderSummary.tsx
    - src/routes/checkout.tsx
decisions:
  - "Increment usedCount via where:{code} (code è @unique) invece di where:{id} per evitare una seconda lookup; resta una sola volta in createOrder"
  - "Codice non valido/scaduto ignorato silenziosamente in createOrder (contratto storico preservato); l'anteprima invece mostra l'errore per UX"
metrics:
  duration: ~3min
  completed: 2026-05-31
  tasks: 2
  files: 6
---

# Phase quick-260531-i1g Plan 01: Fix applicazione codice sconto al checkout Summary

Il pulsante "Applica" del codice sconto, prima inerte, ora valida il codice live via una server function pubblica `$validateDiscount` e mostra l'anteprima dello sconto (riga "Sconto −€X" + Totale ricalcolato) in `OrderSummary`, usando un helper server-side condiviso come single source of truth con `createOrder`.

## What Was Built

**Task 1 — Helper condiviso + refactor createOrder + server fn pubblica** (commit `0f10354`):
- `src/lib/discount.server.ts` (NEW): `validateDiscountCode(code, subtotal) → { valid, discountAmount, error? }`, helper puro server-only (lookup UPPERCASE + isActive + finestra date; check minOrder/maxUses; math percentage/fixed). NON incrementa `usedCount`, nessuna mutazione.
- `src/lib/orders.server.ts`: `createOrder` ora calcola `subtotal` up-front (rimosso il reduce duplicato) e delega la validazione/calcolo sconto all'helper. Comportamento osservabile invariato: codice sconosciuto/scaduto → procede con `discountAmount=0` (nessun errore); errore minOrder/maxUses → `{ ok: false, error }`; increment `usedCount` esattamente una volta, solo a creazione ordine, solo se valido. Increment via `where: { code }` (@unique).
- `src/lib/validators/products.ts`: `validateDiscountSchema` (`code` 1–50, `subtotal` nonnegative) + `ValidateDiscountInput`.
- `src/lib/checkout-functions.ts` (NEW): `$validateDiscount` `createServerFn({ method: "POST" })` con `inputValidator` → `validateDiscountSchema.parse` → `validateDiscountCode`. NESSUN auth guard, nessuna creazione ordine, nessun increment.

**Task 2 — Anteprima UI** (commit `b05ebea`):
- `src/components/checkout/OrderSummary.tsx`: prop opzionale `discountAmount?: number` (default 0, retrocompatibile col carrello), riga "Sconto −€X" in verde quando `> 0`, `total = Math.max(0, subtotal − discountAmount) + shippingCost`. L'IVA contenuta si ricalcola da sé sul nuovo `total`.
- `src/routes/checkout.tsx`: import `$validateDiscount`; nuovi stati `appliedDiscount`/`discountStatus`/`discountError`; handler `handleApplyDiscount` (chiama la server fn col subtotale del carrello); pulsante "Applica" con `onClick` + `disabled` su loading/codice vuoto + spinner `Loader2`; reset anteprima su edit del codice e su cambio `cart.subtotal` (useEffect); errore inline sotto il campo; prop `discountAmount={appliedDiscount}` passata a `OrderSummary`. Submit (riga ~99) NON toccato: continua a inviare `discountCode`, il server resta autorevole.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `grep -n "validateDiscountCode" src/lib/discount.server.ts src/lib/orders.server.ts` → match in entrambi (single source of truth).
- `grep -c "usedCount: { increment: 1 }" src/lib/orders.server.ts` → **1** (increment una sola volta in createOrder).
- `grep -c "requireAdmin" src/lib/checkout-functions.ts` → **0** ($validateDiscount pubblica).
- `grep -c '\$validateDiscount' src/routes/checkout.tsx` → 2 (import + onClick).
- `grep -c "discountAmount" src/components/checkout/OrderSummary.tsx` → 5 (prop + riga + totale).
- `npx tsc --noEmit` filtrato sui 6 file toccati → zero NUOVI errori (gli errori d'ambiente da `routeTree.gen.ts`/`@prisma` non generati nel worktree fresco sono pre-esistenti, risolti dal CI Railway).
- Zero `any`/`as any` sui 6 file; nessun hex hardcoded (solo `text-green-600`/`text-[var(--color-destructive)]`, già in uso nel componente).

## Smoke utente (deferito a dev/deploy)

`pnpm dev` → /checkout con carrello non vuoto → inserire un codice valido (es. `ESTATE10` creato in 260531-hl4) → "Applica" → riga "Sconto −€X" + Totale ridotto. Codice errato → errore inline, nessuno sconto. Modificare il codice → anteprima resettata. Confermare l'ordine → lo sconto viene applicato una sola volta lato server.

## Self-Check: PASSED
