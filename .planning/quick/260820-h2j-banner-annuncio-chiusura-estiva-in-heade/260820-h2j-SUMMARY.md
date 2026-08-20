---
quick_id: 260820-h2j
date: 2026-08-20
status: complete
commits: 2744b87, 03776b2, 728a8ad
---

# Quick 260820-h2j — Banner annuncio chiusura estiva (SUMMARY)

## Cosa è stato fatto

Striscia di annuncio full-width in cima all'header, sopra microbar desktop e barra
mobile, con testo `Chiusura estiva — gli ordini effettuati ora verranno evasi a
partire dal 1° settembre`. Non chiudibile. Si spegne da sola il 1 settembre 2026.

### Task 1 — `2744b87`
- `src/lib/announcement.ts` (nuovo): `ANNOUNCEMENT_TEXT`, `ANNOUNCEMENT_EXPIRES_AT`
  (`2026-09-01T00:00:00+02:00`, ora di Roma) e `isAnnouncementActive(now = Date.now())`.
- `src/styles/design-tokens.css`: token `--announcement-height: 2.75rem` (mobile, il
  testo va su 2 righe) e `--announcement-height-md: 2.25rem`. `--navbar-height` NON
  toccato perché è anche l'altezza della barra mobile.

### Task 2 — `03776b2`
- `src/components/shared/AnnouncementBar.tsx` (nuovo): ritorna `null` quando scaduto;
  altrimenti striscia `bg-[var(--color-primary-dark)]` con testo
  `--color-primary-foreground`, `role="status"`, altezza dai token, nessun hex hardcoded.
- Montato come primo figlio di `<header>` in `MegaMenu.tsx` + export nel barrel `shared/index.ts`.

### Task 3 — `728a8ad`
- `src/routes/__root.tsx`: `<main>` usa
  `pt-[calc(var(--navbar-height)+var(--announcement-height))]` (e variante `md:`) solo
  quando l'annuncio è attivo; altrimenti il padding originale → nessuna fascia vuota
  dopo la scadenza.
- `HeroSection.tsx` / `MobileHeroSection.tsx`: altezza hero ridotta dell'altezza banner
  solo quando attivo, così l'hero continua a chiudere esattamente a viewport.

## Verifica

- `pnpm typecheck`: 0 errori sui file toccati (restano errori preesistenti in
  `src/routes/api/products.ts`, non correlati).
- SSR: `curl localhost:3000` → testo del banner presente nell'HTML server-rendered.
- Screenshot Playwright 1440×900 e 390×844: banner visibile, header non sovrapposto
  al contenuto; su mobile il testo va su 2 righe dentro i 44px senza clipping.
- Stato post-scadenza simulato (banner nascosto + token a 0): nessuno spazio vuoto
  sotto l'header, layout identico a prima della modifica.

## Note

- Header admin non toccato (già escluso da `isAdmin` in `__root.tsx`).
- Per cambiare data o testo basta editare `src/lib/announcement.ts`.
- Non ancora deployato: nessun push su Railway.
