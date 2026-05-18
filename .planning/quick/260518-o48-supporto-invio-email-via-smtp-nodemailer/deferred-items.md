# Deferred Items — quick-260518-o48

Out-of-scope discoveries found during execution. NOT fixed (scope boundary).

## biome.json incompatibile con la versione biome installata

- **Trovato durante:** Task 2 (verifica `biome check`)
- **Issue:** `biome.json` usa la chiave `files.ignore`, valida per Biome 1.x ma rifiutata da Biome 2.x (installato: `@biomejs/biome` 2.4.6, pinnato in `package.json`). `pnpm exec biome check` esce con errore di configurazione prima ancora di analizzare i file. La chiave corretta per Biome 2.x è `files.includes` (con pattern di negazione) o `files.experimentalScannerIgnores`.
- **Impatto:** `pnpm lint` (`biome check .`) non funziona finché `biome.json` non viene aggiornato. Verifica del task aggirata usando un config Biome 2.x valido temporaneo limitato a `src/lib/email.server.ts` (risultato: pulito).
- **Perché non risolto qui:** `biome.json` è un file di configurazione condiviso, non toccato dal task SMTP. Pre-esistente. Va sistemato come task dedicato.

## Baseline typecheck pre-esistente (28 errori)

- **Trovato durante:** Task 2 (`pnpm typecheck`)
- **Issue:** `pnpm typecheck` riporta 28 errori TS pre-esistenti in file non correlati: `src/lib/admin/shipping-config.server.ts`, `src/lib/product-functions.ts`, `src/lib/validators/auth.ts`, `src/routes/api/admin/media.$id.ts`, `src/routes/api/admin/products.ts`, `src/routes/api/products.ts`.
- **Impatto:** Nessuno sul task: verificato 28 errori sia con sia senza le modifiche di questo task (`git stash`). Zero errori nuovi in `src/lib/email.server.ts`.
- **Perché non risolto qui:** Errori pre-esistenti in file non correlati. STATE.md documenta già un baseline noto.
