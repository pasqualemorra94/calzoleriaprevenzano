---
phase: quick/260507-vlu
plan: 01
subsystem: contacts-cta
tags: [contacts, seo, json-ld, whatsapp, accessibility, gdpr-light, instagram-handle, cap-fix]
requires:
  - shared/MegaMenu.tsx
  - shared/Footer.tsx
  - shared/MobileBottomNav.tsx
  - styles/design-tokens.css (--z-sticky, --shadow-md, --transition-base)
provides:
  - 2 sedi su /contatti (Negozio Chiaia + Laboratorio Schipa) con orari, telefoni, email, P.IVA
  - JSON-LD Organization.location[] multi-sede in __root.tsx
  - WhatsAppFloatingButton globale (escluso /admin)
  - Instagram handle corretto (calzoleria_prevenzano)
  - Fallback email form contatti (nunzio.prevenzano@gmail.com)
  - CAP 80121 consistente in tutte le pagine legali e template email
affects:
  - SEO: schema.org Organization multi-sede valido per Search Console
  - CRO: CTA WhatsApp flottante sempre visibile su pagine pubbliche
  - GDPR: nessun impatto (anchor statico, no JS/cookie/fingerprint)
tech-stack:
  added: []
  patterns:
    - JSON-LD Organization.location[] con OpeningHoursSpecification per sede
    - Pattern mount root-level con gate !isAdmin (coerente con Footer/CookieBanner/MobileBottomNav)
    - Brand color hex inline come eccezione documentata (#25D366 WhatsApp)
key-files:
  created:
    - src/components/shared/WhatsAppFloatingButton.tsx
  modified:
    - src/routes/contatti.tsx
    - src/routes/__root.tsx
    - src/components/shared/Footer.tsx
    - src/components/shared/MegaMenu.tsx
    - src/components/shared/index.ts
    - src/lib/contact.server.ts
    - src/routes/termini.tsx
    - src/routes/cookie.tsx
    - src/routes/privacy.tsx
    - src/routes/resi-e-recesso.tsx
    - src/routes/richiesta-reso.tsx
    - src/routes/api/return-request.ts
    - src/lib/email-brand.server.ts
    - src/lib/auth-email.server.ts
decisions:
  - "Mostrare ENTRAMBE le sedi (Negozio + Laboratorio) sulla pagina /contatti e nel JSON-LD root, non solo la sede legale"
  - "Email pubblica visibile (info@calzoleriaprevenzano.it) DIVERSA da fallback recapito form (nunzio.prevenzano@gmail.com): facade vs mailbox reale"
  - "Pulsante WhatsApp sempre visibile su mobile anche su /prodotti/$slug (potenziale overlap con MobileStickyAddToCart deferito a quick task separato se inaccettabile)"
  - "Brand color #25D366 documentato inline come eccezione brand WhatsApp (NON nuovo design token), accettato in CONTEXT.md"
  - "Niente costanti centralizzate per dati sedi/contatti — fuori scope da CONTEXT.md, solo find-and-replace puntuale per consistency fix"
metrics:
  duration: 11m
  completed: 2026-05-07
  tasks: 3
  files_created: 1
  files_modified: 13
---

# Quick 260507-vlu: Contatti reali dal WordPress + WhatsApp flottante globale

Sostituiti tutti i placeholder di contatto (`+39 081 XXX XXXX`, `+39 333 XXX XXXX`, CAP errato `80132 = Posillipo`) con i dati reali scrapati da `https://calzoleriaprevenzano.it/contatti/` (2 sedi, 2 telefoni, WhatsApp, email pubblica, P.IVA), aggiunto JSON-LD multi-sede in `__root.tsx`, fixato handle Instagram (underscore obbligatorio), aggiornato fallback email del form contatti, e introdotto `WhatsAppFloatingButton` globale sticky bottom-right su tutte le pagine pubbliche (escluso `/admin`).

## What Changed

### Task 1 — Contatti reali (commit `1e98374`)

**`src/routes/contatti.tsx`**
- Riscritto `CONTACT_INFO` come struttura tipata (`ContactInfo` + `ContactLocation` + `ContactPhone`, `as const satisfies ContactInfo`).
- Sezione sinistra ora mostra 2 card sedi (Negozio Chiaia + Laboratorio Schipa) in grid `md:grid-cols-2` con icona `MapPin` per indirizzo e `Clock` per orari (uno per riga via `<ul>`).
- Sezione "Contatti" separata sotto le card: 2 telefoni cliccabili (`tel:`), WhatsApp display, email pubblica come `mailto:`, CTA WhatsApp brand-green con messaggio precompilato.
- P.IVA in piedino piccolo (`text-xs text-[var(--color-text-muted)]`).
- Form (colonna destra) **invariato**.

**`src/routes/__root.tsx`**
- `ORG_SCHEMA` migrato da `address: PostalAddress` singolo a `location: [Place, Place]` array.
- Ogni `Place` ha: `address` (CAP corretto 80121/80122), `telephone` E.164 (`+390810410442` / `+390819526465`), `openingHoursSpecification` (1 spec per Negozio Lun-Sab 9:30-20:00; 3 spec per Laboratorio Mar-Ven 9:30-14:00 + Mar-Ven 16:00-20:00 + Sab 9:30-13:00).

**`src/components/shared/Footer.tsx`**
- `SOCIAL_LINKS` Instagram href: `instagram.com/calzoleriaprevenzano` → `instagram.com/calzoleria_prevenzano`.

**`src/components/shared/MegaMenu.tsx`**
- 2 occorrenze (riga 393 desktop top-bar, riga 740 mobile drawer footer): same fix con underscore.

**`src/lib/contact.server.ts`**
- Fallback email: `info@calzoleriaprevenzano.it` → `nunzio.prevenzano@gmail.com` con commento esplicativo (la prima è facade pubblica, non riceve).

### Task 2 — WhatsAppFloatingButton globale (commit `faa3bb1`)

**Nuovo `src/components/shared/WhatsAppFloatingButton.tsx`** (36 LOC)
- Anchor `<a>` semantico (NON button), `target="_blank" rel="noopener noreferrer"`, `aria-label="Contattaci su WhatsApp"`.
- Posizione fixed responsive:
  - Mobile: `bottom-[calc(60px+1rem)] right-4 h-12 w-12` — offset 60px+1rem evita overlap con `MobileBottomNav` (z-navbar 50, fixed inset-x-0 bottom-0).
  - Desktop: `md:bottom-6 md:right-6 md:h-14 md:w-14`.
- Z-index: `var(--z-sticky)` (40) — sotto cookie banner z-toast (80) e modali z-modal (70).
- Colore: `bg-[#25D366]` (brand WhatsApp ufficiale, eccezione documentata inline) + hover `bg-[#1DA851]` (coerente con CTA esistente in `/contatti`).
- Animazione: `transition-[transform,background-color] duration-[var(--transition-base)] ease-[cubic-bezier(0.4,0,0.2,1)]` + `motion-safe:hover:scale-[1.05] motion-safe:active:scale-[0.95]`. NIENTE pulse/wave/shake (decisione CONTEXT.md).
- Icona `MessageCircle` da `lucide-react` (già usato in `contatti.tsx`, no nuova dep).
- Niente `useState`/`useEffect`: link statico SSR-safe.

**`src/components/shared/index.ts`**
- Aggiunto `export { WhatsAppFloatingButton } from "./WhatsAppFloatingButton";`.

**`src/routes/__root.tsx`**
- Import esteso: `Footer, CookieBanner, GoogleAnalytics, WhatsAppFloatingButton`.
- Mount: `{!isAdmin && <WhatsAppFloatingButton />}` subito dopo `<MobileBottomNav />`, prima di `<MobileSearchOverlay />`.

### Task 3 — Consistency fix CAP 80121 + Instagram nelle pagine legali (commit `e26d191`)

Sostituzione mirata `80132 → 80121` (CAP corretto per Via Chiaia 104) in:
- `src/routes/termini.tsx` — 3 occorrenze (sede legale clausola Venditore, raccomandata recesso, address card footer)
- `src/routes/privacy.tsx` — 3 occorrenze (Titolare, DPO, indirizzo postale)
- `src/routes/cookie.tsx` — 1 occorrenza (Titolare)
- `src/routes/resi-e-recesso.tsx` — 1 occorrenza (raccomandata A/R)
- `src/routes/richiesta-reso.tsx` — 1 occorrenza (raccomandata)
- `src/routes/api/return-request.ts` — 1 occorrenza (footer template HTML email)
- `src/lib/email-brand.server.ts` — `companyAddress`
- `src/lib/auth-email.server.ts` — footer template email auth

**NON toccati** (intenzionale): `placeholder="80132"` in `src/routes/checkout.tsx` e `src/routes/account/indirizzi.tsx` — sono esempi generici per l'utente, NON dati reali della calzoleria. CONTEXT.md è esplicita su questo.

Niente costanti centralizzate, niente refactor, solo trova-e-sostituisci puntuale (CONTEXT.md "Claude's Discretion").

## Why It Matters

1. **SEO multi-sede**: Google ora vede 2 location distinte, ognuna con orari e telefono. Doppio LocalBusiness senza creare 2 schema separati. Validabile su https://validator.schema.org/.
2. **Trust del cliente**: niente più placeholder "XXX XXXX" su /contatti — l'utente vede subito numeri reali e cliccabili.
3. **Conversione**: pulsante WhatsApp flottante sempre visibile riduce la frizione per chi vuole chiedere informazioni rapide (audience IG @calzoleria_prevenzano è abituata a chat 1-to-1).
4. **GDPR/legal compliance**: CAP corretto in privacy/termini/cookie/resi è requisito formale di identificabilità del Titolare del trattamento.
5. **Email recapito**: il form contatti ora atterra sulla vera mailbox del titolare (Gmail) invece di una facade non monitorata.

## Verification

### Automated (eseguita in-process)

```bash
# Task 1 — typecheck files
pnpm typecheck 2>&1 | grep -E "^src/(routes/(contatti|__root)|components/shared/(Footer|MegaMenu)|lib/contact\.server)"
# Output: solo 1 errore baseline pre-esistente su contatti.tsx:8 (createFileRoute route registration)
# → nessun errore introdotto dalle modifiche

# Task 2 — typecheck files
pnpm typecheck 2>&1 | grep -E "^src/(components/shared/(WhatsAppFloatingButton|index)|routes/__root)"
# Output: vuoto → 0 errori sui file toccati

# Task 3 — typecheck files
pnpm typecheck 2>&1 | grep -E "^src/(routes/(termini|cookie|privacy|resi-e-recesso|richiesta-reso|api/return-request)|lib/(email-brand|auth-email)\.server)"
# Output: solo 6 errori baseline pre-esistenti createFileRoute (route registration) — non introdotti da noi
```

### Manual (eseguita in-process)

```bash
# Instagram handle corretto
grep -rcn "instagram.com/calzoleria_prevenzano" src/ --include="*.tsx"
# → src/components/shared/MegaMenu.tsx:2, src/components/shared/Footer.tsx:1 (totale 3)

# Instagram handle errato (atteso 0)
grep -rn "instagram.com/calzoleriaprevenzano\b" src/ --include="*.ts" --include="*.tsx"
# → 0 risultati ✓

# CAP errato Via Chiaia (atteso 0)
grep -rn "Via Chiaia" src/ --include="*.ts" --include="*.tsx" | grep "80132"
# → 0 risultati ✓

# Placeholder utente form NON toccati (atteso 2)
grep -n 'placeholder="80132"' src/routes/checkout.tsx src/routes/account/indirizzi.tsx
# → 2 risultati (intenzionale) ✓

# CAP corretto in contesto chiaia/napoli (atteso ≥6)
grep -rn "80121" src/ --include="*.ts" --include="*.tsx" | grep -i "chiaia\|napoli" | wc -l
# → 14 risultati ✓

# WhatsAppFloatingButton mount con gate !isAdmin
grep -n "WhatsAppFloatingButton" src/routes/__root.tsx
# → riga 14 (import) + riga 209 ({!isAdmin && <WhatsAppFloatingButton />}) ✓

# LOC componente
wc -l src/components/shared/WhatsAppFloatingButton.tsx
# → 36 LOC (≤80 limite) ✓

# Zero any
grep -c -w "any" src/components/shared/WhatsAppFloatingButton.tsx
# → 0 ✓

# JSON-LD multi-sede
grep -c "\"@type\": \"Place\"" src/routes/__root.tsx          # → 2
grep -c "openingHoursSpecification" src/routes/__root.tsx     # → 2 (definizione array + uso)
```

### Smoke Browser (post-deploy)

Coerente con executor pattern dei task precedenti (`260507-vll/tcf/ov8/h9l/ucj`): smoke browser deferito a deploy Railway. Sequenza di verifica raccomandata sul preview deployment:

1. Visitare `/contatti` su desktop e mobile → verificare 2 card sedi affiancate (md:) o stacked, niente "XXX", bottone WhatsApp green clickable.
2. View source su `/` → controllare `<script type="application/ld+json">` con `Organization.location[]` + 2 `Place` con CAP 80121/80122 e `openingHoursSpecification`.
3. Validare il JSON-LD su https://validator.schema.org/ (atteso "No errors detected").
4. Click su icone Instagram footer + megamenu (top-bar desktop + drawer mobile) → URL deve contenere `calzoleria_prevenzano` (con underscore).
5. Pulsante WhatsApp floating:
   - Visibile su `/`, `/catalogo`, `/contatti`, `/la-bottega`, `/prodotti/$slug`, `/account/*`.
   - NON visibile su `/admin/*`.
   - Mobile: NON copre MobileBottomNav (offset bottom > 60px verificato).
   - Click → apre `wa.me/390810410442` in nuova tab con messaggio "Ciao, vorrei informazioni sui vostri sandali" precompilato.
   - Cookie banner attivo → copre il pulsante (z-toast 80 > z-sticky 40).
6. Submit form contatti senza env `ADMIN_EMAIL`/`EMAIL_FROM` set → verificare nei log/Resend dashboard recapito a `nunzio.prevenzano@gmail.com`.

## Deviations from Plan

**None — plan executed exactly as written.**

Tutti i 3 task del PLAN.md eseguiti in ordine, ogni task committato atomicamente con messaggio convenzionale italiano. Nessun bug o issue critico riscontrato durante l'esecuzione. Nessuna decisione architetturale richiesta. Nessun auth gate.

Note operative:
- Worktree senza `node_modules`: `pnpm typecheck` ha generato i file `.tanstack/tmp/routeTree.gen.ts` con baseline `createFileRoute` errors pre-esistenti (146 totali). Nessun errore nuovo introdotto sui file toccati. La baseline "25 errori" citata nel constraint si riferisce al main worktree con `node_modules` installati e cache route-tree fresca; i numeri assoluti differiscono ma il principio "nessuna regressione sui file toccati" è soddisfatto.

## Constraint Compliance

| Constraint | Status |
|------------|--------|
| Zero `any` introdotti | ✓ Tipi `ContactInfo`/`ContactLocation`/`ContactPhone` espliciti, `satisfies` operator, `as const`, return type `ReactNode` esplicito |
| Niente nuove dependencies | ✓ Solo `lucide-react` già usato, `motion/react` già presente |
| Niente nuovi env-vars | ✓ Solo cambiato fallback hardcoded in `contact.server.ts` |
| Niente nuovi design tokens | ✓ Riusato `--z-sticky`, `--shadow-md`, `--transition-base` già esistenti |
| Italian copy | ✓ Tutta UI in italiano |
| Hex `#25D366` documentato | ✓ Solo in `contatti.tsx` (esistente) e `WhatsAppFloatingButton.tsx` (nuovo, commento inline) — nessuna propagazione |
| WhatsApp button ≤80 LOC | ✓ 36 LOC totali (incluso JSDoc) |
| Z-index `--z-sticky` (40) | ✓ Sotto cookie banner z-toast (80), sotto modali z-modal (70), sopra contenuto z-base/z-above |
| Mount con gate `!isAdmin` | ✓ Coerente con Footer/CookieBanner/GoogleAnalytics/MobileBottomNav/MobileSearchOverlay |
| Posizione mobile sopra MobileBottomNav | ✓ `bottom-[calc(60px+1rem)]` (60px height + 1rem gap) |
| Messaggio precompilato italiano | ✓ "Ciao, vorrei informazioni sui vostri sandali" |
| CLAUDE.md zero-any policy | ✓ Verificato grep su WhatsAppFloatingButton.tsx |
| CLAUDE.md italian comments | ✓ JSDoc + commenti inline in italiano |
| CLAUDE.md no inline hex (eccetto brand) | ✓ Solo `#25D366`/`#1DA851` brand WhatsApp, documentati |

## Known Stubs

Nessuno. Tutti i dati di contatto sono valori reali e finali decisi in `CONTEXT.md`.

## Self-Check: PASSED

**Files created:**
- `/Users/pasqualemorra/Projects/calzoleriaprevenzano/src/components/shared/WhatsAppFloatingButton.tsx` — FOUND (36 LOC)

**Files modified (verified via git log):**
- `src/routes/contatti.tsx` (commit 1e98374) — FOUND
- `src/routes/__root.tsx` (commits 1e98374 + faa3bb1) — FOUND
- `src/components/shared/Footer.tsx` (commit 1e98374) — FOUND
- `src/components/shared/MegaMenu.tsx` (commit 1e98374) — FOUND
- `src/components/shared/index.ts` (commit faa3bb1) — FOUND
- `src/lib/contact.server.ts` (commit 1e98374) — FOUND
- `src/routes/termini.tsx` (commit e26d191) — FOUND
- `src/routes/cookie.tsx` (commit e26d191) — FOUND
- `src/routes/privacy.tsx` (commit e26d191) — FOUND
- `src/routes/resi-e-recesso.tsx` (commit e26d191) — FOUND
- `src/routes/richiesta-reso.tsx` (commit e26d191) — FOUND
- `src/routes/api/return-request.ts` (commit e26d191) — FOUND
- `src/lib/email-brand.server.ts` (commit e26d191) — FOUND
- `src/lib/auth-email.server.ts` (commit e26d191) — FOUND

**Commits exist (verified via `git log --oneline`):**
- `1e98374` — feat(quick/260507-vlu): contatti reali — 2 sedi, JSON-LD multi-sede, fix Instagram, fallback email — FOUND
- `faa3bb1` — feat(quick/260507-vlu): pulsante WhatsApp flottante globale — FOUND
- `e26d191` — fix(quick/260507-vlu): consistency CAP 80121 nelle pagine legali e template email — FOUND
