---
quick_task_id: 260429-eev
title: Fix pre-existing TypeScript errors in prodotti.$slug.tsx
date: 2026-04-28
mode: quick-task
duration_minutes: 8
commit: 6059e60
branch: site-gen/calzoleria-prevenzano
files_modified:
  - src/routes/prodotti.$slug.tsx
verification:
  typecheck_target_file_before: 34
  typecheck_target_file_after: 0
  typecheck_total_before: 60
  typecheck_total_after: 26
  typecheck_delta: -34
  smoke_purchase_e2e: PASS
  smoke_duration_seconds: 30
---

# Quick Task 260429-eev — Tipizzazione `beforeLoad` in `prodotti.$slug.tsx`

## One-liner

Annotata la return type esplicita di `beforeLoad` con due cast `as Promise<...>` sulle chiamate `createServerFn`, bypassando l'inferenza rotta del serializzatore RPC TanStack Start su `Record<string, unknown>` — eliminati 34 errori TS senza modifiche runtime.

## Diff (5 LOC)

```diff
 export const Route = createFileRoute("/prodotti/$slug")({
-  beforeLoad: async ({ params }) => {
+  beforeLoad: async ({
+    params,
+  }): Promise<{ product: ProductDetail | null; relatedProducts: ProductListItem[] }> => {
     const [product, relatedProducts] = await Promise.all([
-      $getProductBySlug({ data: { slug: params.slug } }),
-      $getFeaturedProducts({ data: { limit: 4 } }),
+      $getProductBySlug({ data: { slug: params.slug } }) as Promise<ProductDetail | null>,
+      $getFeaturedProducts({ data: { limit: 4 } }) as Promise<ProductListItem[]>,
     ]);
     return { product, relatedProducts };
   },
   component: ProdottoPage,
 });
```

Tipi `ProductDetail` e `ProductListItem` già importati alle righe 11 e 13 — nessun nuovo import.

## Verifica gate

| Check | Prima | Dopo | Delta | Esito |
|-------|-------|------|-------|-------|
| Errori TS in `prodotti.$slug.tsx` | 34 | **0** | -34 | PASS |
| Errori TS totali repo | 60 | 26 | -34 | PASS (atteso ~-32) |
| Smoke purchase E2E (`tests/e2e/smoke-purchase.spec.ts`) | — | PASS in 30s | — | PASS |

Comandi:

```bash
pnpm typecheck 2>&1 | grep -F 'prodotti.$slug.tsx' | wc -l        # 0
pnpm typecheck 2>&1 | grep -E "error TS" | wc -l                  # 26 (era 60)
pnpm exec playwright test tests/e2e/smoke-purchase.spec.ts \
  --reporter=list --workers=1 --retries=0                          # 1 passed
```

## Root cause (riferimento)

Il file usa `Route.useRouteContext()` (riga 53) sul valore restituito da `beforeLoad` (righe 39-48). L'inferenza era avvelenata a monte:

- `src/lib/product-functions.ts:80` (`$getProductBySlug`) usa `createServerFn(...).handler(async ({ data }) => ... return product satisfies ProductDetail | null)`.
- L'handler **non typechecka** con TS2345: `ProductDetail.variantConfig: Record<string, unknown> | null` non è assegnabile alla shape attesa dal serializzatore TanStack Start (`{ [x: string]: {} } | null`, perché `unknown` non è assegnabile a `{}`).
- Quando l'overload `ServerFn<...>` non matcha, il tipo di ritorno fallback diventa **`Promise<{}>`** — propagato a `beforeLoad` → a `useRouteContext()` → ogni accesso `ssrProduct.X` errava con TS2339.

Il cast `as Promise<ProductDetail | null>` allinea staticamente al runtime già garantito da `getProductBySlug` (`src/lib/products.server.ts:142`, dichiarato `Promise<ProductDetail | null>`).

## Out-of-scope (follow-up futuro, nessun fix qui)

- **`src/lib/admin-functions.ts:66` (`$getAdminProductById`)** ha la stessa patologia (1 errore residuo). Stesso pattern di fix applicabile, ma fuori scope di questa quick task.
- **Fix durabile alla radice (RPC layer)**: cambiare `ProductDetail.variantConfig` da `Record<string, unknown> | null` a una shape serializer-friendly (es. `JsonObject` da `type-fest`, oppure rimuovere il cast in `products.server.ts:166` lasciando `Prisma.JsonValue | null`). Questo eliminerebbe i due cast in questo file e l'errore in `admin-functions.ts:66`. Da pianificare come quick task separato.
- I 26 errori TS residui (admin-functions, api/products, api/admin/products, scripts/*, validators/auth, admin.prodotti.$id) sono pre-esistenti e fuori scope.

## Note

- Zero modifiche runtime, zero modifiche schema, zero nuovi import.
- Branch `site-gen/calzoleria-prevenzano`, commit `6059e60`, push completato verso `origin`.
- Railway redeploy verrà comunque triggerato (watch su branch), ma è no-op funzionale: solo type-only change.

## Self-Check: PASSED

- `src/routes/prodotti.$slug.tsx` modificato e committato (`6059e60`).
- SUMMARY.md presente in `.planning/quick/260429-eev-fix-pre-existing-typescript-errors-in-pr/`.
- STATE.md aggiornato (riga in Quick Tasks Completed + frontmatter + Current Position + Session Continuity).
- Commit pushato su `origin/site-gen/calzoleria-prevenzano`.
