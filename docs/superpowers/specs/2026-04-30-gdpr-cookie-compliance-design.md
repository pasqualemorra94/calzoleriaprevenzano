# GDPR & Cookie Compliance — Design Spec

**Data**: 2026-04-30
**Stato**: Approvato (in attesa review utente)
**Owner**: Pasquale
**Tipo**: Compliance / Legal

## Contesto

Il repository `calzoleriaprevenzano` contiene già larga parte dell'infrastruttura GDPR ma scollegata: `CookieBanner` mai montato, endpoint `/api/cookie-consent` POSTato dal client ma inesistente lato server, modelli Prisma `ConsentLog` / `DataRequest` / `AuditLog` definiti ma mai popolati. Le pagine `/cookie`, `/privacy`, `/termini` esistono e sono compilate ma menzionano "Plausible Analytics" senza che sia mai stato installato.

Obiettivo: rendere il sito **realmente compliant** rispetto a GDPR + normativa italiana (cookie, diritti utente, fattura/documenti contabili, e-Privacy direttiva 2002/58/CE), allineando codice e dichiarazioni legali.

## Decisioni chiave

| Decisione | Scelta | Motivazione |
|-----------|--------|-------------|
| Analytics | Google Analytics 4 con Consent Mode v2 "basic" | Gratis (vincolo utente). Basic mode = no GA finché consenso analytics non concesso. Comportamento prevedibile, zero superficie legale incerta. |
| IP anonymization | Default GA4 (built-in) | Differente da GA-UA: GA4 anonimizza by design, nessun flag esplicito necessario. |
| Trasferimento dati extra-UE | Disclaimer Schrems II + SCC | Google Ireland Ltd è il titolare europeo; menzione esplicita SCC come base giuridica nelle policy. |
| Cancellazione account | Pseudo-anonimizzazione immediata | DPR 633/72 + art. 2220 c.c. impongono conservazione documenti fiscali 10 anni. Hard delete impossibile per utenti con ordini. Niente grace period. |
| Newsletter | Double opt-in via Resend | Obbligatorio in IT (Codice Privacy + provvedimenti Garante). Token-based confirm + unsubscribe. |
| CMP | Custom (no IAB TCF) | Nessuna pubblicità terza parte, IAB TCF è overkill. |

## Strategia di consegna

Tre quick task GSD separati, indipendenti e committabili/deployabili uno alla volta. Ogni wave ha valore standalone.

```
Wave 1 (rosso, ~2h)   →   Banner vivo + endpoint + footer link
Wave 2 (arancio, ~3h) →   GA4 gated + Consent Mode v2 + policy aligned
Wave 3 (giallo, ~1g)  →   Diritti GDPR (export/delete) + double opt-in newsletter + admin consent log
```

---

## Wave 1 — Banner vivo

**Goal**: Chiunque visita il sito vede il banner cookie alla prima visita; le scelte vengono salvate sia client (`localStorage`) sia server (`Set-Cookie` + `ConsentLog`).

### Task atomici

1. **Mount banner in root**
   - File: `src/routes/__root.tsx`
   - Import + render `<CookieBanner />` dopo `<Footer />`
   - Zero logica aggiuntiva: il componente in `src/components/shared/CookieBanner.tsx:26-34` già auto-nasconde se trova consenso pregresso

2. **Endpoint `POST /api/cookie-consent`**
   - File nuovo: `src/routes/api/cookie-consent.ts`
   - Schema Zod: `{ necessary: true, preferences: bool, analytics: bool, marketing: bool, timestamp: number }` (necessary deve essere true)
   - Rate limit `FORM` via `checkRateLimit` esistente
   - Setta cookie via `setConsentCookie()` di `src/lib/cookieConsent.ts:43`
   - Insert `ConsentLog`: una row per ogni categoria opt-in (preferences/analytics/marketing) con `userId` se sessione, IP, UA, `granted: true`. Nessuna row per categorie rifiutate (basta l'assenza per audit).
   - Risposta `apiSuccess({ saved: true })`
   - Error mapping standard: 422 (validation), 429 (rate), 500 (db)

3. **Link "Gestisci preferenze cookie" nel footer**
   - File: `src/components/shared/Footer.tsx` (sezione legal links ~line 27)
   - Aggiungere voce `{ label: "Gestisci preferenze cookie", action: "reset-consent" }`
   - Rendering: invece di `<a href>`, usa `<button>` che esegue `localStorage.removeItem("consent_preferences"); window.location.reload()`
   - Banner riappare automaticamente al reload perché `getConsent()` ritorna `null`

### Verification

- Smoke browser (incognito): banner appare entro 1s dalla home, "Accetta tutti" → reload → niente banner
- Smoke browser: footer "Gestisci preferenze" → reload → banner di nuovo
- DB: `SELECT * FROM "ConsentLog" ORDER BY "createdAt" DESC LIMIT 5` mostra entry per ogni accettazione
- `pnpm typecheck` baseline preservata

### Atomic commits

1. `feat(legal): mount CookieBanner in root layout`
2. `feat(api): POST /api/cookie-consent with ConsentLog persistence`
3. `feat(footer): "Gestisci preferenze cookie" link to reset consent`

---

## Wave 2 — GA4 con Consent Mode v2

**Goal**: GA4 raccoglie page views e conversioni `purchase` solo dopo consenso `analytics`. Le pagine cookie/privacy descrivono fedelmente quanto fatto.

### Task atomici

1. **Componente `<GoogleAnalytics />`**
   - File nuovo: `src/components/shared/GoogleAnalytics.tsx`
   - Render condizionale: se `import.meta.env.VITE_GA4_MEASUREMENT_ID` mancante → `return null` (no-op in dev)
   - Usa `useEffect` + `loadScriptWithConsent("analytics", loader)` (già esiste `src/lib/cookieConsent.ts:83`)
   - Loader inietta `<script async src="https://www.googletagmanager.com/gtag/js?id=${ID}">` + init `gtag('js', new Date()); gtag('config', ID, { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false })`
   - Listener su `consent-update` event: se categoria `analytics` revocata → `gtag('consent', 'update', { analytics_storage: 'denied' })` + `window.location.reload()` per pulire cookie

2. **Conversion tracking purchase**
   - File: `src/routes/ordine-confermato.tsx` (esistente)
   - In `useEffect` dopo render dati ordine: se `hasConsent("analytics")` e `window.gtag`, chiama `gtag('event', 'purchase', { transaction_id, value, currency: 'EUR', items: [...] })`
   - Niente fallback server-side (Measurement Protocol) — overkill

3. **Env var**
   - Aggiungere `VITE_GA4_MEASUREMENT_ID=G-XXXXXXXX` a `.env.example`
   - Setup Railway env var lato utente (out of scope codice)

4. **Mount in root**
   - `src/routes/__root.tsx`: import + render `<GoogleAnalytics />` dopo `<Scripts />`
   - Auto-disattiva se env var mancante o consenso `analytics: false`

5. **Allineare policy**
   - `src/routes/cookie.tsx` (~line 275): rimuovere "e/o Plausible Analytics", elencare cookie `_ga` e `_ga_<ID>` con durata e finalità (statistiche aggregate)
   - `src/routes/privacy.tsx` (~line 123): rimuovere Plausible, aggiungere paragrafo **"Trasferimento dati extra-UE"**:
     > Google Analytics è fornito da Google Ireland Ltd (titolare europeo). Il servizio prevede potenziali trasferimenti negli Stati Uniti regolati da Standard Contractual Clauses (SCC) approvate dalla Commissione Europea ai sensi del GDPR (Art. 46). Base giuridica: consenso (art. 6.1.a GDPR).

### Verification

- DevTools incognito: rifiuta cookie → 0 richieste a `googletagmanager.com` o `google-analytics.com`
- DevTools incognito: accetta analytics → reload → cookie `_ga` presente, richiesta `g/collect` parte
- GA4 Realtime dashboard mostra il proprio device entro 30s dall'accettazione
- Acquista prodotto test → GA4 Realtime → evento `purchase` con `transaction_id` corretto
- Click "Gestisci preferenze cookie" → rifiuta analytics → reload → cookie `_ga` rimosso

### Atomic commits

1. `feat(analytics): GoogleAnalytics component gated by consent`
2. `chore(env): add VITE_GA4_MEASUREMENT_ID example`
3. `feat(legal): mount GA4 in root layout`
4. `feat(analytics): purchase conversion event in ordine-confermato`
5. `docs(legal): align cookie/privacy policy to GA4 + Schrems II disclaimer`

### Cosa serve dall'utente

- Creare property GA4 "Calzoleria Prevenzano" su [analytics.google.com](https://analytics.google.com), web stream `https://calzoleriaprevenzano.it`
- Copiare `Measurement ID` (`G-XXXXXXXX`)
- Settare `VITE_GA4_MEASUREMENT_ID` su Railway env vars

---

## Wave 3 — Diritti GDPR + Newsletter compliance

**Goal**: L'utente può esercitare diritti Art. 15/17/20 GDPR, ogni consenso ha audit trail, la newsletter è legalmente valida, l'admin può consultare il registro consensi.

### 3a. Pagina `/account/privacy`

- File nuovo: `src/routes/account/privacy.tsx`
- Sezione "I tuoi dati" → bottone "Scarica i miei dati (JSON)" → POST `/api/user/export`
- Sezione "Cancella account" → bottone "Cancella definitivamente" → apre `TypeConfirmDialog` (pattern esistente da `quick/260429-gbo`) con typing-gate "CANCELLA"
- Sezione "Il tuo storico consensi" → tabella read-only delle ultime 20 righe `ConsentLog` per `userId` corrente
- Aggiungere link "Privacy e dati" in `src/routes/account.tsx` sidebar/menu

### 3b. Endpoint `POST /api/user/export`

- File nuovo: `src/routes/api/user/export.ts`
- Auth required (401 se non loggato)
- Rate limit custom: max 3 export/giorno per `userId` (controllo via `DataRequest.count({ userId, type: "export", createdAt > 24h ago })`)
- Query parallele: `user`, `addresses`, `orders { include: items, payments }`, `wishlist`, `consentLogs`, `auditLogs { where: userId }`
- Risposta: `Content-Type: application/json` + `Content-Disposition: attachment; filename="prevenzano-dati-${userId}-${YYYY-MM-DD}.json"`
- Insert `DataRequest { userId, type: "export", status: "completed", completedAt: now }`

### 3c. Endpoint `POST /api/user/delete`

- File nuovo: `src/routes/api/user/delete.ts`
- Auth required, body `{ confirm: "CANCELLA" }` validato Zod
- Transazione atomica:
  ```
  prisma.$transaction([
    user.update: {
      email: `deleted-${cuid()}@deleted.local`,
      name: "Utente cancellato",
      passwordHash: null,
      deletedAt: new Date(),
    }
    wishlistItem.deleteMany({ userId })
    address.deleteMany({ userId })
    session.deleteMany({ userId })       // logout forzato
    auditLog.create: { userId, event: "account_deleted", ip, userAgent }
    dataRequest.create: { userId, type: "delete", status: "completed", completedAt: now }
  ])
  ```
- **Ordini restano in DB**: `Order.userId` resta valorizzato ma `User.email`/`name` ora anonimizzati. Lo snapshot `Order.shippingAddress` JSON contiene già nome/indirizzo storici (immutabili per legge fiscale).
- Risposta: invalida sessione corrente (clear cookie session), `apiSuccess({ deleted: true })`
- Client: redirect `/` con toast "Account cancellato. I tuoi ordini restano per obblighi di legge."

**Schema check**: `User.passwordHash` deve essere nullable. Se non lo è, migration richiesta — verificare in execute phase.

### 3d. Audit log consensi extra (signup + newsletter)

- File: `src/components/auth/GdprConsentFields.tsx` consumer (cerca route `/auth/registrati` o equivalente)
- Al signup: dopo `user.create`, se `acceptPrivacy` true → insert `ConsentLog { userId, type: "privacy", granted: true }`. Idem `acceptMarketing` → `type: "marketing"`
- Newsletter (vedi 3e): insert `ConsentLog { userId: null, type: "marketing", granted: true }` solo dopo conferma double opt-in

### 3e. Newsletter double opt-in

**Migration richiesta**:

```prisma
model NewsletterSubscription {
  id          String    @id @default(cuid())
  email       String    @unique
  status      String    @default("pending") // "pending" | "confirmed" | "unsubscribed"
  token       String    @unique             // confirm + unsubscribe usano lo stesso
  confirmedAt DateTime?
  createdAt   DateTime  @default(now())

  @@index([status])
}
```

- `POST /api/newsletter` (modifica esistente):
  - Upsert `NewsletterSubscription { email, status: "pending", token: cuid() }`
  - Se già `confirmed` → risposta 200 idempotente, no email
  - Se `pending` → invia email Resend con link `https://calzoleriaprevenzano.it/newsletter/conferma?token={token}`
  - Risposta: "Ti abbiamo inviato un'email di conferma"
- Nuova route `/newsletter/conferma` (page TanStack):
  - `loader` chiama `POST /api/newsletter/confirm` con token
  - Endpoint: trova subscription, set `status: "confirmed"`, `confirmedAt: now`, insert `ConsentLog { type: "marketing", granted: true }`
  - Render conferma "Iscrizione confermata, grazie!"
- Nuova route `/newsletter/disiscriviti` (page):
  - Loader chiama `POST /api/newsletter/unsubscribe` con token
  - Set `status: "unsubscribed"`, insert `ConsentLog { type: "marketing", granted: false }`
  - Render "Disiscrizione completata"
- Email template HTML inline (no design system per email — table-based standard)

### 3f. Pannello admin `/admin/consensi`

- File nuovo: `src/routes/admin.consensi.tsx`
- Auth: admin guard (pattern esistente)
- Server function `listConsentLogs({ page, type? })` in `src/lib/admin/admin-consents.server.ts`
- Tabella read-only ultimi 100 entries: `createdAt`, `userId` (link a admin user), `type`, `granted`, `ip`, `userAgent` (truncated)
- Filtro per `type` (cookie/privacy/marketing) e date range
- Paginazione standard (12/pagina come admin orders)

### Verification

- E2E: nuovo signup con entrambi consensi → query `ConsentLog WHERE userId = X` ritorna 2 righe (privacy + marketing)
- E2E: scarica dati → JSON contiene `user`, `orders` con item, `wishlist`, `consentLogs`
- E2E: cancella account con ordini esistenti → query `User WHERE id = X` mostra `email` anonimizzato, `orders` restano con `userId` valorizzato e `shippingAddress` snapshot intatto, login fallisce
- E2E: newsletter signup → email arriva (Resend dashboard mostra delivery) → click conferma → `NewsletterSubscription.status = "confirmed"` + `ConsentLog` row
- E2E: click unsubscribe → `status = "unsubscribed"` + `ConsentLog { granted: false }`
- Admin: `/admin/consensi` mostra ultime righe in ordine cronologico

### Atomic commits

1. `feat(account): /account/privacy page with export + delete + consent history`
2. `feat(api): POST /api/user/export with full data dump JSON`
3. `feat(api): POST /api/user/delete with pseudo-anonymization transaction`
4. `feat(consent): log GdprConsentFields signup choices to ConsentLog`
5. `feat(db): NewsletterSubscription schema + migration`
6. `feat(newsletter): double opt-in flow (subscribe → email → confirm)`
7. `feat(newsletter): unsubscribe via tokenized link`
8. `feat(admin): /admin/consensi read-only consent log panel`

---

## Cosa NON facciamo

- ~~CMP IAB TCF v2.2~~ — overkill senza pubblicità terza parte
- ~~Cookie scanner automatico~~ — manualmente sappiamo cosa installiamo
- ~~Plausible (cloud o self-hosted)~~ — utente preferisce GA4 gratis
- ~~Grace period 30g per cancellazione account~~ — cancellazione immediata, più semplice
- ~~Export PDF/CSV~~ — JSON è formato standard GDPR
- ~~Sync con Mailchimp/Brevo~~ — newsletter resta self-hosted via Resend
- ~~P.IVA in footer~~ — già presente (`Footer.tsx:157`)
- ~~Modifiche schema Prisma per Wave 1/2~~ — modelli `ConsentLog` / `DataRequest` / `AuditLog` già esistono

## File toccati (riepilogo)

| File | Wave | Azione |
|------|------|--------|
| `src/routes/__root.tsx` | 1, 2 | Mount banner + GA4 |
| `src/routes/api/cookie-consent.ts` | 1 | NEW endpoint |
| `src/components/shared/Footer.tsx` | 1 | Add "Gestisci preferenze" |
| `src/components/shared/GoogleAnalytics.tsx` | 2 | NEW component |
| `src/routes/ordine-confermato.tsx` | 2 | Purchase event |
| `.env.example` | 2 | Add `VITE_GA4_MEASUREMENT_ID` |
| `src/routes/cookie.tsx` | 2 | Align to GA4 |
| `src/routes/privacy.tsx` | 2 | Schrems II disclaimer |
| `src/routes/account/privacy.tsx` | 3 | NEW page |
| `src/routes/api/user/export.ts` | 3 | NEW endpoint |
| `src/routes/api/user/delete.ts` | 3 | NEW endpoint |
| `src/components/auth/GdprConsentFields.tsx` consumer | 3 | Log to ConsentLog |
| `prisma/schema.prisma` | 3 | Add `NewsletterSubscription` + check `User.passwordHash` nullable |
| `src/routes/api/newsletter.ts` | 3 | Rewrite for double opt-in |
| `src/routes/api/newsletter/confirm.ts` | 3 | NEW |
| `src/routes/api/newsletter/unsubscribe.ts` | 3 | NEW |
| `src/routes/newsletter.conferma.tsx` | 3 | NEW |
| `src/routes/newsletter.disiscriviti.tsx` | 3 | NEW |
| `src/routes/admin.consensi.tsx` | 3 | NEW |
| `src/lib/admin/admin-consents.server.ts` | 3 | NEW |
| `src/routes/account.tsx` | 3 | Add sidebar link "Privacy e dati" |

## Riferimenti normativi

- GDPR (Reg. UE 2016/679) — Art. 6, 7, 13, 15, 17, 20, 46
- Direttiva e-Privacy (2002/58/CE) — cookie consent
- Codice Privacy italiano (D.Lgs. 196/2003 aggiornato 2018) — newsletter, marketing
- DPR 633/72 + art. 2220 c.c. — conservazione documenti fiscali 10 anni
- Provv. Garante Privacy 10/06/2021 — Linee Guida cookie e altri strumenti di tracciamento
- Schrems II (CGUE C-311/18) — trasferimenti USA, SCC
