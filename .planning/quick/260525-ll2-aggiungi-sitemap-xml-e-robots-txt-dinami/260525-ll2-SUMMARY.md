---
quick_id: 260525-ll2
type: quick
subsystem: seo
tags: [seo, sitemap, robots, gsc, indexing]
requirements:
  - QUICK-260525-LL2-SEO-SITEMAP
  - QUICK-260525-LL2-SEO-ROBOTS
  - QUICK-260525-LL2-GSC-VERIFICATION
dependency_graph:
  requires: ["prisma.product.findMany", "prisma.category.findMany", "process.env.APP_URL (opzionale, fallback hardcoded)"]
  provides: ["GET /sitemap.xml (dinamica)", "GET /robots.txt (dinamico)", "<meta name=google-site-verification> condizionale"]
  affects: ["SEO indexing", "Google Search Console verification flow", "Crawler discovery (Bing, DuckDuckGo, etc.)"]
tech_stack:
  added: []
  patterns: ["TanStack pure server route con .ts (no .tsx)", "Path file con [.] escape per matchare URL con dot literal", "Spread condizionale su array di meta tag per evitare tag vuoti", "XML escape difensivo su tutte le <loc>"]
key_files:
  created:
    - src/routes/sitemap[.]xml.ts
    - src/routes/robots[.]txt.ts
  modified:
    - src/routes/__root.tsx (+3 LOC: spread condizionale meta tag)
    - .env.example (+3 LOC: nuova sezione SEO con GOOGLE_SITE_VERIFICATION)
decisions:
  - "Convenzione TanStack [.]: il filename src/routes/sitemap[.]xml.ts produce path /sitemap.xml (le parentesi quadre escapano il punto, altrimenti '.' è separatore di segmenti). Verificato sia con docs TanStack che con uploads.\$.tsx esistente nel repo."
  - "Estensione .ts (non .tsx): sitemap e robots sono pure server endpoints senza React component, niente JSX nel file. Stesso pattern di src/routes/api/categories.ts."
  - "BASE_URL = process.env.APP_URL ?? \"https://calzoleriaprevenzano.it\": fallback hardcoded al dominio canonico se l'env è vuota/non settata (resilient anche in dev senza .env completo)."
  - "XML escape applicato a TUTTE le <loc>, anche statiche: difesa preventiva contro futuri query param multipli (&page=2 ecc.) che richiederebbero &amp;."
  - "Meta tag GSC condizionale via spread su array literal: ...(process.env.X ? [{...}] : []) garantisce zero tag emessi quando env vuota/undefined (entrambe falsy). Non viene mai renderizzato <meta name=\"google-site-verification\" content=\"\"> (che bloccherebbe la verifica)."
  - "lastmod=YYYY-MM-DD (W3C Datetime short form): sufficiente per sitemaps.org, niente timestamp ISO full necessari."
  - "Cache-Control sitemap 3600s (1h), robots 86400s (24h): bilanciamento freshness/load. Sitemap refresha quando vengono pubblicati nuovi prodotti (max 1h di lag)."
  - "Routing regen routeTree.gen.ts: file gitignored auto-generato. Rigenerato localmente via Generator+getConfig di @tanstack/router-generator per typecheck verde. Su Railway verrà rigenerato automaticamente dal vite plugin a build-time."
metrics:
  duration: "3m 18s"
  completed: "2026-05-25"
  files_changed: 4
  loc_added: 130
---

# Quick 260525-ll2: Sitemap.xml + robots.txt dinamici + meta tag Google Search Console Summary

Aggiunti endpoint dinamici **GET /sitemap.xml** (XML conforme sitemaps.org con 9 statiche + tutti i prodotti pubblicati + tutte le categorie attive) e **GET /robots.txt** (User-agent + Disallow su /admin /account /api /checkout /carrello /auth + riga Sitemap:), più meta tag `<meta name="google-site-verification">` condizionale su `process.env.GOOGLE_SITE_VERIFICATION` in `__root.tsx`. Sblocca indicizzazione SEO completa e collegamento del dominio a Google Search Console senza DNS TXT/file HTML.

## File creati/modificati

| File | Cambio | LOC |
|------|--------|-----|
| `src/routes/sitemap[.]xml.ts` | NEW | +121 |
| `src/routes/robots[.]txt.ts` | NEW | +39 |
| `src/routes/__root.tsx` | MODIFY (+3) | +3 |
| `.env.example` | MODIFY (+3) | +3 |

## Commits atomici

| # | Hash | Messaggio |
|---|------|-----------|
| 1 | `950f8ea` | `feat(quick-260525-ll2): aggiungi sitemap.xml dinamica con pagine statiche, prodotti pubblicati e categorie` |
| 2 | `cfb935d` | `feat(quick-260525-ll2): aggiungi robots.txt dinamico con direttive crawler e link sitemap` |
| 3 | `053df8f` | `feat(quick-260525-ll2): aggiungi meta tag google-site-verification condizionale in __root` |
| 4 | `f2c39cd` | `docs(quick-260525-ll2): documenta GOOGLE_SITE_VERIFICATION in .env.example` |

## Verifica typecheck

`pnpm typecheck`: **26 errori totali** (baseline pre-esistente invariata, identica alla baseline del task precedente 260525-l7t). **Zero errori sui 4 file toccati**.

Errori baseline (out-of-scope, già documentati negli ultimi 10+ task quick):
- `scripts/*` (create-product-templates, generate-seed, import-articoli-calzature-prod, scrape-products, scrape-wcpa-variants, seed-variant-templates, verify-all-wcpa)
- `src/lib/admin-functions.ts` (AdvisorProduct unused + AdminProductDetail serialization mismatch su variantConfig)
- `src/lib/product-functions.ts` (ProductDetail serialization mismatch su variantConfig)
- `src/lib/validators/auth.ts` (z.literal overload)
- `src/routes/api/admin/media.$id.ts` (apiNoContent unused)
- `src/routes/api/admin/products.ts` + `src/routes/api/products.ts` (compareAtPrice null incompatibility)

## Deviazioni dal piano

**Nessuna.** Plan eseguito esattamente come scritto, 4 file modificati nell'ordine previsto, 4 commit atomici italiani.

Nota tecnica (non deviazione): durante il `pnpm typecheck` il path passato a `createFileRoute()` nei 2 file nuovi è stato normalizzato automaticamente dal generator TanStack — da `/sitemap[.]xml` → `/sitemap.xml` e da `/robots[.]txt` → `/robots.txt` (le `[.]` escape valgono solo per il *filename*, mentre il *path URL* nel route registration è il path letterale finale `.xml`/`.txt`). Il `routeTree.gen.ts` (gitignored, auto-generato) è stato rigenerato localmente via `Generator+getConfig` di `@tanstack/router-generator` per allineare i tipi al typecheck — non committato (gitignored), verrà rigenerato automaticamente dal vite plugin sul build Railway.

## Come testare in locale

```bash
# 1) Avvia il dev server (in un terminale)
pnpm dev

# 2) In un altro terminale, verifica la sitemap
curl -i http://localhost:3000/sitemap.xml | head -30

# Output atteso:
# HTTP/1.1 200 OK
# Content-Type: application/xml; charset=utf-8
# Cache-Control: public, max-age=3600
# ...
# <?xml version="1.0" encoding="UTF-8"?>
# <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
#   <url>
#     <loc>https://calzoleriaprevenzano.it/</loc>
#     <lastmod>2026-05-25</lastmod>
#     <changefreq>weekly</changefreq>
#     <priority>1.0</priority>
#   </url>
#   ... (9 statiche + N prodotti + M categorie)

# 3) Verifica il robots
curl -i http://localhost:3000/robots.txt

# Output atteso:
# HTTP/1.1 200 OK
# Content-Type: text/plain; charset=utf-8
# Cache-Control: public, max-age=86400
#
# User-agent: *
# Allow: /
# Disallow: /admin
# Disallow: /admin/
# Disallow: /account
# Disallow: /account/
# Disallow: /api/
# Disallow: /checkout
# Disallow: /carrello
# Disallow: /auth/
#
# Sitemap: https://calzoleriaprevenzano.it/sitemap.xml

# 4) Conta gli URL prodotto/categoria nella sitemap (sanity check)
curl -s http://localhost:3000/sitemap.xml | grep -c '<url>'
# Atteso: 9 statiche + N prodotti pubblicati + M categorie attive

# 5) Valida l'XML (deve essere well-formed)
curl -s http://localhost:3000/sitemap.xml | xmllint --noout - && echo "XML OK"

# 6) Verifica che il meta tag NON appaia se GOOGLE_SITE_VERIFICATION e' vuoto
curl -s http://localhost:3000/ | grep -c "google-site-verification"
# Atteso: 0 (se .env locale ha GOOGLE_SITE_VERIFICATION="")

# 7) Test del meta tag con env settata
GOOGLE_SITE_VERIFICATION="test123abc" pnpm dev
# In un altro terminale:
curl -s http://localhost:3000/ | grep "google-site-verification"
# Atteso: <meta name="google-site-verification" content="test123abc">
```

## Come collegare a Google Search Console

### Passo 1 — Aggiungi la proprietà
1. Vai su https://search.google.com/search-console
2. Login con l'account Google del titolare (o accesso delegato)
3. Click **Aggiungi proprietà** in alto a sinistra
4. Scegli **Prefisso URL** (NON "Dominio" — quello richiede DNS TXT, più lento)
5. Inserisci esattamente `https://calzoleriaprevenzano.it` (con `https://`, senza trailing slash)
6. Click **Continua**

### Passo 2 — Verifica via meta tag HTML
1. Google ti mostra diversi metodi di verifica. Scegli **"Tag HTML"** (in genere il secondo o sotto "Altri metodi di verifica")
2. Google ti mostra una stringa tipo:
   ```html
   <meta name="google-site-verification" content="ABC_xyz123-LONG_HASH" />
   ```
3. **NON cliccare ancora "Verifica"** — prima devi deployare il valore.
4. **Copia SOLO il valore del `content="..."`** (es. `ABC_xyz123-LONG_HASH`, senza virgolette)

### Passo 3 — Setta la env var su Railway
1. Apri il dashboard Railway → progetto Calzoleria Prevenzano → servizio web
2. Tab **Variables**
3. Click **+ New Variable**
4. Nome: `GOOGLE_SITE_VERIFICATION`
5. Valore: incolla il codice copiato al passo 2 (es. `ABC_xyz123-LONG_HASH`)
6. **Save**
7. Railway farà autodeploy (1-2 minuti). Se non autodeploya, premi manualmente **Redeploy** dal menu del servizio.

### Passo 4 — Verifica che il meta tag sia presente in produzione
1. Apri https://calzoleriaprevenzano.it/
2. Click destro → **Visualizza sorgente pagina** (o `Ctrl+U` / `Cmd+Option+U`)
3. Cerca (`Ctrl+F` / `Cmd+F`) la stringa: `google-site-verification`
4. Deve apparire:
   ```html
   <meta name="google-site-verification" content="ABC_xyz123-LONG_HASH">
   ```
5. Se NON appare → Railway non ha ancora redeployato o l'env var non è stata salvata. Torna al passo 3.

### Passo 5 — Verifica su GSC
1. Torna su Google Search Console (il popup con il meta tag dovrebbe ancora essere aperto, altrimenti riaprilo da **Impostazioni → Verifica proprietà**)
2. Click **Verifica**
3. Se tutto è ok: appare **"Proprietà verificata"** ✓

### Passo 6 — Invia la sitemap
1. Nel menu sinistro di GSC: **Sitemap**
2. In "Aggiungi una nuova sitemap" digita: `sitemap.xml` (solo questo, GSC pre-compila il dominio)
3. Click **Invia**
4. Dopo qualche secondo/minuto vedi lo status:
   - **"Riuscita"** + numero di URL trovati (atteso: ~9 statiche + N prodotti pubblicati + M categorie)
   - Se "Errore" o "Recuperata, non riuscito a leggere" → controlla che `https://calzoleriaprevenzano.it/sitemap.xml` sia accessibile da browser

### Passo 7 — Aspetta l'indicizzazione
- Per un nuovo dominio: Google impiega da **3 giorni a 4 settimane** per il primo crawl completo
- Monitora il progresso da GSC → **Indicizzazione → Pagine**
- Puoi forzare la priorità di indicizzazione su singoli URL con **Strumento controllo URL → Richiedi indicizzazione** (limite ~10/giorno)

### Bonus — Test robots.txt
GSC ha uno strumento legacy **"Tester di robots.txt"** (https://www.google.com/webmasters/tools/robots-testing-tool) utile per:
- Confermare che `/admin`, `/api`, `/checkout`, `/carrello`, `/auth/` sono bloccati per Googlebot
- Verificare che la riga `Sitemap:` sia letta correttamente
- Testare singoli URL contro le direttive Disallow

## Deferred (out-of-scope, follow-up opzionali futuri)

- **Sitemap index multi-file**: utile solo se il sito supera 50.000 URL. Con catalogo attuale (~100 prodotti) non serve.
- **hreflang tags**: il sito è monolingua italiano. Quando/se si aggiungerà inglese/francese (vedi roadmap fase futura), aggiungere `<xhtml:link rel="alternate" hreflang="...">` agli `<url>`.
- **Image sitemap extension**: utile per indicizzare le foto prodotti su Google Images. Valutare dopo prima onda di traffico organico.
- **`lastmod` con timestamp ISO full** (es. `2026-05-25T14:23:45Z`): oggi solo `YYYY-MM-DD` per coerenza, sufficiente per sitemaps.org.
- **Sitemap submission automatica al Bing Webmaster Tools** (separato da GSC, opzionale): https://www.bing.com/webmasters/

## Self-Check: PASSED

- File `src/routes/sitemap[.]xml.ts`: FOUND
- File `src/routes/robots[.]txt.ts`: FOUND
- Commit `950f8ea`: FOUND
- Commit `cfb935d`: FOUND
- Commit `053df8f`: FOUND
- Commit `f2c39cd`: FOUND
- Typecheck baseline 26 → 26 (zero regressioni sui 4 file)
- Zero `any` introdotti
- Zero hex hardcoded
- Spread condizionale meta tag funzionante (verificato con grep)
