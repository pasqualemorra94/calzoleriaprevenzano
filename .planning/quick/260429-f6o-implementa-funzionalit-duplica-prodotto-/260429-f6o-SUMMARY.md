---
quick_task: 260429-f6o
title: "Implementa funzionalità Duplica prodotto"
date: 2026-04-29
duration_min: 22
files_modified: 5
files_created: 1
commits: 4
typecheck_delta: -1
e2e_smoke: PASS
---

# Quick Task 260429-f6o — Duplica prodotto: Summary

**Una riga:** Feature end-to-end "Duplica prodotto" admin (server function + endpoint POST + bottoni in lista e editor con ConfirmDialog + toast con action "Apri"), slug/SKU auto-suffix `-copia[-N]` con limite N=50 → 409, variants clonate con `sku=null` e `isActive=false` di default sul prodotto duplicato.

## Diff outline (4 task)

| # | Commit | Files | Δ LOC | Scope |
|---|--------|-------|-------|-------|
| 1 | `0b05363` `feat(admin): adminDuplicateProduct con slug auto-suffix e variants/images cloning` | `src/lib/admin/admin-products.server.ts`, `src/lib/admin.server.ts` | +100 / -0 | Server function + barrel re-export |
| 2 | `5118f49` `feat(admin): endpoint POST /api/admin/products/:id/duplicate` | `src/routes/api/admin/products.$id.duplicate.ts` (new) | +50 / -0 | Route handler con mappatura errori 403/404/409/500 |
| 3 | `5f31bb5` `feat(admin): bottone Duplica nella lista prodotti con conferma` | `src/routes/admin.prodotti.tsx` | +54 / -2 | Bottone Duplica + ConfirmDialog non distruttivo + toast con action "Apri" |
| 4 | `25e4461` `feat(admin): bottone Duplica prodotto nell'editor` | `src/routes/admin.prodotti.$id.tsx` | +50 / -1 | Bottone secondario gated `!isNew` nello sticky header + ConfirmDialog + toast |

**Totale:** 4 commit, 1 file nuovo + 4 file modificati = 5 file impattati. Δ LOC complessivo ~ +254 / -3.

## Slug/SKU collision algorithm — pseudo-code

```
input: id (string)
1. src ← prisma.product.findUnique(id, include: images, variants)
   if !src → throw "Prodotto non trovato"  → 404 dall'endpoint

2. baseSlug ← `${src.slug}-copia`
   baseSku  ← src.sku ? `${src.sku}-COPIA` : null

3. existing ← prisma.product.findMany(where: slug startsWith baseSlug, select: slug+sku)
   slugSet ← Set(existing.map(.slug))
   skuSet  ← Set(existing.map(.sku).filter(non-null))

4. for n in 1..50:                               # hard limit, NON loop infinito
     suffix  ← (n == 1) ? "" : `-${n}`           # primo tentativo senza suffisso N
     trySlug ← `${baseSlug}${suffix}`            # es. "isabella-copia", poi "isabella-copia-2", ...
     trySku  ← baseSku ? `${baseSku}${suffix}` : null
     if !slugSet.has(trySlug) && (!trySku || !skuSet.has(trySku)):
       found ← true; break
   if !found → throw "SLUG_COLLISION_LIMIT"      → 409 dall'endpoint
                                                  con messaggio italiano

5. prisma.$transaction:
     tx.product.create({
       name:       `${src.name} (copia)`,
       slug:       newSlug,
       sku:        newSku,
       isActive:   false,                        # D1 — copia inattiva di default
       isFeatured: false,                        # D2
       stock:      src.stock,                    # D3 — eredita stock
       price/compareAtPrice/description/shortDescription/weight/materials/categoryId: copiati 1:1
       variantConfig/aiMetadata: src.* ?? Prisma.JsonNull
       images:   { create: src.images.map({url, alt, sortOrder, width, height, mediaId}) }
       variants: { create: src.variants.map({name, color, size, price, stock, sku: null, isActive, sortOrder}) }
     }, select: { id, slug })

6. return { id, slug }                           # superficie minima per il client
```

**Race condition (microscopica):** finestra fra `findMany` (step 3) e `create` (step 5). Mitigata catturando Prisma `P2002` nell'endpoint → 409 `"Slug o SKU già esistenti"`.

**Variants `sku: null`:** scelta di sicurezza per evitare conflitti sull'unique globale di `ProductVariant.sku`. L'admin può rieditare gli SKU varianti dopo la duplicazione. Vincolo composito `(productId, color, size)` è ortogonale (productId nuovo → no collision).

## Typecheck — esito

- **Baseline pre-task:** 26 errori (residui pre-esistenti del repo, già documentati in 260429-eev e altri quick task storici).
- **Post-task:** 25 errori (-1).
- **NEW errors introdotti dai 4 task:** 0.
- **Side effect positivo:** Task 4 ha risolto un TS6133 pre-esistente su `navigate is declared but its value is never read` in `admin.prodotti.$id.tsx` perché ora `navigate` viene usato in `handleDuplicate`.

I 25 residui sono tutti errori non in scope (validators auth con Zod, scripts/, RPC serializer su `Record<string,unknown>` in `admin-functions.ts`, `compareAtPrice null/undefined` mismatch in `routes/api/admin/products.ts` e `routes/api/products.ts`). Nessuno blocca la build runtime; Railway ha builddato e deployato il commit `25e4461` con `status=SUCCESS`.

## Railway redeploy

- **Push:** 2026-04-29T09:08:23Z su `origin site-gen/calzoleria-prevenzano` (4 commit consecutivi).
- **Deploy alive:** prima HTTP 200 su `https://calzoleria-prevenzano-production.up.railway.app/api/products?perPage=1` al tentativo 1 (era già stato builddato/deployato durante il poll precedente, attesa effettiva ~3-4 min dopo push).
- **`railway status --json` snapshot:**
  - `latestDeployment.meta.commitHash` = `25e44619da949e6aea7fc2c6b703b43f64842557` (= commit Task 4, ultimo pushato)
  - `latestDeployment.status` = `SUCCESS`
  - `branch` = `site-gen/calzoleria-prevenzano`
- **Smoke E2E:** `pnpm test:e2e tests/e2e/smoke-purchase.spec.ts --reporter=list` → **1 passed in 32.6s**. Il public buy flow (Isabella end-to-end → checkout → payment processing) non è regresso.

## Manual verification — istruzioni per l'utente

1. **Apri** `https://calzoleria-prevenzano-production.up.railway.app/admin/prodotti` e fai login admin.
2. **Trova "Isabella"** nella lista (filtro categoria sandali o cerca "Isabella").
3. **Clicca il bottone "Duplica"** (con icona Copy, fra "Modifica" e "Elimina") sulla riga di Isabella.
4. **Verifica il dialog di conferma:** titolo "Duplicare prodotto", messaggio italiano `Verrà creata una copia inattiva di "Isabella" con suffisso "(copia)". Potrai poi modificarla.`, bottone primario verde "Duplica" (variante non distruttiva, NON rosso), "Annulla" secondario.
5. **Conferma "Duplica"** → in basso appare un toast verde "Prodotto duplicato" con un bottone azione "Apri".
6. **Verifica nella lista** (refresh automatico): nuova riga **"Isabella (copia)"** con badge grigio **"Inattivo"**, prezzo identico, stock identico, immagine miniatura presente.
7. **Clicca "Apri" sul toast** → naviga su `/admin/prodotti/<nuovoId>`. Verifica:
   - Header: `Isabella (copia)`
   - Pannello laterale prezzi: prezzo + compareAtPrice copiati
   - Toggle `Attivo` = OFF, toggle `In evidenza` = OFF
   - Sezione varianti/builder: stessa struttura del sorgente, **SKU varianti vuoti** (regenerati a null)
   - Galleria immagini: tutte presenti nello stesso ordine del sorgente
8. **Test bottone editor** (gated `!isNew`): nella stessa pagina di edit, sopra il form, nello sticky header c'è ora un secondo bottone **"Duplica prodotto"** (icona Copy, fra "Annulla" e "Salva"). Cliccalo → conferma → ti aspetti un toast "Prodotto duplicato" con action "Apri duplicato" e una nuova riga `Isabella (copia)-2` (suffisso `-2` perché `isabella-copia` slug è già occupato dal duplicato del passo 6).
9. **Test salvataggio della copia:** torna alla copia originale (`Isabella (copia)`), modifica un campo (es. nome → `Isabella custom test`, attiva il toggle `Attivo`), clicca **Salva** → toast "Prodotto salvato con successo". Torna alla lista → la riga ora mostra il nuovo nome con badge verde "Attivo".
10. **(Opzionale) Cleanup:** elimina i prodotti di test cliccando "Elimina" sulle righe `Isabella custom test` e `Isabella (copia)-2`, oppure ripristinali dal filtro `Eliminati` se vuoi tenerli.

**Smoke API rapido (curl, da eseguire in console autenticata browser, non da terminale — l'admin auth richiede session cookie):**
```js
// Da DevTools console su /admin/prodotti, dopo aver fatto login
const id = "<ID_ISABELLA>"; // copia da inspect del bottone Modifica
const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: "POST" });
const json = await res.json();
console.log(json); // atteso: { ok: true, data: { id: "...", slug: "isabella-copia(-N)?" } } status 201
```

## Out of scope — esplicitamente flaggati

- **Bulk duplicate** (selezione multipla in lista → duplica N prodotti in una sola call): non in scope, può essere quick task futura.
- **Duplicate cross-category** (cambia category al momento della duplica): la copia eredita la stessa `categoryId` del sorgente.
- **Wizard di overrides** in fase di conferma (es. "duplica ma cambia il nome a X / il prezzo a Y"): out of scope. La copia eredita 1:1, l'admin modifica nell'editor.
- **Cloning del template variant** (`variantTemplateId` se in futuro venisse aggiunto come FK): non applicabile oggi — `variantConfig` è JSON inline, viene copiato as-is.
- **E2E test admin auth** (Playwright spec che fa login + duplica + verifica): non scritta — admin auth richiede session cookie complicata da automatizzare, manual smoke è sufficiente per quick task.
- **Provv inactivation / pre-cleanup** dei duplicati di test: non in scope (esiste già `pnpm db:cleanup-e2e` per gli ordini, non per i prodotti).
- **Pre-existing TS noise** (25 errori residui post-task): non in scope. Sono tracciati in quick task storici (260429-eev, etc.) e non bloccano la build runtime.
- **Logging admin-id sulla duplica** (chi ha duplicato): richiederebbe un campo `createdBy` su `Product` (oggi assente nello schema). Non in scope.
- **Migrazioni DB / Prisma schema / webhook handler / seed:** vincolo del task, non toccati.
- **Nuove dipendenze npm:** vincolo del task, non aggiunte.

## Self-Check: PASSED

- [x] `src/lib/admin/admin-products.server.ts` esporta `adminDuplicateProduct` (verificato: `export async function adminDuplicateProduct`)
- [x] `src/lib/admin.server.ts` re-exporta `adminDuplicateProduct`
- [x] `src/routes/api/admin/products.$id.duplicate.ts` esiste con `createFileRoute("/api/admin/products/$id/duplicate")`
- [x] `src/routes/admin.prodotti.tsx` contiene `handleDuplicate` + import `Copy` + ConfirmDialog
- [x] `src/routes/admin.prodotti.$id.tsx` contiene `handleDuplicate` + bottone gated `!isNew`
- [x] Commit `0b05363`, `5118f49`, `5f31bb5`, `25e4461` presenti in `git log`
- [x] `pnpm typecheck` non aggiunge errori NEW (-1 in totale, side effect positivo)
- [x] Push su `origin site-gen/calzoleria-prevenzano` confermato
- [x] Railway `latestDeployment.commitHash=25e4461...` con `status=SUCCESS`
- [x] Smoke E2E `tests/e2e/smoke-purchase.spec.ts` PASS in 32.6s
