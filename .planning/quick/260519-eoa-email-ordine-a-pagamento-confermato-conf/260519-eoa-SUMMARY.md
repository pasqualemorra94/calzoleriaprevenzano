---
phase: 260519-eoa
plan: 01
subsystem: orders / email
tags: [stripe-webhook, email, checkout, gdpr-adjacent]
requires:
  - "src/lib/email.server.ts (sendEmail)"
  - "src/lib/db.server.ts (prisma)"
  - "src/lib/logger.server.ts (createLogger)"
  - "Stripe webhook checkout.session.completed"
provides:
  - "orderNotificationTemplate — template HTML notifica titolare"
  - "sendOrderConfirmedEmails(orderId) — service invio email post-pagamento"
  - "EMAIL_ORDERS env — destinatario notifiche nuovi ordini"
affects:
  - "src/routes/api/checkout.ts (rimossi invii email pre-pagamento)"
  - "src/lib/webhook-stripe.server.ts (invio email a pagamento confermato)"
tech-stack:
  added: []
  patterns:
    - "Best-effort email send con try/catch separati per non far fallire il webhook"
    - "Service server-only dedicato per estrarre logica dal webhook (<150 LOC)"
key-files:
  created:
    - "src/lib/order-emails.server.ts"
  modified:
    - "src/lib/email-templates.server.ts"
    - "src/lib/webhook-stripe.server.ts"
    - "src/routes/api/checkout.ts"
    - ".env.example"
    - ".env (gitignored, aggiornato localmente)"
decisions:
  - "Email d'ordine inviate solo a pagamento confermato, non alla creazione ordine"
  - "Logica email estratta in order-emails.server.ts per tenere il webhook sotto 150 LOC"
metrics:
  duration: "~8 min"
  completed: "2026-05-19"
  tasks: 3
  files: 5
---

# Phase 260519-eoa Plan 01: Email ordine a pagamento confermato Summary

Le email d'ordine (conferma cliente + nuova notifica titolare) ora partono solo a
pagamento Stripe confermato (`checkout.session.completed`), non più alla creazione
dell'ordine pre-pagamento; l'invio è best-effort e non fa mai fallire il webhook.

## What Was Built

- **Task 1 — `orderNotificationTemplate`** (`email-templates.server.ts`): nuovo template
  HTML per il titolare con interfaccia `OrderNotificationData`. Riusa i helper esistenti
  (`premiumEmailLayout`, `dataRow`, `escapeHtml`, `formatCurrency`, `formatDate`,
  `emailBrand`). Mostra dati cliente (nome/email/telefono), indirizzo di spedizione e
  tabella articoli con totale. Nessun CTA negozio (mail interna).
- **Task 2 — `order-emails.server.ts`**: nuovo service server-only che esporta
  `sendOrderConfirmedEmails(orderId)`. Carica l'ordine con `include` user + items +
  items.address, deriva i dati reali dalla shape Prisma (indirizzo dal primo OrderItem,
  email = `guestEmail ?? user.email`, `Decimal` → centesimi), e invia conferma cliente +
  notifica titolare in due try/catch separati. Salta solo la notifica titolare se
  `EMAIL_ORDERS` non è configurata. Non lancia mai.
- **Task 3 — wiring**: `handleCheckoutComplete` invoca `sendOrderConfirmedEmails(orderId)`
  dopo aver creato il `Payment`, dentro un try/catch di sicurezza; il webhook restituisce
  sempre `status: 200`. Rimossi entrambi i blocchi di invio email pre-pagamento da
  `checkout.ts` (rami guest-shape e auth-shape) e gli import ora inutilizzati `sendEmail`
  e `orderConfirmationTemplate`. Aggiunta env `EMAIL_ORDERS` documentata in `.env.example`
  (e `.env` locale).

## Verification

- `pnpm typecheck`: **nessun errore** nei file toccati dal piano (verificato con filtro
  mirato). Errori residui solo in file pre-esistenti non correlati (vedi sotto).
- Controlli `grep` del Task 3: `EMAIL_ORDERS` presente in `.env.example`,
  `sendOrderConfirmedEmails` presente nel webhook, `checkout.ts` privo di
  `orderConfirmationTemplate` e `sendEmail`. Tutti **OK**.
- `webhook-stripe.server.ts`: 163 righe totali, di cui ~150 di codice (13 di header
  comment). La logica email è correttamente nel service dedicato.

## Deviations from Plan

### Auto-fixed Issues

Nessuna deviazione Rule 1-3 applicata al codice del piano. Il piano è stato eseguito
esattamente come scritto.

### Deferred Issues (out of scope)

Problemi pre-esistenti scoperti durante l'esecuzione, NON causati da questo piano.
Registrati in `deferred-items.md`, non corretti (scope boundary):

1. **`pnpm lint` non eseguibile — Biome config/CLI version mismatch.**
   `biome.json` ha schema `2.0.0` mentre il CLI installato è `2.4.6`; chiavi
   `organizeImports` e `files.ignore` non più valide. `biome check .` esce in errore
   prima di analizzare qualsiasi file. La verifica `pnpm lint` del Task 3 non è quindi
   completabile per cause estranee al piano. I file del piano sono comunque lint-clean:
   `pnpm typecheck` (tsconfig strict con `noUnusedLocals`/`noUnusedParameters`) copre
   già `noUnusedVariables` e `noExplicitAny` è rispettato (zero `any`). Fix suggerito:
   `npx biome migrate` (solo config, nessuna modifica di codice).
2. **Errori `pnpm typecheck` pre-esistenti** in `src/lib/validators/auth.ts`,
   `src/routes/api/admin/media.$id.ts`, `src/routes/api/admin/products.ts`,
   `src/routes/api/products.ts` (Zod v4 `z.literal`, import inutilizzato,
   `compareAtPrice` null/undefined). Indipendenti dal lavoro EOA.

## Known Stubs

Nessuno stub introdotto. Tutti i percorsi dati sono cablati su sorgenti reali
(Prisma order/items/address, env `EMAIL_ORDERS`).

## Notes for Next Phase

- `.env` di produzione (Railway) deve avere `EMAIL_ORDERS` impostata, altrimenti la
  notifica titolare viene saltata silenziosamente (con `log.warn`). La conferma cliente
  parte comunque.
- Considerare la correzione del Biome config (`npx biome migrate`) e degli errori
  typecheck pre-esistenti in un task di manutenzione separato.

## Commits

- `fd8e656` feat(260519-eoa-01): add orderNotificationTemplate for owner
- `9d5446f` feat(260519-eoa-01): add order-emails service for post-payment sends
- `9a4807f` feat(260519-eoa-01): send order emails on payment confirmation

## Self-Check: PASSED

Tutti i file (`order-emails.server.ts`, `email-templates.server.ts`,
`webhook-stripe.server.ts`, `checkout.ts`, `.env.example`) esistono. Tutti i commit
(`fd8e656`, `9d5446f`, `9a4807f`) presenti in git. Export chiave verificati.
