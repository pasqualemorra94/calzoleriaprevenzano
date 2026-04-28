# Deferred Items — 260428-o8a

Pre-existing issues observed during execution but explicitly out of scope per the plan's scope boundary (only `tests/e2e/helpers/variants.ts` may be touched).

## 1. tsc errors in `src/routes/prodotti.$slug.tsx`

`pnpm exec tsc --noEmit` su HEAD pre-fix produce ~30 errori in `src/routes/prodotti.$slug.tsx` del tipo `Property '...' does not exist on type '{}'` e `Parameter 'X' implicitly has an 'any' type`. Pre-esistono al fix dell'helper (verificato con `git stash && pnpm exec tsc --noEmit`). Probabile root cause: il loader della route ha perso l'inferenza dei tipi sul `useLoaderData()` (forse Prisma 7 generated types o un cambio recente di TanStack Start).

Non bloccano i test E2E (Playwright trans-pila i test direttamente, non passa per `tsc`). Va aperto un task separato.

## 2. Biome config schema mismatch in `biome.json`

`pnpm exec biome check` esce con `× Found an unknown key 'ignore'` su `biome.json` linea 33: la chiave `ignore` non è più valida nella versione corrente di Biome — è stata rinominata in `includes` / `experimentalScannerIgnores`. Pre-esiste al fix dell'helper (verificato con `git stash`).

Mitigazione locale: `pnpm exec biome format --write tests/e2e/helpers/variants.ts` continua a funzionare e il file rispetta le regole 2-space + double quotes + semicolons.

Va sistemato nel task di manutenzione tooling.
