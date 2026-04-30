---
phase: quick/260430-vll
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - public/modulo-recesso.pdf
  - scripts/generate-modulo-recesso.ts
  - package.json
  - pnpm-lock.yaml
  - prisma/schema.prisma
  - prisma/migrations/YYYYMMDDHHMMSS_add_return_requests/migration.sql
  - src/routes/api/return-request.ts
  - src/routes/resi-e-recesso.richiesta.tsx
  - src/routes/resi-e-recesso.richiesta.inviata.tsx
  - src/routes/resi-e-recesso.tsx
  - src/routes/termini.tsx
  - src/routes/admin.resi.tsx
  - src/routes/admin.resi.$id.tsx
  - src/lib/admin/admin-returns.server.ts
  - src/lib/admin-functions.ts
  - src/routes/admin.tsx
  - src/routes/api/admin/return-requests.ts
  - src/routes/api/admin/return-requests.$id.ts
  - src/lib/validators/admin.ts
autonomous: true
requirements:
  - REQ-RESI-01-cleanup-pdf
  - REQ-RESI-02-schema-return-requests
  - REQ-RESI-03-public-api-return-request
  - REQ-RESI-04-public-form-pages
  - REQ-RESI-05-update-legal-pages
  - REQ-RESI-06-admin-list-detail
  - REQ-RESI-07-admin-api-audit
user_setup:
  - service: resend
    why: "Notifiche email reso (admin + cliente) — già configurato da Wave 2/3 GDPR"
    env_vars:
      - name: RESEND_API_KEY
        source: "Resend dashboard — già esistente"
      - name: EMAIL_FROM
        source: "Già configurata (noreply@calzoleriaprevenzano.it)"
    dashboard_config:
      - task: "Confermare attivazione mailbox resi@calzoleriaprevenzano.it (alias info@ accettato) — pre-requisito ricezione notifiche admin"
        location: "Provider mail dominio"

must_haves:
  truths:
    - "Il PDF /modulo-recesso.pdf non esiste più sul filesystem né in package.json"
    - "Esiste tabella DB return_requests con indici su orderId/status/createdAt"
    - "POST /api/return-request valida ordine + email + 14gg + idempotenza, soft-block personalizzati (flag), invia 2 email (admin + cliente)"
    - "Utente naviga da /resi-e-recesso, clicca link al form, compila /resi-e-recesso/richiesta, viene reindirizzato a /resi-e-recesso/richiesta/inviata"
    - "/resi-e-recesso e termini § 8 NON contengono più link PDF e linkano al form online (mantenendo email/raccomandata come canali alternativi)"
    - "Admin in /admin/resi vede lista paginata con filtri status/range date, badge count pending nella sidebar, dettaglio editabile cambia status + adminNotes con AuditLog"
  artifacts:
    - path: "prisma/schema.prisma"
      provides: "Modello ReturnRequest con FK Order onDelete:Restrict + flag hasOnlyCustomItems"
      contains: "model ReturnRequest"
    - path: "src/routes/api/return-request.ts"
      provides: "POST endpoint validation + email submit"
      exports: ["Route"]
    - path: "src/routes/resi-e-recesso.richiesta.tsx"
      provides: "Form pubblico tanstack/react-form + zod adapter + shadcn UI"
      exports: ["Route"]
    - path: "src/routes/resi-e-recesso.richiesta.inviata.tsx"
      provides: "Pagina conferma statica no ID URL"
      exports: ["Route"]
    - path: "src/lib/admin/admin-returns.server.ts"
      provides: "$listReturnRequests + $getReturnRequest + $updateReturnRequestStatus + $countPendingReturnRequests"
      exports: ["listReturnRequests", "getReturnRequest", "updateReturnRequestStatus", "countPendingReturnRequests"]
    - path: "src/routes/admin.resi.tsx"
      provides: "Lista paginata admin con filtri sticky"
      exports: ["Route"]
    - path: "src/routes/admin.resi.$id.tsx"
      provides: "Dettaglio editabile + form gestione status"
      exports: ["Route"]
    - path: "src/routes/api/admin/return-requests.ts"
      provides: "GET list admin"
      exports: ["Route"]
    - path: "src/routes/api/admin/return-requests.$id.ts"
      provides: "PATCH status + adminNotes con AuditLog"
      exports: ["Route"]
  key_links:
    - from: "src/routes/resi-e-recesso.richiesta.tsx"
      to: "/api/return-request"
      via: "fetch POST in onSubmit"
      pattern: "fetch.*api/return-request"
    - from: "src/routes/api/return-request.ts"
      to: "prisma.returnRequest.create + prisma.order.findUnique + sendEmail"
      via: "DB lookup + insert + Resend"
      pattern: "prisma\\.returnRequest\\.(create|count)|prisma\\.order\\.findUnique|sendEmail"
    - from: "src/routes/resi-e-recesso.tsx + src/routes/termini.tsx"
      to: "/resi-e-recesso/richiesta"
      via: "anchor href"
      pattern: "/resi-e-recesso/richiesta"
    - from: "src/routes/admin.resi.$id.tsx"
      to: "/api/admin/return-requests/:id"
      via: "fetch PATCH"
      pattern: "fetch.*api/admin/return-requests"
    - from: "src/routes/api/admin/return-requests.$id.ts"
      to: "prisma.auditLog.create"
      via: "AuditLog event return_request_status_changed"
      pattern: "prisma\\.auditLog\\.create.*return_request_status_changed"
    - from: "src/routes/admin.tsx"
      to: "src/lib/admin/admin-returns.server.ts (countPendingReturnRequests)"
      via: "NAV_ITEMS link Resi con badge count + RotateCcw icon"
      pattern: "/admin/resi"
---

<objective>
Pivot dal PDF "modulo recesso" statico a un workflow online completo: form pubblico /resi-e-recesso/richiesta + endpoint POST con validation 14gg/email/idempotenza + email transactional admin/cliente + pannello admin /admin/resi (lista + dettaglio + cambio status con AuditLog) + cleanup PDF/script/devDep pdfkit.

Purpose: Migliorare UX cliente e dare allo staff uno strumento di gestione/audit delle richieste di reso, mantenendo intatti i diritti legali (email + raccomandata restano canali alternativi citati in /resi-e-recesso e termini § 8 ai sensi Art. 49 lett. h + Art. 54 D.Lgs. 206/2005). Soft-block sui prodotti personalizzati (Art. 59 lett. c): submit consentito + flag visibile in admin.

Output: 7 commit atomici italiani in ordine, ~16 file impattati di cui 9 nuovi (1 migration + 8 file applicativi), typecheck baseline 25 → 25 preservata, zero `any`.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@docs/superpowers/specs/2026-04-30-resi-form-online-pivot-design.md
@docs/superpowers/specs/2026-04-30-resi-policy-silent-compliance-design.md
@CLAUDE.md
@prisma/schema.prisma
@src/routes/api/cookie-consent.ts
@src/routes/resi-e-recesso.tsx
@src/routes/termini.tsx
@src/components/auth/RegisterForm.tsx
@src/lib/email.server.ts
@src/lib/admin/admin-orders.server.ts
@src/routes/admin.ordini.tsx
@src/routes/admin.ordini.$id.tsx
@src/routes/admin.tsx
@src/routes/api/admin/orders.ts
@src/routes/api/admin/orders.$id.ts
@src/lib/admin-functions.ts
@src/lib/validators/admin.ts
@package.json

<interfaces>
<!-- Estratti dai file letti durante la pianificazione. L'executor li usa direttamente — nessuna esplorazione codebase necessaria. -->

From src/lib/email.server.ts:
```typescript
interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}
interface SendEmailResult { ok: boolean; id?: string; }
export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult>;
```

From src/lib/api-response.ts (pattern usato ovunque):
```typescript
// apiSuccess(data, status?, headers?) → Response
// apiError(code, message, status, details?, headers?) → Response
```

From src/lib/rate-limit.server.ts:
```typescript
// Buckets configurati: AUTH | FORM | API | UPLOAD
// FORM = 3/min per IP (perfetto per submit reso)
export function checkRateLimit(ip: string, bucket: "AUTH"|"FORM"|"API"|"UPLOAD"): { success: boolean; retryAfterMs: number };
export function getClientIp(request: Request): string;
```

From src/lib/sdk-auth.server.ts:
```typescript
export function requireAdmin(request: Request): Promise<{ id: string; email: string; role: string; ... }>;
export function getUser(request: Request): Promise<User | null>;
```

From prisma/schema.prisma (modello Order esistente per FK):
```prisma
model Order {
  id          String   @id @default(cuid())
  orderNumber String   @unique // "CP-2026-0001"
  userId      String?
  guestEmail  String?
  user        user?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  items       OrderItem[]
  // ... (vedi schema.prisma riga 383)
}
```

From src/lib/admin/admin-orders.server.ts (pattern server-only function):
```typescript
export async function getAdminOrders(input: ListAdminOrdersInput): Promise<PaginatedData<AdminOrderListItem>>;
export async function getAdminOrder(orderId: string): Promise<AdminOrderDetail | null>;
```

From src/lib/admin-functions.ts (pattern createServerFn wrapper):
```typescript
export const $getAdminOrders = createServerFn({ method: "GET" })
  .inputValidator((data: { page?: number; ... }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    return getAdminOrders({ ... }) satisfies Promise<PaginatedData<...>>;
  });
```

From src/routes/api/admin/orders.$id.ts (pattern PATCH admin):
```typescript
PATCH: async ({ request, params }) => {
  const admin = await requireAdmin(request); // throws → catch 403
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Dati non validi", 422);
  // ... update + return apiSuccess
}
```

Categorie prodotti (per computo hasOnlyCustomItems al submit, già verificate nella spec precedente):
- Personalizzati (escludere ex Art. 59.c): Category.slug IN ('classica', 'gioiello', 'bambini') OR parent.slug IN (...)
  Più precisamente: subcategorie di sandali → check parent → "sandali"
- Standard (recesso 14gg ammesso): pelletteria/borselli/cinture/agende/accessori-calzoleria + articoli-calzature/solette
- Logica concreta: `hasOnlyCustomItems = order.items.every(it => it.product.category.parent?.slug === 'sandali')` con eager-load di product.category.parent
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Cleanup PDF + script + devDep pdfkit</name>
  <files>
    public/modulo-recesso.pdf (DELETE)
    scripts/generate-modulo-recesso.ts (DELETE)
    package.json (EDIT — rimuovi devDep + script)
    pnpm-lock.yaml (auto-update via pnpm)
  </files>
  <action>
Rimozione completa dell'infra PDF, non più necessaria con il form online.

1. `pnpm remove pdfkit @types/pdfkit` (aggiorna automaticamente `package.json` + `pnpm-lock.yaml`)
2. `git rm public/modulo-recesso.pdf scripts/generate-modulo-recesso.ts`
3. EDIT `package.json` — rimuovere riga 21 `"modulo:gen": "tsx scripts/generate-modulo-recesso.ts",` dallo `scripts` block. Verificare che la rimozione sia clean (no virgola pendente, no chiave residua).
4. Verificare zero menzioni residue: `grep -rin "pdfkit\|modulo-recesso\|modulo:gen" --include="*.ts" --include="*.tsx" --include="*.json" src/ scripts/ public/ package.json` deve restituire vuoto.

Reasoning: Il PDF era nato dalla quick task `260430-tcf` per soddisfare Art. 49 lett. h ma è stato superato dalla scelta utente di passare al form online. Email + raccomandata restano canali alternativi (gestiti nei task 5 + 6).

Atomic commit: `chore(legal): rimuovi PDF modulo recesso + script + devDep pdfkit`
  </action>
  <verify>
    <automated>
test -f public/modulo-recesso.pdf && exit 1 || true; \
test -f scripts/generate-modulo-recesso.ts && exit 1 || true; \
grep -q "pdfkit" package.json && exit 1 || true; \
grep -q "modulo:gen" package.json && exit 1 || true; \
pnpm typecheck 2>&1 | grep -E "^Found [0-9]+ error" | grep -v "Found 25 error"
# Ultimo comando: deve essere vuoto (baseline 25 mantenuta). Errori >25 = regressione.
    </automated>
  </verify>
  <done>
- `public/modulo-recesso.pdf` non esiste
- `scripts/generate-modulo-recesso.ts` non esiste
- `package.json` non contiene `pdfkit`/`@types/pdfkit`/`modulo:gen`
- `pnpm-lock.yaml` aggiornato (no entry pdfkit)
- Typecheck baseline 25 → 25 (zero regressioni)
- 1 commit `chore(legal): rimuovi PDF modulo recesso + script + devDep pdfkit`
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Schema migration ReturnRequest</name>
  <files>
    prisma/schema.prisma (EDIT — add model ReturnRequest)
    prisma/migrations/YYYYMMDDHHMMSS_add_return_requests/migration.sql (NEW — auto-generated)
  </files>
  <behavior>
    - Tabella `return_requests` creata con tutti i campi della spec
    - 3 indici creati: orderId, status, createdAt
    - FK return_requests.orderId → orders(id) con onDelete: RESTRICT
    - Migration additive (solo CREATE TABLE + CREATE INDEX, no ALTER su tabelle esistenti)
    - Order model NON modificato (relazione inversa opzionale, può essere omessa per evitare touch a Order)
  </behavior>
  <action>
EDIT `prisma/schema.prisma` aggiungendo il modello `ReturnRequest` come definito in spec § "Modello Prisma" (dopo il modello AuditLog o prima dei modelli GDPR per coerenza topologica):

```prisma
// ─── ReturnRequest (Resi & Recesso D.Lgs. 206/2005) ──────────────────────

model ReturnRequest {
  id                 String    @id @default(cuid())
  orderId            String
  orderNumber        String    // denormalizzato per query/visibilità
  email              String    // snapshot email cliente al momento richiesta
  fullName           String    // snapshot nome cliente
  reason             String    @db.Text
  status             String    @default("pending") // "pending" | "approved" | "rejected" | "completed"
  adminNotes         String?   @db.Text
  hasOnlyCustomItems Boolean   @default(false) // flag soft-block: ordine ha solo personalizzati
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  resolvedAt         DateTime?

  order              Order     @relation(fields: [orderId], references: [id], onDelete: Restrict)

  @@index([orderId])
  @@index([status])
  @@index([createdAt])
  @@map("return_requests")
}
```

Aggiungere relazione inversa al modello Order (riga ~404, dove ci sono `items` e `payments`):
```prisma
  returnRequests ReturnRequest[]
```

Run migration:
```
pnpm prisma migrate dev --name add_return_requests
```

Verificare che il file `prisma/migrations/{timestamp}_add_return_requests/migration.sql` sia generato e contenga SOLO CREATE TABLE + CREATE INDEX (no ALTER su orders o altre tabelle esistenti, no DROP). Se il diff genera operazioni distruttive, STOP e segnala (impossibile per design ma sanity check obbligatorio prima di committare).

Run `pnpm db:generate` se non già auto-eseguito da migrate dev (genera Prisma Client con nuovo tipo ReturnRequest).

Reasoning idempotenza: NO `@@unique` constraint su (orderNumber, status). Il check "una sola richiesta pending per ordine" è gestito server-side via `prisma.returnRequest.count` nel Task 3 (Postgres partial index non supportato nativamente da Prisma syntax — vedi spec § "Idempotenza").

Atomic commit: `feat(db): ReturnRequest schema + migration`
  </action>
  <verify>
    <automated>
pnpm prisma migrate status 2>&1 | grep -q "Database schema is up to date" || exit 1; \
ls prisma/migrations/*_add_return_requests/migration.sql 2>/dev/null | head -1 | xargs -I {} sh -c 'grep -q "CREATE TABLE \"return_requests\"" {} && grep -q "CREATE INDEX" {} && ! grep -qE "DROP|ALTER TABLE \"orders\"" {}' || exit 1; \
pnpm typecheck 2>&1 | tail -5
    </automated>
  </verify>
  <done>
- `prisma/schema.prisma` contiene `model ReturnRequest` con tutti i campi/indici/FK della spec
- `prisma/migrations/{timestamp}_add_return_requests/migration.sql` generato (additive: CREATE TABLE + CREATE INDEX, no ALTER su `orders`)
- `prisma migrate status` → up to date
- Prisma Client rigenerato (`prisma.returnRequest.*` disponibile)
- Typecheck baseline 25 → 25
- 1 commit `feat(db): ReturnRequest schema + migration`
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: POST /api/return-request — validation flow + email transactional</name>
  <files>
    src/routes/api/return-request.ts (NEW)
  </files>
  <behavior>
    - Rate limit FORM (3/min per IP) → 429 + Retry-After
    - Zod validation 422 con messaggio dal primo issue
    - Order lookup tramite orderNumber → 404 se non trovato
    - Email match (order.guestEmail OR order.user.email, case-insensitive) → 403 se mismatch
    - Date check (now - order.createdAt) ≤ 14gg → 422 se scaduto
    - Idempotency count pending requests = 0 → 409 se duplicato
    - Compute hasOnlyCustomItems via order.items[].product.category.parent.slug === 'sandali'
    - INSERT ReturnRequest + sendEmail admin + sendEmail cliente
    - apiSuccess({ submitted: true }) on success
    - Email failure NON 500 (degradato a 201, log warning) — pattern come newsletter rewrite (vedi STATE.md ov8)
  </behavior>
  <action>
NEW file `src/routes/api/return-request.ts` modellato 1:1 sul pattern di `src/routes/api/cookie-consent.ts`. Struttura:

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { apiSuccess, apiError } from "~/lib/api-response";
import { checkRateLimit, getClientIp } from "~/lib/rate-limit.server";
import { prisma } from "~/lib/db.server";
import { sendEmail } from "~/lib/email.server";
import { createLogger } from "~/lib/logger.server";

const log = createLogger("return-request");

const returnRequestSchema = z.object({
  fullName: z.string().trim().min(2, "Nome troppo corto").max(100),
  email: z.string().email("Email non valida"),
  orderNumber: z.string().trim().regex(/^CP-\d{4}-\d{4}$/, "Formato numero ordine non valido (es. CP-2026-0001)"),
  reason: z.string().trim().min(10, "Indica almeno 10 caratteri di motivazione").max(500),
  acceptedPolicy: z.literal(true, { message: "Devi accettare la procedura di reso per inviare la richiesta" }),
});

export const Route = createFileRoute("/api/return-request")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Rate limit
        const ip = getClientIp(request);
        const limit = checkRateLimit(ip, "FORM");
        if (!limit.success) {
          return apiError("RATE_LIMITED", "Troppe richieste. Riprova tra qualche minuto.", 429,
            undefined, { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) });
        }

        // 2. Zod validation
        const body = (await request.json()) as unknown;
        const parsed = returnRequestSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Dati non validi", 422);
        }
        const data = parsed.data;

        // 3. Order lookup
        const order = await prisma.order.findUnique({
          where: { orderNumber: data.orderNumber },
          include: {
            user: { select: { email: true } },
            items: {
              include: {
                product: {
                  select: {
                    category: { select: { slug: true, parent: { select: { slug: true } } } },
                  },
                },
              },
            },
          },
        });
        if (!order) {
          return apiError("NOT_FOUND", "Ordine non trovato. Verifica il numero indicato.", 404);
        }

        // 4. Email match (case-insensitive)
        const emailLower = data.email.toLowerCase();
        const orderEmails = [order.guestEmail, order.user?.email].filter(Boolean).map((e) => e!.toLowerCase());
        if (!orderEmails.includes(emailLower)) {
          return apiError("FORBIDDEN", "L'email indicata non corrisponde all'ordine.", 403);
        }

        // 5. Date check (14gg dal createdAt)
        const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
        if (Date.now() - order.createdAt.getTime() > FOURTEEN_DAYS_MS) {
          return apiError("VALIDATION_ERROR", "Termine di 14 giorni superato. Il diritto di recesso non è più esercitabile.", 422);
        }

        // 6. Idempotency
        const pendingCount = await prisma.returnRequest.count({
          where: { orderNumber: data.orderNumber, status: "pending" },
        });
        if (pendingCount > 0) {
          return apiError("CONFLICT", "Hai già una richiesta di reso in corso per questo ordine.", 409);
        }

        // 7. Compute hasOnlyCustomItems (subcategoria di "sandali")
        const hasOnlyCustomItems = order.items.length > 0 && order.items.every((it) =>
          it.product.category?.parent?.slug === "sandali"
        );

        // 8. INSERT
        let created;
        try {
          created = await prisma.returnRequest.create({
            data: {
              orderId: order.id,
              orderNumber: data.orderNumber,
              email: data.email,
              fullName: data.fullName,
              reason: data.reason,
              hasOnlyCustomItems,
            },
          });
        } catch (e: unknown) {
          log.error("ReturnRequest insert failed", { error: e instanceof Error ? e.message : "unknown", orderNumber: data.orderNumber });
          return apiError("INTERNAL_ERROR", "Errore durante il salvataggio della richiesta", 500);
        }

        // 9. Email admin (a resi@calzoleriaprevenzano.it) — best-effort, fail non blocca
        const baseUrl = process.env.BETTER_AUTH_URL ?? "https://calzoleriaprevenzano.it";
        const adminLink = `${baseUrl}/admin/resi/${created.id}`;
        const customWarning = hasOnlyCustomItems
          ? `<p style="background:#fff3cd;border:1px solid #ffeaa7;padding:12px;border-radius:4px;color:#856404;"><strong>⚠ Attenzione:</strong> l'ordine contiene SOLO prodotti personalizzati (esclusi ex Art. 59.c). Valutare caso per caso.</p>`
          : "";
        const adminHtml = `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#f5f3ef;padding:20px;color:#2d2419;">
          <table cellpadding="0" cellspacing="0" border="0" width="600" align="center" style="background:#fff;padding:32px;border:1px solid #d9cdb8;">
            <tr><td>
              <h2 style="color:#8b6f47;margin:0 0 16px;">Nuova richiesta di reso</h2>
              ${customWarning}
              <p><strong>Cliente:</strong> ${data.fullName}</p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Ordine:</strong> ${data.orderNumber}</p>
              <p><strong>Motivazione:</strong></p>
              <p style="background:#f5f3ef;padding:12px;border-left:3px solid #8b6f47;">${data.reason.replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>
              <p style="margin-top:24px;"><a href="${adminLink}" style="background:#8b6f47;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;">Apri in admin</a></p>
            </td></tr>
          </table>
        </body></html>`;
        const adminEmail = await sendEmail({
          to: "resi@calzoleriaprevenzano.it",
          subject: `[Reso] Nuova richiesta da ${data.fullName} — Ordine ${data.orderNumber}`,
          html: adminHtml,
          replyTo: data.email,
        });
        if (!adminEmail.ok) log.warn("Admin notification email failed", { orderNumber: data.orderNumber });

        // 10. Email cliente — best-effort
        const clientHtml = `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#f5f3ef;padding:20px;color:#2d2419;">
          <table cellpadding="0" cellspacing="0" border="0" width="600" align="center" style="background:#fff;padding:32px;border:1px solid #d9cdb8;">
            <tr><td>
              <h2 style="color:#8b6f47;margin:0 0 16px;">Conferma ricezione richiesta reso</h2>
              <p>Gentile ${data.fullName},</p>
              <p>abbiamo ricevuto la tua richiesta di reso relativa all'ordine <strong>${data.orderNumber}</strong>.</p>
              <p>Il nostro team la valuterà e ti contatterà via email entro <strong>14 giorni</strong> con le istruzioni di restituzione o l'esito della valutazione.</p>
              <p style="margin-top:24px;color:#6b6157;font-size:14px;">Per qualsiasi necessità: <a href="mailto:resi@calzoleriaprevenzano.it" style="color:#8b6f47;">resi@calzoleriaprevenzano.it</a></p>
              <hr style="border:0;border-top:1px solid #d9cdb8;margin:24px 0;">
              <p style="color:#6b6157;font-size:12px;">Calzoleria Prevenzano di Prevenzano Antonio<br>Via Chiaia 104 — 80132 Napoli (NA)<br>P.IVA 04590921211</p>
            </td></tr>
          </table>
        </body></html>`;
        const clientEmail = await sendEmail({
          to: data.email,
          subject: "Calzoleria Prevenzano — Conferma ricezione richiesta reso",
          html: clientHtml,
        });
        if (!clientEmail.ok) log.warn("Client confirmation email failed", { orderNumber: data.orderNumber });

        return apiSuccess({ submitted: true });
      },
    },
  },
});
```

**Pitfall noti**:
- Zod v4 sintassi: `z.literal(true, { message: "..." })` (NON `error: ...`, vedi STATE.md tcf — sintassi reale libreria)
- `parsed.error.issues[0]?.message` (non `parsed.error.errors`, allineato a `cookie-consent.ts`)
- Email match case-insensitive (utenti scrivono indifferentemente Maiuscole/minuscole)
- HTML escape `<` minimo nel reason per evitare injection in email body (no escape full perché tag-only inputs già bloccati da Zod)
- `process.env.BETTER_AUTH_URL` come base URL admin link (già usato in newsletter wave 3)

Atomic commit: `feat(api): POST /api/return-request con validation ordine + email + 14gg + soft-block personalizzati`
  </action>
  <verify>
    <automated>
test -f src/routes/api/return-request.ts || exit 1; \
grep -q 'createFileRoute("/api/return-request")' src/routes/api/return-request.ts || exit 1; \
grep -q 'returnRequestSchema' src/routes/api/return-request.ts || exit 1; \
grep -q 'checkRateLimit(ip, "FORM")' src/routes/api/return-request.ts || exit 1; \
grep -q 'prisma.returnRequest.count' src/routes/api/return-request.ts || exit 1; \
grep -q 'hasOnlyCustomItems' src/routes/api/return-request.ts || exit 1; \
grep -q 'sendEmail' src/routes/api/return-request.ts || exit 1; \
grep -q 'resi@calzoleriaprevenzano.it' src/routes/api/return-request.ts || exit 1; \
! grep -qE ": any\b|as any\b|<any>" src/routes/api/return-request.ts || exit 1; \
pnpm typecheck 2>&1 | tail -3
    </automated>
  </verify>
  <done>
- `src/routes/api/return-request.ts` esiste con tutti i 9 step del flusso
- Zero `any` (verificato grep)
- Typecheck baseline 25 → 25 (zero nuovi errori sul file)
- 1 commit `feat(api): POST /api/return-request con validation ordine + email + 14gg + soft-block personalizzati`
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 4: Form pubblico /resi-e-recesso/richiesta + pagina conferma</name>
  <files>
    src/routes/resi-e-recesso.richiesta.tsx (NEW)
    src/routes/resi-e-recesso.richiesta.inviata.tsx (NEW)
  </files>
  <behavior>
    - Form usa `@tanstack/react-form` + `@tanstack/zod-form-adapter` (NO react-hook-form, da CLAUDE.md)
    - Campi shadcn: Input (fullName, email, orderNumber), Textarea (reason), Checkbox (acceptedPolicy), Button submit
    - Validation client-side Zod sincrona (stessa shape dell'API)
    - On submit: fetch POST `/api/return-request` → success redirect `/resi-e-recesso/richiesta/inviata` (no ID URL per privacy)
    - On error: toast `sonner` con messaggio dal server + (opzionale) errore inline su campo se mappabile
    - Layout coerente con `/resi-e-recesso` (max-w-page wrapper, breadcrumb "← Torna a Resi e Recesso")
    - Heading "Richiesta di reso" + sottotitolo Art. 52 + footer link email/raccomandata come canali alternativi
    - Pagina conferma: statica, no data fetching, contenuto da spec § 5
  </behavior>
  <action>
**File 1: `src/routes/resi-e-recesso.richiesta.tsx`** (~180 LOC)

Pattern di riferimento:
- File-based routing TanStack Router: il `.` nel filename è separatore di path, quindi `resi-e-recesso.richiesta.tsx` → URL `/resi-e-recesso/richiesta`
- Form pattern da `src/components/auth/RegisterForm.tsx` (vedi `useForm<RegisterInput>` + `validatorAdapter: zodValidator()` + `onSubmit: async ({ value }) => { ... }`)
- `// @ts-expect-error — TanStack Form v1.28 strict generic typing; works at runtime` sulla riga `useForm` (pattern stabilito in RegisterForm)

```typescript
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

export const Route = createFileRoute("/resi-e-recesso/richiesta")({
  component: ReturnRequestPage,
});

interface ReturnRequestInput {
  fullName: string;
  email: string;
  orderNumber: string;
  reason: string;
  acceptedPolicy: boolean;
}

function ReturnRequestPage(): ReactNode {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // @ts-expect-error — TanStack Form v1.28 strict generic typing; works at runtime
  const form = useForm<ReturnRequestInput>({
    defaultValues: { fullName: "", email: "", orderNumber: "", reason: "", acceptedPolicy: false },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      setServerError(null);
      setIsLoading(true);
      try {
        const res = await fetch("/api/return-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value),
        });
        const json = (await res.json()) as { ok?: boolean; error?: { message: string } };
        if (!res.ok) {
          const msg = json.error?.message ?? "Errore durante l'invio. Riprova.";
          setServerError(msg);
          toast.error(msg);
          return;
        }
        toast.success("Richiesta inviata. Controlla la tua email.");
        navigate({ to: "/resi-e-recesso/richiesta/inviata" });
      } catch {
        const msg = "Errore di connessione. Riprova tra qualche istante.";
        setServerError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-16">
      <Link to="/resi-e-recesso" className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
        ← Torna a Resi e Recesso
      </Link>
      <h1 className="text-lg font-semibold text-[var(--color-text)] mb-2">Richiesta di reso</h1>
      <div className="mb-6 h-[var(--stitch-width)] w-16 bg-[var(--color-accent)]" />
      <p className="mb-8 text-sm text-[var(--color-text-secondary)] max-w-2xl">
        Compila il modulo per esercitare il diritto di recesso ai sensi dell'Art. 52 D.Lgs. 206/2005.
        Riceverai una conferma via email entro 14 giorni con le istruzioni di restituzione.
      </p>

      {serverError && (
        <div className="mb-6 rounded-md border border-[var(--color-destructive)]/20 bg-[var(--color-destructive)]/5 p-4">
          <p className="text-sm text-[var(--color-destructive)]">{serverError}</p>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-5 max-w-xl">
        {/* Field fullName */}
        <form.Field
          name="fullName"
          validators={{ onChange: z.string().trim().min(2, "Nome troppo corto").max(100) }}
        >
          {(field) => (
            <div>
              <Label htmlFor="fullName">Nome e cognome *</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={field.state.meta.errors.length > 0}
                disabled={isLoading}
              />
              {field.state.meta.errors[0] && (
                <p className="mt-1 text-xs text-[var(--color-destructive)]">{String(field.state.meta.errors[0])}</p>
              )}
            </div>
          )}
        </form.Field>

        {/* Field email */}
        <form.Field
          name="email"
          validators={{ onChange: z.string().email("Email non valida") }}
        >
          {(field) => (
            <div>
              <Label htmlFor="email">Email (deve coincidere con quella dell'ordine) *</Label>
              <Input id="email" name="email" type="email" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} aria-invalid={field.state.meta.errors.length > 0} disabled={isLoading} />
              {field.state.meta.errors[0] && <p className="mt-1 text-xs text-[var(--color-destructive)]">{String(field.state.meta.errors[0])}</p>}
            </div>
          )}
        </form.Field>

        {/* Field orderNumber */}
        <form.Field
          name="orderNumber"
          validators={{ onChange: z.string().trim().regex(/^CP-\d{4}-\d{4}$/, "Formato non valido (es. CP-2026-0001)") }}
        >
          {(field) => (
            <div>
              <Label htmlFor="orderNumber">Numero ordine *</Label>
              <Input id="orderNumber" name="orderNumber" type="text" placeholder="CP-2026-0001" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} aria-invalid={field.state.meta.errors.length > 0} disabled={isLoading} />
              <p className="mt-1 text-xs text-[var(--color-muted)]">Lo trovi nella conferma d'ordine ricevuta via email.</p>
              {field.state.meta.errors[0] && <p className="mt-1 text-xs text-[var(--color-destructive)]">{String(field.state.meta.errors[0])}</p>}
            </div>
          )}
        </form.Field>

        {/* Field reason */}
        <form.Field
          name="reason"
          validators={{ onChange: z.string().trim().min(10, "Almeno 10 caratteri").max(500) }}
        >
          {(field) => (
            <div>
              <Label htmlFor="reason">Motivazione *</Label>
              <Textarea id="reason" name="reason" rows={5} value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} aria-invalid={field.state.meta.errors.length > 0} disabled={isLoading} />
              <p className="mt-1 text-xs text-[var(--color-muted)]">Descrivi il motivo della richiesta (max 500 caratteri).</p>
              {field.state.meta.errors[0] && <p className="mt-1 text-xs text-[var(--color-destructive)]">{String(field.state.meta.errors[0])}</p>}
            </div>
          )}
        </form.Field>

        {/* Field acceptedPolicy */}
        <form.Field
          name="acceptedPolicy"
          validators={{ onChange: z.literal(true, { message: "Devi accettare la procedura di reso" }) }}
        >
          {(field) => (
            <div>
              <div className="flex items-start gap-2">
                <Checkbox id="acceptedPolicy" checked={field.state.value} onCheckedChange={(c) => field.handleChange(c === true)} disabled={isLoading} />
                <Label htmlFor="acceptedPolicy" className="text-sm leading-relaxed">
                  Ho letto e accetto la{" "}
                  <Link to="/resi-e-recesso" className="text-[var(--color-primary)] underline">procedura di reso</Link>
                  {" "}e dichiaro di esercitare il diritto di recesso ai sensi dell'Art. 52 D.Lgs. 206/2005.
                </Label>
              </div>
              {field.state.meta.errors[0] && <p className="mt-1 text-xs text-[var(--color-destructive)]">{String(field.state.meta.errors[0])}</p>}
            </div>
          )}
        </form.Field>

        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Invio in corso…</> : "Invia richiesta"}
        </Button>
      </form>

      {/* Canali alternativi */}
      <div className="mt-12 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 max-w-xl">
        <p className="text-sm text-[var(--color-text-secondary)]">
          <strong className="text-[var(--color-text)]">In alternativa</strong>, puoi inviare la richiesta via email a{" "}
          <a href="mailto:resi@calzoleriaprevenzano.it" className="text-[var(--color-primary)] underline">resi@calzoleriaprevenzano.it</a>
          {" "}o tramite raccomandata A/R a Calzoleria Prevenzano, Via Chiaia 104 — 80132 Napoli (NA), come previsto dall'Art. 49 c. 1 lett. h e Art. 54 D.Lgs. 206/2005.
        </p>
      </div>
    </div>
  );
}
```

**File 2: `src/routes/resi-e-recesso.richiesta.inviata.tsx`** (~50 LOC, statica)

```typescript
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/resi-e-recesso/richiesta/inviata")({
  component: ReturnRequestSentPage,
});

function ReturnRequestSentPage(): ReactNode {
  return (
    <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-16">
      <div className="max-w-xl mx-auto text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-[var(--color-primary)] mb-6" />
        <h1 className="text-lg font-semibold text-[var(--color-text)] mb-3">Richiesta inviata</h1>
        <div className="mx-auto mb-6 h-[var(--stitch-width)] w-16 bg-[var(--color-accent)]" />
        <p className="text-[var(--color-text-secondary)] leading-relaxed mb-8">
          Grazie. Abbiamo ricevuto la tua richiesta. Il nostro team la valuterà e ti contatterà via email
          entro 14 giorni con le istruzioni di restituzione o l'esito della valutazione.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="inline-flex items-center justify-center px-6 py-3 bg-[var(--color-primary)] text-white rounded-md text-sm font-medium hover:opacity-90">
            Torna alla home
          </Link>
          <Link to="/termini" className="inline-flex items-center justify-center px-6 py-3 border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-md text-sm font-medium hover:bg-[var(--color-surface)]">
            Vai ai termini di vendita
          </Link>
        </div>
      </div>
    </div>
  );
}
```

**Pitfall noti**:
- Verificare che `~/components/ui/checkbox.tsx`, `~/components/ui/textarea.tsx`, `~/components/ui/label.tsx`, `~/components/ui/input.tsx`, `~/components/ui/button.tsx` esistano (shadcn). Se uno manca: `pnpm dlx shadcn@latest add {component}` (ma dovrebbero esserci tutti, il progetto usa shadcn estensivamente — vedi RegisterForm/checkout). Verifica veloce: `ls src/components/ui/ | grep -E "checkbox|textarea|label|input|button"` (atteso: 5 match).
- `field.state.meta.errors[0]` può essere stringa o `ZodError` issue, da castare con `String(...)` come pattern stabilito
- Dopo creazione file, `routeTree.gen.ts` viene rigenerato automaticamente al prossimo `pnpm dev` (gitignored, vedi STATE.md nzh — meccanica nota TanStack Router Vite plugin)

Atomic commit: `feat(legal): form pubblico /resi-e-recesso/richiesta + pagina conferma`
  </action>
  <verify>
    <automated>
test -f src/routes/resi-e-recesso.richiesta.tsx || exit 1; \
test -f src/routes/resi-e-recesso.richiesta.inviata.tsx || exit 1; \
grep -q '@tanstack/react-form' src/routes/resi-e-recesso.richiesta.tsx || exit 1; \
grep -q 'zodValidator' src/routes/resi-e-recesso.richiesta.tsx || exit 1; \
! grep -q 'react-hook-form' src/routes/resi-e-recesso.richiesta.tsx || exit 1; \
grep -q "fetch.*api/return-request" src/routes/resi-e-recesso.richiesta.tsx || exit 1; \
grep -q '/resi-e-recesso/richiesta/inviata' src/routes/resi-e-recesso.richiesta.tsx || exit 1; \
grep -q 'resi@calzoleriaprevenzano.it' src/routes/resi-e-recesso.richiesta.tsx || exit 1; \
ls src/components/ui/ | grep -cE "^(checkbox|textarea|label|input|button)\.tsx$" | grep -q "^5$" || exit 1; \
pnpm typecheck 2>&1 | tail -3
    </automated>
  </verify>
  <done>
- `src/routes/resi-e-recesso.richiesta.tsx` esiste con form completo (5 fields + submit)
- `src/routes/resi-e-recesso.richiesta.inviata.tsx` esiste statica
- Zero menzioni `react-hook-form` (CLAUDE.md compliance)
- Zero `any`
- Typecheck baseline 25 → 25
- 1 commit `feat(legal): form pubblico /resi-e-recesso/richiesta + pagina conferma`
  </done>
</task>

<task type="auto">
  <name>Task 5: Update /resi-e-recesso + termini § 8 — sostituisci PDF link con form</name>
  <files>
    src/routes/resi-e-recesso.tsx (EDIT)
    src/routes/termini.tsx (EDIT)
  </files>
  <action>
**File 1: `src/routes/resi-e-recesso.tsx`** (riga 115 attuale, da spec § 6)

Trovare il paragrafo che contiene `<a href="/modulo-recesso.pdf"` (riga ~115) nella Sezione B "Procedura". Sostituire l'intero paragrafo "Procedura" mantenendo struttura ma puntando al form:

PRIMA (estratto attuale, righe 113-119 circa):
```tsx
Per esercitare il diritto, è necessario inviare una comunicazione esplicita al Venditore.
Puoi utilizzare il <a href="/modulo-recesso.pdf" target="_blank" rel="noopener" ...>modulo di recesso ufficiale</a>
(Allegato I parte B D.Lgs. 206/2005), oppure inviare una dichiarazione esplicita per email a
<a href="mailto:resi@calzoleriaprevenzano.it" ...>resi@calzoleriaprevenzano.it</a>
oppure tramite raccomandata A/R a Calzoleria Prevenzano, Via Chiaia, 104 — 80132 Napoli (NA).
```

DOPO:
```tsx
Per esercitare il diritto, compila il{" "}
<a href="/resi-e-recesso/richiesta" className="text-[var(--color-primary)] underline underline-offset-2">modulo di richiesta reso online</a>
{" "}indicando il numero del tuo ordine. Riceverai una conferma via email entro 14 giorni con le istruzioni di restituzione.
</p>
<p className="mt-4">
In alternativa, puoi inviare una comunicazione esplicita via email a{" "}
<a href="mailto:resi@calzoleriaprevenzano.it" className="text-[var(--color-primary)] underline underline-offset-2">resi@calzoleriaprevenzano.it</a>
{" "}o tramite raccomandata A/R a Calzoleria Prevenzano, Via Chiaia 104 — 80132 Napoli (NA), come previsto dall'Art. 49 c. 1 lett. h e Art. 54 D.Lgs. 206/2005.
```

Aggiornare anche il footer `Ultimo aggiornamento` a "1 maggio 2026" (o data corrente al momento dell'esecuzione).

**File 2: `src/routes/termini.tsx` § 8** (righe 327-332 attuali, da `grep -n` precedente)

Trovare il paragrafo (riga ~327-332) che contiene `<a href="/modulo-recesso.pdf"` e sostituirlo con:

```tsx
<p>
  Per facilitare l'esercizio del diritto, l'Acquirente può utilizzare il{" "}
  <a href="/resi-e-recesso/richiesta" className="text-[var(--color-primary)] underline underline-offset-2">modulo di richiesta reso online</a>
  {" "}accessibile dal nostro sito. Resta fermo il diritto dell'Acquirente di esercitare il recesso anche tramite comunicazione esplicita inviata a{" "}
  <a href="mailto:resi@calzoleriaprevenzano.it" className="text-[var(--color-primary)] underline underline-offset-2">resi@calzoleriaprevenzano.it</a>
  {" "}o raccomandata A/R all'indirizzo del Venditore (Art. 49 c. 1 lett. h e Art. 54 D.Lgs. 206/2005).
</p>
```

Verificare zero occorrenze residue `modulo-recesso.pdf` in entrambi i file dopo la modifica:
```
grep -n "modulo-recesso.pdf" src/routes/resi-e-recesso.tsx src/routes/termini.tsx
# Atteso: vuoto
```

Le altre occorrenze di `resi@calzoleriaprevenzano.it` e `raccomandata A/R` in termini.tsx (riga 319 lista email contatti, riga 543 footer) sono OK e vanno preservate (canali alternativi mantenuti per compliance Art. 49+54).

Atomic commit: `feat(legal): aggiorna /resi-e-recesso e termini § 8 — link al form (mantieni email/raccomandata come alternative)`
  </action>
  <verify>
    <automated>
! grep -q "modulo-recesso.pdf" src/routes/resi-e-recesso.tsx || exit 1; \
! grep -q "modulo-recesso.pdf" src/routes/termini.tsx || exit 1; \
grep -q "/resi-e-recesso/richiesta" src/routes/resi-e-recesso.tsx || exit 1; \
grep -q "/resi-e-recesso/richiesta" src/routes/termini.tsx || exit 1; \
grep -q "resi@calzoleriaprevenzano.it" src/routes/resi-e-recesso.tsx || exit 1; \
grep -q "raccomandata A/R" src/routes/resi-e-recesso.tsx || exit 1; \
grep -q "raccomandata A/R" src/routes/termini.tsx || exit 1; \
pnpm typecheck 2>&1 | tail -3
    </automated>
  </verify>
  <done>
- Zero menzioni `modulo-recesso.pdf` in entrambi i file
- Entrambi i file linkano `/resi-e-recesso/richiesta`
- Email + raccomandata mantenuti come canali alternativi (Art. 49 + 54 compliance)
- Typecheck baseline 25 → 25
- 1 commit `feat(legal): aggiorna /resi-e-recesso e termini § 8 — link al form (mantieni email/raccomandata come alternative)`
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 6: Admin /admin/resi (lista + dettaglio) + sidebar link con badge</name>
  <files>
    src/lib/admin/admin-returns.server.ts (NEW)
    src/lib/admin-functions.ts (EDIT — aggiungi $listReturnRequests + $getReturnRequest + $countPendingReturnRequests)
    src/lib/validators/admin.ts (EDIT — aggiungi listReturnRequestsSchema)
    src/routes/admin.resi.tsx (NEW — lista paginata)
    src/routes/admin.resi.$id.tsx (NEW — dettaglio editabile)
    src/routes/admin.tsx (EDIT — aggiungi NAV_ITEM "Resi" con icon RotateCcw + badge count)
  </files>
  <behavior>
    - Server functions in `admin-returns.server.ts`: list paginata (filtri status/from/to), getById (con order eager-load), updateStatus (set status + adminNotes + resolvedAt se terminale), countPending
    - `admin-functions.ts`: createServerFn wrapper con `requireAdmin` guard
    - `validators/admin.ts`: schema Zod per list (page/perPage/status/from/to)
    - Lista UI: tabella paginata 12/page, filtri sticky (status select + 2 date inputs + reset), badge status colorati, link al dettaglio, badge "⚠ solo personalizzati" se hasOnlyCustomItems
    - Dettaglio UI: card con dati cliente + ordine + motivazione + select status + textarea adminNotes + button "Salva", link "Apri ordine in /admin/ordini/:orderId"
    - Sidebar: voce "Resi" con icon `RotateCcw` di lucide-react, badge rosso con count pending (fetch al mount del layout admin)
  </behavior>
  <action>
**File 1: `src/lib/admin/admin-returns.server.ts`** (~140 LOC, modellato su `admin-orders.server.ts`)

```typescript
/**
 * Admin Return Requests — server-only
 * CRUD richieste di reso per pannello admin.
 */

import { prisma } from "~/lib/db.server";
import type { PaginatedData } from "~/lib/types/api";

export interface ListReturnRequestsInput {
  page: number;
  perPage: number;
  status?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

export interface AdminReturnRequestListItem {
  id: string;
  orderNumber: string;
  fullName: string;
  email: string;
  status: string;
  hasOnlyCustomItems: boolean;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AdminReturnRequestDetail {
  id: string;
  orderId: string;
  orderNumber: string;
  fullName: string;
  email: string;
  reason: string;
  status: string;
  adminNotes: string | null;
  hasOnlyCustomItems: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  order: {
    id: string;
    orderNumber: string;
    total: number;
    createdAt: string;
    items: Array<{ name: string; quantity: number; price: number; categorySlug: string | null; parentCategorySlug: string | null }>;
  };
}

export async function listReturnRequests(input: ListReturnRequestsInput): Promise<PaginatedData<AdminReturnRequestListItem>> {
  const { page, perPage, status, createdFrom, createdTo } = input;
  const skip = (page - 1) * perPage;
  const conditions: Array<Record<string, unknown>> = [];
  if (status) conditions.push({ status });
  if (createdFrom || createdTo) {
    const range: Record<string, Date> = {};
    if (createdFrom) range.gte = createdFrom;
    if (createdTo) range.lte = createdTo;
    conditions.push({ createdAt: range });
  }
  const where = conditions.length > 0 ? { AND: conditions } : {};

  const [items, total] = await Promise.all([
    prisma.returnRequest.findMany({
      where, orderBy: { createdAt: "desc" }, skip, take: perPage,
      select: { id: true, orderNumber: true, fullName: true, email: true, status: true, hasOnlyCustomItems: true, createdAt: true, resolvedAt: true },
    }),
    prisma.returnRequest.count({ where }),
  ]);

  return {
    items: items.map((r) => ({
      id: r.id, orderNumber: r.orderNumber, fullName: r.fullName, email: r.email, status: r.status,
      hasOnlyCustomItems: r.hasOnlyCustomItems, createdAt: r.createdAt.toISOString(),
      resolvedAt: r.resolvedAt?.toISOString() ?? null,
    })),
    total, page, totalPages: Math.ceil(total / perPage),
  };
}

export async function getReturnRequest(id: string): Promise<AdminReturnRequestDetail | null> {
  const rr = await prisma.returnRequest.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          id: true, orderNumber: true, total: true, createdAt: true,
          items: {
            select: {
              name: true, quantity: true, price: true,
              product: { select: { category: { select: { slug: true, parent: { select: { slug: true } } } } } },
            },
          },
        },
      },
    },
  });
  if (!rr) return null;
  return {
    id: rr.id, orderId: rr.orderId, orderNumber: rr.orderNumber, fullName: rr.fullName, email: rr.email,
    reason: rr.reason, status: rr.status, adminNotes: rr.adminNotes, hasOnlyCustomItems: rr.hasOnlyCustomItems,
    createdAt: rr.createdAt.toISOString(), updatedAt: rr.updatedAt.toISOString(),
    resolvedAt: rr.resolvedAt?.toISOString() ?? null,
    order: {
      id: rr.order.id, orderNumber: rr.order.orderNumber, total: Number(rr.order.total),
      createdAt: rr.order.createdAt.toISOString(),
      items: rr.order.items.map((it) => ({
        name: it.name, quantity: it.quantity, price: Number(it.price),
        categorySlug: it.product.category?.slug ?? null,
        parentCategorySlug: it.product.category?.parent?.slug ?? null,
      })),
    },
  };
}

export interface UpdateReturnRequestInput {
  status: "pending" | "approved" | "rejected" | "completed";
  adminNotes: string | null;
}

export async function updateReturnRequest(id: string, input: UpdateReturnRequestInput): Promise<{ id: string; status: string; oldStatus: string }> {
  const existing = await prisma.returnRequest.findUnique({ where: { id }, select: { status: true } });
  if (!existing) throw new Error("ReturnRequest not found");
  const oldStatus = existing.status;
  const isTerminal = input.status === "approved" || input.status === "rejected" || input.status === "completed";
  const updated = await prisma.returnRequest.update({
    where: { id },
    data: {
      status: input.status,
      adminNotes: input.adminNotes,
      resolvedAt: isTerminal ? new Date() : null,
    },
    select: { id: true, status: true },
  });
  return { id: updated.id, status: updated.status, oldStatus };
}

export async function countPendingReturnRequests(): Promise<number> {
  return prisma.returnRequest.count({ where: { status: "pending" } });
}
```

**File 2: `src/lib/validators/admin.ts`** (EDIT — aggiungi schema)

Inserire (in fondo o vicino agli altri schema admin):
```typescript
export const listReturnRequestsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(12),
  status: z.enum(["pending", "approved", "rejected", "completed"]).optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
});
export type ListReturnRequestsInput = z.infer<typeof listReturnRequestsSchema>;

export const updateReturnRequestSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "completed"]),
  adminNotes: z.string().trim().max(2000).nullable(),
});
export type UpdateReturnRequestInput = z.infer<typeof updateReturnRequestSchema>;
```

**File 3: `src/lib/admin-functions.ts`** (EDIT — aggiungi 3 server functions + re-export types)

Aggiungere import + 3 server functions (modellate sul pattern `$getAdminOrders` riga 75-100):
```typescript
import { listReturnRequests, getReturnRequest, countPendingReturnRequests } from "./admin/admin-returns.server";
import type { AdminReturnRequestListItem, AdminReturnRequestDetail } from "./admin/admin-returns.server";

export type { AdminReturnRequestListItem, AdminReturnRequestDetail };

export const $listReturnRequests = createServerFn({ method: "GET" })
  .inputValidator((data: { page?: number; perPage?: number; status?: string; createdFrom?: string; createdTo?: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    return listReturnRequests({
      page: data.page ?? 1,
      perPage: data.perPage ?? 12,
      status: data.status || undefined,
      createdFrom: data.createdFrom ? new Date(data.createdFrom) : undefined,
      createdTo: data.createdTo ? new Date(data.createdTo) : undefined,
    }) satisfies Promise<PaginatedData<AdminReturnRequestListItem>>;
  });

export const $getReturnRequest = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    return getReturnRequest(data.id) satisfies Promise<AdminReturnRequestDetail | null>;
  });

export const $countPendingReturnRequests = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return countPendingReturnRequests();
});
```

**File 4: `src/routes/admin.resi.tsx`** (~200 LOC, lista — pattern da `admin.ordini.tsx`)

Pattern:
- `beforeLoad` carica prima pagina + status filters + count totali
- Filtri sticky (status select + 2 date inputs + reset btn) con debounced refetch
- Tabella: Data | Cliente | Ordine | Status badge | Flag custom | "Apri" link
- Pagination Prev/Next + "Pagina X di Y"
- Status badges colorati come `admin.ordini.tsx` (pending giallo, approved blu, rejected rosso, completed verde)
- Link `/admin/resi/:id` per il dettaglio

**File 5: `src/routes/admin.resi.$id.tsx`** (~220 LOC, dettaglio)

Pattern:
- `beforeLoad` fetcha `$getReturnRequest({ data: { id } })` → 404 redirect se null
- Card "Dati cliente" (fullName, email, createdAt, hasOnlyCustomItems badge)
- Card "Ordine collegato" con riepilogo items + link "Apri ordine completo" → `/admin/ordini/{orderId}`
- Card "Motivazione" con `<pre>` whitespace-preserving
- Card "Gestione" con `<select>` status (4 opzioni) + `<textarea>` adminNotes + button "Salva modifiche"
- On save: fetch PATCH `/api/admin/return-requests/{id}` + toast success + reload o aggiornamento locale dello state

**File 6: `src/routes/admin.tsx`** (EDIT — sidebar)

1. Import `RotateCcw` da `lucide-react` (riga 3, append a destination existing imports)
2. Aggiungere alla `NAV_ITEMS` array (riga 22-30) DOPO "Ordini":
```typescript
{ label: "Resi", href: "/admin/resi", icon: RotateCcw, matchPath: "/admin/resi" as const },
```
3. Aggiungere fetch del count pending al mount per badge:
```typescript
const [pendingResiCount, setPendingResiCount] = useState<number>(0);
useEffect(() => {
  void $countPendingReturnRequests().then(setPendingResiCount).catch(() => {});
}, []);
```
4. Modificare il render del NAV_ITEMS map (riga 100-119) per visualizzare badge accanto a "Resi" se `pendingResiCount > 0`:
```tsx
{item.label === "Resi" && pendingResiCount > 0 && (
  <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">{pendingResiCount}</span>
)}
```

**Pitfall noti**:
- `routeTree.gen.ts` rigenerato da `pnpm dev` (non committare)
- `requireAdmin` in `admin-functions.ts` è la versione che usa `$getUser()` (non `request`); è già in scope dalla riga 30
- Il count badge fa una chiamata server-fn al mount — accettabile (non in render loop), errore silenzioso (catch + fallback 0)
- TanStack Router file-based: `admin.resi.tsx` + `admin.resi.$id.tsx` → `/admin/resi` + `/admin/resi/:id`. Outlet pattern come in `admin.ordini.tsx` (vedi riga 17-25): la lista è in `admin.resi.tsx` con guard `if (pathname !== "/admin/resi") return <Outlet />`

Atomic commit: `feat(admin): /admin/resi lista paginata + dettaglio gestione status`
  </action>
  <verify>
    <automated>
test -f src/lib/admin/admin-returns.server.ts || exit 1; \
test -f src/routes/admin.resi.tsx || exit 1; \
test -f src/routes/admin.resi.\$id.tsx || exit 1; \
grep -q '$listReturnRequests\|listReturnRequests' src/lib/admin-functions.ts || exit 1; \
grep -q '$countPendingReturnRequests\|countPendingReturnRequests' src/lib/admin-functions.ts || exit 1; \
grep -q 'listReturnRequestsSchema\|updateReturnRequestSchema' src/lib/validators/admin.ts || exit 1; \
grep -q 'RotateCcw' src/routes/admin.tsx || exit 1; \
grep -q '"/admin/resi"' src/routes/admin.tsx || exit 1; \
grep -q 'pendingResiCount\|countPendingReturnRequests' src/routes/admin.tsx || exit 1; \
! grep -qE ": any\b|as any\b" src/lib/admin/admin-returns.server.ts || exit 1; \
! grep -qE ": any\b|as any\b" src/routes/admin.resi.tsx src/routes/admin.resi.\$id.tsx || exit 1; \
pnpm typecheck 2>&1 | tail -3
    </automated>
  </verify>
  <done>
- 3 nuovi file (`admin-returns.server.ts` + 2 route files)
- `admin-functions.ts` esporta 3 nuovi server functions
- `validators/admin.ts` esporta 2 nuovi schema Zod
- Sidebar `admin.tsx` mostra link "Resi" con icon `RotateCcw` + badge count condizionale
- Zero `any`
- Typecheck baseline 25 → 25 (nuovi file zero errori)
- 1 commit `feat(admin): /admin/resi lista paginata + dettaglio gestione status`
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 7: Admin endpoints API (GET list + PATCH status) con AuditLog</name>
  <files>
    src/routes/api/admin/return-requests.ts (NEW — GET list)
    src/routes/api/admin/return-requests.$id.ts (NEW — PATCH status/notes)
  </files>
  <behavior>
    - GET `/api/admin/return-requests`: requireAdmin → 403, parse query params → 400, call `listReturnRequests` → apiSuccess
    - PATCH `/api/admin/return-requests/:id`: requireAdmin → 403, parse body via `updateReturnRequestSchema` → 422, call `updateReturnRequest` → AuditLog event "return_request_status_changed" with metadata `{ id, oldStatus, newStatus, adminNotes }` (best-effort try/catch) → apiSuccess
    - Pattern identico a `src/routes/api/admin/orders.$id.ts`
  </behavior>
  <action>
**File 1: `src/routes/api/admin/return-requests.ts`** (~50 LOC, modellato su `orders.ts`)

```typescript
/**
 * GET /api/admin/return-requests — List return requests (admin)
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { listReturnRequests } from "~/lib/admin/admin-returns.server";
import { listReturnRequestsSchema } from "~/lib/validators/admin";

export const Route = createFileRoute("/api/admin/return-requests")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const url = new URL(request.url);
        const rawParams: Record<string, string> = {};
        for (const [key, value] of url.searchParams) {
          rawParams[key] = value;
        }

        const parsed = listReturnRequestsSchema.safeParse(rawParams);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Parametri non validi", 400);
        }

        const result = await listReturnRequests(parsed.data);
        return apiSuccess(result);
      },
    },
  },
});
```

**File 2: `src/routes/api/admin/return-requests.$id.ts`** (~80 LOC, modellato su `orders.$id.ts`)

```typescript
/**
 * PATCH /api/admin/return-requests/$id — Update return request status (admin)
 *
 * Side-effect: AuditLog event "return_request_status_changed" con metadata { id, oldStatus, newStatus, adminNotes }
 */

import { createFileRoute } from "@tanstack/react-router";
import { apiSuccess, apiError } from "~/lib/api-response";
import { requireAdmin } from "~/lib/sdk-auth.server";
import { prisma } from "~/lib/db.server";
import { updateReturnRequest, getReturnRequest } from "~/lib/admin/admin-returns.server";
import { updateReturnRequestSchema } from "~/lib/validators/admin";
import { createLogger } from "~/lib/logger.server";
import { getClientIp } from "~/lib/rate-limit.server";

const log = createLogger("admin-return-requests");

export const Route = createFileRoute("/api/admin/return-requests/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }
        const rr = await getReturnRequest(params.id);
        if (!rr) return apiError("NOT_FOUND", "Richiesta non trovata", 404);
        return apiSuccess(rr);
      },

      PATCH: async ({ request, params }) => {
        let admin: { id: string };
        try {
          admin = await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        const body = (await request.json()) as unknown;
        const parsed = updateReturnRequestSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Dati non validi", 422);
        }

        let result;
        try {
          result = await updateReturnRequest(params.id, parsed.data);
        } catch (e: unknown) {
          if (e instanceof Error && e.message === "ReturnRequest not found") {
            return apiError("NOT_FOUND", "Richiesta non trovata", 404);
          }
          log.error("updateReturnRequest failed", { error: e instanceof Error ? e.message : "unknown" });
          return apiError("INTERNAL_ERROR", "Errore durante l'aggiornamento", 500);
        }

        // AuditLog best-effort (non blocca update)
        try {
          await prisma.auditLog.create({
            data: {
              userId: admin.id,
              event: "return_request_status_changed",
              ip: getClientIp(request),
              userAgent: request.headers.get("user-agent"),
              metadata: {
                id: result.id,
                oldStatus: result.oldStatus,
                newStatus: result.status,
                adminNotes: parsed.data.adminNotes,
              },
            },
          });
        } catch (e: unknown) {
          log.warn("AuditLog insert failed (non-blocking)", { error: e instanceof Error ? e.message : "unknown" });
        }

        return apiSuccess({ id: result.id, status: result.status });
      },
    },
  },
});
```

**Pitfall noti**:
- File path: `return-requests.$id.ts` (con `.$id` per dynamic param TanStack Router file-based)
- `requireAdmin(request)` (versione server-side che riceve `Request`) — diversa da `requireAdmin()` in `admin-functions.ts`. Pattern identico a `orders.$id.ts:30-35`
- `result.oldStatus` è ritornato da `updateReturnRequest` (Task 6) — necessario per AuditLog metadata
- AuditLog usa `userId` (admin che effettua il cambio), `event: "return_request_status_changed"`, `metadata` con before/after — pattern identico a quelli esistenti (es. `terms_accepted_at_checkout` in `orders.server.ts`)
- PATCH **NON** invia email al cliente in questo task (decisione utente: notifica via email ad approvazione/rifiuto è gestita manualmente dall'admin tramite `replyTo` sull'email originale o composizione manuale — fuori scope per evitare ambiguità su quando emettere quale messaggio)

Atomic commit: `feat(api): GET + PATCH /api/admin/return-requests con AuditLog status change`
  </action>
  <verify>
    <automated>
test -f src/routes/api/admin/return-requests.ts || exit 1; \
test -f src/routes/api/admin/return-requests.\$id.ts || exit 1; \
grep -q 'createFileRoute("/api/admin/return-requests")' src/routes/api/admin/return-requests.ts || exit 1; \
grep -q 'createFileRoute("/api/admin/return-requests/\$id")' src/routes/api/admin/return-requests.\$id.ts || exit 1; \
grep -q 'requireAdmin(request)' src/routes/api/admin/return-requests.ts || exit 1; \
grep -q 'requireAdmin(request)' src/routes/api/admin/return-requests.\$id.ts || exit 1; \
grep -q 'return_request_status_changed' src/routes/api/admin/return-requests.\$id.ts || exit 1; \
grep -q 'oldStatus' src/routes/api/admin/return-requests.\$id.ts || exit 1; \
! grep -qE ": any\b|as any\b" src/routes/api/admin/return-requests.ts src/routes/api/admin/return-requests.\$id.ts || exit 1; \
pnpm typecheck 2>&1 | tail -3
    </automated>
  </verify>
  <done>
- 2 nuovi file API endpoint
- GET ritorna lista paginata (auth-gated)
- PATCH aggiorna status + adminNotes + crea AuditLog `return_request_status_changed` con `{id, oldStatus, newStatus, adminNotes}` metadata best-effort
- Zero `any`
- Typecheck baseline 25 → 25
- 1 commit `feat(api): GET + PATCH /api/admin/return-requests con AuditLog status change`
  </done>
</task>

</tasks>

<verification>
**Smoke verification (post-deploy oppure su dev locale):**

1. **Cleanup**: `ls public/modulo-recesso.pdf 2>&1` → "No such file"; `grep pdfkit package.json` → vuoto
2. **DB**: `pnpm prisma migrate status` → "Database schema is up to date"; `psql $DATABASE_URL -c "\d return_requests"` mostra tabella + 3 indici
3. **Form public smoke (browser)**:
   - Visita `/resi-e-recesso` → click su "modulo di richiesta reso online" → arriva su `/resi-e-recesso/richiesta`
   - Submit con campi vuoti → errori inline (Zod client-side)
   - Submit con `orderNumber: "CP-9999-9999"` (fake) → toast errore "Ordine non trovato"
   - Submit con email valida ma diversa dall'ordine reale → toast "L'email non corrisponde"
   - Submit valido (ordine reale) → redirect `/resi-e-recesso/richiesta/inviata`
   - Re-submit stesso ordine entro 1min → toast "Hai già una richiesta in corso"
4. **Email** (Resend dashboard): verifica 2 email partite per ogni submit (admin + cliente)
5. **Termini § 8** (browser): visita `/termini` → cerca "modulo di richiesta reso online" come anchor href `/resi-e-recesso/richiesta`. Zero menzioni `/modulo-recesso.pdf`
6. **Admin lista** (loggato come admin): `/admin/resi` mostra lista paginata, sidebar mostra "Resi" con icon `RotateCcw` + badge rosso "(N)" se ci sono pending
7. **Admin dettaglio**: click su una richiesta → vedi dati cliente + ordine + motivazione + form gestione. Cambia status (pending → approved) + adminNotes "OK procediamo" → click Salva → toast success
8. **AuditLog**: `psql $DATABASE_URL -c "SELECT event, metadata FROM audit_logs WHERE event='return_request_status_changed' ORDER BY \"createdAt\" DESC LIMIT 1"` mostra il cambio con `{id, oldStatus:"pending", newStatus:"approved", adminNotes:"OK procediamo"}`
9. **Typecheck globale**: `pnpm typecheck 2>&1 | grep -E "^Found"` → "Found 25 errors" (baseline mantenuta)
10. **No regression API esistenti**: smoke E2E `pnpm test:e2e tests/e2e/all-products-purchase.spec.ts -g "denise" --workers=1` PASS

**Pre-commit gate per ogni task:**
- `pnpm typecheck` non aumenta errori sul file modificato
- Zero `any` nei file nuovi (`grep -E ": any|as any|<any>"` vuoto)
- `grep -E "react-hook-form" src/routes/resi-e-recesso.richiesta.tsx` vuoto (CLAUDE.md compliance)
</verification>

<success_criteria>
- [ ] 7 commit atomici italiani in ordine spec (vedi spec § "Atomic commits previsti")
- [ ] 18 file impattati (di cui 9 nuovi: 1 migration sql + 8 file applicativi)
- [ ] PDF + script + devDep pdfkit completamente rimossi (zero residui in package.json/src/scripts/public)
- [ ] Modello `ReturnRequest` esiste in DB con FK Order onDelete:Restrict + 3 indici
- [ ] POST `/api/return-request` valida ordine/email/14gg/idempotenza e invia 2 email (admin + cliente)
- [ ] Form pubblico `/resi-e-recesso/richiesta` usa `@tanstack/react-form` + zod adapter (NO react-hook-form), shadcn UI components, redirect a `/resi-e-recesso/richiesta/inviata` on success
- [ ] `/resi-e-recesso` e `termini § 8` linkano al form online (mantenendo email/raccomandata come canali alternativi compliance Art. 49+54)
- [ ] `/admin/resi` lista paginata + dettaglio editabile + sidebar con icon `RotateCcw` + badge count pending
- [ ] PATCH admin crea AuditLog `return_request_status_changed` con metadata `{id, oldStatus, newStatus, adminNotes}`
- [ ] Soft-block personalizzati: flag `hasOnlyCustomItems` salvato e visibile in admin (warning su email + dettaglio), submit consentito (admin decide caso per caso)
- [ ] Typecheck baseline 25 → 25 (zero regressioni)
- [ ] Zero `any` introdotti (CLAUDE.md zero-any policy)
- [ ] Migration additive-safe (solo CREATE TABLE + CREATE INDEX, no ALTER su `orders`)
</success_criteria>

<output>
After completion, create `.planning/quick/260430-vll-resi-form-online-pivot-cleanup-pdf-retur/260430-vll-SUMMARY.md` con:
- 7 commit hash + commit message
- File impattati (lista completa)
- Verifiche eseguite (smoke browser + smoke API + typecheck)
- Setup utente residuo (es. confermare attivazione mailbox `resi@calzoleriaprevenzano.it` se non già attiva)
- Eventuali deviazioni dal plan (con motivazione, applicare Rule 1/2/3)

Aggiornare `.planning/STATE.md` riga `last_activity` con riepilogo task completato.
</output>
