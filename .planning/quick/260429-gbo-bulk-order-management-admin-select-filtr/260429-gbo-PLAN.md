---
phase: 260429-gbo
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/validators/admin.ts
  - src/lib/admin/admin-orders.server.ts
  - src/lib/admin.server.ts
  - src/lib/admin-functions.ts
  - src/routes/api/admin/orders.bulk.ts
  - src/components/admin/TypeConfirmDialog.tsx
  - src/routes/admin.ordini.tsx
  - src/routes/admin.ordini.cestino.tsx
autonomous: true
requirements:
  - GBO-01-validators-server-fns
  - GBO-02-bulk-api-endpoint
  - GBO-03-type-confirm-dialog
  - GBO-04-list-bulk-and-filters
  - GBO-05-cestino-view

must_haves:
  truths:
    - "Admin can filter orders by email substring (matches user.email and guestEmail)"
    - "Admin can filter orders by createdFrom/createdTo date range"
    - "Admin can multi-select orders via checkboxes (header + per-row) on the active list"
    - "Admin can soft-delete (Cestina) selected orders after typing CANCELLA in TypeConfirmDialog"
    - "Soft-deleted orders disappear from /admin/ordini and appear in /admin/ordini/cestino"
    - "Admin can restore selected orders from /admin/ordini/cestino without confirmation"
    - "Admin can hard-delete selected orders from /admin/ordini/cestino after typing CANCELLA"
    - "Selection set resets when page, view, or any filter changes (no stale id leakage)"
    - "Public e2e smoke flow (smoke-purchase) still passes — no regression"
  artifacts:
    - path: src/lib/validators/admin.ts
      provides: "bulkOrderActionSchema + extended listAdminOrdersSchema with view/emailContains/createdFrom/createdTo"
      contains: "bulkOrderActionSchema"
    - path: src/lib/admin/admin-orders.server.ts
      provides: "softDeleteOrders, restoreOrders, hardDeleteOrders + view-aware getAdminOrders"
      contains: "softDeleteOrders"
    - path: src/routes/api/admin/orders.bulk.ts
      provides: "POST /api/admin/orders/bulk with action discriminator (soft-delete|restore|hard-delete)"
    - path: src/components/admin/TypeConfirmDialog.tsx
      provides: "Reusable type-to-confirm modal (~50 LOC, same backdrop+div+useRef pattern as ConfirmDialog)"
      min_lines: 40
    - path: src/routes/admin.ordini.tsx
      provides: "Multi-select column, email/date filters, bulk Cestina toolbar, link to /admin/ordini/cestino"
    - path: src/routes/admin.ordini.cestino.tsx
      provides: "Trash view with Ripristina (no confirm) + Cancella definitivamente (TypeConfirmDialog) bulk actions"
  key_links:
    - from: "src/routes/admin.ordini.tsx"
      to: "/api/admin/orders/bulk"
      via: "POST fetch with { action, ids }"
      pattern: "fetch.*api/admin/orders/bulk"
    - from: "src/routes/admin.ordini.cestino.tsx"
      to: "/api/admin/orders/bulk"
      via: "POST fetch with { action, ids }"
      pattern: "fetch.*api/admin/orders/bulk"
    - from: "src/routes/api/admin/orders.bulk.ts"
      to: "src/lib/admin/admin-orders.server.ts"
      via: "softDeleteOrders / restoreOrders / hardDeleteOrders"
      pattern: "softDeleteOrders|restoreOrders|hardDeleteOrders"
    - from: "src/routes/admin.ordini.tsx"
      to: "src/lib/admin/admin-orders.server.ts (via $getAdminOrders)"
      via: "view/emailContains/createdFrom/createdTo params"
      pattern: "view:|emailContains|createdFrom|createdTo"
---

<objective>
Bulk order management nell'admin: selezione multipla, filtri (email/data), vista Cestino dedicata, soft/restore/hard-delete con TypeConfirmDialog.

Purpose: Dare all'admin un modo rapido per pulire la lista ordini (test, errori, spam) preservando la possibilita' di ripristino. Mirror 1:1 del pattern soft-delete gia' consolidato su Product.

Output: Endpoint bulk unificato, vista cestino funzionante, dialog type-to-confirm riusabile, selezione multipla con reset corretto su page/view/filter change.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/260429-gbo-bulk-order-management-admin-select-filtr/260429-gbo-RESEARCH.md
@CLAUDE.md
@src/lib/validators/admin.ts
@src/lib/admin/admin-orders.server.ts
@src/lib/admin/admin-products.server.ts
@src/lib/admin-functions.ts
@src/lib/admin.server.ts
@src/routes/admin.ordini.tsx
@src/routes/admin.ordini.$id.tsx
@src/routes/api/admin/orders.ts
@src/routes/api/admin/products.$id.ts
@src/components/admin/ConfirmDialog.tsx
@src/routes/admin.prodotti.tsx
@prisma/schema.prisma

<interfaces>
<!-- Contracts that downstream tasks depend on. RESEARCH.md sketches are copy-pasteable. -->
<!-- Prefer them over re-deriving. -->

From src/lib/validators/admin.ts (already exists, EXTEND):
```typescript
// Existing
export const listAdminOrdersSchema: z.ZodSchema; // page/perPage/status/query/sort
export const updateOrderStatusSchema: z.ZodSchema;

// TO ADD
export const bulkOrderActionSchema = z.object({
  action: z.enum(["soft-delete", "restore", "hard-delete"]),
  ids: z.array(z.string().cuid()).min(1).max(500),
});
export type BulkOrderActionInput = z.infer<typeof bulkOrderActionSchema>;

// Extended listAdminOrdersSchema fields:
//   view: z.enum(["active","trash"]).default("active").optional()
//   emailContains: z.string().optional()
//   createdFrom: z.coerce.date().optional()
//   createdTo: z.coerce.date().optional()
```

From src/lib/admin/admin-orders.server.ts:
```typescript
// Existing (modify):
export async function getAdminOrders(input: ListAdminOrdersInput): Promise<{ items: AdminOrderListItem[]; total: number }>;

// TO ADD:
export async function softDeleteOrders(ids: string[], deletedBy?: string): Promise<{ count: number }>;
export async function restoreOrders(ids: string[]): Promise<{ count: number }>;
export async function hardDeleteOrders(ids: string[]): Promise<{ count: number }>;
```

From src/lib/admin/admin-products.server.ts:261-274 (REFERENCE PATTERN — mirror 1:1):
```typescript
// Soft-delete pattern to mirror on Order:
//   prisma.order.updateMany({
//     where: { id: { in: ids }, deletedAt: null },  // guard: only active rows
//     data: { deletedAt: new Date(), deletedBy: adminUserId ?? null },
//   })
// Restore: where { id: { in: ids }, deletedAt: { not: null } } -> set deletedAt:null, deletedBy:null
// HardDelete: where { id: { in: ids }, deletedAt: { not: null } } -> prisma.order.deleteMany
//   (OrderItem and Payment have onDelete: Cascade — verified schema lines 412, 435)
```

From src/components/admin/ConfirmDialog.tsx (REFERENCE — handcrafted, no Radix):
```typescript
// 105 LOC pattern: fixed inset-0 backdrop + relative dialog + useRef + useEffect Esc handler.
// TypeConfirmDialog mirrors this pattern, adds: input field + matches gate on confirm button.
```

API response helpers (src/lib/api-response.ts, already in repo):
```typescript
export function apiSuccess<T>(data: T, status?: number): Response;
export function apiError(code: string, message: string, status: number): Response;
```

Auth guard (used by src/routes/api/admin/products.$id.ts:53-73):
```typescript
async function requireAdmin(request: Request): Promise<{ id: string; email: string }>;
// Throws on non-admin -> caller wraps in try/catch -> 403
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Validator + server functions (soft/restore/hard-delete + view/email/date filters)</name>
  <files>src/lib/validators/admin.ts, src/lib/admin/admin-orders.server.ts, src/lib/admin.server.ts</files>
  <action>
Estendere validators e aggiungere le bulk server functions per Order. Mirror del pattern soft-delete di Product (vedi admin-products.server.ts:261-274).

**1. src/lib/validators/admin.ts:**
- Estendere `listAdminOrdersSchema` con (mantieni i campi esistenti):
  - `view: z.enum(["active", "trash"]).default("active").optional()`
  - `emailContains: z.string().optional()`
  - `createdFrom: z.coerce.date().optional()`
  - `createdTo: z.coerce.date().optional()`
- Aggiungere nuovo schema:
  ```ts
  export const bulkOrderActionSchema = z.object({
    action: z.enum(["soft-delete", "restore", "hard-delete"]),
    ids: z.array(z.string().cuid()).min(1).max(500),
  });
  export type BulkOrderActionInput = z.infer<typeof bulkOrderActionSchema>;
  ```
- Aggiornare anche il tipo `ListAdminOrdersInput` se gia' esposto come `z.infer<...>`.

**2. src/lib/admin/admin-orders.server.ts:**
- Sostituire l'hardcoded `conditions: [{ deletedAt: null }]` con switch view-aware:
  ```ts
  const { page, perPage, status, query, sort, view, emailContains, createdFrom, createdTo } = input;
  const conditions: Array<Record<string, unknown>> = [];
  conditions.push(view === "trash" ? { deletedAt: { not: null } } : { deletedAt: null });
  if (status) conditions.push({ status });
  if (query) conditions.push({ OR: [
    { orderNumber: { contains: query, mode: "insensitive" } },
    { user: { name: { contains: query, mode: "insensitive" } } },
    { user: { email: { contains: query, mode: "insensitive" } } },
    { guestEmail: { contains: query, mode: "insensitive" } },
  ]});
  if (emailContains) conditions.push({ OR: [
    { guestEmail: { contains: emailContains, mode: "insensitive" } },
    { user: { email: { contains: emailContains, mode: "insensitive" } } },
  ]});
  if (createdFrom || createdTo) conditions.push({ createdAt: {
    ...(createdFrom && { gte: createdFrom }),
    ...(createdTo && { lte: createdTo }),
  }});
  ```
  Nota: createdFrom/createdTo arrivano gia' come Date grazie a z.coerce.date().
- Aggiungere 3 funzioni bulk:
  ```ts
  export async function softDeleteOrders(ids: string[], deletedBy?: string): Promise<{ count: number }> {
    const result = await prisma.order.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date(), deletedBy: deletedBy ?? null },
    });
    return { count: result.count };
  }
  export async function restoreOrders(ids: string[]): Promise<{ count: number }> {
    const result = await prisma.order.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: { deletedAt: null, deletedBy: null },
    });
    return { count: result.count };
  }
  export async function hardDeleteOrders(ids: string[]): Promise<{ count: number }> {
    const result = await prisma.order.deleteMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
    });
    return { count: result.count };
  }
  ```
  hardDelete guarda solo gli ordini gia' nel cestino (safety net). OrderItem e Payment hanno onDelete: Cascade (schema verificato).

**3. src/lib/admin.server.ts:**
- Aggiungere alle re-export del barrel: softDeleteOrders, restoreOrders, hardDeleteOrders da ./admin/admin-orders.server.

**Vincoli:**
- Zero `any`. Usa `Record<string, unknown>` per il where (pattern gia' presente nel file).
- Zero nuove dipendenze.
- Italian commit: `feat(admin): server fn softDelete/restore/hardDelete + filtri email/date sugli ordini`
  </action>
  <verify>
    <automated>pnpm typecheck 2>&1 | tee /tmp/tc-task1.log; ! grep -E "src/(lib/validators/admin|lib/admin/admin-orders\.server|lib/admin\.server).*\.ts.*(error|TS[0-9]+)" /tmp/tc-task1.log</automated>
  </verify>
  <done>
- bulkOrderActionSchema esportato da src/lib/validators/admin.ts
- listAdminOrdersSchema accetta view/emailContains/createdFrom/createdTo
- softDeleteOrders, restoreOrders, hardDeleteOrders esportate e re-esportate dal barrel
- getAdminOrders honors view + nuovi filtri (where clause include OR su user.email/guestEmail e range createdAt)
- pnpm typecheck non introduce nuovi errori sui tre file modificati
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: API endpoint POST /api/admin/orders/bulk con action discriminator</name>
  <files>src/routes/api/admin/orders.bulk.ts</files>
  <action>
Creare un singolo endpoint che dispatcha le 3 azioni via campo `action` nel body. Pattern verificato da src/routes/api/admin/products.$id.ts:53-73.

**File:** src/routes/api/admin/orders.bulk.ts (NEW, ~60 LOC max — sotto i 150 LOC del limite API route).

```ts
import { createFileRoute } from "@tanstack/react-router";
// NOTE: usa esattamente lo stesso import di requireAdmin di src/routes/api/admin/products.$id.ts
import { requireAdmin } from "<same-path-as-products.$id.ts>";
import { apiError, apiSuccess } from "~/lib/api-response";
import { bulkOrderActionSchema } from "~/lib/validators/admin";
import { softDeleteOrders, restoreOrders, hardDeleteOrders } from "~/lib/admin.server";

export const Route = createFileRoute("/api/admin/orders/bulk")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Auth guard
        let admin: { id: string };
        try {
          admin = await requireAdmin(request);
        } catch {
          return apiError("FORBIDDEN", "Accesso negato", 403);
        }

        // 2. Parse body as unknown, validate with Zod
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return apiError("BAD_REQUEST", "Body JSON non valido", 400);
        }
        const parsed = bulkOrderActionSchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", "Dati non validi", 422);
        }

        // 3. Dispatch
        try {
          const { action, ids } = parsed.data;
          let result: { count: number };
          if (action === "soft-delete") result = await softDeleteOrders(ids, admin.id);
          else if (action === "restore") result = await restoreOrders(ids);
          else result = await hardDeleteOrders(ids);
          return apiSuccess({ count: result.count });
        } catch (e: unknown) {
          // Log con context, no stack trace exposure
          console.error("[api/admin/orders/bulk]", e instanceof Error ? e.message : String(e));
          return apiError("INTERNAL_ERROR", "Errore interno", 500);
        }
      },
    },
  },
});
```

**Note di implementazione:**
- Verifica esattamente il path corretto del requireAdmin guard guardando src/routes/api/admin/products.$id.ts e usa lo stesso import path.
- Verifica il nome esatto e la firma di apiSuccess/apiError in src/lib/api-response.ts; se divergono, allinea agli existing — NON inventare API.
- File-based routing: `orders.bulk.ts` -> `/api/admin/orders/bulk` (segmento statico, nessun conflitto con orders.$id.ts).
- Italian commit: `feat(admin): endpoint POST /api/admin/orders/bulk con action discriminator`

**Out of scope:** rate limiting (admin endpoint, gia' protetto da guard).
  </action>
  <verify>
    <automated>pnpm typecheck 2>&1 | tee /tmp/tc-task2.log; ! grep -E "src/routes/api/admin/orders\.bulk\.ts.*(error|TS[0-9]+)" /tmp/tc-task2.log; test -f src/routes/api/admin/orders.bulk.ts</automated>
  </verify>
  <done>
- src/routes/api/admin/orders.bulk.ts esiste, esporta Route, mappa a /api/admin/orders/bulk
- POST con body { action: "soft-delete"|"restore"|"hard-delete", ids: cuid[] } -> dispatch a server fn -> apiSuccess({ count })
- 403 senza admin, 422 con body invalido, 500 con error structured (nessun stack leak)
- pnpm typecheck clean sul nuovo file
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: TypeConfirmDialog component (type-to-confirm gate)</name>
  <files>src/components/admin/TypeConfirmDialog.tsx</files>
  <action>
Creare componente reusable per conferme distruttive con typing gate. Mirror del pattern handcrafted ConfirmDialog.tsx (no Radix). Sketch copy-pasteable in RESEARCH.md sezione 7.

**File:** src/components/admin/TypeConfirmDialog.tsx (NEW, ~50 LOC con import/types, max 70 LOC totali).

**Props:**
```ts
type TypeConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;        // es. "CANCELLA" — la stringa che l'utente deve digitare
  confirmLabel?: string;      // testo del bottone, default "Elimina definitivamente"
  danger?: boolean;           // default true — colore rosso
  isLoading?: boolean;        // disabilita bottone durante POST
};
```

**Comportamento:**
- open=false -> ritorna null (no DOM)
- Su open=true:
  - Reset `typed` state a ""
  - Focus l'input via `useRef<HTMLInputElement>` + useEffect
- Esc key -> onClose()
- Click backdrop -> onClose()
- Bottone Conferma:
  - disabled se `typed.trim() !== confirmText` OR `isLoading === true`
  - on click: onConfirm() (parent gestisce close via onClose se serve)
- Layout (mirror ConfirmDialog.tsx esistente):
  - Container: `fixed inset-0 z-50 flex items-center justify-center`
  - Backdrop: `absolute inset-0 bg-black/40 backdrop-blur-sm` con onClick={onClose}
  - Card: `relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl mx-4`
  - Icon: AlertTriangle da lucide-react in cerchio rosso (bg-red-100, text-red-600)
  - Hint: `<p>Per confermare digita <span className="font-mono font-semibold">{confirmText}</span></p>`
  - Input: `<input type="text" ref={inputRef} value={typed} onChange={...} />` con focus ring rosso
- Bottoni: Annulla (border gray) + Conferma (bg-red-600 / bg-red-300 disabled)

**Vincoli:**
- TS strict, zero `any`. Catch usa `unknown` se serve (qui non serve).
- Italian copy: "Annulla", "Per confermare digita", default `confirmLabel="Elimina definitivamente"`
- Usa cn helper esistente (verifica path: `~/lib/utils/cn` o equivalente — guarda gli import in ConfirmDialog.tsx)
- Limit hard: 70 LOC totali (incluso import + types)
- Italian commit: `feat(admin): TypeConfirmDialog reusable con typing gate`
  </action>
  <verify>
    <automated>pnpm typecheck 2>&1 | tee /tmp/tc-task3.log; ! grep -E "src/components/admin/TypeConfirmDialog\.tsx.*(error|TS[0-9]+)" /tmp/tc-task3.log; test -f src/components/admin/TypeConfirmDialog.tsx; grep -q "confirmText" src/components/admin/TypeConfirmDialog.tsx; grep -q "useRef" src/components/admin/TypeConfirmDialog.tsx</automated>
  </verify>
  <done>
- src/components/admin/TypeConfirmDialog.tsx esiste, esporta `TypeConfirmDialog` named export
- Props match dello schema sopra (confirmText, isLoading, danger, ecc.)
- Input ha focus auto su open, reset su close, Esc chiude, backdrop click chiude
- Bottone Conferma disabled finche' typed.trim() !== confirmText OR isLoading
- pnpm typecheck clean
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 4: List view enhancements — selezione massiva + filtri email/date + Cestina + link Cestino</name>
  <files>src/routes/admin.ordini.tsx, src/lib/admin-functions.ts</files>
  <action>
Aggiungere selezione multipla, filtri (email + data range), bulk toolbar "Cestina", e link a /admin/ordini/cestino.

**1. src/lib/admin-functions.ts (estensione `$getAdminOrders` se necessario):**
- Confermare che l'inputValidator passa view/emailContains/createdFrom/createdTo a `getAdminOrders`. Se la firma attuale non li propaga, allargare il type del parametro per accettarli (TS strict, niente `any`). Usa `z.infer<typeof listAdminOrdersSchema>` come tipo di riferimento.
- Nessuna nuova `createServerFn` necessaria — il client chiama l'endpoint REST `/api/admin/orders/bulk` direttamente con fetch.

**2. src/routes/admin.ordini.tsx (modifiche al component esistente):**

**Nuovi state hooks:**
```tsx
const [selected, setSelected] = useState<Set<string>>(new Set());
const [emailContains, setEmailContains] = useState("");
const [debouncedEmail, setDebouncedEmail] = useState("");
const [createdFrom, setCreatedFrom] = useState<string>(""); // ISO yyyy-mm-dd
const [createdTo, setCreatedTo] = useState<string>("");
const [bulkLoading, setBulkLoading] = useState(false);
const [confirmOpen, setConfirmOpen] = useState(false);
const [trashCount, setTrashCount] = useState<number | null>(null);
```

**Debounce email (300ms, no nuova dipendenza — useEffect + setTimeout):**
```tsx
useEffect(() => {
  const t = setTimeout(() => setDebouncedEmail(emailContains), 300);
  return () => clearTimeout(t);
}, [emailContains]);
```

**Reset selection on page/view/filter change (CRITICO — gotcha §10 di RESEARCH):**
```tsx
useEffect(() => {
  setSelected(new Set());
}, [page, query, status, debouncedEmail, createdFrom, createdTo, sort]);
```

**Pass nuovi parametri a getAdminOrders/$getAdminOrders refetch:**
- view: "active" (hardcoded per questa route)
- emailContains: debouncedEmail || undefined
- createdFrom: createdFrom || undefined
- createdTo: createdTo || undefined

**Trash count badge (separata richiesta one-shot, perPage=1):**
```tsx
useEffect(() => {
  $getAdminOrders({ data: { page: 1, perPage: 1, view: "trash" } })
    .then(r => setTrashCount(r.total))
    .catch(() => setTrashCount(null));
}, []); // refresh su mount; opzionale: dopo bulkLoading transition false->true
```
- Refresh anche dopo successful bulk action.

**UI additions:**

a) Filter row (inserisci accanto a status/sort, riga ~106-123):
```tsx
<input type="email" placeholder="Filtra per email..."
  value={emailContains} onChange={(e) => setEmailContains(e.target.value)}
  className="..." />
<input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} className="..." />
<input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} className="..." />
```

b) Header con link Cestino (vicino al titolo o ai controlli):
```tsx
<Link to="/admin/ordini/cestino" className="...">
  Cestino{trashCount !== null && trashCount > 0 ? ` (${trashCount})` : ""}
</Link>
```

c) Checkbox column header (riga ~131-143):
```tsx
<th className="px-4 py-3 w-10">
  <input type="checkbox"
    checked={orders.length > 0 && orders.every(o => selected.has(o.id))}
    onChange={(e) => {
      if (e.target.checked) setSelected(new Set([...selected, ...orders.map(o => o.id)]));
      else { const next = new Set(selected); orders.forEach(o => next.delete(o.id)); setSelected(next); }
    }} />
</th>
```

d) Checkbox per riga (riga ~156-185):
```tsx
<td className="px-4 py-3">
  <input type="checkbox" checked={selected.has(order.id)}
    onChange={(e) => {
      const next = new Set(selected);
      if (e.target.checked) next.add(order.id); else next.delete(order.id);
      setSelected(next);
    }} />
</td>
```

e) Sticky bulk toolbar (sopra la tabella, render condizionale `selected.size > 0`):
```tsx
{selected.size > 0 && (
  <div className="sticky top-0 z-10 mb-3 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
    <span className="text-sm">{selected.size} ordini selezionati</span>
    <button onClick={() => setConfirmOpen(true)} disabled={bulkLoading}
      className="inline-flex h-9 items-center rounded-md bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
      Cestina
    </button>
  </div>
)}
```

f) TypeConfirmDialog (in fondo al return):
```tsx
<TypeConfirmDialog
  open={confirmOpen}
  onClose={() => setConfirmOpen(false)}
  onConfirm={async () => {
    setBulkLoading(true);
    try {
      const ids = Array.from(selected);
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "soft-delete", ids }),
      });
      if (!res.ok) throw new Error("Bulk fallito");
      const json = await res.json() as { data?: { count: number } };
      toast.success(`${json.data?.count ?? ids.length} ordini cestinati`);
      setSelected(new Set());
      setConfirmOpen(false);
      // refetch lista + trashCount
      await refetchOrders();
      $getAdminOrders({ data: { page: 1, perPage: 1, view: "trash" } })
        .then(r => setTrashCount(r.total)).catch(() => {});
    } catch (e) {
      toast.error("Impossibile cestinare gli ordini");
    } finally {
      setBulkLoading(false);
    }
  }}
  title="Cestinare gli ordini selezionati?"
  message={`${selected.size} ordini saranno spostati nel cestino. Potrai ripristinarli successivamente.`}
  confirmText="CANCELLA"
  confirmLabel="Cestina"
  isLoading={bulkLoading}
/>
```

**Vincoli:**
- TS strict, zero `any`. Tipa la response del fetch con `as { data?: { count: number } }` (validate shape se possibile).
- Diff totale ≤ 120 LOC al file admin.ordini.tsx.
- NIENTE shadcn nuovi (rimani con input/button raw — il file gia' usa raw HTML in altri punti).
- Italian commit: `feat(admin): selezione massiva + filtri email/date + cestina nella lista ordini`

**Pitfall (CRITICO — RESEARCH gotcha §10):**
- Il `useEffect` di reset DEVE includere TUTTI i campi che cambiano la query: page, query, status, debouncedEmail, createdFrom, createdTo, sort. Mancare anche solo uno -> selection stale leak.
  </action>
  <verify>
    <automated>pnpm typecheck 2>&1 | tee /tmp/tc-task4.log; ! grep -E "src/routes/admin\.ordini\.tsx.*(error|TS[0-9]+)" /tmp/tc-task4.log; grep -q "setSelected(new Set())" src/routes/admin.ordini.tsx; grep -qE "useEffect\(\(\) => \{[^}]*setSelected\(new Set\(\)\)" src/routes/admin.ordini.tsx; grep -q "/api/admin/orders/bulk" src/routes/admin.ordini.tsx; grep -q "TypeConfirmDialog" src/routes/admin.ordini.tsx</automated>
  </verify>
  <done>
- Checkbox column su header (select-all-visible) + per-row
- Filtri email (debounced 300ms) + createdFrom + createdTo wired a getAdminOrders
- Sticky toolbar appare con selected.size > 0, mostra count + bottone "Cestina"
- Bottone Cestina apre TypeConfirmDialog con confirmText="CANCELLA"
- Su confirm: POST /api/admin/orders/bulk { action: "soft-delete", ids }, toast su success, refetch, reset selection
- Link "Cestino (N)" visibile in header, N da quick fetch view=trash
- Selection reset su page/query/status/email/dateFrom/dateTo/sort change (verifica grep useEffect contiene setSelected(new Set()))
- pnpm typecheck clean
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 5: Cestino view /admin/ordini/cestino con Ripristina e Cancella definitivamente</name>
  <files>src/routes/admin.ordini.cestino.tsx</files>
  <action>
Creare la vista Cestino. Layout duplicato (no shared component — researcher's call: 2 callsites + abstraction adds noise per quick task).

**File:** src/routes/admin.ordini.cestino.tsx (NEW, target ~150 LOC, hard limit 200 LOC).

**Routing:** TanStack file-based con `.` separatore segmento -> `/admin/ordini/cestino`. Conferma RESEARCH §5: static segment ha precedenza su `$id` dinamico, no conflitto.

**Struttura (mirror admin.ordini.tsx con view=trash):**

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { $getAdminOrders } from "~/lib/admin-functions";
import { TypeConfirmDialog } from "~/components/admin/TypeConfirmDialog";
import type { AdminOrderListItem } from "~/lib/types/admin"; // verifica path esatto

export const Route = createFileRoute("/admin/ordini/cestino")({
  loader: async () => {
    const initial = await $getAdminOrders({ data: { page: 1, perPage: 20, view: "trash" } });
    return { initialOrders: initial };
  },
  component: AdminOrdiniCestinoPage,
});

function AdminOrdiniCestinoPage() {
  const { initialOrders } = Route.useLoaderData();
  const [orders, setOrders] = useState<AdminOrderListItem[]>(initialOrders.items);
  const [total, setTotal] = useState(initialOrders.total);
  const [page, setPage] = useState(1);
  const [emailContains, setEmailContains] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [hardDeleteOpen, setHardDeleteOpen] = useState(false);

  // Debounce email
  useEffect(() => {
    const t = setTimeout(() => setDebouncedEmail(emailContains), 300);
    return () => clearTimeout(t);
  }, [emailContains]);

  // Reset selection on filter/page change (CRITICO)
  useEffect(() => {
    setSelected(new Set());
  }, [page, debouncedEmail, createdFrom, createdTo]);

  // Refetch on filters change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    $getAdminOrders({ data: {
      page, perPage: 20, view: "trash",
      emailContains: debouncedEmail || undefined,
      createdFrom: createdFrom || undefined,
      createdTo: createdTo || undefined,
    }})
      .then(r => { if (!cancelled) { setOrders(r.items); setTotal(r.total); } })
      .catch(() => { if (!cancelled) toast.error("Errore nel caricamento"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, debouncedEmail, createdFrom, createdTo]);

  async function bulkAction(action: "restore" | "hard-delete") {
    setBulkLoading(true);
    try {
      const ids = Array.from(selected);
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      });
      if (!res.ok) throw new Error("Bulk fallito");
      const json = await res.json() as { data?: { count: number } };
      const count = json.data?.count ?? ids.length;
      toast.success(action === "restore" ? `${count} ordini ripristinati` : `${count} ordini eliminati definitivamente`);
      setSelected(new Set());
      setHardDeleteOpen(false);
      // Refetch
      const r = await $getAdminOrders({ data: { page, perPage: 20, view: "trash",
        emailContains: debouncedEmail || undefined,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined } });
      setOrders(r.items); setTotal(r.total);
    } catch {
      toast.error(action === "restore" ? "Impossibile ripristinare" : "Impossibile eliminare definitivamente");
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="...">
      {/* Header con link "Torna agli ordini" */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cestino ordini</h1>
        <Link to="/admin/ordini" className="...">← Torna agli ordini</Link>
      </div>

      {/* Filter row (email + date) — uguale a admin.ordini.tsx ma SENZA status/sort */}
      <div className="flex flex-col gap-3 sm:flex-row mb-4">
        <input type="email" placeholder="Filtra per email..."
          value={emailContains} onChange={(e) => setEmailContains(e.target.value)} className="..." />
        <input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} className="..." />
        <input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} className="..." />
      </div>

      {/* Sticky bulk toolbar */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-10 mb-3 flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm">
          <span className="text-sm">{selected.size} ordini selezionati</span>
          <div className="flex gap-2">
            <button onClick={() => bulkAction("restore")} disabled={bulkLoading}
              className="inline-flex h-9 items-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              Ripristina
            </button>
            <button onClick={() => setHardDeleteOpen(true)} disabled={bulkLoading}
              className="inline-flex h-9 items-center rounded-md bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
              Cancella definitivamente
            </button>
          </div>
        </div>
      )}

      {/* Tabella — checkbox header + per-row + colonne identiche ad admin.ordini.tsx */}
      {/* Stato vuoto: "Il cestino e' vuoto" */}

      {/* Pagination identica */}

      <TypeConfirmDialog
        open={hardDeleteOpen}
        onClose={() => setHardDeleteOpen(false)}
        onConfirm={() => bulkAction("hard-delete")}
        title="Eliminare definitivamente?"
        message={`${selected.size} ordini saranno eliminati permanentemente. Questa azione e' irreversibile.`}
        confirmText="CANCELLA"
        confirmLabel="Elimina definitivamente"
        isLoading={bulkLoading}
      />
    </div>
  );
}
```

**Vincoli:**
- TS strict, zero `any`. Tipa response fetch.
- File ≤ 200 LOC (component limit).
- Stato vuoto: messaggio "Il cestino e' vuoto" quando orders.length === 0 e !loading.
- Ripristina: NO confirm dialog (azione reversibile, basso rischio) — chiama direttamente bulkAction("restore").
- Cancella definitivamente: TypeConfirmDialog con confirmText="CANCELLA".
- Selection reset su page/email/dateFrom/dateTo change (CRITICO — gotcha).
- Italian commit: `feat(admin): vista cestino /admin/ordini/cestino con ripristina e cancella definitivamente`

**Note routing:**
- Il route padre admin.ordini.tsx ha gia' `<Outlet />` con check `pathname !== "/admin/ordini"` (RESEARCH §5) — copre `/admin/ordini/cestino` automaticamente. Nessun cambio al padre.
- Cuid Prisma e' hex-only -> "cestino" non collide mai con `:id`.
  </action>
  <verify>
    <automated>pnpm typecheck 2>&1 | tee /tmp/tc-task5.log; ! grep -E "src/routes/admin\.ordini\.cestino\.tsx.*(error|TS[0-9]+)" /tmp/tc-task5.log; test -f src/routes/admin.ordini.cestino.tsx; grep -q 'view: "trash"' src/routes/admin.ordini.cestino.tsx; grep -q '"restore"' src/routes/admin.ordini.cestino.tsx; grep -q '"hard-delete"' src/routes/admin.ordini.cestino.tsx; grep -qE "useEffect\(\(\) => \{[^}]*setSelected\(new Set\(\)\)" src/routes/admin.ordini.cestino.tsx</automated>
  </verify>
  <done>
- src/routes/admin.ordini.cestino.tsx esiste, route registrata `/admin/ordini/cestino`
- Loader chiama $getAdminOrders con view: "trash"
- Filtri email (debounced) + date range presenti
- Bulk toolbar con "Ripristina" (no confirm) e "Cancella definitivamente" (TypeConfirmDialog "CANCELLA")
- Link "← Torna agli ordini" verso /admin/ordini
- Stato vuoto: "Il cestino e' vuoto"
- Selection reset su page/email/dateFrom/dateTo change
- pnpm typecheck clean
  </done>
</task>

</tasks>

<verification>

**Per task (ogni commit):**
- `pnpm typecheck` non introduce nuovi errori sui file modificati dal task. Errori pre-esistenti TS noise sono out of scope (vedi Out of Scope sotto).

**Aggregato (dopo Task 5, prima del push):**
1. `pnpm typecheck` clean su tutti i file modificati (grep filtrato).
2. `git status` -> 5 commit Italian, files atomici per task.
3. `git push origin site-gen/calzoleria-prevenzano` -> Railway redeploy.
4. Polling deploy con `curl -s https://calzoleriaprevenzano.it/api/products?perPage=1 | jq -r '.data.items | length'` finche' >0 (deploy completato).
5. `pnpm test:e2e tests/e2e/smoke-purchase.spec.ts` -> MUST PASS (no regression sul flow pubblico).

**Manual smoke (post-deploy, instructions in SUMMARY):**
1. Login admin.
2. Vai a /admin/ordini.
3. Filtra per email "e2e+" -> verifica che match trovi ordini guest e user.
4. Filtra date range -> verifica subset corretto.
5. Click select-all-header -> verifica tutte le righe visibili selezionate.
6. Click "Cestina" -> dialog appare -> digita "CANCELLA" -> bottone si abilita -> click.
7. Toast "X ordini cestinati", lista refetcha, ordini scompaiono.
8. Click link "Cestino (N)" -> /admin/ordini/cestino mostra gli ordini cestinati.
9. Seleziona alcuni, click "Ripristina" -> toast, scompaiono dal cestino.
10. Seleziona altri, click "Cancella definitivamente" -> dialog -> "CANCELLA" -> conferma -> toast, ordini eliminati permanentemente.
11. Cambia pagina o filtro nel cestino -> verifica selezione resettata (CRITICO).
12. Torna a /admin/ordini -> verifica gli ordini ripristinati sono di nuovo nella lista attiva.

</verification>

<success_criteria>

**Funzionali:**
- [ ] Filtro email match user.email + guestEmail (case-insensitive, contains)
- [ ] Filtro date range (createdFrom/createdTo) limita correttamente la lista
- [ ] Selezione multipla con header select-all-visible + checkbox per riga
- [ ] Cestina (soft-delete) con TypeConfirmDialog "CANCELLA" funziona
- [ ] /admin/ordini/cestino esiste e mostra solo ordini con deletedAt non null
- [ ] Ripristina (no confirm) sposta ordini back a /admin/ordini
- [ ] Cancella definitivamente (TypeConfirmDialog "CANCELLA") rimuove rows + cascade su OrderItem/Payment

**Robustness:**
- [ ] Selection set RESETTATO su page/view/filter/sort change (verifica grep useEffect contiene setSelected(new Set()))
- [ ] hardDeleteOrders guarda solo ordini gia' nel cestino (safety net)
- [ ] softDeleteOrders guarda solo ordini active (idempotenza)
- [ ] API endpoint: 403 senza admin, 422 body invalido, 500 con error structured (no stack leak)

**Quality gates:**
- [ ] `pnpm typecheck` clean su tutti i file modificati (grep filtrato per nuovi errori)
- [ ] Zero `any` esplicito in tutto il diff
- [ ] Italian commit messages (5 commit, 1 per task)
- [ ] No nuove dipendenze npm
- [ ] `pnpm test:e2e tests/e2e/smoke-purchase.spec.ts` PASS dopo deploy

**Out of scope (flag in SUMMARY, NON fixare):**
- Soft-delete su pagina dettaglio singolo ordine (admin.ordini.$id.tsx)
- Audit trail UI (deletedBy e' settato ma non visualizzato)
- Filtro range totale ordine
- Auto-purge cron del cestino vecchio
- E2E test admin (manual smoke sufficiente per quick task)
- Inactivation provv
- TS noise pre-esistente (errori non introdotti da questo plan)

</success_criteria>

<output>
After completion, create `.planning/quick/260429-gbo-bulk-order-management-admin-select-filtr/260429-gbo-SUMMARY.md` with:
- Files created/modified (8 files)
- 5 commit hashes Italian
- Manual smoke instructions (vedi <verification>)
- Out of scope items flagged
- Confirm push to origin + Railway deploy + smoke-purchase e2e PASS
</output>
