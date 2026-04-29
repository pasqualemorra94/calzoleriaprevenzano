# Bulk Order Management — Research

**Researched:** 2026-04-29
**Mode:** quick-task (~7 min)
**Confidence:** HIGH (tutto verificato leggendo i file)

## Summary

Verifica completa dei prerequisiti tecnici per implementare bulk order management nell'admin: selezione multipla, filtri (email/range data), cestino con vista dedicata, soft-delete + restore + hard-delete, e dialog di conferma con type-to-confirm. Il codebase ha già tutte le primitive necessarie (`Order.deletedAt` + `deletedBy`, sonner, ConfirmDialog, pattern di soft-delete su `Product`, server functions admin via `createServerFn`, API routes con `requireAdmin`). Nessun blocker. Plan da 5-6 task è realistico.

**Primary recommendation:** Mirror il pattern soft-delete di `Product` (1:1, le API + server functions sono già lì come modello). Aggiungere `view`/`emailContains`/`createdFrom`/`createdTo` allo schema Zod `listAdminOrdersSchema` esistente. Creare `TypeConfirmDialog` come componente separato (non estendere `ConfirmDialog`).

## Project Constraints (from CLAUDE.md)

- **Zero `any` policy** non-negotiable — `unknown` + type guards / `Record<string, unknown>` solo
- **Zod schemas in `src/lib/validators/`**, mai inline — già rispettato (file `admin.ts` esistente)
- **`@/components/ui/`** shadcn primitives — ma in questo repo `ConfirmDialog` è handcrafted in `~/components/admin/` (no Radix Dialog usato), NON cambiare
- **Server boundary:** `*.server.ts` mai importato da client; flow obbligatorio: `route.tsx` → `$serverFn` → `lib/admin/*.server.ts`
- **Italiano per copy + commenti**, English per identificatori

## 1. Skeleton `admin.ordini.tsx` — punti di innesto

**Stato attuale (verificato):** route file-based `/admin/ordini` con `Outlet` per i child routes. State client-side (no URL state). `perPage = 20` server-side pagination.

```tsx
// src/routes/admin.ordini.tsx:64-72 — state hooks (NON in URL)
const [orders, setOrders] = useState<AdminOrderListItem[]>(initialOrders.items);
const [page, setPage] = useState(1);
const [query, setQuery] = useState("");
const [status, setStatus] = useState("");
const [sort, setSort] = useState("newest");
const [loading, setLoading] = useState(false);
// AGGIUNGERE: selectedIds: Set<string>, view: "active"|"trash",
//             emailContains: string, createdFrom?: string, createdTo?: string
```

```tsx
// src/routes/admin.ordini.tsx:106-123 — filter row (innesto nuovi filtri qui)
<div className="flex flex-col gap-3 sm:flex-row">
  <div className="relative flex-1"> {/* search */} </div>
  <select value={status} ...> {STATUS_FILTERS.map(...)} </select>
  <select value={sort} ...> {SORT_OPTIONS.map(...)} </select>
  {/* + <input type="email" placeholder="Filtra per email..."> */}
  {/* + <input type="date"> da & <input type="date"> a */}
</div>
```

```tsx
// src/routes/admin.ordini.tsx:131-143 — table header (header con checkbox "select-all")
<tr className="border-b border-gray-200 bg-gray-50 ...">
  {/* + <th className="px-4 py-3 w-10"><input type="checkbox" .../></th> */}
  <th className="px-4 py-3">Numero ordine</th>
  <th>Cliente</th> <th className="text-right">Articoli</th>
  <th className="text-right">Totale</th> <th>Stato</th>
  <th>Tracking</th> <th>Data</th>
  <th className="text-right">Azioni</th>
</tr>
```

```tsx
// src/routes/admin.ordini.tsx:156-185 — table row (checkbox cella per ogni riga)
orders.map((order) => (
  <tr key={order.id} className="hover:bg-gray-50">
    {/* + <td className="px-4 py-3"><input type="checkbox" checked={selected.has(order.id)} ... /></td> */}
    <td>{order.orderNumber}</td> ...
  </tr>
))
```

**Pagination:** server-side, `perPage: 20` hardcoded (riga 9, 78). URL state assente — `selected` viene resettato su page change (necessario; vedi pitfall §10).

**Bulk action bar:** rendering condizionale `selected.size > 0` sopra la tabella (sticky header pattern), con bottoni "Sposta nel cestino" (`view=active`) o "Ripristina" + "Elimina definitivamente" (`view=trash`).

## 2. `getAdminOrders` — signature attuale + diff

```ts
// src/lib/admin/admin-orders.server.ts:14-37 — codice attuale
export async function getAdminOrders(input: ListAdminOrdersInput) {
  const { page, perPage, status, query, sort } = input;
  const conditions: Array<Record<string, unknown>> = [{ deletedAt: null }];  // ← hardcoded!
  if (status) conditions.push({ status });
  if (query) conditions.push({ OR: [
    { orderNumber: { contains: query, mode: "insensitive" } },
    { user: { name: { contains: query, mode: "insensitive" } } },
    { user: { email: { contains: query, mode: "insensitive" } } },
    { guestEmail: { contains: query, mode: "insensitive" } },
  ]});
  ...
}
```

**Conferma:** `deletedAt: null` filtrato di default → corretto. Per la vista cestino va invertito a `{ deletedAt: { not: null } }` (mirror del pattern `getAdminProducts` con `status === "deleted"`, vedi `admin-products.server.ts:33-34`).

**Patch (nuovi parametri):**
```ts
const { page, perPage, status, query, sort, view, emailContains, createdFrom, createdTo } = input;
const conditions: Array<Record<string, unknown>> = [];
if (view === "trash") conditions.push({ deletedAt: { not: null } });
else conditions.push({ deletedAt: null });
if (status) conditions.push({ status });
if (emailContains) conditions.push({ OR: [
  { guestEmail: { contains: emailContains, mode: "insensitive" } },
  { user: { email: { contains: emailContains, mode: "insensitive" } } },
]});
if (createdFrom || createdTo) conditions.push({ createdAt: {
  ...(createdFrom && { gte: new Date(createdFrom) }),
  ...(createdTo && { lte: new Date(createdTo) }),
}});
// query rimane invariato (search globale)
```

**Importante:** `Order.guestEmail` è campo diretto sul model (verificato schema riga 381), NON su `Address`. Per email match servono entrambi i rami (utente loggato `user.email` + ospite `guestEmail`).

## 3. Soft-delete precedent — mirror `Product`

`Order` ha **già** sia `deletedAt: DateTime?` sia `deletedBy: String?` (schema righe 384-385) + index su `deletedAt` (riga 395). Identico al `Product`. Niente migration.

**Pattern canonico (da `admin-products.server.ts:261-274`) — copiare 1:1:**
```ts
export async function adminDeleteOrder(id: string, adminUserId: string) {
  return prisma.order.update({
    where: { id },
    data: { deletedAt: new Date(), deletedBy: adminUserId },
  });
}
export async function adminRestoreOrder(id: string) {
  return prisma.order.update({
    where: { id },
    data: { deletedAt: null, deletedBy: null },
  });
}
export async function adminHardDeleteOrder(id: string, adminUserId: string) {
  // OrderItem ha onDelete: Cascade → si pulisce automatico (verificato schema riga 412)
  // Payment ha onDelete: Cascade → idem (riga 435)
  await prisma.auditLog.create({ data: { userId: adminUserId, event: "order_hard_deleted",
    metadata: { orderId: id } } }).catch(() => {});
  return prisma.order.delete({ where: { id } });
}
```

**Bulk variants** (transactional, con `updateMany` / `deleteMany`):
```ts
export async function adminBulkSoftDeleteOrders(ids: string[], adminUserId: string) {
  return prisma.order.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { deletedAt: new Date(), deletedBy: adminUserId },
  });
}
// idem adminBulkRestoreOrders, adminBulkHardDeleteOrders
```

**Differenza con Product:** `Product` setta anche `isActive: false` su delete; `Order` non ha `isActive`. Skip.

## 4. ConfirmDialog — strategia per type-to-confirm

`ConfirmDialog.tsx` (verificato 105 righe) è handcrafted: usa div+backdrop+`useRef`+`useEffect` per Esc/focus, **non** Radix Dialog (`@radix-ui/react-dialog` non in `package.json`). Props attuali: `open`, `title`, `message`, `confirmLabel`, `cancelLabel`, `variant: "danger"|"default"`, `onConfirm`, `onCancel`. Pattern d'uso da `admin.prodotti.tsx:296-322`: due `<ConfirmDialog>` separati con stati distinti (`deleteTarget`, `duplicateTarget`).

**Decisione: nuovo componente `TypeConfirmDialog`** in `src/components/admin/TypeConfirmDialog.tsx`. Motivo:
- ConfirmDialog è semplice (105 LOC) — aggiungere `requireTyping?` + state interno + validazione complica il caso semplice senza beneficio
- `TypeConfirmDialog` riusa lo stesso markup div+backdrop (nessun Radix da installare), copy-paste del pattern useEffect/useRef
- Single Responsibility: dialog "azione distruttiva irreversibile" è un caso a sé

## 5. Routing per cestino

**TanStack Start file-based routing** (verificato in package.json: `@tanstack/react-router ^1.168.10`, `@tanstack/react-start ^1.167.16`): `.` come separatore segmento → `admin.ordini.cestino.tsx` ⇒ `/admin/ordini/cestino`.

**Conflitto con `$id`?** Già esiste `admin.ordini.$id.tsx` → `/admin/ordini/[id]`. In TanStack Router le rotte statiche hanno precedenza su quelle dinamiche (`$id`), quindi `/admin/ordini/cestino` matcherà `cestino.tsx` correttamente. Conferma indiretta: `$id` parametrico è cuid Prisma (es. `cma1b2c3...`) — nessun ordine ha mai id `cestino`.

**Decisione: file-based** `src/routes/admin.ordini.cestino.tsx`. Il route padre (`admin.ordini.tsx`) ha già `<Outlet />` per i child route (verificato riga 18-20 — controlla `pathname !== "/admin/ordini"`), serve aggiungere il check anche per `/admin/ordini/cestino`:
```tsx
if (pathname === "/admin/ordini/cestino") return <Outlet />;  // o lasciare il check generico esistente
```
In realtà il check esistente `pathname !== "/admin/ordini"` è già abbastanza inclusivo (qualsiasi sub-path → Outlet). Nessun cambio al padre.

**Fallback:** se per qualsiasi motivo il routeTree non riconosce `cestino` come segmento statico (improbabile), passare a query param `/admin/ordini?view=trash` — minor refactor, ma niente nuovo file.

## 6. Zod validators — location + nuove schema

Directory esistente: `src/lib/validators/admin.ts` (72 righe — già contiene `listAdminOrdersSchema`, `updateOrderStatusSchema`). **Aggiungere lì**, non creare file nuovo.

```ts
// AGGIUNGERE a src/lib/validators/admin.ts

// Estendere listAdminOrdersSchema (oppure creare listAdminOrdersAdvancedSchema):
export const listAdminOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(APP_CONFIG.pagination.maxPageSize).default(20),
  status: z.string().optional(),
  query: z.string().optional(),
  sort: z.enum(["newest", "order_number"]).default("newest"),
  view: z.enum(["active", "trash"]).default("active"),         // ← nuovo
  emailContains: z.string().optional(),                          // ← nuovo
  createdFrom: z.string().datetime().optional(),                 // ← nuovo (ISO 8601)
  createdTo: z.string().datetime().optional(),                   // ← nuovo
});

// Bulk action (nuovo)
export const bulkOrderActionSchema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(500),
  action: z.enum(["soft_delete", "restore", "hard_delete"]),
});
export type BulkOrderActionInput = z.infer<typeof bulkOrderActionSchema>;
```

## 7. TypeConfirmDialog — sketch (≤30 LOC, zero `any`, TS strict)

```tsx
// src/components/admin/TypeConfirmDialog.tsx
import { useEffect, useRef, useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "~/lib/utils/cn";

type TypeConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmPhrase: string;            // es. "ELIMINA"
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function TypeConfirmDialog({ open, title, message, confirmPhrase, confirmLabel = "Elimina definitivamente", onConfirm, onCancel }: TypeConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { setTyped(""); inputRef.current?.focus(); } }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);
  if (!open) return null;
  const matches = typed.trim() === confirmPhrase;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl mx-4">
        <button onClick={onCancel} className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600 leading-relaxed">{message}</p>
            <p className="mt-3 text-xs text-gray-500">Per confermare digita <span className="font-mono font-semibold text-gray-900">{confirmPhrase}</span></p>
            <input ref={inputRef} type="text" value={typed} onChange={(e) => setTyped(e.target.value)}
              className="mt-2 w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className={cn("inline-flex h-9 items-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50")}>Annulla</button>
          <button onClick={() => { onConfirm(); onCancel(); }} disabled={!matches}
            className={cn("inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors", matches ? "bg-red-600 text-white hover:bg-red-700" : "bg-red-300 text-white cursor-not-allowed")}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
```

## 8. Server function skeletons (createServerFn pattern)

Da aggiungere in `src/lib/admin-functions.ts` (esistente, riga 73-90 mostra `$getAdminOrders`):

```ts
export const $bulkOrderAction = createServerFn({ method: "POST" })
  .inputValidator((data: { ids: string[]; action: "soft_delete" | "restore" | "hard_delete" }) => data)
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    const parsed = bulkOrderActionSchema.parse(data);  // throw se invalid
    if (parsed.action === "soft_delete") return adminBulkSoftDeleteOrders(parsed.ids, admin.id);
    if (parsed.action === "restore")     return adminBulkRestoreOrders(parsed.ids);
    return adminBulkHardDeleteOrders(parsed.ids, admin.id);
  });
```

E re-export in `src/lib/admin.server.ts` barrel (riga 18-22 mostra il pattern Orders).

## 9. API endpoint POST — pattern verificato

Da `src/routes/api/admin/products.$id.ts:53-73`: `requireAdmin(request)` (try/catch → 403), `request.json() as unknown`, `safeParse`, ritorno `apiSuccess` / `apiError` / `apiNoContent`. Mirror per nuovo endpoint:

```ts
// src/routes/api/admin/orders.bulk.ts (file-based: /api/admin/orders/bulk)
export const Route = createFileRoute("/api/admin/orders/bulk")({
  server: { handlers: {
    POST: async ({ request }) => {
      let admin: { id: string };
      try { admin = await requireAdmin(request); } catch { return apiError("FORBIDDEN", "Accesso negato", 403); }
      const body = (await request.json()) as unknown;
      const parsed = bulkOrderActionSchema.safeParse(body);
      if (!parsed.success) return apiError("VALIDATION_ERROR", "Dati non validi", 422);
      // dispatch a admin*Bulk* functions per parsed.data.action
      return apiSuccess({ count: result.count });
    },
  }},
});
```

**Naming TanStack Start file-based:** `orders.bulk.ts` → `/api/admin/orders/bulk` (segmento statico, nessun conflitto con `orders.$id.ts`).

## 10. Risk inventory

| Risk | Severity | Mitigation |
|------|----------|------------|
| Routing collision `cestino` vs `$id` | LOW | TanStack: static > dynamic. Cuid Prisma è hex-only → mai collide con la stringa "cestino". |
| Selection set leakage tra page change | MEDIUM | `useEffect` reset `selected` quando `page`/`view`/`status`/filtri cambiano. **Critico**: testare. |
| `OrderItem` cascade su hard-delete | LOW (verificato) | Schema riga 412: `onDelete: Cascade`. Anche `Payment` riga 435. Sicuro. |
| Bulk con 500 ids (Prisma `IN` clause) | LOW | Postgres `IN` regge migliaia. Limite 500 dal validator è prudente. |
| `createServerFn` non valida con Zod nativamente | LOW | Pattern in repo: `inputValidator` firma TS + `safeParse` interno (vedi `$bulkOrderAction` sketch). Nessun helper esiste. |
| `view=trash` query nel browser back-button | LOW | State client-side → niente URL state. Refresh = view "active". Accettabile per quick task. |
| Sonner toast import | NONE | Già usato (`admin.prodotti.tsx:4` `import { toast } from "sonner"`), `sonner ^2.0.7` in package.json |

**No blockers.** Tutti i prerequisiti tecnici verificati: schema OK, primitive UI OK, pattern soft-delete consolidato su Product, sonner installato, ConfirmDialog disponibile, validators dir esistente, server function pattern già in `admin-functions.ts`.

## Files to create / modify

**Modify:**
- `src/lib/validators/admin.ts` — estendere `listAdminOrdersSchema` + nuovo `bulkOrderActionSchema`
- `src/lib/admin/admin-orders.server.ts` — aggiungere `view`/`emailContains`/`createdFrom`/`createdTo` + 4 nuove fn (`adminDeleteOrder`, `adminRestoreOrder`, `adminHardDeleteOrder`, + 3 bulk varianti)
- `src/lib/admin.server.ts` — re-export nuove fn (barrel)
- `src/lib/admin-functions.ts` — aggiungere `$bulkOrderAction`, estendere `$getAdminOrders` inputValidator
- `src/routes/admin.ordini.tsx` — checkbox column, bulk bar, nuovi filtri, link a /cestino
- `src/routes/api/admin/orders.ts` — usa il validator esteso (probabile no-op, rilegge da `searchParams`)

**Create:**
- `src/components/admin/TypeConfirmDialog.tsx` (~50 LOC con import/types)
- `src/routes/admin.ordini.cestino.tsx` (~150 LOC, simile a `admin.ordini.tsx` ma `view="trash"` + azioni Restore/HardDelete)
- `src/routes/api/admin/orders.bulk.ts` (~30 LOC)

## Sources

### HIGH confidence — letti direttamente
- `prisma/schema.prisma` righe 364-396 (Order: deletedAt + deletedBy + cascade)
- `src/lib/admin/admin-orders.server.ts` (signature + where clause)
- `src/lib/admin/admin-products.server.ts` righe 1-35, 261-274 (pattern soft-delete canonico)
- `src/lib/admin-functions.ts` (createServerFn pattern + auth guard)
- `src/lib/admin.server.ts` (barrel re-export)
- `src/lib/validators/admin.ts` (Zod schemas esistenti)
- `src/components/admin/ConfirmDialog.tsx` (105 LOC, no Radix, handcrafted)
- `src/routes/admin.ordini.tsx` (skeleton completo, state client-side)
- `src/routes/admin.ordini.$id.tsx` (no soft-delete pattern qui — solo PATCH status)
- `src/routes/admin.prodotti.tsx` righe 1-50, 285-323 (pattern toast + ConfirmDialog usage)
- `src/routes/api/admin/products.$id.ts` (pattern API route DELETE/POST + requireAdmin)
- `src/routes/api/admin/orders.ts` + `orders.$id.ts` (pattern existing endpoints)
- `package.json` (sonner ^2.0.7, @tanstack/react-router ^1.168.10, zod ^4.3.6, no @radix-ui/react-dialog, no use-debounce)
