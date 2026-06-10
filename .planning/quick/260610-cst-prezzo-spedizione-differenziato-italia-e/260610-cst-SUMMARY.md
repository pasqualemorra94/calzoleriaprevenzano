---
phase: quick-260610-cst
plan: 01
subsystem: checkout / shipping
tags: [shipping, checkout, admin, estero, prisma, validators]
requires:
  - ShippingConfig singleton (id="default")
  - computeShippingCost helper puro
  - checkoutGuestSchema + createOrder server-side
provides:
  - Tariffa spedizione estero configurabile (costEstero/freeThresholdEstero)
  - Selettore paese binario Italia/estero al checkout
  - Calcolo spedizione server-side basato sul country normalizzato
affects:
  - src/lib/utils/shipping.ts
  - src/lib/admin/shipping-config.server.ts
  - src/lib/validators/admin.ts
  - src/lib/validators/products.ts
  - src/lib/orders.server.ts
  - src/routes/checkout.tsx
  - src/components/checkout/ShippingAddressFields.tsx
  - src/routes/admin.spedizione.tsx
  - src/routes/carrello.tsx (fix tipo)
tech-stack:
  added: []
  patterns: [zod superRefine condizionale, zona binaria Italia/estero, helper condiviso isEsteroCountry]
key-files:
  created:
    - prisma/migrations/20260610071814_add_shipping_estero/migration.sql
    - src/components/checkout/ShippingAddressFields.tsx
  modified:
    - prisma/schema.prisma
    - src/lib/utils/shipping.ts
    - src/lib/admin/shipping-config.server.ts
    - src/lib/validators/admin.ts
    - src/lib/validators/products.ts
    - src/lib/orders.server.ts
    - src/routes/checkout.tsx
    - src/routes/admin.spedizione.tsx
    - src/routes/carrello.tsx
decisions:
  - "Zona binaria Italia (IT/ITALIA/ITALY) vs estero — nessuna tabella zone/paesi"
  - "Indirizzo estero in forma libera (provincia/CAP non più 2/5 char obbligatori)"
  - "Prezzo spedizione SEMPRE ricalcolato server-side dal country, mai dal client"
  - "Migrazione additiva applicata SOLO al DB locale — prod è step manuale separato"
metrics:
  duration: ~40m
  completed: 2026-06-10
  tasks: 5
  files: 11
  commits: 4
---

# Quick 260610-cst: Prezzo spedizione differenziato Italia/estero — Summary

Tariffa di spedizione estero configurabile dall'admin + selettore paese binario Italia/"Altro paese (estero)" al checkout, con indirizzo estero in forma libera e prezzo sempre ricalcolato server-side dal `country` normalizzato.

## Cosa è stato fatto

**Task 1 — Data layer (commit `74bc4df`)**
- `prisma/schema.prisma`: due colonne additive su `ShippingConfig` — `costEstero` e `freeThresholdEstero` (`Decimal(10,2)`, default 7.90 / 199.00).
- Migrazione `20260610071814_add_shipping_estero` generata e applicata **SOLO al DB locale** (solo `ADD COLUMN` con default, additiva, nessun DROP/ALTER distruttivo).
- `computeShippingCost(subtotal, config, isEstero = false)`: nuovo flag `isEstero` (default false → retrocompatibile). Sceglie `costEstero`/`freeThresholdEstero` per l'estero, `cost`/`freeThreshold` per l'Italia. Regole invariate (`!enabled`→0; `subtotal ≥ soglia`→0; altrimenti round2).
- `ShippingConfigData` + lettura `getShippingConfig` + upsert `updateShippingConfig` (update/create/return) + `updateShippingConfigSchema` estesi coi due campi (z.coerce.number, min 0, max 9999.99 / 99999.99).
- `carrello.tsx`: costruzione della config aggiornata coi due nuovi campi (fix blocking del tipo `ShippingConfigShape`, Rule 3).

**Task 2 — Validazione + calcolo ordine server-side (commit `9f2ef0e`)**
- `checkoutGuestSchema`: `province`/`postalCode` allentati a stringa libera opzionale, `country` `min(1)`. `superRefine` applica il formato IT stretto (provincia 2 char, CAP 5 char) **solo per l'Italia**; per l'estero sono liberi. `createAddressSchema` NON toccato.
- Helper condiviso `isEsteroCountry(country)` (IT/ITALIA/ITALY = domestico), esportato dal validator (file shared, importabile dal server).
- `orders.server.ts` `createOrder`: cattura `shippingCountry` in entrambi i rami (`address.country` per addressId loggato, `input.address.country` per guest), calcola `isEstero` e lo passa a `computeShippingCost`. Prezzo sempre server-side.

**Task 3 — UI checkout (commit `4b3b51d`)**
- Nuovo componente `src/components/checkout/ShippingAddressFields.tsx`: selettore paese binario Italia / Altro paese (estero) con due radio nativi token-styled (nessun shadcn Select usato in questo file). In modalità estero compare il campo "Nazione" obbligatorio, le label diventano "Provincia/Regione" e "Codice postale", e cadono `maxLength` + trasformazioni IT (`.toUpperCase()` / `.replace(/\D/g)`).
- `checkout.tsx`: stato `isEstero` + `country` nel form state; `validateForm` condizionale (Italia: 2/5 char; estero: nazione obbligatoria, provincia/CAP liberi); reset errori province/postalCode/country al cambio zona; payload submit `country = "IT"` (Italia) o `form.country.trim()` (estero); preview costo e soglia gratuita usano `isEstero`. Estratto il blocco indirizzo nel nuovo componente (import boundary rispettato).

**Task 4 — UI admin (commit `1848919`)**
- `admin.spedizione.tsx`: `ShippingFormValues` + `defaultValues` estesi; due nuovi `form.Field` "Costo spedizione estero (€)" e "Soglia spedizione gratuita estero (€)" (number step 0.01, min 0, validazione onChange `>=0`, helper text "Vale per ordini con spedizione fuori Italia"), posizionati dopo i corrispondenti campi Italia. La validazione onSubmit usa `updateShippingConfigSchema` esteso → i campi arrivano automaticamente al server.

**Task 5 — Gate build (nessun commit di codice)**
- `pnpm typecheck`: **zero errori su tutti gli 8 file del piano** (+ carrello.tsx). Errori residui = baseline pre-esistente (auth.ts, admin.tsx/sconti, api/admin/*, api/products, *-functions.ts).
- `pnpm build` e `pnpm lint`: **bloccati da problemi d'ambiente pre-esistenti** (vedi Deferred). NESSUN deploy né `prisma migrate deploy` eseguito.

## VINCOLO DEPLOY CRITICO

- La migrazione `add_shipping_estero` è stata creata e applicata **SOLO al DB locale** (`localhost:5433/calzoleria_prevenzano_dev`). Railway/produzione NON è stato toccato.
- Per la produzione serve **ok esplicito dell'utente** prima di pushare e applicare la migrazione a Railway (`prisma migrate deploy`). Finché le colonne `costEstero`/`freeThresholdEstero` non esistono su prod, `getShippingConfig()` (che fa `Number(row.costEstero)`) **fallirebbe in produzione**.
- Codice e migrazione prod vanno applicati **INSIEME**: NON deployare il codice senza aver prima migrato il DB di prod, e fare entrambe le cose solo con consenso esplicito.
- `pnpm install --ignore-workspace` è stato eseguito (workaround isolamento monorepo): il `pnpm-lock.yaml` generato **NON è stato committato** (resta untracked, come da vincolo).

## Deviazioni dal piano

### Auto-fix (Rule 3 — blocking)
**1. [Rule 3] `carrello.tsx` aggiornato per il nuovo tipo `ShippingConfigShape`**
- Trovato durante: Task 1 (typecheck).
- Issue: estendere `ShippingConfigShape` con `costEstero`/`freeThresholdEstero` ha rotto la costruzione della config in `carrello.tsx` (oltre a `checkout.tsx`, già nel piano).
- Fix: aggiunti i due campi nella `setShippingConfig` di `carrello.tsx` (i valori arrivano già da `$getPublicShippingConfig`).
- Commit: `74bc4df` (con Task 1).

Nessun'altra deviazione. Niente Rule 4 (architetturale): zona binaria via colonne additive, nessuna nuova tabella.

## Note implementative

- `ShippingAddressFields.tsx` è ~292 LOC totali, ma è composto da 3 componenti distinti (`ShippingAddressFields` ~155, `FormInput` ~50, `CountryOption` ~30): ciascuno ben sotto i 200 LOC CLAUDE.md. Il totale alto è dovuto al wiring ripetitivo di 9 campi form (presentazionale, nessun branch logico aggiuntivo). L'estrazione ha alleggerito `checkout.tsx`.
- Zero `any` / zero `as any` introdotti; zero hex hardcoded (solo design token).

## Deferred Issues (ambiente, pre-esistenti — NON causati dal task)

Vedi `deferred-items.md`:
1. **`pnpm build` rotto** — version skew interno TanStack Start / `@tanstack/router-core` in node_modules (`MISSING_EXPORT` su `isSsrResponse`/`normalizeSsrResponse`/`replaceSsrResponse`). Tentati reinstall isolato + prisma generate, non risolve (mismatch tra pacchetti TanStack). Le modifiche del task non toccano internals SSR/routing. Build validata dal CI Railway.
2. **`pnpm lint` rotto** — `biome.json` incompatibile con Biome 2.x (chiavi sconosciute). Pre-esistente in tutte le quick task precedenti. Lint deferito al CI Railway.

## Self-Check: PASSED
- Tutti i 10 file (8 piano + migrazione + carrello) verificati presenti su disco.
- Tutti i 4 commit (`74bc4df`, `9f2ef0e`, `4b3b51d`, `1848919`) presenti nel git log.
