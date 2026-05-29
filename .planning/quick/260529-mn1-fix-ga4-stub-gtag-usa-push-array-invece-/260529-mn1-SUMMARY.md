---
phase: quick-260529-mn1
plan: 01
subsystem: analytics
tags: [ga4, gtag, analytics, bugfix]
requires: []
provides:
  - "Stub gtag che spinge l'oggetto arguments nativo (pattern ufficiale Google) → GA4 invia /collect"
affects:
  - src/components/shared/GoogleAnalytics.tsx
tech-stack:
  added: []
  patterns:
    - "gtag stub: function gtag(){ dataLayer.push(arguments) } con cast (...args: unknown[]) => void per zero-any"
key-files:
  created: []
  modified:
    - src/components/shared/GoogleAnalytics.tsx
decisions:
  - "Funzione senza parametri tipizzati + cast esplicito sull'assegnazione invece di rest-param, per usare l'oggetto arguments nativo richiesto da gtag.js"
  - "biome-ignore lint/style/noArguments inline (lint project-wide rotto, ma il commento resta corretto per il CI Railway)"
metrics:
  duration: "~3 min"
  completed: "2026-05-29"
  tasks: 1
  files: 1
requirements: [GA4-FIX-01]
---

# Quick 260529-mn1: Fix stub gtag (push arguments invece di array) Summary

Corretto lo stub di `gtag` in `GoogleAnalytics.tsx`: ora spinge l'oggetto `arguments` nativo nel `dataLayer` (pattern ufficiale Google `function gtag(){ dataLayer.push(arguments); }`) invece di un array di rest-param `args`, ripristinando l'invio dei dati a GA4 (tid=G-VBM6E09LBH).

## Cosa è stato fatto

**Task 1 — Correggi lo stub gtag** (commit `ed6d2c0`)

Unico fix sostanziale, righe 45-50 di `src/components/shared/GoogleAnalytics.tsx`:

```diff
-        function gtag(...args: unknown[]): void {
-          (window.dataLayer as unknown[]).push(args);
-        };
+        (function gtag(): void {
+          // biome-ignore lint/style/noArguments: gtag.js richiede l'oggetto arguments nativo (pattern ufficiale Google), non un array — vedi diagnosi /collect
+          (window.dataLayer as unknown[]).push(arguments);
+        } as (...args: unknown[]) => void);
```

Perché funziona: gtag.js a valle ispeziona gli oggetti `arguments` (array-like con `callee`) per riconoscere i comandi `js`/`config`. Un array normale (`push(args)`) veniva ignorato → 0 richieste `/collect`. Con `push(arguments)` il config viene processato e GA4 invia i dati. Diagnosi già confermata empiricamente via Playwright sul sito live (0 vs 2 richieste `/collect`).

Vincoli rispettati:
- **Zero `any`**: funzione dichiarata senza parametri (`function gtag(): void`) + cast esplicito sull'assegnazione a `(...args: unknown[]) => void` (parametri in meno sono assegnabili, e il cast soddisfa TS sull'uso di `arguments` con `noImplicitAny`). Nessun `any`/`as any` nel diff.
- **biome-ignore** `lint/style/noArguments` inline sopra la riga che usa `arguments`, commento in italiano.
- **Tutto il resto invariato**: consent gating (`loadScriptWithConsent`), logging diagnostico `[GA4]`, idempotenza injection dello script, config (`anonymize_ip` / `allow_google_signals: false` / `allow_ad_personalization_signals: false`), listener `consent-update` di revoke. Il diff netto tocca solo il corpo dello stub + commento + cast.

## Verifica

- `grep -n "dataLayer.*push(arguments)"` → match a riga 49 (nuovo pattern presente).
- `grep -c "push(args)"` → 0 (vecchio pattern rimosso).
- `grep -n "biome-ignore lint/style/noArguments"` → match a riga 48.
- Zero `any`/`as any` nel file.
- `pnpm typecheck` → **0 errori su `GoogleAnalytics.tsx`** (verificato due volte).

## Deviazioni dal Plan

Nessuna — plan eseguito esattamente come scritto.

## Note ambientali (non regressioni)

Il conteggio totale `pnpm typecheck` in questo worktree mostra ~310 errori (non i 26 di baseline) perché il worktree è fresco: `src/routeTree.gen.ts` è gitignored e non ancora generato (cascata di ~24 errori sui file di rotta), `@prisma/client` non generato (`PrismaClient` non esportato in `prisma/seed*.ts`), `@playwright/test` non installato (`playwright.config.ts`). Sono tutti artefatti di generazione/installazione fuori scope, non regressioni di codice — verranno risolti dal CI Railway che esegue `prisma generate` + generazione `routeTree.gen.ts` al deploy. La metrica rilevante per questo plan (0 errori sul file GA4) è verde.

`pnpm lint` non eseguito: rotto project-wide (`biome.json` incompatibile con Biome 2.x — problema PRE-ESISTENTE documentato in STATE.md). Il commento `biome-ignore` resta corretto per quando il lint verrà ripristinato e per il CI.

## Verifica funzionale post-deploy (manuale, a carico utente)

Dopo l'auto-deploy Railway del branch `site-gen/calzoleria-prevenzano`:
1. Aprire `calzoleriaprevenzano.it`, accettare il consenso analytics.
2. DevTools → Network → filtrare `collect` → deve comparire ≥1 richiesta a `google-analytics.com/g/collect` con `tid=G-VBM6E09LBH`.
3. In alternativa: GA4 Realtime (proprietà 273888156) deve registrare la sessione.

## Self-Check: PASSED

- File `src/components/shared/GoogleAnalytics.tsx` → FOUND
- Commit `ed6d2c0` → FOUND
