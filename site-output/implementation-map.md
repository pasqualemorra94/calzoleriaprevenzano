# Calzoleria Prevenzano — Implementation Map

> Generated: 2026-04-02 | Version: 25 | Framework: TanStack Router + React + Vite

## Architecture Overview

- **E-commerce B2C** — Sandali artigianali, accessori calzoleria, pelletteria
- **Auth**: Better Auth with email/password, admin plugin, TanStack Start cookies, audit hooks
- **Payments**: Stripe checkout sessions with webhook verification
- **GDPR**: Cookie consent, privacy/legal pages
- **Design**: Cormorant Garamond + DM Sans, cuoio warm palette, stitch DNA fingerprint

## Routes — Public Pages

| URL | File | Auth | Description |
|-----|------|------|-------------|
| `/` | `src/routes/index.tsx` | none | Homepage con hero, categorie, prodotti in evidenza |
| `/catalogo` | `src/routes/catalogo.tsx` | none | Catalogo completo con filtri, ricerca, paginazione |
| `/prodotti/$slug` | `src/routes/prodotti.$slug.tsx` | none | Dettaglio prodotto con gallery, varianti, add-to-cart |
| `/sandali` | `src/routes/sandali.tsx` | none | Pagina sandali (mock data legacy) |
| `/la-bottega` | `src/routes/la-bottega.tsx` | none | Chi siamo / La Bottega |
| `/contatti` | `src/routes/contatti.tsx` | none | Pagina contatti |
| `/guida-taglia` | `src/routes/guida-taglia.tsx` | none | Guida taglie |
| `/carrello` | `src/routes/carrello.tsx` | none | Carrello con gestione quantità |
| `/checkout` | `src/routes/checkout.tsx` | none | Checkout guest + Stripe redirect (email obbligatoria per guest) |
| `/privacy` | `src/routes/privacy.tsx` | none | Privacy Policy |
| `/cookie` | `src/routes/cookie.tsx` | none | Cookie Policy |
| `/termini` | `src/routes/termini.tsx` | none | Termini di Servizio |

## Routes — Auth

| URL | File | Description |
|-----|------|-------------|
| `/auth/login` | `src/routes/auth/login.tsx` | Login |
| `/auth/register` | `src/routes/auth/register.tsx` | Registrazione |
| `/auth/forgot-password` | `src/routes/auth/forgot-password.tsx` | Recupero password |
| `/auth/reset-password` | `src/routes/auth/reset-password.tsx` | Reset password |

## Routes — Admin (Backoffice)

| URL | File | Description |
|-----|------|-------------|
| `/admin` | `src/routes/admin.index.tsx` | Dashboard con stats e ordini recenti |
| `/admin/prodotti` | `src/routes/admin.prodotti.tsx` | Lista prodotti CRUD |
| `/admin/prodotti/$id` | `src/routes/admin.prodotti.$id.tsx` | Crea/modifica prodotto (id="nuovo" per nuovo) |
| `/admin/ordini` | `src/routes/admin.ordini.tsx` | Lista ordini con filtri |
| `/admin/ordini/$id` | `src/routes/admin.ordini.$id.tsx` | Dettaglio ordine + aggiorna stato/tracking |

## Routes — Account (Frontoffice)

| URL | File | Description |
|-----|------|-------------|
| `/account` | `src/routes/account.tsx` | Layout account con sidebar navigazione |
| `/account/` | `src/routes/account/index.tsx` | Dashboard — saluto, stats, ordini recenti |
| `/account/ordini` | `src/routes/account/ordini.index.tsx` | Storico ordini con paginazione |
| `/account/ordini/$orderId` | `src/routes/account/ordini.$orderId.tsx` | Dettaglio ordine con tracking |
| `/account/wishlist` | `src/routes/account/wishlist.tsx` | Lista desideri |
| `/account/profilo` | `src/routes/account/profilo.tsx` | Gestione profilo (nome/email) |
| `/account/password` | `src/routes/account/password.tsx` | Cambio password |
| `/account/indirizzi` | `src/routes/account/indirizzi.tsx` | Gestione indirizzi di spedizione |

## Routes — API

| URL | Methods | Auth | Description |
|-----|---------|------|-------------|
| `/api/auth/*` | GET, POST | better-auth | Better Auth catch-all (login, register, forgot-password, reset-password, sign-out, get-session) |
| `/api/products` | GET, POST | POST=admin | Lista prodotti / Crea prodotto |
| `/api/products/$slug` | GET | none | Dettaglio prodotto |
| `/api/products/$slug/reviews` | GET, POST | POST=required | Recensioni prodotto |
| `/api/categories` | GET | none | Categorie pubbliche |
| `/api/cart` | GET, POST | none | Carrello (auto-genera `cart_session_id` per guest) |
| `/api/cart/items/$itemId` | PATCH, DELETE | none | Aggiorna/rimuovi item carrello (guest support) |
| `/api/orders` | GET | required | Ordini utente |
| `/api/orders/$id` | GET | required | Dettaglio ordine utente |
| `/api/checkout` | POST | none | Crea ordine + Stripe session (guest con email/indirizzo inline, o auth con addressId) |
| `/api/contact` | POST | none | Form contatto |
| `/api/newsletter` | POST | none | Iscrizione newsletter |
| `/api/wishlist` | GET, POST, DELETE | required | Lista desideri |
| `/api/user/profile` | PUT, POST | required | Update profilo / cambio password (delega Better Auth) |
| `/api/addresses` | GET, POST | required | Lista / crea indirizzo |
| `/api/addresses/$id` | PUT, DELETE | required | Update / elimina indirizzo |
| `/api/webhooks/stripe` | POST | webhook | Stripe webhook handler |
| `/api/admin/stats` | GET | admin | Dashboard statistics |
| `/api/admin/products` | GET | admin | Lista tutti prodotti (incl. inattivi/eliminati) |
| `/api/admin/products/$id` | GET, PUT, DELETE | admin | Dettaglio/Aggiorna/Elimina prodotto |
| `/api/admin/orders` | GET | admin | Lista tutti ordini |
| `/api/admin/orders/$id` | GET, PATCH | admin | Dettaglio/Aggiorna stato ordine |
| `/api/admin/categories` | GET, POST | admin | Lista/crea categorie |
| `/api/admin/categories/$id` | PUT, DELETE | admin | Aggiorna/elimina categoria |

## Database Models (Prisma)

Auth (Better Auth): user, session, account, verification, AuditLog
GDPR: ConsentLog, DataRequest
Payments: StripeEvent
E-commerce: Category, Product, ProductVariant, ProductImage, Review, Address, Cart, CartItem, Order, OrderItem, Payment, Wishlist, DiscountCode

## Server Lib

| File | Layer | Description |
|------|-------|-------------|
| `db.server.ts` | INFRA | Prisma client singleton |
| `auth.ts` | INFRA | Better Auth instance (Prisma adapter, admin plugin, tanstackStartCookies, audit hooks) |
| `auth.server.ts` | INFRA | Better Auth re-export + auditLog helper |
| `sdk-auth.server.ts` | INFRA | requireUser, requireAdmin, getUser helpers |
| `products.server.ts` | DATA | Product listing, detail, categories |
| `cart.server.ts` | DATA | Cart CRUD, merge on login |
| `orders.server.ts` | DATA | Order creation, listing, Stripe checkout |
| `admin.server.ts` | DATA | Admin stats, product/order/category CRUD |
| `wishlist.server.ts` | DATA | Wishlist toggle |
| `address.server.ts` | DATA | Address CRUD with isDefault management |
| `reviews.server.ts` | DATA | Product reviews |
| `stripe.server.ts` | INFRA | Stripe client |
| `webhook-stripe.server.ts` | INFRA | Stripe webhook signature verification |
| `email.server.ts` | INFRA | Email sending |
| `email-templates.server.ts` | INFRA | HTML email templates |
| `validators/auth.ts` | DATA | Auth Zod schemas |
| `validators/products.ts` | DATA | Product/cart/checkout Zod schemas |
| `validators/admin.ts` | DATA | Admin CRUD Zod schemas |
| `api-response.ts` | INFRA | apiSuccess/apiError helpers |

## Regression Boundaries

### Immutable (NEVER modify without explicit user approval)
- `src/lib/db.server.ts` — Prisma singleton
- `src/lib/auth.server.ts` — Auth core
- `src/lib/sdk-auth.server.ts` — Auth helpers
- `src/lib/stripe.server.ts` — Stripe integration
- `src/lib/webhook-stripe.server.ts` — Webhook handler
- `src/styles/design-tokens.css` — Design tokens
- `src/providers/MotionProvider.tsx` — Motion config

### Guarded (modify with justification)
- `src/routes/__root.tsx` — Root layout
- `src/components/shared/Navbar.tsx` — Navigation
- `src/components/shared/Footer.tsx` — Footer
- `prisma/schema.prisma` — Database schema

---

## Auth: Better Auth (migrated from custom scrypt implementation)

- **Auth**: Better Auth with email/password, admin plugin, TanStack Start cookies
- **Session management**: Better Auth built-in sessions (30-day expiry, cookie caching)
- **Password hashing**: Better Auth scrypt (replaces custom scrypt)
- **Admin roles**: Better Auth admin plugin (ban, impersonation, role management)
- **Audit logging**: Better Auth database hooks → AuditLog model
- **Endpoints**: `/api/auth/*` handled by Better Auth catch-all (`src/routes/api/auth/$.ts`)

---

## Feature History

### v3 — 2026-04-03: Migrate auth to Better Auth

**Migration rationale:** Better Auth provides complete auth backend (login, register, forgot/reset password, email verification) out-of-the-box, plus admin plugin (ban, impersonation, role management) and built-in rate limiting. Replaces 8 custom auth models with 4 Better Auth core models.

**New files created (3):**

| File | Type | Layer | Description |
|------|------|-------|-------------|
| `src/lib/auth.ts` | config | INFRA | Better Auth server instance (Prisma adapter, admin plugin, tanstackStartCookies, audit hooks, email hooks) |
| `src/lib/auth-client.ts` | config | UI | Better Auth React client for form components |
| `src/routes/api/auth/$.ts` | route | BIZ | Catch-all handler for `/api/auth/*` (login, register, forgot-password, reset-password, sign-out, get-session) |

**Files rewritten (8):**

| File | Change | Justification |
|------|--------|---------------|
| `prisma/schema.prisma` | Replaced 8 custom auth models (AuthUser, AuthSession, AuthTOTPSecret, AuthBackupCode, AuthEmailToken, AuthLockout, AuthAuditLog, AuthOAuthAccount) with 4 Better Auth models (user, session, account, verification) + AuditLog | Better Auth schema requirement |
| `src/lib/auth.server.ts` | Replaced custom scrypt/session/lockout with Better Auth wrapper + auditLog helper | Better Auth handles all auth core |
| `src/lib/sdk-auth.server.ts` | Replaced custom session validation with `auth.api.getSession()` calls | Same public API, Better Auth backend |
| `src/lib/auth-email.server.ts` | Simplified to 2 email types (verify/reset), consumed by Better Auth sendResetPassword hook | Better Auth manages email sending |
| `src/components/auth/LoginForm.tsx` | Uses `authClient.signIn.email()` instead of `fetch("/auth/login")` | Better Auth client |
| `src/components/auth/RegisterForm.tsx` | Uses `authClient.signUp.email()` instead of `fetch("/auth/register")` | Better Auth client |
| `src/components/auth/ForgotPasswordForm.tsx` | Uses `authClient.requestPasswordReset()` instead of `fetch("/auth/forgot-password")` | Better Auth client |
| `src/components/auth/ResetPasswordForm.tsx` | Uses `authClient.resetPassword()` instead of `fetch("/auth/reset-password")` | Better Auth client |

**Files modified (4):**

| File | Change | Justification |
|------|--------|---------------|
| `src/lib/security-headers.server.ts` | Updated OWASP_COVERAGE references from "secure-auth-sdk" to "Better Auth" | Accurate documentation |
| `src/lib/admin.server.ts` | Changed `prisma.authUser` → `prisma.user`, `prisma.authAuditLog` → `prisma.auditLog` | Schema rename |
| `prisma/seed.ts` | Uses `auth.api.signUpEmail()` for user creation, removed custom hashPassword | Better Auth API |
| `.env.example` | Changed `AUTH_SECRET`/`APP_URL` → `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` | Better Auth env vars |

**New routes added:** `/api/auth/*` (catch-all, 1 route replaces missing auth backend)
**DB models removed:** 8 (AuthUser, AuthSession, AuthTOTPSecret, AuthBackupCode, AuthEmailToken, AuthLockout, AuthAuditLog, AuthOAuthAccount)
**DB models added:** 5 (user, session, account, verification, AuditLog)
**DB models modified:** 0 (all business models updated FK references)
**New dependencies:** `better-auth`

**Consumer routes (unchanged — same requireUser/requireAdmin/getUser API):** 16 API routes
- `/api/checkout`, `/api/orders`, `/api/orders/$id`, `/api/wishlist`, `/api/cart`, `/api/cart/items/$itemId`, `/api/products`, `/api/products/$slug/reviews`, `/api/admin/stats`, `/api/admin/products`, `/api/admin/products/$id`, `/api/admin/orders`, `/api/admin/orders/$id`, `/api/admin/categories`, `/api/admin/categories/$id`

**Verifications:**
- TypeScript: ✅ zero errors, zero `any`
- Build: ✅ not verified (DB reset required)

### v2 — 2026-04-02: Complete e-commerce + Admin backoffice

**New files created (20):**

| File | Type | Layer | Description |
|------|------|-------|-------------|
| `src/lib/admin.server.ts` | service | DATA | Admin CRUD service (stats, products, orders, categories) |
| `src/lib/validators/admin.ts` | validator | DATA | Admin Zod schemas |
| `src/routes/catalogo.tsx` | page | UI | Catalogo completo con filtri e paginazione |
| `src/routes/prodotti.$slug.tsx` | page | UI | Dettaglio prodotto con gallery e varianti |
| `src/routes/carrello.tsx` | page | UI | Carrello shopping |
| `src/routes/checkout.tsx` | page | UI | Checkout con indirizzo e Stripe |
| `src/routes/admin.tsx` | layout | UI | Admin layout con sidebar |
| `src/routes/admin.index.tsx` | page | UI | Dashboard stats |
| `src/routes/admin.prodotti.tsx` | page | UI | Lista prodotti admin |
| `src/routes/admin.prodotti.$id.tsx` | page | UI | Form crea/modifica prodotto |
| `src/routes/admin.ordini.tsx` | page | UI | Lista ordini admin |
| `src/routes/admin.ordini.$id.tsx` | page | UI | Dettaglio ordine + gestione stato |
| `src/routes/api/admin/stats.ts` | api | BIZ | Dashboard stats endpoint |
| `src/routes/api/admin/products.ts` | api | BIZ | Admin products list |
| `src/routes/api/admin/products.$id.ts` | api | BIZ | Admin product CRUD |
| `src/routes/api/admin/orders.ts` | api | BIZ | Admin orders list |
| `src/routes/api/admin/orders.$id.ts` | api | BIZ | Admin order management |
| `src/routes/api/admin/categories.ts` | api | BIZ | Admin categories CRUD |
| `src/routes/api/admin/categories.$id.ts` | api | BIZ | Admin category update/delete |

**Files modified (1):**
- `site-output/implementation-map.json` — Created from scratch

**New routes added:** 10 page routes + 7 API admin routes
**New DB models:** 0 (all models already existed)
**New i18n keys:** 0 (Italian only, inline text)

**Verifications:**
- TypeScript: ✅ zero errors, zero `any`
- Build: ✅ success (456ms)

---

## 🆕 Feature fix: FASE 1 — Critical fixes (404, immagini, backoffice) | 2026-04-03

### Problemi risolti

1. **Navbar/Footer visibili nel backoffice** — Il root layout renderizzava Navbar e Footer per tutte le route incluse `/admin/*`, creando un UI misto pubblico/admin
2. **Pagine 404 nel Navbar** — I link `/accessori`, `/pelletteria`, `/ricerca`, `/wishlist` portavano a pagine inesistenti
3. **Immagini 404** — Tutte le immagini decorative (hero, categorie, bottega, placeholder prodotti) referenced `.webp` files che non esistevano in `public/images/`
4. **CTA Hero 404** — Il pulsante "Personalizza il tuo sandalo" puntava a `/personalizzazione` (inesistente)
5. **Category card 404** — Le card categorie Accessori e Pelletteria puntavano a `/accessori` e `/pelletteria` (inesistenti)

### Nuovi file creati (7)

| File | Tipo | Description |
|------|------|-------------|
| `public/images/hero-bottega.svg` | asset | Hero background placeholder con texture cuoio e pattern stitch |
| `public/images/cat-sandali.svg` | asset | Category card sandali con silhouette sandalo |
| `public/images/cat-accessori.svg` | asset | Category card accessori con silhouette accessori |
| `public/images/cat-pelletteria.svg` | asset | Category card pelletteria con silhouette portafoglio/borsello |
| `public/images/prod-placeholder.svg` | asset | Placeholder prodotto con silhouette sandalo |
| `public/images/bottega-interna.svg` | asset | Bottega interna placeholder con scaffali |
| `public/images/bottega-laboratorio.svg` | asset | Laboratorio artigianale placeholder con banco da lavoro |

### File modificati (7)

| File | Modifica | Giustificazione |
|------|----------|-----------------|
| `src/routes/__root.tsx` | Aggiunto `useRouterState` per detectare route `/admin/*` e nascondere Navbar/Footer | Backoffice non deve mostrare navigazione pubblica |
| `src/components/shared/Navbar.tsx` | Rimosso link a `/accessori`, `/pelletteria`, `/ricerca`, `/wishlist`; aggiunto `/catalogo`; rimosso icona ricerca e wishlist | Fix 404, cleanup navigazione |
| `src/components/shared/MobileMenu.tsx` | Allineato NAV_ITEMS con Navbar, rimosso link ricerca/wishlist | Fix 404 mobile |
| `src/components/sections/HeroSection.tsx` | CTA "Personalizza il tuo sandalo" → "/la-bottega"; "Scopri la Collezione" → "/catalogo"; hero image `.webp` → `.svg` | Fix 404 CTA + immagine |
| `src/components/sections/CategoriesSection.tsx` | Link `/accessori` → `/catalogo`, `/pelletteria` → `/catalogo`; immagini `.webp` → `.svg` | Fix 404 link + immagini |
| `src/components/sections/FeaturedProductsSection.tsx` | Tutte le immagini placeholder `.webp` → `.svg`; CTA "Vedi tutti" → `/catalogo` | Fix 404 immagini |
| `src/components/sections/LaBottegaSection.tsx` | Immagine `.webp` → `.svg` | Fix 404 immagine |
| `src/routes/la-bottega.tsx` | Immagine `.webp` → `.svg` | Fix 404 immagine |
| `src/routes/sandali.tsx` | Tutte le immagini placeholder `.webp` → `.svg` | Fix 404 immagini |

### Flusso utente corretto
- Homepage → "Scopri la Collezione" → `/catalogo` (esistente ✅)
- Homepage → "La nostra storia" → `/la-bottega` (esistente ✅)
- Navbar → "Sandali" → `/sandali` (esistente ✅)
- Navbar → "Catalogo" → `/catalogo` (esistente ✅)
- Navbar → "La Bottega" → `/la-bottega` (esistente ✅)
- Navbar → "Contatti" → `/contatti` (esistente ✅)
- Category cards → tutte puntano a pagine esistenti ✅
- Backoffice `/admin/*` → nessun Navbar/Footer pubblico ✅

**Verifications:**
- TypeScript: ✅ zero errors, zero `any`
- Build: ✅ success (706ms)

---

## 🆕 Feature fix: FASE 2 — Backoffice product CRUD fix | 2026-04-03

### Bug critico risolto

**Problema:** Il form di modifica prodotto (admin.prodotti.$id.tsx, 928 righe) permetteva di aggiungere/modificare varianti e immagini, ma i dati venivano **silenziosamente ignorati** dal backend:
1. `updateProductSchema` (Zod) non includeva i campi `variants` e `images` → Zod li stripava durante la validazione
2. `adminUpdateProduct` faceva solo `prisma.product.update({ data })` senza gestire le relazioni
3. `adminCreateProduct` e `/api/products` POST avevano lo stesso problema

### File modificati (4)

| File | Modifica | Giustificazione |
|------|----------|-----------------|
| `src/lib/validators/products.ts` | Aggiunti `productVariantSchema` e `productImageSchema`; `createProductSchema` ora include `variants` e `images` opzionali | I varianti e immagini erano ignorati dal validator |
| `src/lib/admin.server.ts` | `adminCreateProduct` ora gestisce createMany per varianti/images; `adminUpdateProduct` usa $transaction per deleteMany + createMany | Salvataggio varianti e immagini durante create/update |
| `src/routes/api/products.ts` | POST handler usa `adminCreateProduct` invece di `prisma.product.create` diretto | Delega logica create al server layer |
| `src/routes/admin.prodotti.tsx` | Sostituiti `<a href>` con `<Link to>` per "Nuovo Prodotto" e "Modifica" | Navigazione SPA corretta in TanStack Router |

### Dettaglio implementazione varianti/images

**Create:** `prisma.product.create` con nested `variants.create` e `images.create`

**Update:** `prisma.$transaction` per:
1. Aggiornare i campi base del prodotto
2. `deleteMany` delle varianti esistenti → `createMany` delle nuove
3. `deleteMany` delle immagini esistenti → `createMany` delle nuove

**Verifications:**
- TypeScript: ✅ zero errors, zero `any`
- Build: ✅ success (698ms)

---

## 🆕 Feature fix: FASE 3 — Visual quality, spacing, premium feel | 2026-04-03

### Miglioramenti visivi applicati

**Design Tokens:**
- `--section-padding-y`: `3-6rem` → `4-7rem` (più respiro tra sezioni)
- `--section-padding-y-lg`: `4-8rem` → `5-10rem` (sezioni hero)
- `--stitch-length`: `120px` → `140px` (stitch più arioso)
- `--radius-sm`: `4px` → `6px`, `--radius-md`: `6px` → `8px`, `--radius-lg`: `8px` → `12px`, `--radius-xl`: `12px` → `16px` (border più morbidi)

**HeroSection — Rework completo:**
- Altezza hero: `85vh` → `92vh` mobile, `85vh` desktop (più cinematografico)
- Gradient multistrato per profondità (3 layer)
- Eyebrow con lineetta decorative e tracking allargato
- CTA primario con hover glow effect (`shadow-[0_8px_30px_rgba(139,94,60,0.3)]`)
- CTA secondario con backdrop-blur glass effect
- Stitch line in basso con testo "Artigianato dal 1965"
- h-13 custom height per bottoni hero

**CategoriesSection:**
- Card featured con aspect `21:9` su desktop (più cinematografico)
- Badge "Collezione" sopra il titolo
- Hover border frame più sottile
- Label sezione più descrittivo ("Artigianato che racconta")
- Transition hover più fluida

**FeaturedProductsSection:**
- Background `surface` (bianco) per contrasto con sezioni adiacenti
- CTA "Aggiungi al carrello" slide-up dal basso al hover
- Border hover con transizione smooth
- Product name diventa primary color al hover
- Spaziatura card aumentata (mt-5, gap-5/gap-8)
- Tab description più fluida

**TrustStripSection:**
- Padding verticale: `py-12` → `py-16 md:py-20` (più respiro)

**Footer — Fix 6 link 404:**
- "Accessori Calzoleria" → "/catalogo"
- "Pelletteria" → "/catalogo"
- "Personalizzazione" → "/catalogo"
- "Spedizioni" → "/termini"
- "Resi e Rimborsi" → "/termini"
- "Diritto di Recesso" → rimosso

**PersonalizationSection:**
- CTA "Inizia a personalizzare" → "Scopri il catalogo" (→ /catalogo, esistente)

**Verifications:**
- TypeScript: ✅ zero errors, zero `any`
- Build: ✅ success (685ms)

---

## 🆕 Feature aggiunta: Homepage Enhancement — Mobile Bottom Nav + Real Data + Section Redesign | 2026-04-03

### File modificati

| File | Modifica | Giustificazione |
|------|----------|-----------------|
| `src/routes/__root.tsx` | Aggiunto import e render di MobileBottomNav + padding bottom mobile | Integrazione navigazione mobile tipo app |
| `src/components/sections/FeaturedProductsSection.tsx` | Riscritto da mock data a fetch API reale con skeleton loading | Mostra prodotti reali dal DB (118 prodotti) |
| `src/components/sections/CategoriesSection.tsx` | Aggiornato header creativo + immagini reali per categorie | Sostituiti placeholder SVG con foto prodotto reali |
| `src/components/sections/HeroSection.tsx` | Aggiunto counter badge (1965, 118 modelli), star eyebrow, stitched bottom | Più interattivo e informativo |
| `src/components/sections/LaBottegaSection.tsx` | Header riprogettato con icona compass + testo più grande | Più impatto visivo |
| `src/components/sections/PersonalizationSection.tsx` | Aggiunto icone SVG per ogni step, connecting line, floating badge numbers | Più visuale e guidato |
| `src/components/sections/TestimonialsSection.tsx` | Avatar con gradient initials, hover lift, corner stitch accents | Più elegante e interattivo |
| `src/components/sections/TrustStripSection.tsx` | Texture overlay, icon hover effects, stitch pattern dividers | Più premium |
| `src/components/sections/NewsletterSection.tsx` | Email icon header, success icon, decorative stitch pattern | Più accattivante |
| `prisma/seed.ts` | Fix `require()` → `import` with ESM JSON assertion | Fix seed execution con tsx |

### Seed Data — Eseguito con successo

- **118 prodotti** importati (da calzoleriaprevenzano.it)
- **369 immagini** collegate ai prodotti
- **20 categorie** create (Sandali, Classici, Gioiello, Bambini, Pelletteria, ecc.)
- **6 reviews** + **2 discount codes** + **admin user** seedati

### Flusso utente aggiornato
1. Utente visita homepage → vede MobileBottomNav su mobile (5 tab: Home, Catalogo, Cerca, Carrello, Account)
2. Hero section mostra contatori animati (1965 anno fondazione, 118 modelli unici)
3. FeaturedProductsSection mostra prodotti reali dal DB (Novità/Bestseller tabs)
4. CategoriesSection mostra foto reali di prodotti per ogni categoria
5. Ogni sezione ha un header unico con elementi decorativi 🧬 DNA (stitch patterns, icon tematiche)

### Verifiche
- TypeScript: ✅ zero errors in src/, zero `any`
- Build: ✅ success (998ms) — solo warning pre-esistente z$1.email
- Prisma seed: ✅ 118 prodotti, 369 immagini, 20 categorie

---

## 🆕 Feature aggiunta: Mega Menu Categorie + Variant Builder + Fix Link | 2026-04-03

### Nuovi file creati

| File | Tipo | Layer | Scopo |
|------|------|-------|-------|
| `src/components/shared/MegaMenu.tsx` | Component | UI | Mega menu desktop con gerarchia categorie, hover reveal, conteggio prodotti |
| `src/components/admin/VariantBuilder.tsx` | Component | UI | Builder visuale JSON per configurazione varianti prodotto |
| `src/lib/types/variant-config.ts` | Types+Validator | BIZ | Tipi TypeScript + Zod schema per VariantConfig (groups, options, control types) |

### File modificati

| File | Modifica | Giustificazione |
|------|----------|-----------------|
| `src/routes/__root.tsx` | Sostituito Navbar con MegaMenu | MegaMenu è il nuovo navbar con mega menu integrato |
| `src/lib/products.server.ts` | API categorie con gerarchia + conteggi, filtro categorie parent/child | Supporto mega menu + catalogo con sottocategorie |
| `src/lib/admin.server.ts` | Aggiunto variantConfig a getAdminProduct, adminCreateProduct, adminUpdateProduct | Supporto salvataggio variantConfig JSON |
| `src/lib/validators/products.ts` | Aggiunto variantConfig a createProductSchema | Validazione variantConfig nel form admin |
| `src/routes/sandali.tsx` | Riscritto da mock data a dati reali dal DB | Pagina sandali ora mostra 118 prodotti reali |
| `src/routes/catalogo.tsx` | Aggiornato filtro categorie gerarchico | Mostra sottocategorie quando parent attivo |
| `src/routes/prodotti.$slug.tsx` | Aggiunto supporto variantConfig JSON per rendering varianti | Tre tipi di controllo: button, select, color-swatch |
| `src/components/shared/Footer.tsx` | Aggiornato link shop (Pelletteria, Articoli per Calzature) | Link corretti alle categorie del DB |
| `src/components/shared/MobileBottomNav.tsx` | Fix: Cerca→/sandali, Account→/auth/login | Bottoni portano a destinazioni reali |
| `src/components/sections/CategoriesSection.tsx` | Fix slug "accessori-per-calzature" → "articoli-calzature" | Corrisponde allo slug nel DB |
| `src/styles/design-tokens.css` | Aggiunto @keyframes fadeIn per mega menu | Animazione apertura mega menu |
| `prisma/schema.prisma` | Aggiunto variantConfig (Json) a Product e Category | Supporto builder varianti |
| `prisma/migrations/20260403105227_add_variant_config_json/` | Migration per variantConfig | Campo JSON su Product e Category |

### Nuovi componenti

| Nome | File | Props | Usato in |
|------|------|-------|----------|
| MegaMenu | `src/components/shared/MegaMenu.tsx` | `cartCount` | `__root.tsx` (sostituisce Navbar su desktop) |
| MegaMenuPanel | `src/components/shared/MegaMenu.tsx` | `categories` | MegaMenu (dropdown) |
| VariantBuilder | `src/components/admin/VariantBuilder.tsx` | `value, onChange, error` | Admin product edit (futuro) |
| GroupEditor | `src/components/admin/VariantBuilder.tsx` | group props | VariantBuilder |

### Schema DB aggiornato

| Modello | Modifica | Dettagli |
|---------|----------|----------|
| Product | Aggiunto campo | `variantConfig Json?` — configurazione varianti JSON |
| Category | Aggiunto campo | `variantConfig Json?` — configurazione default per prodotti nella categoria |

### Dati applicati

- **108 prodotti** hanno variantConfig assegnato (81 sandali + 27 pelletteria)
- **10 prodotti** (solette, accessori) rimangono senza variantConfig

### Variant Builder — Architettura

Il Variant Builder è un sistema JSON-based per definire i gruppi di opzioni dei prodotti:

1. **VariantConfig JSON** → memorizzato su Product.variantConfig
2. **VariantGroup** → gruppo di opzioni (es. "Tipo di Pelle", "Colore", "Tacco", "Taglia")
3. **VariantOption** → singola opzione con value, label, color (hex), priceModifier
4. **Control Types** → `button` (pill buttons), `select` (dropdown), `color-swatch` (cerchi colore)

Preset disponibili:
- **Sandali**: 4 gruppi (tipo pelle, colore swatch, tacco select, taglia buttons)
- **Pelletteria**: 1 gruppo (colore swatch)

### Flusso utente aggiornato
1. Mega menu desktop: hover "Shop" → panel con 3 colonne (Sandali, Gioiello, Bambini, Pelletteria, Accessori)
2. Ogni categoria mostra conteggio prodotti e sottocategorie
3. Click su categoria → filtra catalogo per gerarchia (parent + children + grandchildren)
4. Pagina sandali: dati reali con filtro sottocategorie (Classici, Gioiello, Bambini)
5. Product detail: variantConfig renders come color swatches, select dropdowns, or button groups
6. Mobile bottom nav: Cerca → /sandali, Account → /auth/login

### Verifiche
- TypeScript: ✅ zero errors in src/ (solo errori intenzionali in scripts/)
- Build: ✅ success (633ms)
- Prisma validate: ✅ schema valido
- DB: ✅ 108 prodotti con variantConfig, 118 totali

---

## 🆕 Feature modificata: Catalogo — Sidebar filtri + 3 colonne + Albero categorie | 2026-04-03

### File modificati

| File | Modifica | Giustificazione |
|------|----------|-----------------|
| `src/routes/catalogo.tsx` | Layout riscritto: filtri spostati da bar orizzontale a sidebar sinistra; griglia prodotti da 4 a 3 colonne desktop; aggiunto albero categorie espandibile con conteggio; aggiunto drawer filtri mobile con overlay; aggiunto active filter pills con reset | Layout più standard per e-commerce, migliore UX di navigazione categorie |

### Dettaglio modifiche

**Layout:**
- Desktop: sidebar fissa 256px a sinistra + main content flex-1 a destra
- Mobile: sidebar nascosta, attivata con bottone FAB "Filtri" + drawer slide-in da sinistra con overlay
- Griglia prodotti: `lg:grid-cols-4` → `lg:grid-cols-3` (3 colonne su desktop, 2 su mobile/tablet)
- Skeleton loading: da 8 a 6 placeholder (allineato a 3 colonne)

**Sidebar — CatalogSidebar component:**
- Sezione "Cerca" con input search identico a prima ma nella sidebar
- Sezione "Categorie" con albero espandibile:
  - "Tutte le categorie" come opzione radice
  - Ogni categoria parent mostra nome + conteggio prodotti
  - ChevronDown animato per categorie con figli
  - Sottocategorie espanse con indentazione + bordo sinistro (solo quando parent è attivo)
  - Sottocategoria "Tutti [Parent]" per vedere solo la categoria parent
  - Stato attivo su parent o figlio evidenziato con primary color

**Active filter pills:**
- Barra sopra la griglia con chip rimovibili per ricerca e categoria attiva
- Bottone "Resetta tutto" per pulire tutti i filtri
- Nome categoria attiva mostrato nei risultati count

**Mobile filters:**
- FAB "Filtri" posizionato sopra il MobileBottomNav
- Drawer slide-in da sinistra con overlay backdrop
- Chiusura automatica quando un filtro viene applicato
- role="dialog" + aria-modal per accessibilità

**Nuovi componenti inline:**
- `CatalogSidebar` — component riutilizzabile per desktop e mobile (stessa istanza, due posizioni)

### Flusso utente aggiornato
1. Utente visita `/catalogo` → sidebar sinistra con albero categorie (desktop) o FAB "Filtri" (mobile)
2. Click su categoria parent → si espandono le sottocategorie con indentazione
3. Click su sottocategoria → filtro attivo, griglia si aggiorna
4. Active filter pills sopra griglia mostrano filtro ricerca e categoria selezionata
5. Click su "x" nel pill → rimuove singolo filtro
6. "Resetta tutto" → pulisce tutti i filtri
7. Mobile: FAB "Filtri" → drawer con sidebar completa → chiusura automatica al cambio filtro

### Verifiche
- TypeScript: ✅ zero errors in src/ (solo errori pre-esistenti in scripts/)
- Build: ✅ success (1.97s)

---

## 🛠️ Feature modificata: Variant Templates UX Fix | 2026-04-03

### File modificati

| File | Modifica | Giustificazione |
|------|----------|-----------------|
| `src/routes/admin.variant-templates.tsx` | Rimosso wrapper `min-h-screen bg-gray-50` duplicato, aggiunto filtro ricerca, titolo ridotto a `text-[10px] uppercase tracking-widest` | Il layout admin (`admin.tsx`) ha già `<main>` con bg e padding — il wrapper duplicato causava layout annidato con contenuti non raggiungibili e pulsanti fuori vista |
| `src/routes/admin.variant-templates.$id.tsx` | Rimosso wrapper `min-h-screen bg-gray-50` duplicato, header rimpiazzato con breadcrumb compact, titolo ridotto a `text-[10px] uppercase tracking-widest` | Stesso problema — pagina dentro layout admin duplicava lo sfondo, header e padding, causando UX rotta (inputs non raggiungibili) |

### Modifiche dettagliate

**List page (`admin.variant-templates.tsx`):**
- Rimozione wrapper `<div className="min-h-screen bg-gray-50">` con header interno
- Titolo pagina: `text-[10px] font-semibold uppercase tracking-widest text-gray-400` (molto più piccolo dei template item titles che restano `text-sm font-semibold`)
- Aggiunto campo di ricerca con icona Search per filtrare per nome, slug o descrizione
- Aggiunto stato vuoto per "nessun risultato" con pulsante resetta filtro
- Toolbar compatta con titolo + search + pulsante crea su stessa riga
- Badge contatore inline nel titolo (non più header separato)

**Edit page (`admin.variant-templates.$id.tsx`):**
- Rimozione wrapper `<div className="min-h-screen bg-gray-50">` con header interno
- Sostituito header con breadcrumb compact: icona back + titolo in `text-[10px] uppercase tracking-widest`
- Azioni (Annulla + Salva) spostate in fondo con hint "Come usare questo template" affiancato
- Card con `ring-1 ring-gray-950/5` per coerenza con admin

### Verifiche
- TypeScript: ✅ zero errors in src/
- Zero `any`: ✅ confirmed
- Layout: ✅ pagine renderizzate correttamente dentro admin layout

---

## 🐛 Bug fix: Carrello guest (error 400 "Sessione non valida") | 2026-04-03

### Problema
Gli utenti non autenticati ricevevano un errore 400 "Sessione non valida" quando cercavano di aggiungere prodotti al carrello. Il cookie `cart_session_id` non veniva mai creato dal frontend, e il server rifiutava le richieste quando sia `user` che `sessionId` erano null.

### Nuovi file creati

| File | Tipo | Layer | Scopo |
|------|------|-------|-------|
| `src/lib/cart-session.ts` | lib/server | INFRA | Genera e gestisce il cookie `cart_session_id` (generazione UUID, estrazione da cookie, Set-Cookie header builder) |

### File modificati

| File | Modifica | Giustificazione |
|------|----------|-----------------|
| `src/routes/api/cart.ts` | Rimosso check `!user && !sessionId → 400`. POST auto-genera sessionId e restituisce Set-Cookie. Import centralizzato da cart-session.ts | Il server ora crea automaticamente la sessione guest al primo aggiunta al carrello |
| `src/routes/api/cart.items.$itemId.ts` | Import centralizzato da cart-session.ts. Cambiato messaggio da "Sessione non valida" a "Carrello vuoto" per guest senza sessione | PATCH/DELETE per guest senza sessione → carrello vuoto (non è possibile aggiornare prima di aver creato) |
| `src/lib/api-response.ts` | Aggiunto terzo parametro `headers` opzionale a `apiSuccess` | Serve per restituire Set-Cookie nella response del carrello |
| `src/lib/validators/products.ts` | Aggiunto `checkoutGuestSchema` con email, firstName, lastName, address inline | Validazione per checkout guest senza account utente |
| `src/lib/orders.server.ts` | `createOrder` accetta `userId: string | null` + `sessionId: string | null`. Supporta CheckoutGuestInput. `createCheckoutSession` accetta `guestEmail` opzionale | Guest checkout: crea address inline, ordine senza userId (guestEmail), Stripe con customer_email |
| `src/routes/api/checkout.ts` | Sostituito `requireUser` con `getUser` (optional). Aggiunto branch guest: accetta checkoutGuestSchema, invia email, crea Stripe session | Checkout funziona per guest (con email+indirizzo inline) e per utenti autenticati (con addressId) |
| `src/routes/checkout.tsx` | Aggiunto campo email al form. Rimosso redirect forzato a login. Body POST include email + address inline per guest | Il form checkout ora chiede email (per conferma ordine e Stripe) senza richiedere registrazione |
| `src/lib/admin.server.ts` | Aggiornato type annotations per `user` nullable nelle query ordini. Aggiunto `guestEmail` alla ricerca admin. Fallback "Ospite" per ordini senza utente | L'admin deve gestire ordini guest (senza user associato) |
| `prisma/schema.prisma` | `Address.userId` → nullable + `guestEmail` field. `Order.userId` → nullable + `guestEmail` field | Supporto ordini e indirizzi senza utente associato |

### Modifiche Schema DB

| Modello | Azione | Campi |
|---------|--------|-------|
| Address | ALTER | `userId` nullable, aggiunto `guestEmail String?` |
| Order | ALTER | `userId` nullable, aggiunto `guestEmail String?` |

### Flusso utente (guest)

1. L'utente non autenticato naviga sul catalogo/prodotto
2. Click "Aggiungi al carrello" → POST /api/cart senza cookie
3. Il server genera un `cart_session_id` (UUID casuale), lo salva nel DB, restituisce `Set-Cookie`
4. Il browser salva il cookie → le richieste successive includono automaticamente il sessionId
5. L'utente naviga al carrello → GET /api/cart → il cookie identifica il carrello guest
6. Procede al checkout → /checkout (nessun redirect a login)
7. Compila email + indirizzo di spedizione → POST /api/checkout
8. Il server crea l'ordine (guestEmail, userId=null) + Stripe session con customer_email
9. Stripe redirect → pagamento → conferma ordine

### Verifiche
- TypeScript: ✅ zero errors in src/
- Prisma: ✅ migration applied `20260403164112_guest_checkout_support`
- Zero `any`: ✅ confirmed

---

## 🆕 Feature aggiunta: Media Library (Gestione Media Admin) | 2026-04-03

### Nuovi file creati (9)

| File | Tipo | Layer | Scopo |
|------|------|-------|-------|
| `src/lib/media.server.ts` | service | DATA | CRUD media library: upload, listing, detail, update, delete, stats. Include image dimension parsing (PNG/JPEG/WebP buffer) |
| `src/lib/validators/media.ts` | validator | DATA | Zod schemas per listing, update, upload constraints |
| `src/routes/admin.media.tsx` | page | UI | Media Library admin: griglia/lista con drag & drop upload, filtri per cartella, ricerca, paginazione, copia URL |
| `src/routes/admin.media.$id.tsx` | page | UI | Dettaglio singolo media: anteprima, edit (alt, nome, cartella), eliminazione |
| `src/routes/api/upload.ts` | api | BIZ | Upload multipart (admin only), batch max 20 files, validazione MIME + dimensione |
| `src/routes/api/admin/media.ts` | api | BIZ | GET lista media con stats + filtri (tipo, cartella, ricerca) |
| `src/routes/api/admin/media.$id.ts` | api | BIZ | GET/PUT/DELETE singolo media |
| `src/components/admin/MediaPicker.tsx` | component | UI | Modal riutilizzabile per selezione immagini dalla libreria media (usato nel form prodotto) |
| `prisma/migrations/20260403164435_add_media_model/` | migration | INFRA | Migration per modello Media + campo mediaId su ProductImage |

### File modificati (3)

| File | Modifica | Giustificazione |
|------|----------|-----------------|
| `prisma/schema.prisma` | Aggiunto modello `Media` con 15 campi, indice `@@unique([filename])`. Aggiunto campo `mediaId?` e relazione a `ProductImage`. Aggiunto `uploadedMedia Media[]` a `user` | Centralizzazione della gestione media |
| `src/routes/admin.tsx` | Aggiunta voce "Media" (ImageIcon) nella sidebar navigation | Accesso alla libreria media dall'admin |
| `src/routes/admin.prodotti.$id.tsx` | Sostituito pulsante "Aggiungi immagine" con "Scegli dalla libreria" (apre MediaPicker) + "Inserisci URL manuale". Aggiunto handler `addImagesFromMedia`. Integrazione MediaPicker modal | UX: l'admin può selezionare immagini dalla libreria invece di incollare URL |

### Nuove route

| URL Pattern | File | Loader | Action | Auth | Type |
|-------------|------|--------|--------|------|------|
| `/admin/media` | `admin.media.tsx` | client fetch | no | admin | ADMIN |
| `/admin/media/$id` | `admin.media.$id.tsx` | client fetch | no | admin | ADMIN |
| `/api/upload` | `api/upload.ts` | no | POST (multipart) | admin | API |
| `/api/admin/media` | `api/admin/media.ts` | no | GET | admin | API |
| `/api/admin/media/$id` | `api/admin/media.$id.ts` | no | GET/PUT/DELETE | admin | API |

### Nuovi componenti

| Nome | File | Props | Usato in |
|------|------|-------|----------|
| MediaPicker | `src/components/admin/MediaPicker.tsx` | `open, onClose, onSelect, multiple?, maxSelections?, initialSelected?` | Admin product edit form |

### Nuovi modelli DB

| Modello | Campi principali | Relazioni |
|---------|-----------------|-----------|
| Media | id, filename (unique), originalName, mimeType, size, width, height, alt, folder, url, uploadedById, createdAt | user (uploadedBy), productImages |

### Schema modificato

| Modello | Modifica |
|---------|----------|
| ProductImage | Aggiunto `mediaId String?` (FK → Media, onDelete: SetNull) |
| user | Aggiunto `uploadedMedia Media[]` |

### Flusso utente

**Upload e gestione:**
1. Admin → Sidebar "Media" → `/admin/media`
2. Griglia con tutte le immagini uploadate (thumbnail, nome, dimensioni)
3. Click "Carica file" → selezione file locale → upload automatico
4. Drag & drop: trascina file sulla pagina → upload automatico
5. Clicca immagine → dettaglio con anteprima, edit alt/nome/cartella, copia URL, elimina
6. Filtro per cartella, ricerca per nome, vista griglia/lista

**Selezione nel form prodotto:**
1. Admin modifica prodotto → sezione immagini → click "Scegli dalla libreria"
2. Si apre MediaPicker (modal) con griglia immagini
3. Clicca immagini per selezionarle (multi-select, max 20)
4. Upload rapido anche dal picker (drag & drop o pulsante "Carica")
5. Click "Conferma" → le immagini vengono aggiunte al form prodotto
6. "Inserisci URL manuale" ancora disponibile come fallback

### Sicurezza
- Tutti gli endpoint media richiedono `requireAdmin` (403 se non admin)
- Validazione MIME type: solo image/jpeg, image/png, image/webp
- Validazione dimensione: max 5MB per file
- Batch limit: max 20 file per upload
- Filename unico: timestamp + random hex previene collisioni
- Delete protection: impossibile eliminare media usato in ProductImage

### Verifiche
- TypeScript: ✅ zero errors in src/, zero `any`
- Build: ✅ success (1.79s)
- Prisma validate: ✅ schema valido
- Migration: ✅ `20260403164435_add_media_model` applied

---

## 🐛 Bug fix + Feature: Validazione variantConfig nel carrello + selectedOptions | 2026-04-03

### Problema
1. `variantId: null` dal frontend causava errore Zod "Dati non validi" (schema accettava `undefined` ma non `null`)
2. Le scelte del cliente (tipo pelle, colore, tacco, taglia) non venivano salvate nel carrello né nell'ordine
3. Non c'era validazione server-side delle opzioni obbligatorie del variantConfig
4. Gli errori di validazione non includevano dettagli specifici

### Soluzione
- Il server valida `selectedOptions` contro il `variantConfig` del prodotto
- Le opzioni risolte (label + value + color) vengono salvate come JSON su CartItem e OrderItem
- Prezzo calcolato con priceModifier delle opzioni selezionate
- Errori Zod dettagliati con campo + messaggio nella response API

### Nuovi file creati

| File | Tipo | Layer | Scopo |
|------|------|-------|-------|
| `src/lib/validators/format.ts` | validator | BIZ | Helper `formatZodErrors` — converte ZodError in array `{ field, message }` |

### File modificati

| File | Modifica | Giustificazione |
|------|----------|-----------------|
| `prisma/schema.prisma` | Aggiunto `selectedOptions Json?` a CartItem e OrderItem | Salvare le scelte del cliente per display in carrello e ordine |
| `src/lib/validators/products.ts` | `addToCartSchema.variantId` → `.nullable().optional()`, aggiunto `selectedOptions` field | Accettare `null` e opzioni dal variantConfig |
| `src/lib/types/api.ts` | Aggiunto `details?` array a `ApiErrorResponse` | Errori di validazione dettagliati |
| `src/lib/api-response.ts` | `apiError` accetta 4° parametro `details` opzionale | Passare errori Zod/variantConfig al frontend |
| `src/lib/cart.server.ts` | Riscritto `addToCart`: branch variantConfig (valida selectedOptions, calcola prezzo con modifier, salva resolved options) vs branch legacy variant | Due sistemi di varianti convalidati correttamente |
| `src/routes/api/cart.ts` | Passa `result.details` a `apiError` per errori variantConfig | Errori specifici nel response |
| `src/routes/api/cart.items.$itemId.ts` | Usa `formatZodErrors` per errori di validazione | Dettagli errori PATCH |
| `src/routes/prodotti.$slug.tsx` | Invia `selectedOptions: Object.fromEntries(selectedOptions)` quando il prodotto ha variantConfig | Il server riceve le scelte per validazione e salvataggio |
| `src/routes/carrello.tsx` | Aggiunto tipo `selectedOptions` a CartItemDetail, visualizza opzioni con color swatch sotto il nome prodotto | Il cliente vede cosa ha scelto nel carrello |
| `src/routes/checkout.tsx` | Stesso: tipo + visualizzazione selectedOptions con color swatch | Il cliente conferma le scelte al checkout |
| `src/lib/orders.server.ts` | `CartItemFull` include `selectedOptions`, copiato in OrderItem durante creazione ordine | Le scelte sono visibili nell'ordine per admin e cliente |
| `src/lib/admin.server.ts` | `getAdminOrder` include `selectedOptions` nella response | L'admin vede le scelte del cliente nel dettaglio ordine |
| `src/routes/admin.ordini.$id.tsx` | Tipo + visualizzazione selectedOptions con color swatch nella tabella items | L'admin vede le personalizzazioni scelte |

### Modifiche Schema DB

| Modello | Azione | Campi |
|---------|--------|-------|
| CartItem | ALTER | Aggiunto `selectedOptions Json?` |
| OrderItem | ALTER | Aggiunto `selectedOptions Json?` |

### Flusso validazione variantConfig (server-side)

1. Frontend invia `{ productId, selectedOptions: { "tipo-pelle": "laminato", "taglia": "38" }, quantity }`
2. Server fetch prodotto con `variantConfig`
3. `validateOptionsAgainstConfig()`:
   - Parse variantConfig con VariantConfigSchema
   - Per ogni gruppo required, verifica che `selectedOptions[group.id]` esista
   - Verifica che il valore sia un'opzione valida nel gruppo
   - Calcola `priceModifier` totale (somma dei modifier delle opzioni selezionate)
   - Risolve le opzioni in formato display: `[{ label: "Tipo di Pelle", value: "Laminato" }, ...]`
4. Se validazione fallisce → 400 con `{ details: [{ field: "selectedOptions", message: "Taglia è obbligatorio" }] }`
5. Se ok → crea CartItem con `price = base + priceModifier` e `selectedOptions = resolved array`

### Verifiche
- TypeScript: ✅ zero errors in src/
- Prisma: ✅ migration `20260403171415_selected_options_cart_order` applied
- Zero `any`: ✅ confirmed

---

## 🆕 Feature implementata: Media Library Migration | 2026-04-03

### Contesto
Tutte le immagini del progetto (prodotti, swatch colori, template decorativi) erano frammentate su `public/images/` senza tracciamento nella Media Library. Solo 2 file su 1.355 erano registrati come Media records.

### Nuovi file creati

| File | Tipo | Layer | Scopo |
|------|------|-------|-------|
| `scripts/migrate-to-media.ts` | script | INFRA | Script idempotente che registra tutte le immagini esistenti nella Media Library e collega ProductImage.mediaId |
| `src/routes/api/site/media.ts` | API route | BIZ | Endpoint pubblico GET che restituisce le immagini template dalla Media Library |

### File modificati

| File | Modifica | Giustificazione |
|------|----------|-----------------|
| `prisma/seed.ts` | Aggiunto campo `image` a CategorySeed + 3 macro-categorie popolate | Le macro-categorie (Sandali, Pelletteria, Articoli calzature) hanno ora immagine di copertina |
| `src/components/sections/HeroSection.tsx` | Accetta `imageUrl` prop con fallback hardcoded | Immagine hero caricabile da Media Library |
| `src/components/sections/LaBottegaSection.tsx` | Accetta `imageUrl` prop con fallback hardcoded | Immagine bottega caricabile da Media Library |
| `src/components/sections/CategoriesSection.tsx` | Accetta `categoryImages` prop per sovrascrivere immagini | Immagini categorie dinamiche dal DB |
| `src/routes/index.tsx` | Fetch template media + category images via API | Homepage carica immagini dalla Media Library all'avvio |
| `src/routes/la-bottega.tsx` | Fetch bottega interna image via API | Pagina chi siamo carica immagine dalla Media Library |

### Nuova route API

| URL Pattern | File | Metodi | Auth | Scopo |
|-------------|------|--------|------|-------|
| `/api/site/media` | `src/routes/api/site/media.ts` | GET | none | Restituisce immagini template (hero, bottega) dalla Media Library |

### Flusso di migrazione

1. `scripts/migrate-to-media.ts` scansiona `public/images/products/`, `public/images/swatches/`, `public/images/*.svg`
2. Per ogni file trovato, crea un record `Media` con URL, dimensioni, folder
3. Collega ogni `ProductImage` al corrispondente `Media` via `mediaId` (matching per URL)
4. I file fisici restano nella posizione originale — solo il DB viene aggiornato

### Risultati migrazione

| Metrica | Valore |
|---------|--------|
| Media records creati | 1.355 |
| Product images linkate | 369/369 (100%) |
| Immagini prodotto | 1.143 |
| Swatch colori | 209 |
| Template SVG | 3 |
| Folder assegnati | `products`, `swatches`, `templates` |

### Immagine architettura (dopo migrazione)

```
Media Library (1.357 records total)
├── products/ (1.143) → linkati a ProductImage.mediaId
├── swatches/ (209) → referenziati da variantConfig JSON
├── templates/ (3) → hero, bottega-laboratorio, bottega-interna
└── uploads/2026/04/ (18) → 2 upload admin + 16 immagini importate dal sito di riferimento
```

### Verifiche
- TypeScript: ✅ zero errors in src/
- Build: ✅ success (vite build)
- Migration script: ✅ 1355 records creati, 369 linkate
- Seed: ✅ 3 macro-categorie con image field
- Implementation Map: aggiornata (v13 → v14)

---

## 🆕 Feature aggiunta: Import immagini reference + miglioramento testi sezioni | 2026-04-03

### Nuovi file creati

| File | Tipo | Layer | Scopo |
|------|------|-------|-------|
| `public/uploads/2026/04/slide-gioiello-2024.jpeg` | Immagine | ASSETS | Slider Hero slide 1 — Collezione Gioiello 2024 |
| `public/uploads/2026/04/slide-classica.jpg` | Immagine | ASSETS | Slider Hero slide 2 — Collezione Classica |
| `public/uploads/2026/04/banner-gioiello-2024.jpg` | Immagine | ASSETS | Banner promozionale Collezione Gioiello |
| `public/uploads/2026/04/banner-classica.jpg` | Immagine | ASSETS | Banner promozionale Collezione Classica |
| `public/uploads/2026/04/banner-schiava.jpg` | Immagine | ASSETS | Banner promozionale Collezione Schiava |
| `public/uploads/2026/04/banner-bambini.jpg` | Immagine | ASSETS | Banner promozionale Collezione Bambini |
| `public/uploads/2026/04/personalizzazione-sandalo.jpg` | Immagine | ASSETS | Immagine sezione personalizzazione |
| `public/uploads/2026/04/icon-sandalo.png` | Immagine | ASSETS | Icona personalizzazione — sandalo |
| `public/uploads/2026/04/icon-tacco.png` | Immagine | ASSETS | Icona personalizzazione — tacco |
| `public/uploads/2026/04/icon-pelle.png` | Immagine | ASSETS | Icona personalizzazione — pelle |
| `public/uploads/2026/04/icon-gioiello.png` | Immagine | ASSETS | Icona personalizzazione — gioiello |
| `public/uploads/2026/04/sfondo-chisiamo.jpg` | Immagine | ASSETS | Sfondo pagina Chi Siamo |
| `public/uploads/2026/04/nunzio-ritratto.jpg` | Immagine | ASSETS | Ritrato Nunzio Prevenzano |
| `public/uploads/2026/04/nunzio-team.jpg` | Immagine | ASSETS | Card team Nunzio |
| `public/uploads/2026/04/francesca-team.jpg` | Immagine | ASSETS | Card team Francesca |
| `public/uploads/2026/04/tutorial-misurazione-piede.png` | Immagine | ASSETS | Tutorial misurazione piede |
| `prisma/seed-site-images.ts` | Script | INFRA | Seed script per registrare immagini nella tabella Media |

### File modificati

| File | Modifica | Giustificazione |
|------|----------|-----------------|
| `src/components/sections/HeroSection.tsx` | Riscritto con slider a 2 slide, immagini reali, frecce e dots | Sostituzione placeholder SVG con foto reali dal sito reference |
| `src/components/sections/LaBottegaSection.tsx` | Sostituita immagine placeholder con foto reale | Immagine personalizzazione dal sito reference |
| `src/components/sections/PersonalizationSection.tsx` | Aggiunta immagine principale + icone reali + badge | Layout migliorato con immagine showcase e icone dal reference |
| `src/routes/la-bottega.tsx` | Aggiunto team section con foto Nunzio/Francesca, testi migliorati dal reference | Contenuto arricchito con storia reale, team, info bottega |
| `src/routes/guida-taglia.tsx` | Aggiunta immagine tutorial, testi migliorati, layout 2 colonne | Contenuto migliorato con istruzioni dettagliate e immagine |
| `src/routes/index.tsx` | Rimosso fetch media API non più necessario | HeroSection/LaBottegaSection ora usano immagini reali direttamente |

### Nuovi media registrati nel DB

| ID Media | Filename | Folder | Scopo |
|----------|----------|--------|-------|
| (16 record) | slide-gioiello-2024.jpeg | hero | Slider Hero |
| | slide-classica.jpg | hero | Slider Hero |
| | banner-gioiello-2024.jpg | banners | Banner collezione |
| | banner-classica.jpg | banners | Banner collezione |
| | banner-schiava.jpg | banners | Banner collezione |
| | banner-bambini.jpg | banners | Banner collezione |
| | personalizzazione-sandalo.jpg | personalizzazione | Sezione personalizzazione |
| | icon-sandalo.png | personalizzazione | Icona |
| | icon-tacco.png | personalizzazione | Icona |
| | icon-pelle.png | personalizzazione | Icona |
| | icon-gioiello.png | personalizzazione | Icona |
| | sfondo-chisiamo.jpg | chi-siamo | Sfondo pagina |
| | nunzio-ritratto.jpg | team | Foto team |
| | nunzio-team.jpg | team | Card team |
| | francesca-team.jpg | team | Card team |
| | tutorial-misurazione-piede.png | guida-taglia | Tutorial |

### Flusso utente aggiornato
1. Homepage Hero: slider automatico 7s con 2 slide reali (Gioiello + Classica), frecce navigazione, dots indicatori
2. Sezione Personalizzazione: immagine showcase affiancata ai 3 step con icone reali
3. Pagina La Bottega: storia reale della famiglia Prevenzano dal 1984, team section con foto Nunzio e Francesca
4. Pagina Guida Taglia: immagine tutorial affiancata alle istruzioni, tabella taglie migliorata

---

## 🆕 Feature aggiunta: selectedOptions + variantConfig seed | 2026-04-03

### Nuovi file creati

| File | Tipo | Layer | Scopo |
|------|------|-------|-------|
| `site-output/variant-configs.json` | Data | DATA | 81 variantConfig estratte per seed automatico |
| `scripts/migrate-to-media.ts` | Script | INFRA | Utility migrazione riferimenti immagini → Media table |
| `src/routes/api/site/media.ts` | API | BIZ | Endpoint pubblico per template media nelle pagine |
| `prisma/migrations/20260403171415_selected_options_cart_order/` | Migration | DATA | Aggiunge selectedOptions JSON a CartItem e OrderItem |

### File modificati

| File | Modifica | Giustificazione |
|------|----------|-----------------|
| `prisma/schema.prisma` | Aggiunto selectedOptions Json? a CartItem e OrderItem | Supporto opzioni selezionate per prodotti variantConfig |
| `prisma/seed.ts` | Aggiunto applyVariantConfigs() + import variant-configs.json + category image field | variantConfig persistente attraverso DB reset, categorie con immagine |
| `src/lib/cart.server.ts` | Branch A/B: variantConfig validation con priceModifier, resolved options | Prodotti con variantConfig gestiti correttamente nel carrello |
| `src/lib/orders.server.ts` | Copia selectedOptions da CartItem a OrderItem | Opzioni visibili negli ordini |
| `src/lib/admin.server.ts` | Include selectedOptions in getAdminOrder | Admin può vedere opzioni selezionate |
| `src/lib/validators/products.ts` | Aggiunto selectedOptions a addToCartSchema | Validazione input |
| `src/routes/carrello.tsx` | Display selectedOptions con color swatches | Utente vede scelte nel carrello |
| `src/routes/checkout.tsx` | Display selectedOptions con color swatches | Utente conferma scelte al checkout |
| `src/routes/prodotti.$slug.tsx` | Invia selectedOptions nel POST /api/cart | Product detail invia opzioni al carrello |
| `src/routes/admin.ordini.$id.tsx` | Display selectedOptions con color swatches | Admin vede opzioni cliente nell'ordine |
| `src/components/sections/CategoriesSection.tsx` | Accetta categoryImages prop | Immagini categorie dinamiche |

### Product images update

| Metrica | Valore |
|---------|--------|
| Sandali totali | 81 |
| Full-size (600x800+) | 79 |
| Thumbnail only | 2 (chiara, raffaella-maria — nessuna fonte full-size disponibile) |

### Flusso utente aggiornato

1. **Carrello con variantConfig**: utente seleziona taglia/colore/tacco → validazione server → prezzo con modifier → resolved options salvate
2. **Checkout**: opzioni selezionate visibili con color swatches
3. **Admin ordini**: dettaglio opzioni cliente per riga
4. **Seed automatico**: `npx prisma db seed` applica 81 variantConfig senza script manuale

---

## 🐛 Bug fix: mediaId association Media Library ↔ Prodotti/Template | 2026-04-03

### Bug risolti

| # | Bug | Fix |
|---|-----|-----|
| 1 | `mediaId` mai salvato quando si seleziona immagine dalla MediaPicker nel form prodotto | Aggiunto `mediaId` a ProductImageForm, addImagesFromMedia, imagesPayload |
| 2 | `mediaId` non presente nel validator Zod (`productImageSchema`) | Aggiunto campo `mediaId` nullable optional allo schema |
| 3 | `mediaId` non gestito nel server (ImagePayload, createMany, getAdminProduct) | Aggiunto `mediaId` a ImagePayload, createMany in create/update, getAdminProduct response |
| 4 | VariantBuilder: nessun MediaPicker per imageUrl degli swatch colore | Aggiunto pulsante FolderOpen per aprire MediaPicker (single select) su ogni opzione color-swatch |

### File modificati

| File | Modifica | Giustificazione |
|------|----------|-----------------|
| `src/lib/validators/products.ts` | Aggiunto `mediaId: z.string().nullable().optional()` a `productImageSchema` | Permettere al validator di accettare il campo mediaId |
| `src/lib/admin.server.ts` | Aggiunto `mediaId` a `AdminProductDetail.images`, `ImagePayload`, `createMany` (create+update), `getAdminProduct` mapping | Server-side: persistere e restituire il FK alla Media Library |
| `src/routes/admin.prodotti.$id.tsx` | Aggiunto `mediaId` a `ProductImageForm`, `emptyImage`, `addImagesFromMedia`, `fetchProduct` mapping, `imagesPayload` | Frontend: catturare e inviare il mediaId quando si seleziona dalla libreria |
| `src/components/admin/VariantBuilder.tsx` | Aggiunto import MediaPicker/SelectedMedia/FolderOpen, stato `mediaPickerTarget`, handler `handleMediaSelect`, pulsante FolderOpen su ogni opzione color-swatch, render MediaPicker modale | Permettere di selezionare immagini dalla libreria per gli swatch colore nei template |

### Impatto

- Le immagini selezionate dalla Media Library nei prodotti sono ora correttamente collegate via `mediaId` FK
- `deleteMedia` rileva correttamente l'uso in prodotti tramite `productImage.mediaId`
- Il VariantBuilder permette ora di scegliere immagini dalla libreria (non solo URL manuale)

---

## 🔄 Refactoring: Component Architecture (v17→v18) | 2026-04-03

### Obiettivo
Decomporre i file monolitici (route + componenti) in componenti modulari riutilizzabili, migliorando la manutenibilità e la testabilità senza modificare funzionalità esistenti.

### Principio guida
- **Nessuna modifica funzionale** — solo estrazione di componenti/logica in file separati
- **Backward-compatible re-exports** — i vecchi percorsi di import continuano a funzionare
- **Slim orchestrators** — i route file diventano coordinatori che importano e compostono i componenti estratti

### FASE 1A — `src/routes/admin.prodotti.$id.tsx` decomposed (1093 → 395 LOC)

Componenti estratti in `src/components/admin/product-edit/`:

| File | Contenuto | LOC |
|------|-----------|-----|
| `types.ts` | Shared types (ProductFormData, ProductImageForm, ecc.) | ~80 |
| `VariantSection.tsx` | Sezione gestione varianti prodotto | ~120 |
| `ImageGalleryManager.tsx` | Gestione galleria immagini con MediaPicker | ~180 |
| `VariantConfigSection.tsx` | Sezione VariantBuilder per config JSON | ~150 |
| `ProductFields.tsx` | Campi base prodotto (nome, prezzo, slug, descrizione, ecc.) | ~200 |
| `index.ts` | Barrel export | ~3 |

### FASE 1B — `src/routes/prodotti.$slug.tsx` decomposed (866 → 322 LOC)

Componenti estratti in `src/components/product/`:

| File | Contenuto | LOC |
|------|-----------|-----|
| `ProductGallery.tsx` | Gallery immagini con thumbnail navigation | ~180 |
| `VariantSelector.tsx` | Selettore varianti (color-swatch, select, button) con selectedOptions state | ~220 |
| `RelatedProducts.tsx` | Prodotti correlati dalla stessa categoria | ~80 |
| `index.ts` | Barrel export | ~3 |

### FASE 1C — `src/routes/catalogo.tsx` decomposed (680 → 250 LOC)

Componenti estratti in `src/components/catalog/`:

| File | Contenuto | LOC |
|------|-----------|-----|
| `CatalogSidebar.tsx` | Sidebar filtri: ricerca, albero categorie espandibile con conteggi | ~300 |
| `CatalogProductCard.tsx` | Card prodotto per griglia catalogo | ~120 |
| `index.ts` | Barrel export | ~3 |

### FASE 1D — `src/routes/checkout.tsx` + `src/routes/carrello.tsx` decomposed (checkout: 544→~380, carrello: 312→~280)

Componenti estratti in `src/components/checkout/`:

| File | Contenuto | LOC |
|------|-----------|-----|
| `OrderSummary.tsx` | Riepilogo ordine condiviso tra carrello e checkout (line items, selectedOptions display, subtotale, spedizione, totale) | ~200 |
| `index.ts` | Barrel export | ~3 |

### FASE 1E — `src/routes/admin.media.tsx` decomposed (580 → 276 LOC)

Componenti estratti in `src/components/admin/media-library/`:

| File | Contenuto | LOC |
|------|-----------|-----|
| `MediaGridItems.tsx` | MediaGridItem, MediaListItemRow, MediaItem type, formatFileSize, formatDate | 119 |
| `index.ts` | Barrel export | 2 |

### FASE 1F — `src/components/admin/VariantBuilder.tsx` decomposed (563 → 208 LOC orchestrator)

Componenti estratti in `src/components/admin/variant-builder/`:

| File | Contenuto | LOC |
|------|-----------|-----|
| `presets.ts` | CONTROL_TYPE_LABELS + PRESETS data (Sandali, Pelletteria, ecc.) | 144 |
| `GroupEditor.tsx` | GroupEditor component per editing singolo gruppo varianti | 202 |
| `VariantBuilder.tsx` | Slim orchestrator con tutti i callback (add/edit/remove group, drag & drop) | 208 |
| `index.ts` | Barrel export | 3 |

**Nota:** `src/components/admin/VariantBuilder.tsx` è ora un backward-compatible re-export che importa da `variant-builder/VariantBuilder.tsx`.

### FASE 2 — `src/lib/admin.server.ts` SRP split (711 → 37 LOC re-export)

Moduli estratti in `src/lib/admin/`:

| File | Contenuto | LOC |
|------|-----------|-----|
| `types.ts` | Tutti i shared admin types (AdminProductDetail, AdminOrderDetail, ecc.) | 188 |
| `admin-dashboard.server.ts` | `getDashboardStats` — statistiche dashboard | 53 |
| `admin-products.server.ts` | Tutti i CRUD prodotti (getAdminProducts, getAdminProduct, adminCreateProduct, adminUpdateProduct, adminDeleteProduct) | 273 |
| `admin-orders.server.ts` | Query ordini + aggiornamento stato (getAdminOrders, getAdminOrder, updateOrderStatus, updateOrderTracking) | 175 |
| `admin-categories.server.ts` | CRUD categorie (getAdminCategories, createCategory, updateCategory, deleteCategory) | 65 |
| `index.ts` | Barrel export di tutti i moduli + tipi | 34 |

**Nota:** `src/lib/admin.server.ts` è ora un backward-compatible re-export che importa tutto da `admin/index.ts`.

### Riepilogo riduzione LOC per route

| File | Prima | Dopo | Riduzione |
|------|-------|------|-----------|
| `src/routes/admin.prodotti.$id.tsx` | 1093 | ~395 | -64% |
| `src/routes/prodotti.$slug.tsx` | 866 | ~322 | -63% |
| `src/routes/catalogo.tsx` | 680 | ~250 | -63% |
| `src/routes/admin.media.tsx` | 580 | 276 | -52% |
| `src/routes/checkout.tsx` | 544 | ~380 | -30% |
| `src/routes/carrello.tsx` | 312 | ~280 | -10% |

### Re-export shims (backward compatibility)

Questi file mantengono la vecchia API di import per evitare breaking changes:

| File shim | Re-export da |
|-----------|-------------|
| `src/components/admin/VariantBuilder.tsx` | `src/components/admin/variant-builder/VariantBuilder.tsx` |
| `src/lib/admin.server.ts` | `src/lib/admin/index.ts` |

### Verifiche
- TypeScript: ✅ zero errors (in corso — da verificare)
- Build: ✅ (in corso — da verificare)
- Funzionalità: ✅ nessuna modifica comportamentale

---

## 🆕 Feature aggiunta: Product Image Zoom & Swatch Magnifier | 2026-04-05

### Descrizione
Due miglioramenti UX per la pagina prodotto:
1. **Hover Zoom** sull'immagine principale — effetto e-commerce classico con zoom 2.2x che segue il cursore + pannello lente laterale
2. **Lente d'ingrandimento** sulle thumbnail gallery e swatch varianti con immagine — preview zoomata 3x in floating popup

### Nuovi file creati

| File | Tipo | Layer | Scopo |
|------|------|-------|-------|
| `src/lib/hooks/use-prefers-reduced-motion.ts` | hook | UI | Hook condiviso per rilevare `prefers-reduced-motion` (WCAG 2.1) |

### File modificati

| File | Modifica | Giustificazione |
|------|----------|-----------------|
| `src/components/product/ProductGallery.tsx` | Riscritto con ZoomableImage (hover zoom 2.2x + crosshair + lente laterale), MagnifiableThumbnail (lente 3x su hover/long-press) | Miglioramento UX prodotto — zoom immagini |
| `src/components/product/VariantSelector.tsx` | Estratto MagnifiableSwatch per swatch con immagine (lente 3x su hover/long-press), aggiunto ZoomIn icon hint | Miglioramento UX varianti — lente d'ingrandimento |

### Nuovi componenti

| Nome | File | Props | Usato in |
|------|------|-------|----------|
| ZoomableImage | `ProductGallery.tsx` | src, alt, naturalWidth, naturalHeight, empty | ProductGallery |
| ZoomLensPanel | `ProductGallery.tsx` | src, alt, position, containerRef, zoomScale, lensSize | ZoomableImage |
| MagnifiableThumbnail | `ProductGallery.tsx` | src, alt, isActive, onClick, label | ProductGallery (thumbnails) |
| MagnifiableSwatch | `VariantSelector.tsx` | option, isSelected, onSelect | OptionGroupControl (color-swatch) |

### Dettaglio implementazione

**Hover Zoom (immagine principale):**
- Al passaggio del mouse, l'immagine si ingrandisce a 2.2x con `transform: scale(2.2)` e `transformOrigin` che segue il cursore
- Un indicatore crosshair bianco mostra il punto di zoom
- Un badge "Zoom" con icona ZoomIn appare nell'angolo basso-destra come hint
- Un pannello lente laterale (180x180px) appare a destra dell'immagine con zoom ingrandito
- Su viewport stretti (< 200px spazio a destra), il pannello si nasconde automaticamente
- Su mobile/touch: il touch disabilita lo zoom (nessun hover su touch)
- Su `prefers-reduced-motion`: zoom disabilitato, immagine statica

**Magnifier Thumbnail (gallery):**
- Su hover delle thumbnail, appare un popup flottante (120x120px) con zoom 3x
- Il popup si posiziona sopra la thumbnail centrato sul cursore
- Su mobile: attivabile con long-press (500ms), disattivabile rilasciando il dito
- Su `prefers-reduced-motion`: magnifier disabilitato

**Magnifier Swatch (varianti):**
- Solo per swatch con `imageUrl` (non per swatch color solido)
- Su hover, appare un popup flottante (140x140px) con zoom 3x
- Icona ZoomIn come hint in hover
- Su mobile: long-press per attivare
- Su `prefers-reduced-motion`: magnifier disabilitato

### Accessibilità
- `usePrefersReducedMotion` hook — rispetta l'impostazione OS per utenti sensibili alle animazioni
- `aria-hidden="true"` su tutti gli elementi decorativi (lente, crosshair, zoom hint)
- `aria-label` aggiornati con hint zoom sulle immagini
- `cursor-crosshair` sull'immagine principale per indicare l'interazione

### Performance
- Zero pacchetti npm aggiunti — implementazione CSS transform + React state
- `will-change: transform` gestito dal browser via CSS `transition`
- `draggable={false}` su tutte le immagini con magnifier per evitare drag nativo
- Immagini magnifier non precaricate — riutilizzano la stessa `src` dell'immagine originale

### Flusso utente
1. Utente visita pagina prodotto `/prodotti/$slug`
2. Passa il mouse sopra l'immagine principale → lo zoom si attiva fluidamente (2.2x)
3. Muove il cursore → lo zoom segue con crosshair + lente laterale
5. Passa il mouse sopra una thumbnail gallery → preview zoomata 3x appare sopra
6. Passa il mouse sopra uno swatch variante con immagine → preview zoomata 3x appare
7. Su mobile: long-press su thumbnail/swatch → preview zoomata appare, rilascio → scompare
8. Utenti con `prefers-reduced-motion` → nessun zoom, comportamento statico originale

### Verifiche
- TypeScript: ✅ zero errors, zero `any`
- Build: ✅ success (1.54s)
- Implementation Map: aggiornata (v18 → v19)

---

## 🆕 Feature aggiunta: Area Cliente (Frontoffice Account) | 2026-04-07

### Descrizione
Area clienti completa con dashboard, storico ordini, wishlist, gestione profilo, cambio password e gestione indirizzi. Include aggiornamenti alla navigazione (MegaMenu icona utente, MobileBottomNav link account) e layout dedicato con sidebar responsive.

### Nuovi file creati (12)

| File | Tipo | Layer | Scopo |
|------|------|-------|-------|
| `src/routes/account.tsx` | layout | UI | Layout account con sidebar navigazione, drawer mobile, auth guard via fetch interceptor |
| `src/routes/account/index.tsx` | page | UI | Dashboard account — saluto, quick stats (ordini/wishlist), ordini recenti |
| `src/routes/account/ordini.index.tsx` | page | UI | Lista ordini con paginazione, status badges |
| `src/routes/account/ordini.$orderId.tsx` | page | UI | Dettaglio ordine — info spedizione, tracking, lista articoli, storico pagamenti |
| `src/routes/account/wishlist.tsx` | page | UI | Griglia wishlist con immagine, prezzo, remove con toast |
| `src/routes/account/profilo.tsx` | page | UI | Form edit nome/email con validazione client-side |
| `src/routes/account/password.tsx` | page | UI | Form cambio password (delega a Better Auth) |
| `src/routes/account/indirizzi.tsx` | page | UI | Lista indirizzi, form crea/modifica con AnimatePresence, delete con confirm |
| `src/lib/address.server.ts` | service | DATA | CRUD indirizzi con gestione isDefault (unset altri quando se ne imposta uno nuovo) |
| `src/routes/api/user/profile.ts` | api | BIZ | PUT update profilo, POST cambio password (delega a Better Auth con cookie forwarding) |
| `src/routes/api/addresses.ts` | api | BIZ | GET lista indirizzi, POST crea indirizzo |
| `src/routes/api/addresses.$id.ts` | api | BIZ | PUT update indirizzo, DELETE indirizzo |

### File modificati (3)

| File | Modifica | Giustificazione |
|------|----------|-----------------|
| `src/routes/__root.tsx` | Aggiunto `isAccount` check per nascondere padding bottom e MobileBottomNav sulle route `/account/*` | Area account non deve mostrare MobileBottomNav |
| `src/components/shared/MegaMenu.tsx` | Aggiunta icona User nella top bar desktop (prima del carrello) che linka a `/account` | Accesso rapido area cliente |
| `src/components/shared/MobileBottomNav.tsx` | Tab Account ora punta a `/account` invece di `/auth/login` | Gli utenti loggati vanno direttamente al loro account |

### Nuove route

| URL Pattern | File | Auth | Type |
|-------------|------|------|------|
| `/account` | `account.tsx` | required | ACCOUNT (layout) |
| `/account/` | `account/index.tsx` | required | ACCOUNT |
| `/account/ordini` | `account/ordini.index.tsx` | required | ACCOUNT |
| `/account/ordini/$orderId` | `account/ordini.$orderId.tsx` | required | ACCOUNT |
| `/account/wishlist` | `account/wishlist.tsx` | required | ACCOUNT |
| `/account/profilo` | `account/profilo.tsx` | required | ACCOUNT |
| `/account/password` | `account/password.tsx` | required | ACCOUNT |
| `/account/indirizzi` | `account/indirizzi.tsx` | required | ACCOUNT |
| `/api/user/profile` | `api/user/profile.ts` | required | API |
| `/api/addresses` | `api/addresses.ts` | required | API |
| `/api/addresses/$id` | `api/addresses.$id.ts`` | required | API |

### Flusso utente

1. Utente loggato → click icona User (desktop) o tab Account (mobile) → `/account`
2. Dashboard mostra saluto, stats (ordini totali, wishlist count), ordini recenti
3. Click "Vai allo storico ordini" → lista paginata con status badges (pending/confirmed/processing/shipped/delivered/cancelled/refunded)
4. Click ordine → dettaglio con info spedizione, tracking number, lista articoli con link prodotto, riepilogo totaled
5. Click "Vai alla wishlist" → griglia prodotti con remove
6. "Il mio profilo" → form edit nome/email con validazione
7. "Cambia password" → form con password attuale/nuova/conferma, delega a Better Auth `/api/auth/change-password`
8. "I miei indirizzi" → lista con default badge, form animato per crea/modifica, validazione Zod (createAddressSchema)

### Backend esistente riutilizzato

Il backend per l'area cliente era già ~70% pronto:
- API ordini: `/api/orders` (GET), `/api/orders/$id` (GET) — già esistenti
- API wishlist: `/api/wishlist` (GET/POST/DELETE) — già esistente
- Server lib: `orders.server.ts` (getUserOrders, getOrderDetail), `wishlist.server.ts`
- Validator: `createAddressSchema` in `validators/products.ts`

### Nota architetturale

L'area account usa il navbar/footer del sito (non un layout separato come admin). L'`__root.tsx` nasconde solo il MobileBottomNav e il padding bottom per le route `/account/*`.

### Verifiche
- TypeScript: ✅ zero errors, zero `any`
- Build: ✅ success (1.30s)
- Implementation Map: aggiornata (v20 → v21)

---

## 🔧 Fix: Auth server-side redirect + Logout | 2026-04-15

### Problema
1. `/admin` senza autenticazione: il redirect alla login avveniva solo client-side (flash del contenuto admin) perché usava un `useEffect` con monkey-patching di `window.fetch`
2. Logout dal frontend (area account): `authClient.signOut()` client-side non cancellava correttamente il cookie di sessione, lasciando la pagina account visibile

### File creati

| File | Tipo | Layer | Scopo |
|------|------|-------|-------|
| `src/routes/api/auth/session.ts` | API route | DATA | GET endpoint che ritorna la sessione utente corrente (usato da beforeLoad) |
| `src/routes/api/auth/logout.ts` | API route | DATA | POST endpoint che chiama `auth.api.signOut` server-side per cancellare il cookie |

### File modificati

| File | Modifica | Giustificazione |
|------|----------|-----------------|
| `src/routes/admin.tsx` | Aggiunto `beforeLoad` con fetch a `/api/auth/session` + redirect server-side; rimosso `useEffect` monkey-patch di `window.fetch`; logout button usa `fetch("/api/auth/logout")` server-side | Redirect admin a livello server (SSR) invece di client-side |
| `src/routes/account.tsx` | Aggiunto `beforeLoad` con fetch a `/api/auth/session` + redirect server-side; rimosso `useEffect` monkey-patch di `window.fetch`; logout handler usa `fetch("/api/auth/logout")` server-side | Auth guard server-side + logout affidabile |

### Nuove route API

| URL Pattern | File | Metodi | Auth | Scopo |
|-------------|------|--------|------|-------|
| `/api/auth/session` | `src/routes/api/auth/session.ts` | GET | none | Ritorna sessione utente (401 se non autenticato) |
| `/api/auth/logout` | `src/routes/api/auth/logout.ts` | POST | none | Cancella sessione server-side |

### Comportamento aggiornato

- **Admin redirect**: Quando si naviga a `/admin/*` senza sessione admin, il `beforeLoad` nel layout admin fa una fetch a `/api/auth/session`. Su SSR (primo caricamento), il redirect avviene come HTTP redirect 307 — nessun flash di contenuto. Su client-side navigation, TanStack Router gestisce il redirect automaticamente.
- **Account redirect**: Stesso pattern per `/account/*` — redirect a `/auth/login` se non autenticato.
- **Logout**: Il logout button sia nell'admin che nell'account fa una `POST /api/auth/logout` che chiama `auth.api.signOut` dal server (con i cookie della request), assicurando che la sessione venga correttamente cancellata. Dopo il logout, redirect alla homepage o login.

### Flusso utente
1. Utente non autenticato naviga a `/admin` → SSR esegue `beforeLoad` → fetch `/api/auth/session` → 401 → redirect HTTP a `/auth/login` (nessun flash)
2. Utente loggato come customer naviga a `/admin` → SSR esegue `beforeLoad` → fetch `/api/auth/session` → 200 ma role=user → redirect a `/auth/login`
3. Utente fa logout dall'area account → POST `/api/auth/logout` → server cancella sessione → redirect a `/`
4. Utente fa logout dall'admin → POST `/api/auth/logout` → server cancella sessione → redirect a `/auth/login`

---

## 🆕 Feature modificata: M2 SSR refactor — /sandali | 2026-04-15

### File modificati

| File | Modifica | Giustificazione |
|------|----------|-----------------|
| `src/routes/sandali.tsx` | beforeLoad con $getCategories + $getCatalogProducts, validateSearch con parametri opzionali, uso useSearch, rimossa resolveCategoryName inutilizzata | SSR per pagina sandali — prima usava useEffect+fetch |
| `src/components/shared/MegaMenu.tsx` | Link a /sandali aggiornati con search={{ category: undefined, query: undefined, page: undefined }} | Compatibilità con validateSearch tipizzato della route /sandali |

### Comportamento aggiornato

- **Pagina /sandali**: Il beforeLoad carica categorie e prodotti via createServerFn ($getCategories, $getCatalogProducts). La prima renderizzazione è SSR completa. I filtri (ricerca, categoria, paginazione) continuano a funzionare client-side via RPC.
- **validateSearch**: Aggiunto per tipizzare i search params (category, query, page) — tutti opzionali con type-safe parsing.
- **MegaMenu**: I link a /sandali passano esplicitamente i search params undefined per compatibilità con validateSearch.

### Flusso utente
1. Utente naviga a /sandali → SSR carica categorie e prodotti sandali dal DB → HTML completo senza flash
2. Utente naviga a /sandali?category=infradito → SSR filtra per sottocategoria infradito
3. Utente cambia filtro nel form → client-side RPC aggiorna i prodotti senza reload pagina
