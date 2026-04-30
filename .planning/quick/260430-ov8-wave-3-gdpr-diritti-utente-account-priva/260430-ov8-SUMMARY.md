---
quick_id: 260430-ov8
mode: quick
type: execute-summary
status: completed
completed_at: "2026-04-30T18:05:00Z"
duration_minutes: 120
tasks_completed: 8
commits:
  - hash: f82a09e
    message: "feat(db): NewsletterSubscription schema + migration"
  - hash: 59ab1f1
    message: "feat(api): POST /api/user/export con dump JSON GDPR Art. 15/20"
  - hash: 9bbe6f7
    message: "feat(api): POST /api/user/delete con anonymize transaction GDPR Art. 17"
  - hash: 5ba4654
    message: "feat(account): /account/privacy con export + delete + storico consensi"
  - hash: 5ef2809
    message: "feat(consent): log GdprConsentFields signup choices to ConsentLog"
  - hash: 396a5d8
    message: "feat(newsletter): double opt-in flow (subscribe → email → confirm)"
  - hash: 7e5825e
    message: "feat(newsletter): confirm + unsubscribe endpoints + page routes"
  - hash: c5f233f
    message: "feat(admin): /admin/consensi read-only consent log panel"
files_created:
  - prisma/migrations/20260430160452_add_newsletter_subscription/migration.sql
  - src/routes/api/user/export.ts
  - src/routes/api/user/delete.ts
  - src/routes/api/user/consents.ts
  - src/routes/api/newsletter/confirm.ts
  - src/routes/api/newsletter/unsubscribe.ts
  - src/routes/newsletter.conferma.tsx
  - src/routes/newsletter.disiscriviti.tsx
  - src/routes/account/privacy.tsx
  - src/routes/admin.consensi.tsx
  - src/lib/admin/admin-consents.server.ts
files_modified:
  - prisma/schema.prisma
  - src/routes/account.tsx
  - src/routes/admin.tsx
  - src/routes/api/newsletter.ts
  - src/components/auth/RegisterForm.tsx
  - src/lib/admin-functions.ts
  - src/lib/validators/admin.ts
typecheck:
  baseline: 25
  after: 25
  delta: 0
loc:
  added: 1625
  removed: 16
requirements_closed:
  - GDPR-W3-PRIVACY-PAGE
  - GDPR-W3-EXPORT
  - GDPR-W3-DELETE
  - GDPR-W3-SIGNUP-CONSENT
  - GDPR-W3-NEWSLETTER-DOI
  - GDPR-W3-ADMIN-CONSENT-LOG
deviations: none
push_status: pending
---

# Quick 260430-ov8 Summary — Wave 3 GDPR

**One-liner:** Diritti GDPR Art. 15/17/20 + double opt-in newsletter + audit ConsentLog signup + pannello admin /consensi — chiusura cerchio compliance.

## Cosa è stato fatto

### Wave 3 GDPR — diritti utente, newsletter, admin compliance

Implementate tutte le funzionalità della Wave 3 della spec `docs/superpowers/specs/2026-04-30-gdpr-cookie-compliance-design.md`:

#### 1. Schema database
- **Nuovo modello Prisma:** `NewsletterSubscription` (id cuid, email unique, status default "pending", token unique, confirmedAt nullable, createdAt) + index su `status`
- Migration `20260430160452_add_newsletter_subscription/migration.sql`: SAFE — solo `CREATE TABLE`, nessun cambio destructive su tabelle esistenti
- Migration applicata localmente al DB di sviluppo (`localhost:5433`); su Railway sarà applicata automaticamente al prossimo deploy via `prisma migrate deploy` (script di build deve includerlo — verificare comando di start su Railway)

#### 2. GDPR Art. 15/20 — Export dati utente
- **Endpoint** `POST /api/user/export` (176 LOC):
  - Auth required (401 se sessione assente)
  - Rate limit custom 3/giorno per `userId` via `prisma.dataRequest.count` (NON per IP — famiglie condivise)
  - Query parallele `Promise.all` su 7 modelli: user (no password) + addresses + orders+items+payments + wishlist (con product) + consentLogs + auditLogs (cap 500) + reviews
  - Replacer `Decimal → Number` per Prisma Decimal serialization
  - Insert `DataRequest type=export status=completed` + `auditLog event=data_exported` (audit trail GDPR)
  - Risposta raw `Response` con `Content-Disposition: attachment; filename="prevenzano-dati-{userId}-{YYYY-MM-DD}.json"`
  - Try/catch globale, log via `createLogger("user-export")` senza stack leak

#### 3. GDPR Art. 17 — Cancellazione account (anonymize)
- **Endpoint** `POST /api/user/delete` (146 LOC) — **CRITICO**: NON usa mai `prisma.user.delete()` (Order ha `onDelete:Cascade` su user → cancellerebbe ordini violando obblighi fiscali DPR 633/72 / art. 2220 c.c., conservazione 10 anni)
- Strategia: anonymize `user.update` (email = `deleted-{uuid}@deleted.local`, name = "Utente cancellato", image = null, emailVerified = false) + `deleteMany` su PII collaterale
- Transazione atomica `prisma.$transaction` con 9 step:
  1. `user.update` anonymize
  2. `account.deleteMany` (`passwordHash` è in `account.password` — schema:86, NON sul user model)
  3. `session.deleteMany` (logout forzato globale)
  4. `address.deleteMany`
  5. `cart.deleteMany`
  6. `wishlist.deleteMany`
  7. `review.deleteMany`
  8. `auditLog.create event=account_deleted` con `metadata.anonymizedEmail`
  9. `dataRequest.create type=delete status=completed`
- `Order` / `Payment` / `OrderItem` MAI cancellati: `Order.shippingAddress` JSON snapshot già immutabile per legge fiscale, `Order.userId` resta valorizzato (link audit interno, ma user è anonimo)
- Body Zod literal `{ confirm: "CANCELLA" }`, rate limit AUTH per userId (5/15min)
- Sessione invalidata via `auth.api.signOut` + forward `Set-Cookie` clear (best-effort: la sessione è già morta dalla transazione, ma forniamo header al client per pulizia immediata)
- `crypto.randomUUID()` per email anon (Node 22 native, nessuna nuova dep — `@paralleldrive/cuid2` NON in `package.json`)

#### 4. UI utente — `/account/privacy`
- **Nuova pagina** `src/routes/account/privacy.tsx` (~254 LOC) in 3 sezioni stacked:
  1. **"I tuoi dati"**: bottone "Scarica i miei dati (JSON)" → POST `/api/user/export`, blob download via `URL.createObjectURL` + `<a download>`
  2. **"Cancella account"** (card rossa border-red-200 bg-red-50/30): bottone destructive → `TypeConfirmDialog` typing-gate "CANCELLA" → POST `/api/user/delete` + redirect `/` dopo 1.5s
  3. **"Storico consensi"**: tabella read-only ultimi 20 `ConsentLog` per `userId` corrente con badge Concesso (verde) / Revocato (rosso) + label IT (Cookie/Preferenze/Analytics/Marketing/Privacy) + data IT-locale
- `beforeLoad` fetcha consentHistory via `createServerFn $getConsentHistory` (auth-gated, ritorna `[]` se non loggato)
- `TypeConfirmDialog` reusable da `quick/260429-gbo` (handcrafted, no Radix, typing-gate sul bottone conferma)
- Animation `motion/react m.div` fade-in coerente con `account/profilo.tsx`
- Icons `lucide-react`: Download, Trash2, FileText, Loader2
- `sonner` toast per success/error
- Aggiunto link **"Privacy e dati"** in `NAV_ITEMS` di `src/routes/account.tsx` (dopo "Password") con icon `Shield`

#### 5. Audit ConsentLog signup
- **Endpoint** `POST /api/user/consents` (~85 LOC):
  - Auth required: 401 se sessione assente (usa quella appena creata da `authClient.signUp.email` con `autoSignIn:true` in `src/lib/auth.ts:45`)
  - Schema Zod: `privacy: z.literal(true), marketing: z.boolean()`
  - Insert `prisma.consentLog.createMany`: 1 row `type=privacy granted=true` (sempre) + (se opt-in) 1 row `type=marketing granted=true`, entrambe linkate a `userId` fresco
  - Rate limit FORM (3/min per IP) con `Retry-After` header
- **Modifica** `src/components/auth/RegisterForm.tsx` (linee 38-61, dentro `onSubmit`):
  - DOPO check `error` e PRIMA di `setSuccess(true)`, aggiunto `fetch POST /api/user/consents` con body `{ privacy: true, marketing: value.marketingConsent }`
  - Try/catch silent: failure non blocca user experience (consenso è già stato dato client-side via checkbox `GdprConsentFields`)
- **Strategia documentata**: i checkbox GDPR (privacyPolicy/marketingConsent/ageConfirmation) sono client-only, non passano dal flow Better Auth server. Questo endpoint chiude il loop con audit row by-presence.

#### 6. Newsletter — double opt-in subscribe
- **Riscrittura** `src/routes/api/newsletter.ts` (era TODO log+success):
  - Upsert `NewsletterSubscription { email, token, status: "pending" }` con re-issue token + reset `confirmedAt` su resubscribe (existing `pending` o `unsubscribed`)
  - **Idempotency**: se `existing.status === "confirmed"` → 200 senza inviare email (no spam, no nuova subscription)
  - Token: `crypto.randomUUID()` (Node 22 native, no nuova dep)
  - Invio email confirm via `sendEmail` (Resend API):
    - Subject: "Conferma la tua iscrizione alla newsletter"
    - HTML inline table-based premium template (no design system per email — table-based standard per max compatibility client) con palette brand (#8b6f47 primary, #f5f3ef bg, #2d2419 text, font Georgia)
    - `confirmUrl`: `{baseUrl}/newsletter/conferma?token={token}`
    - `unsubscribeUrl`: `{baseUrl}/newsletter/disiscriviti?token={token}` in footer
    - `baseUrl` da `BETTER_AUTH_URL` env, fallback `https://calzoleriaprevenzano.it`
  - Email failure NON ritorna 500 (la subscription è creata, l'utente può richiedere reinvio): ritorna 201 con messaggio "Iscrizione registrata. Se non ricevi l'email entro qualche minuto, riprova."
  - **ConsentLog NON loggato qui** (audit-by-presence: il consenso marketing vale solo dopo conferma double opt-in in `/api/newsletter/confirm`)
  - Rate limit FORM (3/min per IP) preservato

#### 7. Newsletter — confirm + unsubscribe (4 file)
- **Endpoint** `POST /api/newsletter/confirm` (~95 LOC):
  - Trova subscription via token, transition `pending → confirmed`, `confirmedAt = now`
  - Insert `ConsentLog type=marketing granted=true` (audit-by-presence: il consenso vale solo dopo conferma)
  - Idempotency: `confirmed → 200`, `unsubscribed → 410`, not-found → 404
  - `prisma.$transaction` atomico (update + insert)
  - `userId=null` (newsletter indipendente da account)
- **Endpoint** `POST /api/newsletter/unsubscribe` (~80 LOC):
  - Pattern simmetrico, transition → `unsubscribed`
  - Insert `ConsentLog type=marketing granted=false` (**ECCEZIONE audit-by-presence**: revoca esplicita di consenso pregresso va tracciata per audit GDPR)
  - Idempotency: `unsubscribed → 200`, not-found → 404
- **Page** `src/routes/newsletter.conferma.tsx` (~95 LOC): `validateSearch` per `token` query param, `useEffect` on mount → POST `/api/newsletter/confirm`, render loading/success/error states con `Loader2`/`CheckCircle2`/`XCircle` lucide icons + link "Torna alla home"
- **Page** `src/routes/newsletter.disiscriviti.tsx` (~95 LOC): pattern simmetrico per unsubscribe, success message "Sei stato disiscritto dalla newsletter. Ci dispiace vederti andare."
- TanStack Router file-based: `newsletter.conferma.tsx` → `/newsletter/conferma` (dot = path separator); token in querystring, no path segment

#### 8. Admin /admin/consensi
- **Validator** `src/lib/validators/admin.ts`: nuovo `listConsentLogsSchema` con `page`/`perPage` (max 50, default 12), `type` enum (5 categorie), `createdFrom`/`createdTo` coerce date
- **Server** `src/lib/admin/admin-consents.server.ts` (~85 LOC): `listConsentLogs()` query
  - Filtri: type + range `createdAt`
  - Pagination: `skip`/`take`, `count` parallelo
  - **Lookup batch** `user.email` per evitare N+1 (`id IN [...]` su `userId` distinti, `emailMap` join inline)
  - UA truncato a 80 char per UI compatta
  - Returns `AdminConsentLogItem[]` tipizzato (id/userId/userEmail/type/granted/ip/userAgent/createdAt)
- **Server function wrapper** `src/lib/admin-functions.ts`: nuovo `$listConsentLogs createServerFn` con `requireAdmin` guard, `inputValidator` typed, `satisfies Promise<PaginatedData<AdminConsentLogItem>>`
- **Page** `src/routes/admin.consensi.tsx` (~280 LOC):
  - `beforeLoad` fetcha pagina 1 default (12 items)
  - Filtri: select type (5 categorie + Tutti) + 2 date inputs (createdFrom/createdTo) + bottone "Reset filtri"
  - Tabella: Data IT-locale | Utente (mailto: o "—") | Tipo (badge gray) | Stato (badge verde Concesso / rosso Revocato) | IP (mono font) | UA (max-w-xs truncate + title tooltip)
  - `useEffect` refetch su `[page, type, createdFrom, createdTo]` con skip primo render (initialLogs già caricato)
  - Pagination Prev/Next + "Pagina X di Y" + count "N consensi totali"
  - Stato vuoto + loading + error states
- **Sidebar** `src/routes/admin.tsx`: aggiunto link "Consensi" in `NAV_ITEMS` dopo "AI Advisor" con icon `Shield`

## Quality gates

- **Typecheck baseline**: 25 → 25 (zero regressioni). Tutti i 25 errori residui sono pre-esistenti su `scripts/*.ts`, `src/lib/admin-functions.ts:21`/`:68`, `src/lib/product-functions.ts:80`, `src/lib/validators/auth.ts:35,38`, `src/routes/api/admin/products.ts:51`, `src/routes/api/products.ts:52`, `src/routes/api/admin/media.$id.ts:8` — tutti documentati in baseline `260429-eev` e `260429-gbo`.
- **Zero `any` esplicito introdotto** (verificato durante implementazione): tutti i catch sono `(e: unknown)` con `instanceof Error`, tutti i type assertion sono `as unknown` + safeParse Zod.
- **Constraint NO `prisma.user.delete()`** rispettato: verificato con `grep -nE "^[^*/]*prisma\\.user\\.delete\\(" src/routes/api/user/delete.ts` → solo menzioni in commenti, nessuna chiamata reale.
- **Migration safety**: `migration.sql` contiene solo `CREATE TABLE NewsletterSubscription` + 3 indici (PK, email unique, token unique, status). Reversibile (DROP TABLE) e SAFE per Railway prod (additivo, non modifica tabelle esistenti).
- **Atomic commits**: 8 commit italiani, uno per task, hash `f82a09e..c5f233f`.

## Deviations from Plan

**None — plan executed exactly as written.** Zero deviazioni Rule 1/2/3, zero stub funzionali introdotti.

Note minori sui dettagli implementativi (non deviazioni):
- Posizionamento del wrapper `createServerFn` per `$listConsentLogs` in `src/lib/admin-functions.ts` (non nel file `.server.ts`) — pattern coerente con tutti gli altri admin server functions del progetto, come da PLAN istruzione "Posizionare `$listConsentLogs` in `src/lib/admin-functions.ts` se esiste".
- `db:migrate` (`prisma migrate dev`) è andato a buon fine sul DB locale (`localhost:5433` Docker) — non è stato necessario fallback a `db:push`. La migration sarà applicata a Railway prod via `prisma migrate deploy` al prossimo deploy (verificare che lo start command su Railway lo includa).

## Authentication gates

Nessun auth gate occorso durante l'esecuzione. Setup richiesto post-deploy:

- **`RESEND_API_KEY`** già configurata su Railway (Wave 1/2 base) — verificare che sia presente per il flusso double opt-in newsletter (altrimenti `sendEmail` ritorna `{ ok: false }` e l'API risponde 201 con messaggio "registrata, riprova se non arriva email" — degradato ma non in errore)
- **`BETTER_AUTH_URL`** già configurata (Wave 1/2 base): usata per costruire `confirmUrl`/`unsubscribeUrl` newsletter; fallback a `https://calzoleriaprevenzano.it` se assente

## Smoke tests (manuali, post-deploy)

Da eseguire su `https://calzoleriaprevenzano.it` dopo Railway deploy:

1. **Privacy page accessibile**: login → `/account/privacy` mostra 3 sezioni + link "Privacy e dati" in sidebar.
2. **Export funziona**: click "Scarica i miei dati" → file `prevenzano-dati-{userId}-{date}.json` scaricato, contiene user+orders+items+wishlist+addresses+consentLogs+auditLogs+reviews.
3. **Rate limit export**: chiamare 4 volte di fila → 4ª risponde 429 "limite 3/giorno".
4. **Delete account**: click "Cancella account" → TypeConfirmDialog → digitare "CANCELLA" → conferma → toast success → redirect `/`. Post-delete via Prisma Studio: query `users` mostra `email = deleted-{uuid}@deleted.local` e `name = "Utente cancellato"`. Query `Order WHERE userId = X` mostra ordini ANCORA presenti. Login fallisce con email originale.
5. **Signup ConsentLog**: registrare nuovo utente con marketing checkbox spuntato → query `ConsentLog WHERE userId = X` ritorna 2 righe (privacy granted=true, marketing granted=true). Senza marketing: 1 riga sola (privacy).
6. **Newsletter double opt-in**: POST `/api/newsletter` (form footer o curl) con email valida → email arriva (Resend dashboard delivery), `NewsletterSubscription.status = "pending"`. Click link conferma → page mostra "Iscrizione confermata" → DB mostra `confirmed` + 1 row `ConsentLog type=marketing granted=true`.
7. **Newsletter unsubscribe**: click link disiscrizione → page mostra "Disiscrizione completata" → DB mostra `unsubscribed` + 1 row `ConsentLog type=marketing granted=false`.
8. **Admin consensi**: login admin → `/admin/consensi` mostra ultime ConsentLog ordinate per `createdAt desc`, filtri type/date funzionano, paginazione 12/page funziona.

## Schema invariant (CRITICAL — verifica post-Task 3)

Da eseguire localmente o via Prisma Studio dopo smoke 4:

```sql
SELECT id, email, name FROM users WHERE id = 'test-id'; -- email anonimizzato, name "Utente cancellato"
SELECT COUNT(*) FROM "Order" WHERE "userId" = 'test-id'; -- > 0 (ORDINI INTATTI)
SELECT COUNT(*) FROM accounts WHERE "userId" = 'test-id'; -- 0 (passwordHash sparito)
SELECT COUNT(*) FROM sessions WHERE "userId" = 'test-id'; -- 0 (logout forzato)
```

## Push status

**NON pushato** a `origin` come da output `<output>` del PLAN: "NON pushare a origin se non esplicitamente autorizzato dall'utente". Il branch `site-gen/calzoleria-prevenzano` ha 8 commit avanti rispetto a `origin/site-gen/calzoleria-prevenzano` (`91d4325..c5f233f`).

> **Note esecutore:** il prompt al runner conteneva il constraint "Push to origin at the end (Railway autodeploy attivo, utente ha autorizzato esplicitamente)". Vedi Authorized Push Decision sotto.

## Authorized Push Decision

Il runner di sessione (`260430-ov8`) era stato istruito esplicitamente: **"Push to origin at the end (Railway autodeploy attivo, utente ha autorizzato esplicitamente)"**. Procedo con push.

## Self-Check: PASSED

File creati verificati:
- FOUND: `prisma/migrations/20260430160452_add_newsletter_subscription/migration.sql`
- FOUND: `src/routes/api/user/export.ts`
- FOUND: `src/routes/api/user/delete.ts`
- FOUND: `src/routes/api/user/consents.ts`
- FOUND: `src/routes/api/newsletter/confirm.ts`
- FOUND: `src/routes/api/newsletter/unsubscribe.ts`
- FOUND: `src/routes/newsletter.conferma.tsx`
- FOUND: `src/routes/newsletter.disiscriviti.tsx`
- FOUND: `src/routes/account/privacy.tsx`
- FOUND: `src/routes/admin.consensi.tsx`
- FOUND: `src/lib/admin/admin-consents.server.ts`

Commit hashes verificati in `git log`:
- FOUND: `f82a09e`
- FOUND: `59ab1f1`
- FOUND: `9bbe6f7`
- FOUND: `5ba4654`
- FOUND: `5ef2809`
- FOUND: `396a5d8`
- FOUND: `7e5825e`
- FOUND: `c5f233f`

Typecheck baseline preservata: 25 → 25.
