---
phase: quick/260430-vll
plan: 01
subsystem: legal/admin/api/db
tags: [resi, recesso, gdpr, admin, audit, soft-block, art-59c, art-52]
wave: 1
requires: [Order, AuditLog, sendEmail/Resend, requireAdmin/secure-auth-sdk]
provides:
  - prisma.returnRequest model + migration additive
  - POST /api/return-request (rate-limited public form endpoint)
  - /resi-e-recesso/richiesta (public form @tanstack/react-form + zod)
  - /resi-e-recesso/richiesta/inviata (privacy-safe confirmation page)
  - /admin/resi list + detail + sidebar badge count pending
  - GET/PATCH /api/admin/return-requests (admin CRUD + AuditLog)
affects:
  - /resi-e-recesso (link form sostituisce PDF)
  - /termini § 8 (link form sostituisce PDF)
  - /admin sidebar (nuovo NAV_ITEM Resi + RotateCcw + badge)
tech-stack:
  added: [] # nessuna nuova dep, solo cleanup pdfkit + @types/pdfkit
  patterns:
    - "createServerFn { method:'GET' }.inputValidator(...).handler(requireAdmin)"
    - "AuditLog event 'return_request_status_changed' best-effort try/catch"
    - "Idempotency via prisma.returnRequest.count where status:pending (no @@unique partial index)"
    - "Soft-block Art. 59.c: hasOnlyCustomItems flag computato server-side, submit consentito + warning admin"
    - "TanStack Form v1.28 useForm con @ts-expect-error sul useForm + helper firstErrorMessage per stringa stampabile"
key-files:
  created:
    - prisma/migrations/20260430_add_return_requests/migration.sql
    - src/routes/api/return-request.ts
    - src/routes/resi-e-recesso.richiesta.tsx
    - src/routes/resi-e-recesso.richiesta.inviata.tsx
    - src/lib/admin/admin-returns.server.ts
    - src/routes/admin.resi.tsx
    - src/routes/admin.resi.$id.tsx
    - src/routes/api/admin/return-requests.ts
    - src/routes/api/admin/return-requests.$id.ts
  modified:
    - prisma/schema.prisma (+ model ReturnRequest, + Order.returnRequests inverse relation)
    - package.json (− pdfkit, − @types/pdfkit, − script modulo:gen)
    - pnpm-lock.yaml (auto)
    - src/routes/resi-e-recesso.tsx (Procedura → link form, footer date)
    - src/routes/termini.tsx (§ 8 → link form)
    - src/routes/admin.tsx (+ NAV Resi + badge count + RotateCcw icon)
    - src/lib/admin-functions.ts (+ 3 createServerFn wrapper resi)
    - src/lib/validators/admin.ts (+ listReturnRequestsSchema + updateReturnRequestSchema)
  deleted:
    - public/modulo-recesso.pdf
    - scripts/generate-modulo-recesso.ts
decisions:
  - id: "form pubblico no-login"
    why: "Il diritto di recesso spetta anche a guest, login required violerebbe Art. 52 D.Lgs. 206/2005"
    impact: "Identification lite via numero ordine + email match case-insensitive — rate limit FORM 3/min per IP previene abuso"
  - id: "soft-block prodotti personalizzati Art. 59.c"
    why: "Utente ha scelto soft-block (vs hard-block): l'admin valuta caso per caso (cortesia commerciale)"
    impact: "Submit consentito + flag hasOnlyCustomItems salvato + warning ambra in lista admin + warning email + warning pannello dettaglio"
  - id: "idempotency via business logic, non @@unique partial index"
    why: "Postgres partial index non supportato nativamente da Prisma syntax (es. WHERE status='pending')"
    impact: "Server-side prisma.returnRequest.count where { orderNumber, status: 'pending' } === 0 prima di insert; race window minima ma esiste — accettabile per UX form pubblico"
  - id: "no @@unique constraint sul DB"
    why: "Permetterebbe più richieste storiche per stesso ordine (es. dopo che admin ha rifiutato, cliente può riprovare con motivazione diversa)"
    impact: "Solo le pending sono uniche per orderNumber; approved/rejected/completed possono accumularsi (audit trail completo)"
  - id: "Order.onDelete: Restrict (non Cascade)"
    why: "Non vogliamo perdere richieste reso anche se l'ordine viene cancellato (es. soft-delete admin con bulk)"
    impact: "DB blocca cancellazione hard di Order se ci sono ReturnRequest collegate — gestione manuale richiesta"
  - id: "AuditLog best-effort (no transaction)"
    why: "Pattern consolidato nel progetto (terms_accepted_at_checkout, account_deleted): non vogliamo che un fail su AuditLog blocchi l'azione admin"
    impact: "log.warn se insert fallisce; in caso di losses isolate, audit lacunoso ma operazione admin completata"
  - id: "pivot completo dal PDF, no doppio canale"
    why: "Mantenere PDF + form genera confusione cliente e doppia manutenzione; lo standard moderno è form online"
    impact: "Email + raccomandata restano come canali alternativi citati esplicitamente (Art. 49 + 54 compliance), ma il PDF non esiste più"
  - id: "no email cliente su PATCH admin status change"
    why: "Decisione utente: notifica via email a approvazione/rifiuto è gestita manualmente dall'admin via replyTo email originale"
    impact: "Endpoint PATCH minimal: solo update DB + AuditLog. Admin può copiare reply manualmente da Resend dashboard se serve"
  - id: "HTML escape su user input nelle email"
    why: "Defense in depth contro injection nel body email (anche se Zod blocca tag-only inputs)"
    impact: "escapeHtml() helper inline sul fullName/email/orderNumber/reason prima di interpolazione in template HTML email"
metrics:
  duration: "1h ~30min (Tasks 3-7)"
  tasks_total: 7
  tasks_completed: 7
  files_created: 9
  files_modified: 8
  files_deleted: 2
  commits: 7
  typecheck_baseline: "25 → 25 (zero regressioni)"
  any_introduced: 0
  completed: 2026-05-01
---

# Phase quick/260430-vll: Resi Form Online Pivot (cleanup PDF + ReturnRequest workflow) Summary

**One-liner:** Pivot completo da PDF statico "modulo recesso" a workflow online: form pubblico `/resi-e-recesso/richiesta` con validation 14gg/email/idempotenza/soft-block Art. 59.c + email transactional admin/cliente Resend + pannello admin `/admin/resi` (lista paginata + dettaglio editabile + sidebar con badge pending) + AuditLog event `return_request_status_changed`.

## Outcome

7 commit atomici italiani in ordine spec, 19 file impattati (9 nuovi inclusa migration, 8 modificati, 2 deleted), zero deviazioni Rule 1/2/3 dal plan originale, una sola decisione di adattamento minore documentata sotto.

| # | Commit | Type | Files | Notes |
|---|--------|------|-------|-------|
| 1 | `baafa88` | chore(legal) | 4 | rimuovi PDF modulo recesso + script + devDep pdfkit (eseguito dal parent prima dell'avvio executor) |
| 2 | `0df68c1` | feat(db) | 2 | ReturnRequest schema + migration `20260430_add_return_requests` (eseguito dal parent) |
| 3 | `bfaa24a` | feat(api) | 1 | POST /api/return-request con validation ordine + email + 14gg + soft-block personalizzati |
| 4 | `a4c6c66` | feat(legal) | 2 | form pubblico /resi-e-recesso/richiesta + pagina conferma |
| 5 | `e7188ca` | feat(legal) | 2 | aggiorna /resi-e-recesso e termini § 8 — link al form (mantieni email/raccomandata come alternative) |
| 6 | `633940d` | feat(admin) | 6 | /admin/resi lista paginata + dettaglio gestione status + sidebar badge count |
| 7 | `5fe9a20` | feat(api) | 2 | GET + PATCH /api/admin/return-requests con AuditLog status change |

## Decisions Made

Tutte le decisioni chiave sono già nel frontmatter. Riepilogo prosa:

1. **Form pubblico no-login** + identification lite via `orderNumber + email case-insensitive` — il diritto di recesso vale anche per guest (Art. 52 D.Lgs. 206/2005), login required sarebbe stato barrier illegittimo. Rate limit `FORM` (3/min per IP) bilancia accessibilità e protezione anti-abuse.
2. **Soft-block Art. 59.c** — submit consentito anche per ordini "solo personalizzati" (sandali Classica/Gioiello/Bambini), ma flag `hasOnlyCustomItems` salvato in DB + warning ambra in lista admin + alert in dettaglio + warning HTML in email admin. Decisione utente: cortesia commerciale > rigidità legale.
3. **Idempotency via business logic** (count pending, no `@@unique` partial index) — Prisma syntax non supporta partial indexes nativamente. Race window minima accettabile per UX form pubblico.
4. **`Order.onDelete: Restrict`** — proteggere richieste reso da hard-delete ordini (admin bulk). Pattern conservativo per audit completo.
5. **AuditLog best-effort try/catch** — coerente con pattern esistenti (`terms_accepted_at_checkout`, `account_deleted`): un fail su AuditLog non deve bloccare l'azione admin. `log.warn` su fail.
6. **Pivot completo dal PDF** — il PDF non esiste più. Email + raccomandata mantenuti come canali alternativi citati esplicitamente in `/resi-e-recesso` § Procedura + `/termini` § 8 (compliance Art. 49 c. 1 lett. h + Art. 54 inderogabile).
7. **No email cliente su PATCH status admin** — decisione utente: notifica approvazione/rifiuto è gestita manualmente dall'admin via `replyTo` sull'email originale (Resend dashboard). Endpoint PATCH minimal: solo update DB + AuditLog.
8. **HTML escape su user input nelle email** — defense in depth contro injection nel body HTML. Helper `escapeHtml()` inline su `fullName`/`email`/`orderNumber`/`reason` prima di interpolazione.

## Deviations from Plan

**1 deviazione minore (Rule 2 — auto-add missing critical functionality):**

- **HTML escape esplicito sul `reason` (e tutti gli altri user input) nelle email transactional**
  - **Found during:** Task 3 (POST /api/return-request)
  - **Issue:** Il plan prevedeva `data.reason.replace(/</g, "&lt;").replace(/\n/g, "<br>")` come escape minimo "perché tag-only inputs già bloccati da Zod". In realtà Zod NON blocca tag — accetta qualsiasi stringa di 10-500 caratteri, inclusi `<script>` o `<img onerror>`. Gli altri campi (`fullName`, `email`, `orderNumber`) erano interpolati senza escape.
  - **Fix:** Helper `escapeHtml(input)` standalone con escape completo (`&`, `<`, `>`, `"`, `'`), applicato a tutti i 4 campi user input + `\n → <br>` solo sul `reason` per preservare formatting multilinea.
  - **Files modified:** `src/routes/api/return-request.ts`
  - **Commit:** `bfaa24a`
  - **Rationale Rule 2:** Defense in depth — anche se i client email moderni sandboxano JS, evitare injection nel body HTML è correctness/security baseline. Costo: 8 LOC, zero impatto runtime.

**Adattamenti tecnici (NON deviazioni):**

- **No shadcn UI primitives nel progetto** — il plan citava `Input`, `Textarea`, `Checkbox`, `Button`, `Label` da `~/components/ui/`. Verificato: `src/components/ui/` contiene solo 3 custom components animation (`StaggeredGrid`, `ScrollCounter`, `ScrollAnimatedSection`). Il progetto usa raw HTML elements + Tailwind classes (pattern coerente con `FormField.tsx` in `src/components/auth/`). Implementato con stesso pattern: input/textarea/checkbox raw + `inputClass` constant Tailwind. CLAUDE.md "ALWAYS use shadcn equivalents" si applica quando shadcn è installato — qui no.
- **Helper `firstErrorMessage(errors: unknown)` in `resi-e-recesso.richiesta.tsx`** — TanStack Form v1.28 con `@ts-expect-error` sul `useForm` propaga `unknown` sui `field.state.meta.errors[0]`, che JSX rifiuta come `ReactNode`. Helper estrae stringa stampabile gestendo string + Zod issue object + fallback `String()`. Pattern locale al file, non astratto. Allineato a CLAUDE.md zero-any (nessun `any`, solo `unknown` con narrowing).
- **TanStack Router file-based: `admin.resi.tsx` + `admin.resi.$id.tsx`** — la lista guard con `useRouterState` + `pathname !== "/admin/resi" → <Outlet />` (pattern identico a `admin.ordini.tsx`).
- **`routeTree.gen.ts`** — gitignored, rigenerato automaticamente da `pnpm dev` (Vite plugin TanStack Router). Non impatta commit (verificato `git status` post-task).

## Authentication Gates

Nessuno. Il task non richiedeva nuove credenziali (Resend già configurata da Wave 2/3 GDPR, Better Auth admin già funzionante).

## Verifications Eseguite

**Pre-commit gate per ogni task:**
- `pnpm typecheck`: baseline 25 errori → 25 errori dopo Task 7 (zero regressioni, verificato individualmente dopo ogni task)
- Zero `any` introdotti: `grep -rEn ": any|as any|<any>" <new files>` → tutti vuoti
- Zero menzioni `react-hook-form` nel form: `grep -n "react-hook-form" src/routes/resi-e-recesso.richiesta.tsx` → vuoto (CLAUDE.md compliance)
- Zero menzioni `modulo-recesso.pdf` post-Task 5: `grep -n "modulo-recesso.pdf" src/routes/resi-e-recesso.tsx src/routes/termini.tsx` → vuoto
- Entrambi i file legali linkano `/resi-e-recesso/richiesta` (verificato `grep -c`)
- Entrambi i file legali mantengono `raccomandata A/R` come canale alternativo (verificato `grep -c`)

**Smoke browser/API DEFERRED a deploy Railway** (executor non ha eseguito server locale, scelta per evitare hang nel sandbox). Smoke previsti post-deploy:
- `/resi-e-recesso/richiesta` → form 5 campi + submit
- POST `/api/return-request` con `orderNumber: CP-9999-9999` (fake) → 404
- POST con email mismatch → 403
- POST con ordine reale > 14gg → 422
- Re-POST stesso ordine entro 1min → 409
- POST valido → redirect `/inviata` + 2 email Resend
- `/admin/resi` lista + filtri + badge sidebar
- PATCH dettaglio admin → AuditLog `return_request_status_changed`

## Post-deploy Setup utente richiesto

1. **Mailbox `resi@calzoleriaprevenzano.it`**: confermare attivazione (alias a `info@` accettato). Pre-requisito ricezione notifiche admin. Già citato in spec `260430-tcf` (precedente).
2. **Migration Railway**: `prisma migrate deploy` deve applicare `20260430_add_return_requests` automaticamente (pattern già verificato per migration NewsletterSubscription Wave 3).
3. **Smoke API post-deploy**: opzionale ma raccomandato — eseguire 4 path errore via curl o Postman su un ordine reale (404 ordine fake, 403 email mismatch, 409 doppio submit, 200 valido) per verificare che Prisma Client production sia rigenerato e che `prisma.returnRequest` sia disponibile.
4. **Verifica Resend dashboard**: dopo primo submit reale, controllare che 2 email partano (admin a `resi@` + cliente all'email indicata).

## Stato finale

Branch: `site-gen/calzoleria-prevenzano` — 7 commit avanti rispetto a `origin` (push autorizzato esplicitamente per Railway autodeploy).

## Self-Check: PASSED

- 9 file creati verificati esistenti su disk
- 7 commit hash verificati presenti in `git log --oneline baafa88^..HEAD`
- Typecheck baseline 25 → 25 verificato
- Zero `any` introdotti verificato
- Zero menzioni `modulo-recesso.pdf` in src/ verificato
