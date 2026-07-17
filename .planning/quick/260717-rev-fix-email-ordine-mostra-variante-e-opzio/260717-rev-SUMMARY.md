---
phase: quick-260717-rev
plan: 01
subsystem: email
tags: [email, orders, variants, customization, security]
requires:
  - "OrderItem.variantName (String?) e OrderItem.selectedOptions (Json?) già persistiti"
provides:
  - "Email conferma cliente + notifica titolare mostrano variante e opzioni sotto ogni articolo"
  - "Swatch colore inline sanitizzato (hex-only) per le opzioni con colore"
affects:
  - src/lib/email-templates.server.ts
  - src/lib/order-emails.server.ts
tech-stack:
  added: []
  patterns:
    - "Sanitizzazione colore hex-only (regex ^#[0-9a-fA-F]{3,8}$) prima dell'inserimento nello style"
    - "escapeHtml su ogni testo dinamico (variantName, label, value)"
    - "Narrowing tipizzato Json → Array<{label,value,color?}> | null (no any)"
key-files:
  created: []
  modified:
    - src/lib/email-templates.server.ts
    - src/lib/order-emails.server.ts
decisions:
  - "Helper itemDetailLines condiviso tra i due template per evitare duplicazione"
  - "Swatch omesso (non iniettato) se il colore non è un hex valido: difesa da injection"
metrics:
  duration: "~2 min"
  completed: "2026-07-17"
  tasks: 2
  files: 2
  commits: 2
---

# Phase quick-260717-rev Plan 01: Fix email ordine — variante e opzioni Summary

Le email d'ordine (conferma cliente + notifica titolare) ora mostrano, sotto ogni articolo, la variante selezionata (`variantName`) e ogni opzione di personalizzazione (`label: value`), con uno swatch di colore inline quando l'opzione definisce un colore hex valido.

## What Was Built

Prima, il layer email scartava `variantName` e `selectedOptions` di `OrderItem` (visibili in admin ma persi nelle mail). Ora entrambe le mail riportano queste informazioni.

### Task 1 — Template email (`src/lib/email-templates.server.ts`, commit `9a0b8ec`)
- Estese le interfacce `OrderEmailData.items` e `OrderNotificationData.items` (stessa shape) con `variantName?: string | null` e `selectedOptions?: Array<{ label: string; value: string; color?: string }> | null`.
- Nuovo helper module-private `safeHexColor(color)`: consente SOLO hex `#RGB`/`#RRGGBB`/`#RRGGBBAA` (regex `^#[0-9a-fA-F]{3,8}$`), altrimenti `null`.
- Nuovo helper module-private `itemDetailLines(item)`: renderizza le sotto-righe di UN articolo (variante + opzioni), riusato da entrambi i template. `escapeHtml` su tutto il testo dinamico; swatch inline con `background:${hex}` solo se `safeHexColor` ha validato il colore.
- Chiamata `itemDetailLines(item)` inserita sotto la riga nome+quantità, dentro la stessa `<td>`, in `orderConfirmationTemplate` (riga ~277) e `orderNotificationTemplate` (riga ~359). Struttura tabellare e colonna prezzo invariate.

### Task 2 — Servizio email (`src/lib/order-emails.server.ts`, commit `3fa9077`)
- Il `.map` che costruisce `items` ora popola `variantName: i.variantName` e `selectedOptions` con narrowing tipizzato (identico al pattern canonico di `admin-orders.server.ts:156`), zero `any`.
- Lo stesso array `items` alimenta sia `orderConfirmationTemplate` sia `orderNotificationTemplate`: singola modifica → entrambe le mail. Nessun `include` Prisma aggiunto (colonne scalari già nel risultato).

## Security Notes

- Il colore entra nello `style` SOLO dopo `safeHexColor` (regex hex): non può contenere `;`, `<`, `"` o altre sequenze di injection. Un colore non valido → swatch omesso.
- `variantName`, `label` e `value` passano sempre da `escapeHtml`.

## Verification

- `npx tsc --noEmit` — zero errori sui 2 file toccati (baseline pre-esistente su questi file: 0, invariata). Build/lint reali demandati al CI Railway (rotti in locale per version skew / Biome 2.x, come da vincolo del task).
- Grep di coerenza: `variantName` e `selectedOptions` presenti in entrambe le interfacce, negli helper e nel mapping; `itemDetailLines` chiamato in entrambi i template.

## Deviations from Plan

None - plan executed exactly as written.

## Constraints Respected

- Nessun push, nessun deploy, nessuna modifica a DB/schema/migration.
- Zero `any`, zero hex hardcoded negli stili (i colori swatch vengono dai dati, sanitizzati).
- `customerNote` / "Note personalizzazione" non toccati (fuori scope).
- Commenti in italiano (convenzione CLAUDE.md).

## Self-Check: PASSED

- FOUND: src/lib/email-templates.server.ts
- FOUND: src/lib/order-emails.server.ts
- FOUND: .planning/quick/260717-rev-.../260717-rev-SUMMARY.md
- FOUND: commit 9a0b8ec (Task 1)
- FOUND: commit 3fa9077 (Task 2)
