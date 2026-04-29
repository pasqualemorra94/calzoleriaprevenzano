---
quick: 260429-e6n
title: Cleanup script for E2E test orders (marker-based)
date: 2026-04-29
commit: c12f8d4
branch: site-gen/calzoleria-prevenzano
files_added:
  - scripts/cleanup-e2e-orders.ts
files_modified:
  - package.json
---

# 260429-e6n — Cleanup script for E2E test orders (marker-based)

## One-liner

CLI locale `scripts/cleanup-e2e-orders.ts` che cancella dal DB Railway gli ordini creati dai test E2E, identificati via marker email guest hard-coded `e2e+%@test.calzoleriaprevenzano.it`. Default dry-run, `--execute` opt-in con countdown 5s e DATABASE_URL obbligatorio.

## Diff outline

**Aggiunto: `scripts/cleanup-e2e-orders.ts` (267 LOC)**

- `E2E_EMAIL_MARKER` const al top del file (mai da argv).
- `parseArgs(argv)` → `{ help, execute }` via `process.argv.includes("--execute" | "--help" | "-h")`.
- Pre-flight: `DATABASE_URL` obbligatorio → exit 1 se mancante; warning loud se URL non contiene "railway" né "prevenzano" (non blocca).
- Query Prisma: `prisma.order.findMany` con `AND[{ guestEmail.startsWith: "e2e+" }, { guestEmail.endsWith: "@test.calzoleriaprevenzano.it" }]`, mode insensitive. Select minimal (`id`, `orderNumber`, `guestEmail`, `total`, `createdAt`).
- Anteprima sempre stampata: count, somma `order.total`, oldest/newest con date, campione primi 10 orderNumber con email + data.
- Idempotenza: zero match → log `Nessun ordine di test trovato. Niente da fare.` + exit 0.
- Dry-run path (default): stampa anteprima + suggerimento `--execute`, exit 0. Nessuna scrittura.
- Execute path: countdown 5s con messaggio `Premi Ctrl-C entro Ns per annullare`, poi `prisma.order.deleteMany({ where: { id: { in: idsToDelete } } })`. Cascade DB (vedi sotto) elimina automaticamente OrderItem + Payment.
- Try/catch con `e: unknown` + narrowing su `Error.message`. `prisma.$disconnect()` in finally.
- Help text completo, italiano, esce con 0.

**Modificato: `package.json`**

- Aggiunto `"db:cleanup-e2e": "tsx scripts/cleanup-e2e-orders.ts"` nello script block, alfabetico tra gli altri `db:` (riordinati anche `db:reset` e `db:seed` per ordine alfabetico).

## Schema decision (cascade vs manual cleanup)

Ho letto `prisma/schema.prisma` PRIMA di scrivere il delete-path. FK rilevanti su `Order`:

| Relazione                       | onDelete             | Conseguenza                          |
|---------------------------------|----------------------|--------------------------------------|
| `Order` → `OrderItem.orderId`   | `Cascade` (line 412) | Auto-cancellati quando cancello Order |
| `Order` → `Payment.orderId`     | `Cascade` (line 435) | Auto-cancellati quando cancello Order |
| `OrderItem` → `Address.addressId` | (nessun cascade)   | Address NON toccato                   |
| `Order` → `user.userId`         | `Cascade` (su user.id, NOT on order)| Order ha `userId?` opzionale; cancellando Order non tocca lo user. Per gli ordini guest `userId` è null comunque. |

**Decisione: deleteMany su Order, basta.** Il cascade DB-level fa il resto. Non serve cancellare manualmente OrderItem né Payment.

**Address: lasciato intatto.** Anche se gli `OrderItem.addressId` puntano a qualche Address, il cascade lato `OrderItem→Address` è no-op (Address è il parent, non il figlio). Inoltre Address può essere riferita da altri OrderItem di ordini reali → cancellarli è rischioso. Strategia "leave them" come da plan.

## Sicurezza — audit

- Marker `E2E_EMAIL_MARKER` è `const` immutabile al top del file. Nessun branch lo legge da `argv`/`env`/`stdin`.
- Default dry-run: `args.execute = process.argv.includes("--execute")` parte `false`, e l'unico path che chiama `deleteMany` è dietro `if (!args.execute) { process.exit(0); }`.
- DATABASE_URL check duro (exit 1) — lo script non parte mai contro un DB sconosciuto.
- Sanity check soft sul nome host: warning ma non bloccante (per non rompere se Railway cambia naming).
- Countdown 5s prima del delete: l'utente può abortire con Ctrl-C dopo aver visto la preview.
- `deleteMany` usa `id: { in: idsToDelete }` — solo gli ID restituiti dalla query iniziale, mai filtri ampi.
- Re-read del file end-to-end prima del commit: nessuna invocazione automatica di `--execute`, nessun test runtime di `--execute`.

## Verifica

| Check                                                    | Risultato                            |
|----------------------------------------------------------|--------------------------------------|
| `pnpm tsx scripts/cleanup-e2e-orders.ts --help`          | OK — stampa usage + exit 0           |
| `pnpm typecheck` (errori SOLO nello script nuovo)        | 0 errori in `cleanup-e2e-orders.ts`  |
| `pnpm typecheck` (errori pre-esistenti `prodotti.$slug.tsx` etc.) | Invariati (noise pre-esistente) |
| Re-read end-to-end pre-commit                            | OK — marker hard-coded, no auto-execute |
| Test con `--execute`                                     | NON eseguito (è scelta dell'utente)  |

## Usage instructions per l'utente

**Prerequisito una-tantum**: esportare la `DATABASE_URL` di Railway nella shell corrente. Esempio (i comandi esatti dipendono dal tooling Railway che usi):

```bash
# Opzione A — Railway CLI
export DATABASE_URL="$(railway variables get DATABASE_URL)"

# Opzione B — copia manuale dalla dashboard Railway → Variables
export DATABASE_URL="postgres://user:pass@...railway.app:5432/railway"
```

Verifica con `echo $DATABASE_URL` (deve cominciare con `postgres://`).

**1. Dry-run (anteprima, sicuro)**:

```bash
pnpm db:cleanup-e2e
# oppure: pnpm tsx scripts/cleanup-e2e-orders.ts
```

Stampa: count, importo totale, oldest/newest, campione primi 10 orderNumber. Zero scritture sul DB.

**2. Help**:

```bash
pnpm tsx scripts/cleanup-e2e-orders.ts --help
```

**3. Execute (cancellazione reale)**:

```bash
pnpm tsx scripts/cleanup-e2e-orders.ts --execute
```

Stampa la stessa anteprima, poi countdown di 5 secondi (`Premi Ctrl-C entro Ns per annullare`), poi cancella. Il cascade DB pulisce automaticamente OrderItem e Payment.

**Nota deploy**: questo script gira **in locale** puntando al DB Railway via `DATABASE_URL`. Non richiede redeploy del sito Railway, non è un endpoint, non è esposto da nessuna parte. È un tool monouso di manutenzione.

## Self-Check: PASSED

- File creato: `scripts/cleanup-e2e-orders.ts` — verificato presente
- File modificato: `package.json` — verificato presente
- Commit `c12f8d4` — verificato in `git log`, pushato su `origin site-gen/calzoleria-prevenzano`
- `--help` invocato con successo (exit 0)
- Typecheck: zero nuove regressioni introdotte da questo lavoro
