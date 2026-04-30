# Resi — Form Online (Pivot dal PDF) Design Spec

**Data**: 2026-04-30
**Stato**: Approvato (in attesa review utente)
**Owner**: Pasquale
**Tipo**: Feature / Legal / Admin Workflow
**Supersedes (parzialmente)**: `docs/superpowers/specs/2026-04-30-resi-policy-silent-compliance-design.md` § 6 + § 5 (parte B procedura)

## Contesto

La spec precedente (`2026-04-30-resi-policy-silent-compliance-design.md`) ha consegnato l'allineamento marketing al minimo legale + pagina `/resi-e-recesso` + PDF "modulo di recesso" + checkbox checkout. Tutto pushato (commit `1ff3a00..5c0a4a0`).

Il PDF risulta poco usabile per il cliente moderno e non offre ai gestori del negozio uno strumento di gestione/audit. Pivot: sostituire il PDF con un **form online pubblico** + workflow admin di gestione richieste.

## Obiettivo

- Fornire al consumatore un canale digitale per richiedere il reso (campo `numero ordine` come autenticazione lite)
- Mantenere intatti i diritti legali: email + raccomandata restano canali validi (obbligo Art. 49 lett. h)
- Rinforzare la "silent compliance" originale: il form è discreto (linkato solo da `/resi-e-recesso` + § 8 termini), non promosso
- Creare un workflow admin che permetta di tracciare, gestire e auditare le richieste
- Soft handling: anche le richieste su prodotti personalizzati (in teoria escluse ex Art. 59.c) vengono accettate dal form e gestite caso per caso dall'admin

## Decisioni chiave

| Decisione | Scelta | Motivazione |
|-----------|--------|-------------|
| Accesso al form | Pubblico (no login required) | Anche guest può recedere (diritto consumatore) |
| Identificazione lite | Numero ordine + email coincidente | Previene richieste random senza richiedere login |
| Ordini personalizzati (Art. 59.c) | **Soft block** — warning visibile, submit consentito | L'utente ha scelto soft: l'admin valuta caso per caso (es. cortesia commerciale) |
| Termine 14gg | Validato server-side, hard block | Diritto scaduto = richiesta non ammissibile |
| Idempotenza | Una sola richiesta `pending` per `orderNumber` | Evita doppi submit, replay attack |
| Notifica | Email a `resi@calzoleriaprevenzano.it` (admin) + email conferma cliente | Pattern Resend esistente |
| Pagina conferma | `/resi-e-recesso/richiesta/inviata` (no ID in URL) | Privacy: nessun dato sensibile esposto |
| Modello DB | Nuovo `ReturnRequest` (non riuso `DataRequest`) | Semantica diversa, audit indipendente |
| Pannello admin | `/admin/resi` con filtri + status workflow | Pattern identico a `/admin/ordini` |
| PDF + script + devDep pdfkit | **Rimossi** | Non più usati, cleanup completo |
| Email diretta + raccomandata | **Mantenute** in § 8 termini come canali alternativi | Diritto inderogabile (Art. 49 + 54) |

## Architettura

### Modello Prisma

```prisma
model ReturnRequest {
  id          String    @id @default(cuid())
  orderId     String                    // FK Order
  orderNumber String                    // denormalizzato per query/visibilità
  email       String                    // snapshot email al momento della richiesta
  fullName    String                    // snapshot nome cliente
  reason      String    @db.Text
  status      String    @default("pending") // "pending" | "approved" | "rejected" | "completed"
  adminNotes  String?   @db.Text
  hasOnlyCustomItems Boolean @default(false) // flag soft-block: ordine ha solo personalizzati
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  resolvedAt  DateTime?

  order       Order     @relation(fields: [orderId], references: [id], onDelete: Restrict)

  @@index([orderId])
  @@index([status])
  @@index([createdAt])
  @@map("return_requests")
}
```

**Note schema**:
- `onDelete: Restrict` su Order: non vogliamo perdere richieste reso anche se l'ordine viene cancellato
- `hasOnlyCustomItems` flag computato al server al submit, comodo per filtri admin (vedere subito le richieste "pelose")
- Migration additive (`CREATE TABLE`), zero rischio su prod

**Idempotenza** gestita via business logic (no `@@unique` constraint Prisma): server-side check `count({ orderNumber, status: "pending" }) === 0` prima di insert. Rationale: il constraint @@unique avrebbe richiesto partial index su PostgreSQL non supportato nativamente da Prisma syntax.

### Flusso submit

```
[Form public] POST /api/return-request
  ├─ Rate limit FORM (3/min per IP)
  ├─ Zod validation { fullName, email, orderNumber, reason, acceptedPolicy: literal(true) }
  ├─ DB lookup: order = findUnique({ orderNumber })
  │   └─ no → 404 "Ordine non trovato"
  ├─ Email match: order.guestEmail === email OR order.user.email === email
  │   └─ no → 403 "L'email non corrisponde all'ordine"
  ├─ Date check: (now - order.createdAt) <= 14 days
  │   └─ no → 422 "Termine di 14 giorni superato"
  ├─ Idempotency: count pending requests = 0
  │   └─ exists → 409 "Hai già una richiesta in corso"
  ├─ Compute hasOnlyCustomItems: tutti i product.category in subcategorie sandali?
  ├─ INSERT ReturnRequest (status="pending", hasOnlyCustomItems)
  ├─ sendEmail: notifica admin a resi@calzoleriaprevenzano.it (con link admin)
  ├─ sendEmail: conferma cliente all'email indicata
  └─ Return apiSuccess({ submitted: true })
```

### Flusso admin

```
GET /api/admin/return-requests?page=N&status=X&from=YYYY-MM-DD&to=YYYY-MM-DD
  → paginated list

PATCH /api/admin/return-requests/:id { status, adminNotes }
  ├─ Auth admin
  ├─ Update record (set status, adminNotes, resolvedAt if status terminale)
  ├─ AuditLog event "return_request_status_changed" with before/after
  └─ apiSuccess
```

## Modifiche dettagliate

### 1. Cleanup PDF

- DELETE `public/modulo-recesso.pdf`
- DELETE `scripts/generate-modulo-recesso.ts`
- EDIT `package.json`: rimuovere `pdfkit` + `@types/pdfkit` dalle devDependencies, rimuovere script `modulo:gen` se presente
- Run `pnpm install` per aggiornare `pnpm-lock.yaml`

### 2. Schema migration

- EDIT `prisma/schema.prisma`: aggiungere modello `ReturnRequest` come sopra
- Run `pnpm prisma migrate dev --name add_return_requests`
- La migration sarà additive-safe (solo `CREATE TABLE` + indici)

### 3. Endpoint `POST /api/return-request`

- NEW `src/routes/api/return-request.ts`
- Schema Zod inline:

```typescript
const returnRequestSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().email(),
  orderNumber: z.string().trim().regex(/^CP-\d{4}-\d{4}$/),
  reason: z.string().trim().min(10).max(500),
  acceptedPolicy: z.literal(true),
});
```

- Tutti gli error mapping con messaggi italiani precisi (no leak stack)
- Rate limit FORM bucket via `checkRateLimit` esistente

### 4. Form pagina `/resi-e-recesso/richiesta`

- NEW `src/routes/resi-e-recesso.richiesta.tsx`
- Usa `@tanstack/react-form` + zod adapter (NO `react-hook-form` da CLAUDE.md)
- Layout: stesso wrapper di `/resi-e-recesso` per coerenza visiva
- Heading: "Richiesta di reso", sottotitolo "Compila il modulo per esercitare il diritto di recesso (Art. 52 D.Lgs. 206/2005)"
- Campi UI: shadcn `Input`, `Textarea`, `Checkbox`, `Button`
- Stato success → redirect `/resi-e-recesso/richiesta/inviata`
- Stato error → toast `sonner` + messaggio inline sul campo se applicabile
- Link sotto al form: "In alternativa puoi inviare la richiesta via email a `resi@calzoleriaprevenzano.it` o raccomandata A/R" (mantenere visibilità diritti alternativi)

### 5. Pagina conferma `/resi-e-recesso/richiesta/inviata`

- NEW `src/routes/resi-e-recesso.richiesta.inviata.tsx`
- Static page, no data fetching (no ID in URL per privacy)
- Contenuto:
  - Titolo "Richiesta inviata"
  - Testo: *"Grazie. Abbiamo ricevuto la tua richiesta. Il nostro team la valuterà e ti contatterà via email entro 14 giorni con le istruzioni di restituzione o l'esito."*
  - CTA "Torna alla home" → `/`
  - Link "Vai ai termini di vendita" → `/termini`

### 6. Update `/resi-e-recesso.tsx` (esistente)

- Sezione B (prodotti shop): sostituire le righe sulla procedura PDF con:
  > *Per esercitare il diritto, compila il [modulo di richiesta reso online](/resi-e-recesso/richiesta) indicando il numero del tuo ordine. Riceverai una conferma via email entro 14 giorni con le istruzioni di restituzione.*
  >
  > *In alternativa, puoi inviare comunicazione esplicita via email a `resi@calzoleriaprevenzano.it` o tramite raccomandata A/R a Calzoleria Prevenzano, Via Chiaia 104 — 80132 Napoli (NA).*

### 7. Update `termini.tsx` § 8

- Sostituire il paragrafo aggiunto nel commit `28c0a68` sul modulo PDF con:
  > *Per facilitare l'esercizio del diritto, l'Acquirente può utilizzare il [modulo di richiesta reso online](/resi-e-recesso/richiesta) accessibile dal nostro sito. Resta fermo il diritto dell'Acquirente di esercitare il recesso anche tramite comunicazione esplicita inviata a `resi@calzoleriaprevenzano.it` o raccomandata A/R all'indirizzo del Venditore (Art. 49 c. 1 lett. h e Art. 54 D.Lgs. 206/2005).*

### 8. Email templates

Riusare l'infra `src/lib/email.server.ts` esistente (Resend wrapper).

**Email admin** (a `resi@calzoleriaprevenzano.it`):
- Subject: `[Reso] Nuova richiesta da {fullName} — Ordine {orderNumber}`
- Body HTML inline: dettagli richiesta + link `/admin/resi/{id}` + flag warning se `hasOnlyCustomItems`

**Email cliente** (all'email indicata nel form):
- Subject: `Calzoleria Prevenzano — Conferma ricezione richiesta reso`
- Body HTML inline: ringraziamento, riassunto (numero ordine, data richiesta), promessa "ti contatteremo entro 14 giorni", footer con info contatto

### 9. Pannello admin `/admin/resi`

- NEW `src/routes/admin.resi.tsx` — lista paginata
- NEW `src/routes/admin.resi.$id.tsx` — dettaglio + form gestione status
- NEW `src/lib/admin/admin-returns.server.ts` — server functions:
  - `$listReturnRequests({ page, status?, from?, to? })`
  - `$getReturnRequest(id)` con include order + items
  - `$updateReturnRequestStatus(id, { status, adminNotes })`
- Pattern: identico a `/admin/ordini` (paginazione 12/page, filtri sticky, status badge colorati)
- Sidebar admin (`src/routes/admin.tsx`): aggiungere link "Resi" con icon `RotateCcw` di lucide-react + badge count `pending`

### 10. Endpoint admin

- NEW `src/routes/api/admin/return-requests.ts` — GET list (riusa server function)
- NEW `src/routes/api/admin/return-requests.$id.ts` — PATCH status/notes
- Auth: admin guard pattern esistente
- AuditLog event `return_request_status_changed` con `metadata: { id, oldStatus, newStatus, adminNotes }`

## Atomic commits previsti

1. `chore(legal): rimuovi PDF modulo recesso + script + devDep pdfkit`
2. `feat(db): ReturnRequest schema + migration`
3. `feat(api): POST /api/return-request con validation ordine + email + 14gg + soft-block personalizzati`
4. `feat(legal): form pubblico /resi-e-recesso/richiesta + pagina conferma`
5. `feat(legal): aggiorna /resi-e-recesso e termini § 8 — link al form (mantieni email/raccomandata come alternative)`
6. `feat(admin): /admin/resi lista paginata + dettaglio gestione status`
7. `feat(api): GET + PATCH /api/admin/return-requests con AuditLog status change`

7 commit atomici, ~14 file impattati di cui 9 nuovi (1 migration + 8 file applicativi).

## Verification

- **Smoke browser**: `/resi-e-recesso` mostra link al form (NO link PDF). Click apre `/resi-e-recesso/richiesta`. Submit incompleto → errori inline. Submit valido (con dati di un ordine reale) → redirect a `/inviata`
- **Smoke API ordine inesistente**: POST con `orderNumber` fake → 404
- **Smoke API email mismatch**: POST con email diversa da quella ordine → 403
- **Smoke API ordine vecchio**: simulare con ordine >14gg in DB → 422
- **Smoke API doppio submit**: POST due volte stesso ordine → seconda 409
- **Smoke API personalizzati**: POST con ordine che ha solo sandali custom → success ma `hasOnlyCustomItems=true` in DB
- **Email**: verificare in Resend dashboard che entrambe le email partano post-submit
- **Admin**: `/admin/resi` mostra lista, filtri funzionano, dettaglio editabile, cambio status crea AuditLog
- **Cleanup**: `ls public/modulo-recesso.pdf` → No such file. `cat package.json | grep pdfkit` → empty
- **`pnpm typecheck`**: baseline 25 → 25 preservata
- **`pnpm prisma migrate status`**: nuova migration applied

## Scope esplicitamente escluso

- ~~Allegato foto del prodotto al form~~ — semplicità, può aggiungersi dopo
- ~~Login required~~ — utente ha scelto pubblico (A)
- ~~Hard block sui personalizzati~~ — utente ha scelto soft (admin decide)
- ~~Tracking RMA / etichetta corriere prepagata~~ — fuori scope, manuale
- ~~Workflow stato a step (es. "in attesa pacco" / "ricevuto" / "rimborsato")~~ — bastano 4 status (pending/approved/rejected/completed)
- ~~Notifica WhatsApp/SMS~~ — solo email
- ~~Auto-rimborso Stripe~~ — gestione manuale dall'admin (Stripe dashboard separato)

## File toccati (riepilogo)

| File | Azione |
|------|--------|
| `public/modulo-recesso.pdf` | DELETE |
| `scripts/generate-modulo-recesso.ts` | DELETE |
| `package.json` + `pnpm-lock.yaml` | EDIT (rimuovi pdfkit) |
| `prisma/schema.prisma` | EDIT (add ReturnRequest) |
| `prisma/migrations/YYYYMMDD_add_return_requests/migration.sql` | NEW (auto) |
| `src/routes/api/return-request.ts` | NEW |
| `src/routes/resi-e-recesso.richiesta.tsx` | NEW |
| `src/routes/resi-e-recesso.richiesta.inviata.tsx` | NEW |
| `src/routes/resi-e-recesso.tsx` | EDIT (link al form) |
| `src/routes/termini.tsx` | EDIT (§ 8 link al form) |
| `src/routes/admin.resi.tsx` | NEW |
| `src/routes/admin.resi.$id.tsx` | NEW |
| `src/lib/admin/admin-returns.server.ts` | NEW |
| `src/routes/api/admin/return-requests.ts` | NEW |
| `src/routes/api/admin/return-requests.$id.ts` | NEW |
| `src/routes/admin.tsx` | EDIT (sidebar + Resi) |
| `src/lib/email.server.ts` o nuovo helper | EDIT/NEW (template email reso) |

~16 file totali, 9 nuovi.

## Riferimenti normativi

- D.Lgs. 206/2005:
  - Art. 49 lett. h — modulo recesso obbligatorio (form online soddisfa requisito)
  - Art. 52 — 14 giorni termine
  - Art. 54 — modalità esercizio (qualsiasi dichiarazione esplicita, non solo PDF)
  - Art. 56 + 57 — rimborso e restituzione
  - Art. 59 lett. c — esclusione personalizzati (soft-applicato qui)
