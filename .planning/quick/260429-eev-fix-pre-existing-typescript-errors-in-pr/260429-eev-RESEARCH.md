# Quick Task — Fix pre-existing TS errors in `src/routes/prodotti.$slug.tsx`

**Date:** 2026-04-28
**Mode:** quick-task (~5 min)
**Confidence:** HIGH

---

## 1. Error count

**32 errors** in `src/routes/prodotti.$slug.tsx` (verified via `pnpm typecheck`).

All errors are downstream of one root cause — every property access on `ssrProduct` or `ssrRelated` reports `Property 'X' does not exist on type '{}'` (TS2339), plus implicit-any on inline callbacks (TS7006) and one `satisfies` failure (TS1360 on line 95).

Sample (lines 78, 83, 95, 100, 116, 133, 137, 140, 149, 197, 254, 264, 278…):
```
src/routes/prodotti.$slug.tsx(78,61): error TS2339: Property 'variantConfig' does not exist on type '{}'.
src/routes/prodotti.$slug.tsx(95,30): error TS1360: Type '{}' does not satisfy the expected type 'ProductDetail'.
src/routes/prodotti.$slug.tsx(133,43): error TS7006: Parameter 'v' implicitly has an 'any' type.
```

---

## 2. Root cause

The route file does **NOT** use `useLoaderData()` — it uses TanStack Router's `Route.useRouteContext()` (line 53), which reads what `beforeLoad` returned (lines 39-48). The context inference is broken upstream:

- **`src/lib/product-functions.ts:80`** — `$getProductBySlug = createServerFn(...).handler(async ({ data }) => { ... return product satisfies ProductDetail | null; })`
- The handler **fails to typecheck** with TS2345: `Type 'ProductDetail' is not assignable to type '{ ...; variantConfig: { [x: string]: {} } | null; ... }'` because `ProductDetail.variantConfig` is `Record<string, unknown> | null` (defined `src/lib/products.server.ts:37`), and TanStack Start's RPC serialization layer expects `{ [x: string]: {} } | null` (`unknown` is not assignable to `{}`).
- When the handler signature doesn't match `ServerFn<...>`, TanStack falls back the inferred return type of `$getProductBySlug(...)` to **`Promise<{}>`**.
- That `{}` propagates through `beforeLoad`'s implicit return → into `Route.useRouteContext()` → and every `ssrProduct.X` access errors.

**Same issue exists in `src/lib/admin-functions.ts:66`** (`$getAdminProductById`) for the same `variantConfig` reason. `catalogo.tsx` is unaffected because `PaginatedData<ProductListItem>` and `CategoryItem[]` don't contain `Record<string, unknown>`.

NB: comment in `product-functions.ts:7-9` claims these handler errors are "virtual-module noise resolved at runtime" — true at runtime, but `tsc --noEmit` still infers `{}`, and that is what poisons the consumer route.

---

## 3. Recommended fix — Path A (explicit `beforeLoad` return type)

Annotate `beforeLoad`'s return type. This bypasses the broken `$getProductBySlug` inference and pins the route context to the real types. **Zero runtime change.**

It does not require fixing `product-functions.ts` (out of scope for this PR — but worth a follow-up: change `variantConfig: Record<string, unknown> | null` → `variantConfig: Prisma.JsonValue | null` or remove the `satisfies ProductDetail | null` cast and let TanStack infer the Prisma shape directly).

Path B (per-site narrowing with `if`/guards) is rejected — 30+ touchpoints, fragile.
Path C (refactor `$getProductBySlug`) is rejected — out of PR scope.

---

## 4. Code snippet — exact diff for `prodotti.$slug.tsx`

Replace lines 39-48 with:

```tsx
export const Route = createFileRoute("/prodotti/$slug")({
  beforeLoad: async ({
    params,
  }): Promise<{ product: ProductDetail | null; relatedProducts: ProductListItem[] }> => {
    const [product, relatedProducts] = await Promise.all([
      $getProductBySlug({ data: { slug: params.slug } }) as Promise<ProductDetail | null>,
      $getFeaturedProducts({ data: { limit: 4 } }) as Promise<ProductListItem[]>,
    ]);
    return { product, relatedProducts };
  },
  component: ProdottoPage,
});
```

The two `as Promise<…>` casts are required because the upstream `createServerFn` chain returns `Promise<{}>` — the cast aligns the runtime-correct shape (Prisma + transformations in `getProductBySlug`) with the static type. Existing imports on lines 11 and 13 (`ProductListItem`, `ProductDetail`) cover all needed types — no new imports.

This single change resolves all 32 errors in the file (line 95's `satisfies ProductDetail` clause becomes valid; lines 96 `satisfies ProductListItem[]` likewise; every `.variants`, `.images`, `.category`, `.price` access typechecks; the `(v) => …` callbacks recover their parameter types from `product.variants` and stop being implicit-any).

---

## 5. Risk

**Very low.** Pure type annotations + `as` casts on the awaited values. No control flow, no data shape, no runtime call changes. The `smoke-purchase.spec.ts` Playwright test (loads page → click variant → add to cart → checkout) is the canonical regression guard; no behavior change is expected.

One caveat: the `as Promise<…>` cast asserts that the runtime shape matches `ProductDetail`/`ProductListItem`. This is already true — `getProductBySlug` (`src/lib/products.server.ts:142`) explicitly declares `Promise<ProductDetail | null>` and the `satisfies` on line 82 of `product-functions.ts` confirms intent — the cast is a TS workaround, not a behavioral lie.

---

## 6. Verification commands

```bash
# Confirm errors are gone in this file
pnpm typecheck 2>&1 | grep "prodotti.\$slug.tsx" | wc -l   # must be 0

# Confirm no new errors elsewhere
pnpm typecheck 2>&1 | grep "error TS" | wc -l   # should drop by exactly 32

# Smoke test — page loads, variant clicks, add-to-cart works
pnpm test:e2e tests/e2e/smoke-purchase.spec.ts
```

---

## 7. Out-of-scope follow-up (do NOT do in this PR)

The same root cause hits `src/lib/admin-functions.ts:66` and shows up as 1 error there. The PR description says "fix pre-existing TS errors in PR" — if scope is "errors in `prodotti.$slug.tsx` only", do only Path A above. If scope is broader, the durable fix is at the source: change `ProductDetail.variantConfig` from `Record<string, unknown> | null` to a serializer-friendly shape (e.g., `JsonObject | null` from `type-fest`, or drop the cast on `products.server.ts:166` and let it stay `Prisma.JsonValue | null`). That fix would let the `createServerFn` handler typecheck cleanly and would remove the casts above too. Recommend filing as a separate task.

## Sources

- File: `src/routes/prodotti.$slug.tsx` (read in full)
- File: `src/lib/product-functions.ts` (lines 78-93, comment lines 7-9)
- File: `src/lib/products.server.ts` (lines 25-37, 142, 166 — `ProductDetail` definition + `variantConfig` cast)
- File: `src/routes/catalogo.tsx` (lines 25-50 — clean reference using same `beforeLoad` + `useRouteContext` pattern, unaffected because no `Record<string, unknown>` in payload)
- Command: `pnpm typecheck 2>&1` (32 errors in target file, plus 2 upstream `createServerFn` overload mismatches at `product-functions.ts:80` and `admin-functions.ts:66` that are the real source)
