# Deferred Items — 260507-ucj

Issues discovered during execution but **out of scope** per CLAUDE.md scope boundary.
Not fixed in this quick task. Logged for future cleanup.

## 1. `biome.json` config-format mismatch

**Where:** `biome.json` riga 33
**Issue:** la chiave `files.ignore` non è riconosciuta dalla versione installata di Biome (richiede `files.includes` con pattern negativi). `pnpm biome check` exit code 1 con errore deserializzazione.
**Pre-existing since:** commit `4064639` foundation.
**Impact:** `pnpm biome check` non eseguibile in CLI. Eventuale `pnpm lint` script bloccato.
**Fix proposto:** aggiornare `biome.json` da Biome 2.0 → schema corrente:
```diff
-  "files": {
-    "ignore": ["node_modules", "dist", ".output", "**/routeTree.gen.ts"]
-  }
+  "files": {
+    "includes": ["**", "!node_modules", "!dist", "!.output", "!**/routeTree.gen.ts"]
+  }
```
**Owner:** prossimo task di cleanup tooling/CI.

## 2. `duration-[var(--transition-slow)]` su `<img>` di CatalogProductCard.tsx riga 31

**Where:** `src/components/catalog/CatalogProductCard.tsx` riga 31
**Issue:** il design token `--transition-slow` contiene durata+easing combinati (`'350ms cubic-bezier(0.22, 1, 0.36, 1)'`). Quando passato a Tailwind `duration-[var(--transition-slow)]`, genera `transition-duration: 350ms cubic-bezier(...)`, che è CSS invalido (la prop `transition-duration` accetta solo valori `<time>`). Il browser rifiuta la dichiarazione e la transizione probabilmente cade su default 0s.
**Pre-existing since:** commit `4064639` foundation (stesso pattern presente in altri componenti, es. `FeaturedProductsSection.tsx`).
**Verifica:** DevTools → Computed → `transition-duration` su `<img>` hover → si vede `0s` invece di `350ms`.
**Fix proposto:** sostituire con `duration-[350ms]` ed `ease-[cubic-bezier(0.22,1,0.36,1)]` esplicito, oppure introdurre token CSS scorporati `--duration-slow: 350ms` + `--ease-out-expo: cubic-bezier(0.22,1,0.36,1)` e usarli separati.
**Impact:** transizione hover sull'immagine probabilmente non sta animando (effetto "scatto" invece di scale fluido).
**Owner:** prossimo design-system refactor / quick task UX su catalogo + featured.
**Nota:** lo stesso anti-pattern è probabilmente presente su tutti i componenti che usano `duration-[var(--transition-*)]`. Da grep: ~3-5 occorrenze in `src/components/sections/`.
