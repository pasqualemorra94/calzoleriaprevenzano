# Pitfalls Research

**Domain:** Artisanal Italian e-commerce (customizable sandals + leather goods)
**Researched:** 2026-04-02
**Confidence:** HIGH (domain-specific, stack-verified, codebase-audited)

---

## Critical Pitfalls

### Pitfall 1: Product Variant Schema Explosion (Customization Model)

**What goes wrong:**
Each sandal can have multiple independent customization axes (heel type, leather type, leather color, jewelry/decoration). Developers model this with a combinatorial `ProductVariant` table where every possible permutation (e.g., heel A × leather B × color C × jewelry D) becomes a row. With 82 sandali × 3 heel types × 4 leather types × 8 colors × 6 jewelry options = **~47,000 variant rows** for sandals alone. The database balloons, the admin panel becomes unusable, and adding a new color requires creating hundreds of new variant rows.

**Why it happens:**
E-commerce tutorials teach the `Product → ProductVariant` pattern from Shopify-style platforms where variants are pre-defined SKUs. But Calzoleria Prevenzano's sandals are **made-to-order with configurable options** — they're not pre-manufactured SKUs. The customization is additive/compositional, not combinatorial.

**How to avoid:**
Model customizations as **independent `ProductOption` groups** (not variant permutations). Each option group (Heel, Leather, Color, Jewelry) is a separate entity linked to the product. The final price is computed by summing the base price + option surcharges at checkout time. Only create an `OrderItem` snapshot when the customer places an order — never pre-generate all combinations.

```
Product
  ├── basePrice: Int (cents)
  ├── ProductOptionGroup[]
  │     ├── name: "Tacco" (Heel)
  │     └── ProductOption[]
  │           ├── value: "Con infradito"
  │           └── priceModifier: 0 (cents)
  │     ├── name: "Pelle" (Leather)
  │     └── ProductOption[]
  │           ├── value: "Cuoio toscano"
  │           └── priceModifier: 1500 (cents)
  │     └── ...
  └── (no ProductVariant[] table needed)
```

**Warning signs:**
- Admin panel has a "Generate all variants" button
- ProductVariant count exceeds Product count by >10×
- Adding a new color takes seconds due to row creation
- `SELECT COUNT(*) FROM ProductVariant` returns thousands

**Phase to address:** Phase 1 (Schema/Database design) — this is the foundational data model that everything else depends on. Getting it wrong requires a full rewrite.

---

### Pitfall 2: Stripe Dynamic Pricing for Custom Products

**What goes wrong:**
The project creates Stripe `Product` + `Price` objects for each product in the database, then references them by `price_data.price` ID at checkout. But customized sandals don't have a fixed price — the total depends on which options the customer selects. If you try to create a Stripe Price per permutation, you hit Stripe API rate limits and create thousands of orphaned Price objects. If you hardcode prices client-side, customers can manipulate the total via browser devtools.

**Why it happens:**
Stripe's documentation focuses on fixed-price products. The `price_data` parameter for dynamic/inline prices is less prominent. Developers don't realize you can create **ephemeral line items** using `price_data` directly in the Checkout Session creation without pre-creating any Stripe Price objects.

**How to avoid:**
Use `price_data` inline in the Checkout Session creation — compute the total price server-side from the selected options, then pass it as:

```typescript
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [{
    price_data: {
      currency: "eur",
      unit_amount: computedTotalInCents, // server-side computed
      product_data: {
        name: `Sandalo ${product.name} - ${selectedOptions}`,
        description: `${heel}, ${leather}, ${color}, ${jewelry}`,
        // No need to pre-create a Product in Stripe
      },
    },
    quantity: 1,
  }],
  // ...
});
```

**Critical:** Never trust the price from the client. Always recompute server-side from `productId` + selected option IDs → database lookup → price calculation → Stripe `price_data.unit_amount`.

**Warning signs:**
- Stripe dashboard shows hundreds of Products with zero purchases
- Checkout flow has a `stripe.products.create()` call before checkout
- Price is sent from the browser as a parameter to the checkout API

**Phase to address:** Phase 2 (Cart + Checkout) — must be correct before any payments go live.

---

### Pitfall 3: Italian IVA (VAT) Display and Calculation

**What goes wrong:**
Italian law (Decreto Legge 267/2000, EU Directive 2008/8/EC) requires that consumer-facing prices **always include IVA** (VAT inclusive). If prices are displayed without IVA, or if the IVA calculation is wrong, the site is non-compliant. The standard IVA rate is 22% in Italy. Two common failures:
1. Prices are stored IVA-exclusive and the 22% is added client-side (rounding errors, manipulable)
2. Stripe Tax is not configured for Italian tax codes, so Stripe doesn't know this is a clothing/leather goods product

**Why it happens:**
Anglo-Saxon e-commerce defaults to tax-exclusive pricing. Stripe's default behavior depends on configuration. Prisma stores `Int` (cents) but developers forget whether it's IVA-inclusive or exclusive.

**How to avoid:**
- Store all prices in the database as **IVA-inclusive cents** (what the customer pays)
- Configure Stripe products with `tax_behavior: "inclusive"` when using `price_data`
- Enable `automatic_tax[enabled]=true` in Stripe Checkout Sessions with proper `shipping_address_collection` including Italy and EU countries
- Use Stripe Tax with correct tax codes: `txcd_20030000` (general clothing) for sandals, `txcd_20060000` (accessories) for leather goods
- Display "IVA inclusa" (VAT included) near every price — this is a legal requirement in Italy
- The price displayed on the product page must match exactly what Stripe charges

**Warning signs:**
- Product page shows €60 but Stripe charges €73.20 (22% IVA added on top)
- No "IVA inclusa" text near prices
- `tax_behavior` is not set or set to `"exclusive"` in Stripe calls
- Prices are stored as floating-point instead of integer cents

**Phase to address:** Phase 1 (Schema — decide IVA-inclusive storage convention) + Phase 2 (Checkout — configure Stripe Tax correctly).

---

### Pitfall 4: TanStack Start Version Volatility (RC Status)

**What goes wrong:**
TanStack Start is currently at **RC (Release Candidate) stage, not 1.0** (confirmed from official site April 2026). The API surface may change between RC versions. Code written against RC may break with the stable release. The site-generator-agents codebase already shows `@tanstack/start` pinned to `latest` without version pinning. A breaking change in `createServerFn`, `createFileRoute`, or the Vinxi build pipeline could halt development.

**Why it happens:**
TanStack Start is newer than React Router 7/Remix. The ecosystem is smaller, fewer StackOverflow answers, fewer production battle-tested examples. The project AGENTS.md references `pnpm tanstack <command>` for latest docs, but the generated code may not be in sync.

**How to avoid:**
- **Pin exact versions** in `package.json`: `"@tanstack/start": "1.0.0-rc.X"` (never `latest` or `^`)
- Pin `vinxi` to the exact compatible version listed in TanStack Start's own `package.json`
- Create a **lockfile checkpoint** after confirming everything works — commit `pnpm-lock.yaml`
- Before upgrading TanStack Start, test in a branch, read the changelog, and never upgrade mid-phase
- Keep a compatibility matrix: `@tanstack/start` version ↔ `@tanstack/react-router` version ↔ `vinxi` version
- Consider having a fallback plan: if TanStack Start hits a blocking bug, the architecture should allow swapping to React Router 7 without rewriting business logic

**Warning signs:**
- `package.json` uses `"@tanstack/start": "latest"` or `"^1.0.0"`
- `pnpm update` breaks the build
- Vinxi dev server crashes with cryptic errors
- Route types aren't generated correctly after an update

**Phase to address:** Phase 0 (Project setup) — version pinning is a day-1 concern. Every subsequent phase depends on a stable framework.

---

### Pitfall 5: GDPR Cookie Consent Gate Blocking Critical Functionality

**What goes wrong:**
The codebase shows that monitoring (Sentry), analytics (Plausible), and Web Vitals tracking are all gated behind `hasConsent("analytics")`. This is correct for analytics. But developers sometimes accidentally gate **essential** functionality behind consent checks:
- Stripe payment scripts don't load until "marketing" consent is given
- The cart session breaks if "essential" cookies are blocked
- Error tracking fails silently in production because Sentry is behind analytics consent
- The service worker/PWA features break without consent

**Why it happens:**
GDPR compliance code is often added as an afterthought with blanket `if (!hasConsent()) return;` guards. The distinction between "essential" (auth, cart, payment) and "analytics/marketing" (tracking, ads) is not enforced at the type level.

**How to avoid:**
- Define a clear consent taxonomy: `essential` (always allowed), `analytics` (Plausible, Sentry, Web Vitals), `marketing` (ads, remarketing)
- Auth cookies, cart state, and Stripe sessions are `essential` — **never gate them**
- Sentry error tracking should initialize in production regardless of consent (for security), but don't send analytics data until consent is given. Use `beforeSend` to redact PII, not to disable entirely.
- Test the site with all consent categories declined — cart, checkout, and account must still work
- The `CookieBanner` component should clearly show "Essential cookies are always active and cannot be disabled"

**Warning signs:**
- Checkout fails when user declines all non-essential cookies
- Sentry never reports production errors
- Cart state is lost on cookie decline
- Any `if (hasConsent(...))` check wraps auth, cart, or payment code

**Phase to address:** Phase 2 (GDPR/Cookie consent implementation) + Phase 3 (Compliance audit).

---

### Pitfall 6: WooCommerce Product Data Migration — Lossy Export

**What goes wrong:**
The existing WordPress/WooCommerce site has ~118 products across 14 subcategories. During migration:
1. **Image URLs break** — WooCommerce stores images as WordPress media attachments with URLs like `/wp-content/uploads/2024/01/sandalo-1.jpg`. These need to be downloaded, re-uploaded, and URLs updated.
2. **Category hierarchy is lost** — WooCommerce's `product_cat` taxonomy with parent-child relationships (Sandali → Gioiello → Con infradito) needs to be mapped to the new Prisma `Category` tree.
3. **Product attributes/variants are lost** — WooCommerce stores variation attributes as serialized meta. Custom fields for heel/leather/color may be in `wp_postmeta` or custom taxonomies.
4. **Prices may be IVA-inclusive or exclusive** — WooCommerce configuration determines this. If the old site was configured differently than the new one, prices will be wrong.
5. **SEO URLs change** — Old WooCommerce URLs (`/product/sandalo-classico/`) will 404 on the new site, losing all Google indexing.

**Why it happens:**
Developers assume WooCommerce's CSV export contains all data. It doesn't — custom fields, variation attributes, category hierarchy, and image associations are in separate database tables. The WordPress database has a complex relational structure with `wp_posts`, `wp_postmeta`, `wp_terms`, `wp_term_relationships`, and `wp_woocommerce_attribute_taxonomies`.

**How to avoid:**
- **Do NOT use WooCommerce CSV export** as the primary migration source — query the WordPress database directly
- Write a migration script that:
  1. Dumps the WordPress database via `mysqldump`
  2. Reads products from `wp_posts` where `post_type = 'product'` or `product_variation`
  3. Reads categories from `wp_terms` + `wp_term_taxonomy` with parent relationships
  4. Reads images from `wp_posts` where `post_type = 'attachment'` and `post_parent = {product_id}`
  5. Reads custom attributes from `wp_postmeta` or `wp_woocommerce_attribute_taxonomies`
- Download all product images via `wp-content/uploads/` and re-upload to the new system
- Create 301 redirects from old WooCommerce URLs to new TanStack Start routes
- Verify prices match (compare a sample of products between old and new site)

**Warning signs:**
- Migration uses WooCommerce REST API or CSV export
- No 301 redirect mapping planned
- Product count after migration is less than 118
- Images are hotlinked to the old WordPress domain

**Phase to address:** Phase 3 (Migration) — but the schema must support the incoming data structure from Phase 1.

---

### Pitfall 7: Cart State Desync Between Client and Server

**What goes wrong:**
The cart is stored client-side (localStorage or React state) but the server needs it for checkout. When a user adds a customized sandal (base product + options) to cart, the server must validate:
1. The product still exists and is in stock
2. The selected options are valid for that product
3. The price hasn't changed since the user added it
If the cart is purely client-side, a user could add a product, the admin changes the price, and the checkout charges the wrong amount. Or worse, a user manipulates the cart JSON to set a custom price.

**Why it happens:**
Building a client-only cart is fast and feels responsive. Server-side cart requires API calls for every add/remove/update, which feels slower. Developers optimize for UX and skip server validation.

**How to avoid:**
- **Server-side cart** stored in the database (Prisma `Cart` + `CartItem` models), keyed by session ID or user ID
- Client maintains a optimistic local copy for instant UI feedback, but every mutation is synced to the server
- At checkout time, the server recomputes the total from `CartItem.productId` + `CartItem.selectedOptions` → database lookup → price calculation
- The `CartItem` stores `productId` and `selectedOptionIds`, NOT the computed price — the price is always derived server-side
- Use TanStack Query's `useMutation` + `onMutate` for optimistic updates with `onError` rollback

**Warning signs:**
- Cart state is only in `useState` or `localStorage`
- Checkout receives `price` from the client
- No server-side price re-validation at checkout
- Admin price change doesn't update existing carts

**Phase to address:** Phase 2 (Cart + Checkout) — this is the core of the e-commerce flow.

---

### Pitfall 8: Image Optimization for Artisan Product Photography

**What goes wrong:**
Artisan products need high-quality photos (close-ups of leather grain, stitching, jewelry details). These images are often 3-5MB each shot on a DSLR. With 118 products × ~3 images each = ~350 images, the site loads 1-2GB of unoptimized images. Mobile users on Italian 4G connections see blank screens. The site feels "premium" only when images load instantly — otherwise it feels amateur.

**Why it happens:**
The WooCommerce migration brings original WordPress images. Nobody runs an optimization pipeline. `public/uploads/` grows unbounded. The gallery plugin's image resize (thumbnail 300×300, medium 800px, full original) is configured but never triggered for migrated data.

**How to avoid:**
- During migration, run **Sharp-based image processing** to generate thumbnail (300×300), medium (800px WebP), and full (original WebP) versions
- Serve images with `<picture>` element: WebP first, JPEG fallback
- All product images use `loading="lazy" decoding="async"` with proper `width`/`height` to prevent CLS
- Consider using Cloudinary or Supabase Storage with on-the-fly transforms for dynamic resizing
- Set up nginx to serve images with long cache headers (`Cache-Control: public, max-age=31536000, immutable`)
- Define a max file size (2MB) for product images in admin upload

**Warning signs:**
- Product page loads >3 seconds on mobile
- Images served as original 4000×3000 JPEGs
- No WebP versions exist
- Lighthouse performance score <70

**Phase to address:** Phase 1 (Schema — define image model with thumbnail/medium/full variants) + Phase 3 (Migration — process images during import).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store prices as EUR floats | Quick display formatting | Rounding errors (0.1 + 0.2 ≠ 0.3), Stripe requires cents anyway | **Never** — use integer cents from day 1 |
| Client-side only cart | Fast UX, no API calls | Price manipulation, stale data, lost carts on device switch | **Never** — server cart is non-negotiable for payments |
| Hardcoded Italian strings in components | Ship faster, no i18n overhead | Multi-language v2 requires touching every component | MVP only — use `t()` translation keys even if only Italian exists |
| Single `Product` table for all types | Simpler schema | Sandals (customizable) and leather goods (fixed) have different requirements, leading to nullable columns and validation sprawl | **Never** — use a `productType` discriminator with option groups |
| Skip 301 redirects from old URLs | Save development time | Lose all SEO authority, Google Search Console floods with 404s | **Never** — SEO migration is critical for an established domain |
| Store images in `public/uploads/` | No cloud config needed | No CDN, no transforms, disk fills on VPS, no backup | MVP (acceptable) — plan cloud storage for v2 |
| In-memory rate limiting | Simple implementation | Lost on restart, doesn't work across pm2 cluster instances | Development only — use Redis in production |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Stripe Checkout** | Pre-creating Price objects for every product variant | Use `price_data` inline in session creation with server-computed totals |
| **Stripe Webhooks** | Not verifying webhook signature (`stripe.webhooks.constructEvent`) | Always verify `STRIPE_WEBHOOK_SECRET` — never trust raw body |
| **Stripe Webhooks** | Processing events idempotently (double-processing `checkout.session.completed`) | Store `StripeEvent` in Prisma with unique event ID, skip if already processed |
| **Stripe Amounts** | Passing EUR as euros (60.00) instead of cents (6000) | Stripe **always** uses smallest currency unit: `unit_amount: 6000` for €60.00 |
| **Stripe Tax** | Not setting `tax_behavior: "inclusive"` for Italian IVA-inclusive pricing | Set `inclusive` and enable `automatic_tax[enabled]=true` |
| **Prisma** | Using `@ignore` on soft-deleted models instead of middleware | Use `prisma-soft-delete.server.ts` middleware as defined in codebase |
| **Better Auth** | Using `User` model name instead of `AuthUser` required by `secure-auth-sdk` | Must use `AuthUser`, `AuthSession`, etc. — exact model names required |
| **Prisma Migrations** | Running `prisma migrate dev` in production | Use `prisma migrate deploy` for production — `dev` can cause data loss |
| **WooCommerce DB** | Using WooCommerce REST API for migration | Query the WordPress MySQL database directly — REST API loses meta/relationships |
| **Email (Resend)** | Blocking order confirmation on email failure | Email is best-effort, never block the transaction — fire-and-forget with retry queue |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 queries on product listing | Product page takes >2s, slow TTFB | Use `include: { options: true, images: true }` in Prisma, batch load categories | >50 products on a single page |
| Unoptimized product images | 3-5MB images, mobile blank screen | Sharp pipeline: WebP, 3 sizes (thumb/medium/full), lazy loading | Any product with DSLR photos |
| No pagination on category pages | All 82 sandals load at once | Cursor-based pagination (12-20 per page) with TanStack Query `useInfiniteQuery` | >30 products in a category |
| Stripe Checkout Session creation on every page load | Slow "Add to Cart" → Checkout flow | Create session only when user clicks "Proceed to Checkout", not when viewing cart | >100 concurrent users |
| Prisma client in serverless context | Connection pool exhaustion | Use `prisma.$connect()` / `$disconnect()` lifecycle, or connection pooling via PgBouncer | Production with pm2 cluster mode |
| No caching for product catalog | Database hit on every product page view | Redis cache for product listing with invalidation on admin update | >500 daily visitors |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Client-side price computation** | Customer sets own price via devtools | Always compute price server-side from product ID + option IDs → DB lookup |
| **Missing Stripe webhook signature verification** | Attacker sends fake `checkout.session.completed` events | Always use `stripe.webhooks.constructEvent(body, sig, webhookSecret)` |
| **Admin routes without `requireAdmin` guard** | Any authenticated user accesses admin panel | Every `/admin/*` route must call `requireAdmin()` from `secure-auth-sdk` |
| **SQL injection via product search** | User searches for `'; DROP TABLE Product; --` | Use Prisma's parameterized queries (never raw SQL for user input) |
| **Missing CSRF protection on cart mutations** | Cross-site request adds/removes cart items | Use `secure-auth-sdk` CSRF middleware on all state-changing endpoints |
| **Default admin password in seed** | Production deployed with `change-me-immediately-123!` | Seed script requires `ADMIN_PASSWORD` env var, fails if not set |
| **Product images with EXIF data** | GPS/location data leaks from DSLR photos | Strip EXIF data during image processing pipeline |
| **Missing rate limiting on checkout** | Bot floods checkout, creates Stripe sessions | Rate limit `/api/checkout` to 5 req/min per IP via Redis + nginx |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **Generic e-commerce template feel** | Artisan brand looks like a dropshipping site | Custom design tokens reflecting Neapolitan craftsmanship — warm tones, serif headings, leather texture motifs. Use the DNA Fingerprint system. |
| **No size guide on product page** | Customers buy wrong size, returns and negative reviews | Size guide PDF link + video tutorial prominently placed near size selector. Sizes 33-42 with measurement instructions. |
| **Customization options not visually previewed** | Customer doesn't understand what they're buying | Show visual swatches for leather color, icon/preview for heel type, jewelry option thumbnails. Even static images per option are better than text-only dropdowns. |
| **Prices without IVA indication** | Legal non-compliance, customer distrust | Show "€60,00 IVA inclusa" — use Italian number formatting (`Intl.NumberFormat("it-IT")`) with comma decimal separator |
| **No contact/WhatsApp on product page** | Artisan customers want to ask questions before buying | WhatsApp link (already used by the business) + phone number prominently on every page. Artisan buyers expect human interaction. |
| **English UI patterns in Italian** | "Add to Cart", "Checkout", "Sign Up" feel foreign | All UI text in proper Italian: "Aggiungi al carrello", "Procedi al pagamento", "Registrati" |
| **Slow image loading on mobile** | Mobile users (majority in Italy) bounce | Prioritize LCP image, use `fetchpriority="high"` on hero product image, skeleton loaders for product grids |
| **No breadcrumb navigation** | Users get lost in Sandali → Gioiello → Con infradito hierarchy | Breadcrumb on every page: `Home > Sandali > Gioiello > Con infradito > Sandalo [nome]` |
| **Missing "Made in Italy" trust signals** | International customers need reassurance | Certifications section (cuoio toscano certificato, Swarovski), Italian flag icon, "100% Fatto a mano a Napoli" badge |

## "Looks Done But Isn't" Checklist

- [ ] **Checkout:** Often missing webhook idempotency — verify `StripeEvent` table has unique constraint on `eventId`
- [ ] **Product customization:** Often missing price recomputation — verify total always derived server-side from options, never stored
- [ ] **Cart:** Often missing stock validation at checkout — verify inventory check happens before Stripe session creation
- [ ] **IVA/VAT:** Often missing `tax_behavior: "inclusive"` — verify Stripe session `price_data` includes it
- [ ] **GDPR:** Often missing cookie consent before any analytics load — verify Plausible/Sentry only fire after consent
- [ ] **Migration:** Often missing 301 redirects — verify old WooCommerce URLs redirect to new routes
- [ ] **Images:** Often missing WebP conversion — verify all product images have WebP variants
- [ ] **SEO:** Often missing structured data (schema.org Product) — verify JSON-LD on every product page
- [ ] **Admin:** Often missing `requireAdmin` on some routes — verify ALL `/admin/*` routes have auth guard
- [ ] **Size guide:** Often missing from product page — verify PDF download link + video on sandal pages
- [ ] **Contact info:** Often missing physical store addresses — verify both Via Chiaia and Via Schipa addresses with map
- [ ] **Email:** Often missing order confirmation — verify `checkout.session.completed` webhook triggers email

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Variant schema explosion | **HIGH** — requires data migration + Prisma schema change + API rewrite | 1. Create new `ProductOptionGroup`/`ProductOption` tables. 2. Migrate variant data to option groups. 3. Rewrite product API to use options. 4. Update admin UI. 5. Update checkout flow. Estimate: 1-2 weeks. |
| Client-side price trusted | **MEDIUM** — requires server-side validation addition | 1. Add price recomputation to checkout API. 2. Add `selectedOptionIds` to `CartItem`. 3. Verify existing orders weren't manipulated. |
| Wrong IVA handling | **MEDIUM** — affects pricing across entire site | 1. Audit all price storage (ensure IVA-inclusive cents). 2. Update Stripe `tax_behavior`. 3. Update product display templates. 4. Re-verify all prices match. |
| No 301 redirects | **MEDIUM** — SEO already degraded | 1. Map old WooCommerce URLs from sitemap/Google Search Console. 2. Create redirect map. 3. Add nginx `return 301` rules. SEO recovery takes 2-4 weeks. |
| Client-only cart | **HIGH** — requires cart rewrite | 1. Add server-side cart tables. 2. Create cart API endpoints. 3. Rewrite cart UI to use mutations + optimistic updates. 4. Handle anonymous → authenticated cart merge. |
| TanStack Start breaking update | **LOW** — if versions pinned | 1. Revert to pinned version from lockfile. 2. Test new version in branch. 3. Update only when compatibility confirmed. |
| Missing GDPR compliance | **HIGH** — legal risk | 1. Add CookieBanner with granular consent. 2. Gate analytics behind consent. 3. Add data export/delete API. 4. Add privacy policy, cookie policy, terms. 5. Log consent with timestamp and IP hash. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Variant schema explosion | Phase 1 (Schema) | Review Prisma schema — no `ProductVariant` with option columns; options are separate entities |
| Stripe dynamic pricing | Phase 2 (Checkout) | Checkout creates ephemeral `price_data`, no pre-created Stripe Prices for custom products |
| Italian IVA handling | Phase 1 (Schema) + Phase 2 | All prices stored as IVA-inclusive cents; `tax_behavior: "inclusive"` in Stripe; "IVA inclusa" displayed |
| TanStack Start version | Phase 0 (Setup) | `package.json` has pinned versions; `pnpm-lock.yaml` committed; no `latest` ranges |
| GDPR consent gating | Phase 2 (GDPR) + Phase 3 | Cart/checkout/auth work with all consent declined; analytics don't fire without consent |
| WooCommerce migration | Phase 3 (Migration) | Product count = 118; all images present; categories match; 301 redirects active |
| Cart state desync | Phase 2 (Cart) | Server recomputes price at checkout; no client-sent prices; admin price change reflected |
| Image optimization | Phase 1 (Schema) + Phase 3 | Lighthouse performance >80; all images have WebP variants; max 2MB per image |
| Security (price manipulation) | Phase 2 (Checkout) | Checkout API ignores client price; derives from DB; rate limiting active |
| UX (artisan brand feel) | Phase 1 (Design) | Design tokens reflect craftsmanship; no generic e-commerce template look |
| SEO migration | Phase 3 (Migration) | Google Search Console shows 301 redirects; no 404 spikes; product pages indexed |
| Missing trust signals | Phase 1 (Design) | "Fatto a mano a Napoli", certifications, WhatsApp visible on product pages |

## Sources

- **Stripe Checkout documentation** — https://docs.stripe.com/payments/checkout/how-checkout-works (dynamic `price_data`, tax behavior, webhook lifecycle)
- **Stripe Tax for Checkout** — https://docs.stripe.com/tax/checkout (automatic tax, `tax_behavior`, `inclusive` pricing)
- **Prisma relations documentation** — https://www.prisma.io/docs/orm/prisma-schema/data-model/relations (relation modeling patterns)
- **TanStack Start official site** — https://tanstack.com/start/latest (RC status confirmed, version stability concern)
- **Project codebase analysis** — `.planning/codebase/CONCERNS.md` (19 identified technical debt items including auth defaults, GDPR gaps, framework conflicts)
- **Italian VAT regulation** — Decreto Legge 267/2000, EU Directive 2008/8/EC (IVA-inclusive display requirement, 22% standard rate)
- **EU GDPR regulation** — Articles 6, 7, 17, 20 (consent management, right to erasure, data portability)
- **Project context** — `.planning/PROJECT.md` (118 products, 14 categories, customization requirements, WooCommerce migration)

---
*Pitfalls research for: Calzoleria Prevenzano artisanal e-commerce*
*Researched: 2026-04-02*
