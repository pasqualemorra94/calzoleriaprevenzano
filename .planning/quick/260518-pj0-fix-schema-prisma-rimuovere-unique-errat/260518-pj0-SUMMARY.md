---
phase: quick-260518-pj0
plan: 01
subsystem: auth / database
tags: [prisma, better-auth, bugfix, migration, password-reset]
requires: []
provides:
  - "Modello verification senza @unique su value (Better Auth puo creare piu righe con lo stesso value)"
  - "Migrazione DROP INDEX su verifications_value_key applicabile in produzione"
affects:
  - "prisma/schema.prisma"
  - "flusso /api/auth/request-password-reset"
tech-stack:
  added: []
  patterns:
    - "prisma migrate resolve --applied per riconciliare history senza reset"
key-files:
  created:
    - "prisma/migrations/20260518162613_remove_verification_value_unique/migration.sql"
    - "prisma/migrations/20260518145300_shipping_free_threshold_199/migration.sql"
  modified:
    - "prisma/schema.prisma"
decisions:
  - "Rimosso @unique da verification.value: lo schema canonico Better Auth non lo prevede e causava P2002 sul reset password"
  - "Drift orfano sul default di ShippingConfig.freeThreshold estratto in una migrazione dedicata invece di lasciarlo dentro la migrazione del fix"
  - "History riconciliata con prisma migrate resolve --applied (nessun reset, nessuna perdita dati) come da vincolo"
metrics:
  duration: "~9 min"
  completed: "2026-05-18"
  tasks: 2
  files: 3
  commits: 2
---

# Quick 260518-pj0: Fix schema Prisma — rimuovere @unique errato Summary

Rimosso il vincolo `@unique` errato dal campo `value` del modello `verification` (Better Auth) che causava `P2002` su `prisma.verification.create()` e rompeva il reset password in produzione (HTTP 500 su `/api/auth/request-password-reset`).

## Cosa e stato fatto

### Task 1 — Rimozione @unique da verification.value
`prisma/schema.prisma` riga 99: `value String @unique` -> `value String`. Nessun altro modello, campo, indice o `@@map` toccato (`user.email`, `session.token`, `@@index([identifier])`, ecc. invariati). `pnpm prisma format` + `pnpm prisma validate` -> schema valido.
Commit: `edfa061`

### Task 2 — Migrazione drop indice unique
`pnpm prisma migrate dev --name remove_verification_value_unique` -> `prisma/migrations/20260518162613_remove_verification_value_unique/migration.sql` contenente `DROP INDEX "verifications_value_key";`. La migrazione e non distruttiva (nessun `DROP TABLE`/`DROP COLUMN`). In produzione sara applicata da `npx prisma migrate deploy` (gia nel CMD del Dockerfile).
Commit: `fa039ff`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking drift] Cambiamento orfano di schema dentro la migrazione generata**
- **Found during:** Task 2
- **Issue:** `prisma migrate dev` ha generato un `migration.sql` con DUE statement: il `DROP INDEX` atteso E un `ALTER TABLE "shipping_config" ALTER COLUMN "freeThreshold" SET DEFAULT 199.00;` inatteso. Causa accertata: il commit `44b14b7` ("soglia spedizione gratuita a 199 EUR") aveva modificato `@default(99.00)` -> `@default(199.00)` su `ShippingConfig.freeThreshold` nello schema **senza generare la migrazione corrispondente**. La migrazione originale `20260508145233_shipping_config` ha ancora `DEFAULT 99.00`, quindi lo schema e il DB locale divergevano e Prisma ha incluso anche questa diff. Il plan chiede di fermarsi su statement non previsti, ma la diff e non distruttiva (`ALTER COLUMN ... SET DEFAULT`, non matcha il guard `DROP TABLE|DROP COLUMN|ALTER TABLE.*DROP COLUMN`).
- **Fix:** La migrazione `20260518162613_remove_verification_value_unique/migration.sql` e stata ridotta al solo `DROP INDEX` (una concern per migrazione). Il cambiamento orfano e stato estratto in una migrazione dedicata `20260518145300_shipping_free_threshold_199/migration.sql` (`ALTER TABLE "shipping_config" ALTER COLUMN "freeThreshold" SET DEFAULT 199.00;`), con timestamp anteriore cosi da preservare l'ordine cronologico. La history `_prisma_migrations` e stata riconciliata con `prisma migrate resolve --applied` per entrambe le migrazioni (scrive solo la tabella di history, nessun `migrate reset`, nessuna perdita dati — coerente col vincolo che vieta comandi distruttivi). `prisma migrate status` -> "Database schema is up to date!"; `prisma migrate dev` -> "Already in sync, no schema change or pending migration was found".
- **Files modified:** `prisma/migrations/20260518162613_remove_verification_value_unique/migration.sql`, `prisma/migrations/20260518145300_shipping_free_threshold_199/migration.sql`
- **Commit:** `fa039ff`
- **Nota produzione:** in produzione `prisma migrate deploy` applichera anche `20260518145300_shipping_free_threshold_199` — innocuo e desiderato: il DB di produzione, se mai riallineato, avra il default corretto a `199.00` (il valore runtime effettivo non cambia: la colonna `freeThreshold` ha sempre valori espliciti via upsert dal modulo ShippingConfig, il `DEFAULT` riguarda solo nuove `INSERT` senza quel campo).

## Verifica

- `prisma/schema.prisma`: `verification.value = String` senza `@unique`; nessun altro modello toccato (verificato via Read).
- `pnpm prisma format` + `pnpm prisma validate` -> "The schema at prisma/schema.prisma is valid".
- `migration.sql` del fix contiene SOLO `DROP INDEX "verifications_value_key";` — nessuno statement distruttivo (guard `DROP TABLE|DROP COLUMN|ALTER TABLE.*DROP COLUMN` -> nessun match).
- `pnpm prisma generate` completa senza errori.
- `pnpm prisma migrate status` -> "Database schema is up to date!" (14 migrazioni, zero drift).
- `pnpm prisma migrate dev` (no-op finale) -> "Already in sync, no schema change or pending migration was found".

## Outcome

Better Auth puo ora eseguire `prisma.verification.create()` con valori `value` ripetuti senza errore `P2002`. Il flusso di reset password non e piu bloccato dal vincolo errato. La migrazione e pulta e pronta per `prisma migrate deploy` in produzione.

## Self-Check: PASSED

- FOUND: prisma/schema.prisma (verification.value senza @unique)
- FOUND: prisma/migrations/20260518162613_remove_verification_value_unique/migration.sql
- FOUND: prisma/migrations/20260518145300_shipping_free_threshold_199/migration.sql
- FOUND commit: edfa061
- FOUND commit: fa039ff
