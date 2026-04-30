---
phase: quick/260430-of1
plan: 01
subsystem: legal/analytics
tags: [gdpr, cookie-consent, ga4, analytics, schrems-ii, scc, conversion-tracking]
requires:
  - Wave 1 GDPR cookie compliance gia' live (CookieBanner mounted, /api/cookie-consent endpoint, ConsentLog persistence) — quick/260430-nzh
  - src/lib/cookieConsent.ts (loadScriptWithConsent + hasConsent + dispatchConsentUpdate) — pre-esistente
  - src/routes/api/orders.by-session.ts (response shape: orderNumber, total in EUR, items con price/quantity/name) — pre-esistente
provides:
  - GA4 gtag.js loader gated da consenso analytics (Consent Mode v2 "basic": no GA prima del consenso, no denied pings)
  - Componente <GoogleAnalytics /> auto-disattivante (no-op) se VITE_GA4_MEASUREMENT_ID assente o vuoto
  - Conversion tracking purchase event in /ordine-confermato post Stripe redirect, idempotente via useRef
  - Listener consent-update con reload su revoca analytics post-load (cleanup cookie _ga)
  - Policy /cookie + /privacy allineate a GA4 reale (zero menzioni Plausible mai installato)
  - Disclaimer Schrems II (CGUE C-311/18) + SCC art. 46 GDPR per trasferimenti USA via Google Ireland Limited
affects:
  - src/routes/__root.tsx (mount component, gate !isAdmin)
  - src/components/shared/index.ts (barrel export aggiornato)
  - src/routes/ordine-confermato.tsx (purchase event con guard hasConsent + idempotency ref)
  - src/routes/cookie.tsx (sezione 4 riformulata)
  - src/routes/privacy.tsx (sezione E + nuovo paragrafo Schrems II in sezione 8)
  - .env.example (VITE_GA4_MEASUREMENT_ID con commento no-op)
tech-stack:
  added: []  # nessuna nuova dipendenza, usa solo Vite env + DOM API + cookieConsent.ts esistente
  patterns:
    - "Side-effect-only React component (return null + useEffect)"
    - "Type augmentation cross-file via declare global { interface Window {...} }"
    - "useRef<boolean> guard per idempotenza StrictMode dev double-fire"
    - "Consent Mode v2 basic mode (no early gtag('consent','default') call)"
key-files:
  created:
    - src/components/shared/GoogleAnalytics.tsx (76 LOC, side-effect-only, zero any)
  modified:
    - src/components/shared/index.ts (+1 LOC barrel export)
    - src/routes/__root.tsx (+2 -1 LOC: import + mount JSX)
    - src/routes/ordine-confermato.tsx (+23 -1 LOC: import + ref + useEffect dedicato)
    - src/routes/cookie.tsx (+8 -4 LOC: paragrafo sezione 4 riformulato)
    - src/routes/privacy.tsx (+3 -1 LOC sezione E; +3 LOC nuovo paragrafo Schrems II in sezione 8)
    - .env.example (+3 LOC sezione Analytics)
decisions:
  - "Consent Mode v2 BASIC (non advanced): nessuna chiamata a gtag('consent','default',{analytics_storage:'denied'}) prima del consenso. GA non si carica affatto finche' analytics false. Niente denied pings, zero superficie legale incerta."
  - "Mount <GoogleAnalytics /> con gate !isAdmin (coerente con Footer/CookieBanner/MegaMenu) — belt-and-suspenders dato che il componente e' comunque no-op senza consenso o env var."
  - "useRef<boolean>(false) per idempotenza purchase event invece di useState — non rerender-triggering, semantica corretta per side-effect guard."
  - "item_id derivato come `${orderNumber}-${idx}` — la response shape /api/orders/by-session non espone product id, l'estensione sarebbe out-of-scope. Item_id univoco per transaction garantito comunque."
  - "Reload (non gtag('consent','update')) su revoca analytics — pulisce cookie _ga al prossimo paint perche' GA non si ricarica senza consenso. Approccio semantico, nessun pendente."
  - "Type augmentation window.gtag/dataLayer via declare global cross-file: ordine-confermato.tsx eredita i tipi senza side-effect import (typecheck conferma)."
metrics:
  duration: "7m 18s (438s)"
  completed: "2026-04-30T15:48:00Z"
  tasks: 5
  files: 7  # 1 nuovo + 6 modificati
  loc_delta: "+115 / -7"
---

# Quick 260430-of1: Wave 2 GDPR/Cookie Compliance — GA4 con Consent Mode v2

GA4 gtag.js loader gated da consenso analytics (Consent Mode v2 "basic"), purchase conversion event in `/ordine-confermato` con idempotenza ref, allineamento policy `/cookie` + `/privacy` (rimossa Plausible mai installata, aggiunto disclaimer Schrems II + SCC art. 46 GDPR per trasferimenti dati extra-UE via Google Ireland Limited).

## Commit Atomici (5)

| # | Hash | Message | File |
|---|------|---------|------|
| 1 | `809f717` | `feat(analytics): GoogleAnalytics component gated by consent` | `src/components/shared/GoogleAnalytics.tsx` (NEW), `src/components/shared/index.ts` |
| 2 | `d359f7a` | `feat(legal): mount GA4 in root layout` | `src/routes/__root.tsx` |
| 3 | `c76d40d` | `chore(env): add VITE_GA4_MEASUREMENT_ID example` | `.env.example` |
| 4 | `5dfd425` | `feat(analytics): purchase conversion event in ordine-confermato` | `src/routes/ordine-confermato.tsx` |
| 5 | `834e6fe` | `docs(legal): align cookie/privacy policy to GA4 + Schrems II disclaimer` | `src/routes/cookie.tsx`, `src/routes/privacy.tsx` |

## File Impattati (7)

| File | Tipo | LOC delta | Note |
|------|------|-----------|------|
| `src/components/shared/GoogleAnalytics.tsx` | NEW | +76 | Side-effect-only component, zero any, no-op se env var assente |
| `src/components/shared/index.ts` | MOD | +1 | Barrel export `GoogleAnalytics` |
| `src/routes/__root.tsx` | MOD | +2 / -1 | Import + mount JSX gated `!isAdmin` |
| `src/routes/ordine-confermato.tsx` | MOD | +23 / -1 | Import `useRef`/`hasConsent`, ref guard, useEffect purchase event |
| `src/routes/cookie.tsx` | MOD | +8 / -4 | Sezione 4 paragrafo Plausible → GA4 |
| `src/routes/privacy.tsx` | MOD | +6 / -1 | Sezione E Plausible → GA4; nuovo paragrafo Schrems II in sezione 8 |
| `.env.example` | MOD | +3 | Sezione Analytics + `VITE_GA4_MEASUREMENT_ID` con commento no-op |

**Totale: +115 / -7 LOC, 1 file nuovo, 6 modificati.**

## Verifiche Eseguite

### Typecheck (blocking)

```
pnpm typecheck → 25 errori (baseline preservata)
```

Baseline pre-task: 25 errori (pre-esistenti da `secure-auth-sdk` validators + product compareAtPrice + media/admin TS6133).
Baseline post-task: 25 errori. **Zero nuove regressioni introdotte da questo wave.**

### Anti-regressione zero-any

```
grep -nE ":\s*any\b|as any\b" src/components/shared/GoogleAnalytics.tsx → 0 match
grep -nE ":\s*any\b|as any\b" src/routes/ordine-confermato.tsx → 0 match
```

### Anti-Plausible (verifica policy alignment)

```
grep -i "plausible" src/routes/cookie.tsx src/routes/privacy.tsx → 0 match
```

### Verifiche assertive su contenuti policy

```
grep -E "Google Analytics 4 \(GA4\)" src/routes/cookie.tsx → MATCH
grep -E "Standard Contractual Clauses" src/routes/privacy.tsx → MATCH
grep -E "Schrems II" src/routes/privacy.tsx → MATCH
grep -E "Google Ireland" src/routes/privacy.tsx → MATCH
grep -E "art\. 46.*GDPR" src/routes/privacy.tsx → MATCH (2 occorrenze: Stripe pre-esistente + nuovo paragrafo GA4)
```

### Smoke browser end-to-end (DEFERRED utente)

Lo spec dichiara che la verifica end-to-end di GA4 richiede:
1. Property GA4 creata su [analytics.google.com](https://analytics.google.com) con web stream `https://calzoleriaprevenzano.it`
2. `Measurement ID` (`G-XXXXXXXX`) settato come Railway env var `VITE_GA4_MEASUREMENT_ID`
3. DevTools incognito + GA4 Realtime dashboard per validare hit pageview + evento purchase

**Senza setup utente** (env var assente in dev locale): componente e' no-op, zero richieste a `googletagmanager.com` confermato per costruzione (early-return `if (!MEASUREMENT_ID) return;` in entrambi gli useEffect).

## Stato Push

**ESEGUITO** — Railway autodeploy attivo, utente ha autorizzato esplicitamente push a `origin/site-gen/calzoleria-prevenzano`.

5 commit atomici (`809f717..834e6fe`) avanzano `site-gen/calzoleria-prevenzano`. Railway redeploy automatico al push.

## Cosa serve all'utente per attivare GA4 in produzione

1. **Creare property GA4 "Calzoleria Prevenzano"** su [https://analytics.google.com](https://analytics.google.com)
   - Tipo: web stream
   - URL: `https://calzoleriaprevenzano.it`
   - Nome stream: "Calzoleria Prevenzano — Production"
2. **Copiare il Measurement ID** dalla pagina della property (formato `G-XXXXXXXX`)
3. **Settare la env var su Railway**:
   - Vai su Railway → Project → Service → Variables
   - Aggiungi `VITE_GA4_MEASUREMENT_ID=G-XXXXXXXX` (sostituisci con il valore reale)
   - Save → Railway redeploy automatico (~2 min)
4. **Verifica end-to-end** (post deploy):
   - Apri sito prod in incognito → "Rifiuta tutto" sul banner cookie → DevTools Network: ZERO richieste a `googletagmanager.com`
   - Apri sito prod in incognito → "Accetta tutti" → reload → Network mostra `gtag/js?id=G-...` + `g/collect` parte. Cookie `_ga` e `_ga_<container>` presenti.
   - GA4 Realtime dashboard mostra il device entro 30s
   - Acquista prodotto test → su `/ordine-confermato` → GA4 Realtime → tab "Eventi" mostra `purchase` con `transaction_id` corretto (formato `PRV-YYYYMMDD-XXXX`)
   - Footer "Gestisci preferenze cookie" → rifiuta analytics → reload → cookie `_ga` rimossi al primo render senza GA

**Senza setup utente**: il sito funziona normalmente, `<GoogleAnalytics />` e' un no-op completo (zero side effect, zero richieste, zero log errori).

## Wave 3 Status

**DEFERRED** come da spec `docs/superpowers/specs/2026-04-30-gdpr-cookie-compliance-design.md` (sezione "Wave 3 — Diritti GDPR + Newsletter compliance").

Scope Wave 3 (~1 giorno di lavoro):
- `/account/privacy` page con sezioni: scarica dati, cancella account, storico consensi
- `POST /api/user/export` con full data dump JSON (rate limit 3/day, `DataRequest` audit)
- `POST /api/user/delete` con pseudo-anonimizzazione transazionale (mantiene Order per obbligo fiscale 10 anni DPR 633/72)
- Audit log consensi extra: signup → `ConsentLog { type: "privacy"/"marketing" }`
- Newsletter double opt-in (richiede migration `NewsletterSubscription` con token + status)
- Pannello admin `/admin/consensi` read-only consent log

Wave 3 ha valore standalone, non blocca Wave 1+2 deployati.

## Deviazioni dal Plan

**Nessuna.** Plan eseguito esattamente come scritto. Zero deviazioni Rule 1/2/3, zero blockers, zero auth gates. Tutti i task verificati con assertion grep + typecheck baseline preservata.

## Self-Check: PASSED

- [x] `src/components/shared/GoogleAnalytics.tsx` esiste (76 LOC, ~80 LOC target rispettato)
- [x] `src/components/shared/index.ts` esporta `GoogleAnalytics`
- [x] `src/routes/__root.tsx` importa + monta `<GoogleAnalytics />` con gate `!isAdmin`
- [x] `.env.example` contiene `VITE_GA4_MEASUREMENT_ID` con commento no-op
- [x] `src/routes/ordine-confermato.tsx` spara `gtag('event', 'purchase', {...})` con guard `hasConsent` + `useRef` idempotency
- [x] `src/routes/cookie.tsx` zero menzioni Plausible, descrive GA4 con flag `allow_google_signals:false` + `allow_ad_personalization_signals:false`
- [x] `src/routes/privacy.tsx` zero menzioni Plausible, contiene paragrafo Schrems II in sezione 8 con: Google Ireland Limited, SCC, art. 46 GDPR, art. 6.1.a GDPR, sentenza CGUE C-311/18
- [x] `pnpm typecheck` baseline 25 → 25 (zero regressioni)
- [x] 5 commit atomici italiani con messaggi spec-aligned
- [x] Tutti i commit verificati con `git log --oneline -6`
