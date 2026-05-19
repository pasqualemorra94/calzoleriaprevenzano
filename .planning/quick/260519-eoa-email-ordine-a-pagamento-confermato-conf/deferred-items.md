# Deferred Items — 260519-eoa

Pre-existing typecheck errors discovered during execution, NOT caused by this plan's
changes. Out of scope per executor scope boundary. Listed for future cleanup.

- `src/lib/validators/auth.ts` (35,22) and (38,24): `z.literal` overload mismatch
  (Zod v4 API change — `errorMap` no longer valid option).
- `src/routes/api/admin/media.$id.ts` (8,32): `apiNoContent` imported but unused (TS6133).
- `src/routes/api/admin/products.ts` (51,50): `compareAtPrice` type `number | null`
  not assignable to `number | undefined` in `ProductWithRelationsInput`.
- `src/routes/api/products.ts` (52,50): same `compareAtPrice` null/undefined mismatch.

These cause `pnpm typecheck` to exit non-zero independently of the EOA-01..04 work.

## Pre-existing: Biome config / CLI version mismatch

`pnpm lint` (`biome check .`) fails before linting any file because `biome.json`
targets schema `2.0.0` while the installed Biome CLI is `2.4.6`. Unknown keys for
2.4.x: `organizeImports`, `files.ignore`. Fix is `npx biome migrate` (config-only,
no code change) — left out of this plan's scope (unrelated tooling drift).
Plan-related files (`email-templates.server.ts`, `order-emails.server.ts`,
`webhook-stripe.server.ts`, `checkout.ts`) are clean: `pnpm typecheck` reports
zero errors for them and `noUnusedLocals`/`noUnusedParameters` (strict tsconfig)
already cover the `noUnusedVariables` lint rule.
