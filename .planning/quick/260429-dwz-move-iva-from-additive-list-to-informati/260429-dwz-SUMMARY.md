---
task_id: 260429-dwz
title: 'IVA admin order detail — da riga additiva a "di cui" sotto il totale'
type: quick
date: 2026-04-29
status: complete
duration_min: ~5
files_modified:
  - src/routes/admin.ordini.$id.tsx
commits:
  - 58322c2: 'fix(admin): IVA come riga informativa "di cui" sotto il totale (no double-display)'
deploy:
  platform: Railway
  branch: site-gen/calzoleria-prevenzano
  url: https://calzoleria-prevenzano-production.up.railway.app
  status: live (HTTP 200 verificato post-push)
tags:
  - admin
  - ui-fix
  - iva
  - visual-only
---

# Quick Task 260429-dwz — IVA come riga informativa "di cui" nel dettaglio ordine admin

## Obiettivo

Correggere il breakdown visivo nel dettaglio ordine admin (`src/routes/admin.ordini.$id.tsx`):
la riga IVA era posizionata nella stessa colonna additiva di Subtotale e Spedizione,
inducendo a pensare che l'IVA venisse sommata sopra il totale (double-display).

In realtà, dopo il fix IVA del task `260428-m6j`, `order.taxAmount` rappresenta già
la quota IVA **inclusa** in `order.total` (Italian VAT-inclusive pricing). Mostrarla
come riga additiva è quindi fuorviante per chi legge il pannello admin.

## Soluzione

Rimossa la riga IVA dalla lista additiva. Aggiunta una riga **informativa** muted
sotto il **Totale** in stile "di cui IVA (22%) €X.XX", rispecchiando esattamente
il pattern già usato in `OrderSummary.tsx` (componente customer-facing al checkout
e in pagina ordine confermato).

In questo modo admin e customer-facing convergono sulla stessa narrazione visiva:
prezzo IVA inclusa, quota IVA mostrata come informazione ausiliaria.

## Diff applicato

**File**: `src/routes/admin.ordini.$id.tsx` (4+/4-)

```diff
                 {order.discountAmount > 0 && (
                   <div className="flex justify-between text-green-600">
                     <span>Sconto</span>
                     <span>-{fmt(order.discountAmount)}</span>
                   </div>
                 )}
-                <div className="flex justify-between text-gray-600">
-                  <span>IVA</span>
-                  <span>{fmt(order.taxAmount)}</span>
-                </div>
                 <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                   <span>Totale</span>
                   <span>{fmt(order.total)}</span>
                 </div>
+                <div className="flex justify-between text-xs text-gray-500">
+                  <span>di cui IVA (22%)</span>
+                  <span>{fmt(order.taxAmount)}</span>
+                </div>
```

## Layout finale

```
Subtotale            €X.XX
Spedizione           €X.XX
[Sconto             -€X.XX]   (solo se discountAmount > 0, in verde)
─────────────────────────
Totale               €X.XX    (bold, separator-top)
di cui IVA (22%)     €X.XX    (text-xs text-gray-500, no border)
```

## Verifica matematica (invariata)

Il calcolo del totale **non è toccato**. Continua a valere:

```
Totale = Subtotale + Spedizione − Sconto
```

`order.taxAmount` viene usato esclusivamente per la riga informativa, esattamente
come prima — solo la sua **posizione visiva** è cambiata (da additiva a sotto-totale
muted). Nessun ricalcolo, nessuna chiamata API, nessuna modifica al backend.

## Pattern allineato a OrderSummary.tsx

`OrderSummary.tsx:97-100` (customer-facing):

```tsx
<div className="flex justify-between text-xs text-[var(--color-text-muted)]">
  <span>di cui IVA (22%)</span>
  <span>€{(Math.round((total * 22 / 122) * 100) / 100).toFixed(2)}</span>
</div>
```

Admin (post-fix): stesse classi `flex justify-between text-xs` + colore muted
equivalente (`text-gray-500` perché l'admin usa palette gray-* invece di CSS vars).
Il valore è preso direttamente da `order.taxAmount` invece di ricalcolarlo —
unica fonte di verità (post-fix `260428-m6j`).

## Constraint di scope rispettati

- Singolo file modificato: `src/routes/admin.ordini.$id.tsx`
- Zero modifiche a backend / API / schema / `taxAmount` computation
- Zero modifiche a `OrderSummary.tsx` (era già corretto)
- Zero modifiche a `ordine-confermato.tsx`
- Zero modifiche ai test (cambio puramente visivo)
- Width `w-64` mantenuta — la stringa "di cui IVA (22%)" entra senza wrap
- ROADMAP.md non toccato (è un quick task)

## Verifica TypeScript

`pnpm typecheck` mostra **solo errori pre-esistenti** in `src/routes/prodotti.$slug.tsx`
e `src/routes/api/products.ts` (non correlati a questo task — segnalati come noise
nelle istruzioni). **Zero nuove regressioni TS** introdotte dalla modifica
in `admin.ordini.$id.tsx`.

## Deploy & verifica live

1. Commit: `58322c2`
2. Push: `origin site-gen/calzoleria-prevenzano` (Railway auto-deploy attivo)
3. Polling endpoint health: `curl -sI https://calzoleria-prevenzano-production.up.railway.app/api/products?perPage=1` → **HTTP 200** confermato
4. Server: `railway-edge` europe-west4

## Istruzioni per il review utente

Per vedere il nuovo layout in produzione:

1. Apri il pannello admin: `https://calzoleria-prevenzano-production.up.railway.app/admin/ordini`
2. Apri il dettaglio di un ordine qualsiasi
3. Scorri al riepilogo prezzi in fondo alla tabella prodotti
4. Verifica che la riga IVA **non** appaia più sopra il Totale come additiva
5. Verifica che sotto il Totale (in grassetto) appaia ora una riga grigia piccola: **"di cui IVA (22%) €X.XX"**

Se la cache del browser mostra ancora la vecchia versione: hard refresh (Cmd+Shift+R su Mac, Ctrl+F5 su Windows).

## Note

- Cambio puramente visivo: nessun test E2E necessario (per istruzioni esplicite del task)
- Coerenza UX: ora admin e checkout/conferma-ordine raccontano la stessa storia IVA
- Nessuna confusione future per chi consulta gli ordini dal pannello admin
- Fix complementare a `260428-m6j` (che aveva risolto il **calcolo** IVA double-tax;
  questo task risolve la **rappresentazione** IVA double-display)

## Self-Check: PASSED

- File `src/routes/admin.ordini.$id.tsx` modificato (4+/4- LOC, diff verificato)
- Commit `58322c2` presente in `git log` su branch `site-gen/calzoleria-prevenzano`
- Pushato su origin, Railway redeploy verificato HTTP 200
- SUMMARY.md presente al path corretto
- STATE.md aggiornato (Quick Tasks Completed table + last_activity + stopped_at)
