---
phase: quick-260601-q8r
plan: 01
subsystem: scripts/migration
tags: [migration, variant-config, prisma, cli, data-cleanup]
requires: []
provides:
  - "scripts/remove-bruciato-option.ts — CLI di migrazione dry-run/execute per rimuovere l'opzione variante Bruciato"
affects:
  - "Product.variantConfig (a runtime, solo con --execute)"
  - "VariantTemplate.config (a runtime, solo con --execute)"
tech-stack:
  added: []
  patterns:
    - "Script CLI dry-run-by-default + flag --execute (pattern populate-and-cleanup-prod-images.ts)"
    - "Tipi variante ridefiniti localmente (tsx non risolve alias ~/)"
    - "Type guard runtime isVariantConfig prima di ogni cast (zero any)"
    - "JSON.parse(JSON.stringify(...)) per InputJsonValue compatibile Prisma"
key-files:
  created:
    - scripts/remove-bruciato-option.ts
  modified: []
decisions:
  - "Gruppi svuotati dal filtro NON vengono eliminati: lasciati con options=[] e segnalati come warning"
  - "Match label.trim().toLowerCase() === 'bruciato' → preserva 'Marrone bruciato'"
  - "Lo script NON è stato eseguito contro alcun DB: solo scritto + typecheck (l'utente lo lancia manualmente)"
metrics:
  duration: "~4 min"
  completed: "2026-06-01"
  tasks: 1
  files: 1
  commits: 1
---

# Phase quick-260601-q8r Plan 01: Script migrazione rimozione opzione variante Bruciato Summary

Script CLI di migrazione `scripts/remove-bruciato-option.ts` che rimuove l'opzione variante colore "Bruciato" da `Product.variantConfig` e `VariantTemplate.config`, dry-run di default, type-safe (zero any), idempotente — solo scritto e type-checkato, NON eseguito contro alcun DB.

## What Was Built

Un singolo file TypeScript (243 LOC) eseguibile con `npx tsx`:

- **Dry-run di default**: nessuna scrittura senza il flag `--execute`. Le chiamate `prisma.*.update` sono gated su `isExecute`.
- **Match esatto**: rimuove solo le option con `label.trim().toLowerCase() === "bruciato"` → "Marrone bruciato" resta intatto.
- **Due target**: itera `prisma.product.findMany({ where: { variantConfig: { not: null } } })` (nullable) e `prisma.variantTemplate.findMany()` (config non nullable).
- **Type guard difensivo** `isVariantConfig(value: unknown): value is VariantConfig`: parte da `unknown`, restringe con controlli espliciti (`groups` array, ogni `group.options` array), zero cast ciechi. Su forma inattesa → skip + warning.
- **Funzione pura** `stripBruciato(config)`: non muta l'input, ritorna `{ config, removed, affectedGroups, emptiedGroups }`. I gruppi svuotati dal filtro NON vengono eliminati (lasciati con `options: []`), solo segnalati come warning.
- **Sicurezza**: guard su `DATABASE_URL` (exit 1 se assente), `maskDbHost` stampa solo l'hostname (mai user/password), `prisma.$disconnect()` in `finally`, `main().catch(...)` in coda.
- **Idempotente**: dopo un `--execute`, un secondo run rimuove 0 opzioni.
- **Doc-comment** con esempi d'uso locale e Railway (`railway run --service Postgres -- bash -c 'DATABASE_URL=$DATABASE_PUBLIC_URL ...'`).

## Verification Results

| Check | Comando | Esito |
| --- | --- | --- |
| Typecheck file | `npx tsc --noEmit \| grep remove-bruciato-option.ts` | 0 match (EXIT_NO_MATCH=1) — nessun errore sul file |
| Zero any | `grep -nE ": any\|as any" scripts/remove-bruciato-option.ts` | 0 match |
| Mutazioni presenti | `grep -c "prisma.product.update\|prisma.variantTemplate.update"` | 2 |
| findMany presenti | `grep -cE "prisma\.(product\|variantTemplate)\.findMany"` | 2 |
| LOC | `wc -l` | 243 (≥120) |
| $disconnect | `grep -c '\$disconnect'` | 1 (in finally) |
| Script eseguito | — | NO — nessun `tsx scripts/remove-bruciato-option.ts` lanciato |

Nota ambiente: il typecheck globale del worktree fresco è gonfio (routeTree.gen.ts/@prisma/@playwright non generati), ma il grep filtrato conferma **zero errori imputabili al nuovo file**. Questi errori d'ambiente sono pre-esistenti e verranno risolti dal CI Railway.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

Nessuno. Lo script è completo e funzionale; l'unica azione differita (per design del piano) è l'esecuzione manuale dell'utente contro il DB (locale e/o Railway).

## Self-Check: PASSED

- FOUND: scripts/remove-bruciato-option.ts
- FOUND: commit 3147013
