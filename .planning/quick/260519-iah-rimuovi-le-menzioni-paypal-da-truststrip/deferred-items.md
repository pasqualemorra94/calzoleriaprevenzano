# Deferred Items — quick-260519-iah

Out-of-scope discoveries found during execution. NOT caused by this plan's changes.

## Pre-existing typecheck errors (unrelated files)

Discovered while running `pnpm typecheck` for plan verification. None of these
are in files modified by this plan (TrustStripSection.tsx, Footer.tsx,
FeaturedProductsSection.tsx).

- `src/lib/validators/auth.ts:35,38` — `z.literal(boolean, { errorMap })` no longer
  matches Zod overload (likely Zod v4 API change; `errorMap` -> `error`).
- `src/routes/api/admin/media.$id.ts:8` — `apiNoContent` imported but unused (TS6133).
- `src/routes/api/admin/products.ts:51` — `compareAtPrice: number | null` not
  assignable to `ProductWithRelationsInput.compareAtPrice: number | undefined`.
- `src/routes/api/products.ts:52` — same `compareAtPrice` null vs undefined mismatch.

These should be addressed in a separate quick fix.
