# Deferred Items — quick/260610-cst

Out-of-scope, pre-existing issues discovered during execution. NOT caused by this task.

## 1. `pnpm build` rotto in locale — version skew TanStack Start / router-core

`pnpm build` fallisce con `MISSING_EXPORT` in `node_modules/.nitro/vite/services/ssr/index.js`:
`isSsrResponse`, `normalizeSsrResponse`, `replaceSsrResponse` non sono esportati da
`@tanstack/router-core/dist/esm/ssr/server.js`. Il servizio SSR generato da nitro
(`@tanstack/react-start`) li importa ma la versione di `router-core` risolta non li espone.

- Causa: dependency-resolution skew dovuto allo store pnpm condiviso nel monorepo
  (vedi MEMORY.md "Monorepo pnpm condiviso rompe Prisma"). Tentati `pnpm install --ignore-workspace`
  + `pnpm prisma generate`: non risolvono (il mismatch è tra pacchetti TanStack interni).
- Impatto su questo task: NESSUNO. Le modifiche del task toccano solo logica spedizione,
  validators e UID — niente internals SSR/routing. `pnpm typecheck` è pulito su tutti gli
  8 file modificati. La build viene validata dal CI Railway (workflow storico del progetto).
- Fix futuro (separato): allineare le versioni `@tanstack/react-start` / `@tanstack/react-router`
  / `@tanstack/router-core` nel package.json + reinstall isolato.

## 2. `pnpm lint` rotto in locale — biome.json incompatibile con Biome 2.x

`pnpm lint` (e qualsiasi invocazione biome) fallisce perché `biome.json` usa chiavi
sconosciute a Biome 2.x (`files.ignore` ecc.). Pre-esistente, documentato in tutte le
quick task precedenti. Lint deferito al CI Railway.
