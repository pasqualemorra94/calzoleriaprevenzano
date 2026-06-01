---
phase: quick-260601-rcf
plan: 01
subsystem: payments
tags: [stripe, checkout, paypal, klarna, webhook]
requires:
  - "src/lib/stripe.server.ts (stripe client)"
  - "Prisma model Payment (method String? libero)"
  - "Config Stripe dashboard pmc_1RdLHmEX5xHVNQD4DXYk2phK (PayPal+Klarna attivi)"
provides:
  - "createCheckoutSession con payment_method_types esplicito card+paypal+klarna"
  - "handleCheckoutComplete che registra il metodo di pagamento reale nel record Payment"
affects:
  - "Stripe Checkout hosted (opzioni di pagamento offerte al cliente)"
  - "Record Payment (campo method) per backoffice/ordini"
tech-stack:
  added: []
  patterns:
    - "Narrowing su Stripe.PaymentIntent.latest_charge (string | Stripe.Charge | null)"
    - "expand latest_charge.payment_method_details per derivare il metodo reale"
    - "Fallback robusto 'card' su errore/indeterminato — il webhook non fallisce"
key-files:
  created: []
  modified:
    - "src/lib/orders.server.ts"
    - "src/lib/webhook-stripe.server.ts"
decisions:
  - "payment_method_types esplicito (card+paypal+klarna) invece di dynamic payment methods, per evitare metodi region-specific (Bancontact/iDEAL/EPS/BLIK) ai clienti"
  - "Nessuna migration Prisma: il campo method è String? libero, accetta 'paypal'/'klarna' senza enum"
  - "stripePaymentId mantenuto come session.payment_intent as string (corretto per l'evento checkout.session.completed)"
metrics:
  duration: "~3 min"
  completed: "2026-06-01"
  tasks: 3
  files: 2
---

# Phase quick-260601-rcf Plan 01: Aggiungere PayPal e Klarna come metodi di pagamento Summary

Abilitato card + PayPal + Klarna nel Checkout Stripe hosted (forma esplicita) e derivato il metodo di pagamento realmente usato dal PaymentIntent per registrarlo correttamente nel record Payment, con fallback robusto a "card".

## What Was Built

- **Task 1 — `src/lib/orders.server.ts`** (`createCheckoutSession`): `payment_method_types: ["card"]` → `["card", "paypal", "klarna"]`. Forma esplicita deliberata per evitare che metodi region-specific (Bancontact, iDEAL, EPS, BLIK, ecc.) compaiano ai clienti. Tutto il resto della chiamata `sessions.create` invariato (mode, line_items, metadata, customer_email, success_url, cancel_url). Commit `8b46780`.

- **Task 2 — `src/lib/webhook-stripe.server.ts`** (`handleCheckoutComplete`): aggiunto import runtime `import { stripe } from "~/lib/stripe.server"` (oltre all'esistente `import type Stripe`). Prima della `prisma.payment.create`, derivato il `paymentIntentId` (narrowing `typeof session.payment_intent === "string"`), recuperato il PaymentIntent con `stripe.paymentIntents.retrieve(id, { expand: ["latest_charge.payment_method_details"] })`, e ricavato `charge.payment_method_details?.type` con narrowing su `latest_charge` (`string | Stripe.Charge | null`). Il record Payment ora usa `method: paymentMethod` invece dell'hardcoded `"card"`. Su errore/indeterminato il fallback resta `"card"` e il webhook NON fallisce. Altri handler (PaymentSuccess/Failed/Refunded/InvoiceFailed) e logica idempotenza/email invariati. Commit `479742c`.

- **Task 3 — Typecheck di verifica** (nessuna modifica): `pnpm typecheck` non introduce nuovi errori sui due file del piano.

## Verification

- grep: `payment_method_types: ["card", "paypal", "klarna"]` presente in `orders.server.ts` (1 match, riga 445).
- grep: `webhook-stripe.server.ts` importa il client `stripe`, chiama `paymentIntents.retrieve`, usa `method: paymentMethod`, e NON ha più `method: "card"` hardcoded → script di verifica Task 2 stampa `OK`.
- typecheck: filtrato sui due file → "NESSUN ERRORE sui file del piano".
- Zero `any`: narrowing su `typeof` e `instanceof Error`, nessun cast non sicuro. Il `payment_method_types` array è tipizzato dal SDK Stripe senza necessità di cast; `payment_method_details?.type` già tipizzato come stringa dall'SDK.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. Nessun valore hardcoded/placeholder introdotto: il fallback `"card"` è una scelta di robustezza documentata nel piano (must_have: "Se il metodo non è determinabile, il record Payment cade sul fallback 'card' senza errori"), non uno stub.

## Notes operativi

- Commit locali atomici sul branch corrente `site-gen/calzoleria-prevenzano`. NESSUN `git push` eseguito (vincolo Railway — l'utente gestisce il push).
- Nessun cambiamento di schema Prisma (`method` è `String?` libero).
- Deferred ambiente invariato: `pnpm lint` rotto (`biome.json` incompatibile Biome 2.x) — fuori scope.

## Self-Check: PASSED
