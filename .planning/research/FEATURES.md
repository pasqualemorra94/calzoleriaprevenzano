# Feature Landscape

**Domain:** Artisanal Italian e-commerce — custom handmade sandals + leather goods
**Researched:** 2026-04-02
**Overall confidence:** HIGH (direct analysis of existing site + project context)

## Table Stakes

Features users expect. Missing = product feels incomplete. These are non-negotiable for a working e-commerce replacement.

### Browsing & Discovery

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Product catalog with hierarchical categories | Every e-commerce has this; current site has 3-level taxonomy (Sandali → Classica → Infradito) | Med | Categories: Sandali (Classica/Gioiello/Bambini with sub-types), Shop (Pelletteria/Accessori/Articoli calzature) |
| Product listing pages per category | Users land on category pages to browse; current site uses `/categoria-prodotto/sandali/classici/con_infradito/` | Low | Grid layout with product cards showing image, name, price |
| Product detail page (PDP) | Core of any e-commerce; current site has image gallery, pricing, options | Med | Must include image gallery, price, description, customization options, size selector, add-to-cart |
| Product image gallery | Every product has multiple photos; current site shows 3-5 images per product | Med | Zoomable main image + thumbnails. Different images per color/variant is a nice-to-have |
| Search with autocomplete | Users search by product name (all products have Italian women's names: Noemi, Margherita, etc.) | Med | Search bar in header. Current site has search with category filter |
| Category + price filters | Current site has category sidebar + price range filter | Med | Essential for browsing 118 products. Filter by collection, sub-type, price range |
| Mobile-responsive design | 60%+ of Italian e-commerce traffic is mobile | Low | Non-negotiable. Current Kapee theme is responsive but sluggish on mobile |
| "In evidenza" / featured products | Current site highlights products on homepage with "In Evidenza" badge | Low | Homepage carousel/section. Admin controls which products are featured |
| "Novità" / new arrivals | Current site has "Novità" tab showing newest products | Low | Sort by creation date, badge on product cards |
| Related products on PDP | Current site shows "Prodotti correlati" section on every product page | Low | Same category products, randomize, show 4-8 |

### Product Customization (THE core feature)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Sandal configurator: leather type** | Current site offers 3 leather types (Laminato, Liscio, Pitone Stampato) per braid zone | High | Leather type determines which color palette is available. Different products have different leather options |
| **Sandal configurator: color swatches** | Current site shows ~30+ colors per leather type with thumbnail images | High | Color swatches with small thumbnail images. Different palettes per leather type. Per braid zone on some products |
| **Sandal configurator: heel selection** | Current site offers: No tacco (€0), Tacco 2.5cm (+€10), Tacco 5cm (+€10) | Med | Image-based selector with price modifier. Visual thumbnail of each heel type |
| **Sandal configurator: jewelry selection** | Gioiello products offer jewelry variants (Viola, Verde, Red, Cristal, Black) | Med | Image swatches. Only appears for Gioiello collection products |
| **Sandal configurator: size selector** | All sandals require size (32-42). Link to size guide | Low | Dropdown 32-42. Link to /guida-alla-taglia from the selector |
| **Sandal configurator: custom notes** | Current site has free-text "Note" field for extra customizations | Low | Simple textarea. Passes to order as line item metadata |
| Dynamic price calculation | Heel adds €10; base price varies per product. Total updates live | Med | "Prezzo opzioni: €0 → Prezzo Prodotto: €70 → Totale: €80" pattern from current site |
| **Configurator varies by product type** | Classica has 3 braid color zones × leather type; Gioiello has jewelry choice; Bambini is simpler | High | THE hardest data model challenge. Not all products have same options. Config must be per-product-type |

### Cart & Checkout

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Shopping cart (guest + registered) | Table stakes for e-commerce. Current site supports both | Med | Persistent cart for logged-in users. Guest cart via session/cookie |
| Cart with variant details | Customized sandals must show selected options in cart line items | Med | Must show: leather type, colors, heel, size, notes per item |
| Stripe payment integration | Already decided in PROJECT.md. Standard for Italian e-commerce | High | Cards + optional Apple Pay / Google Pay via Stripe |
| Checkout flow (shipping + billing) | Required to complete orders | High | Italian address format, international shipping support |
| Order confirmation page + email | Users expect confirmation after payment | Med | Email with order details, customization summary |
| Guest checkout (no forced registration) | Reduces cart abandonment. Current site allows it | Med | Option to create account after purchase |
| IVA (VAT) calculation | Italian law requires 22% IVA. Prices shown are IVA inclusa | Med | Current site shows prices IVA inclusa. Prices €20-170 range |
| Shipping zones & rates | Ships worldwide from Italy. Needs zone-based shipping | Med | Italy, EU, Rest of world at minimum. Possibly weight-based |

### User Accounts

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Registration / Login | Current site has WooCommerce account system | Med | Email + password. Better Auth already in stack |
| Order history | Users need to see past orders and statuses | Low | List of orders with status, detail view with items |
| Saved addresses | Reduces friction for repeat purchases | Low | Italian + international address format |
| Wishlist / Preferiti | Current site has "Lista dei desideri" with heart icon on every product | Med | Save/unsave products. Dedicated /account/wishlist page |
| Password reset | Standard auth flow | Low | Email-based reset |

### Admin / Content Management

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Product CRUD (create, read, update, delete) | ~118 products to manage, new ones added regularly | High | Admin must manage products with all variant/customization options |
| Category management | Hierarchical categories with 3 levels | Med | Parent/child categories. Slug-based URLs |
| Order management | View orders, update status, process shipments | Med | Order list, detail view, status transitions |
| Product image upload | Multiple images per product + variant swatch images | Med | Image upload for product gallery + color swatch thumbnails |
| Manage customization options per product | Different products have different options (Classica vs Gioiello vs Shop) | High | The hardest admin feature. Must support per-product-type option schemas |

### Legal & Compliance

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Cookie consent banner | EU/Italy GDPR requirement. Current site has "Avviso sui cookie" | Low | Simple accept banner. Cookie policy page |
| Privacy policy page | GDPR requirement. Current site has /privacy-policy-2/ | Low | Static page with legal text |
| Terms and conditions | Italian e-commerce requirement. Current site has /termini-e-condizioni-duso/ | Low | Static page with legal text |
| P.Iva display | Italian law: P.Iva 04590921211 must be visible. Current site shows in footer | Low | Footer element |
| GDPR data handling | User data must be handled per GDPR (export, delete) | Med | Account deletion, data export |

### Brand & Story

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Chi Siamo (About) page | Current site has rich story: founded 1984, family team, craftsmanship heritage | Low | Static page with story, team photos (Vincenzo, Nunzio, Francesca) |
| Size guide page | Current site has /guida-alla-taglia with PDF downloads per size (33-42) + video tutorial | Med | Size table + downloadable PDFs + embedded video tutorial |
| Contact page with two stores | Two physical stores: Via Chiaia 104 and Via Schipa 111, Napoli | Med | Map embed, phone numbers, email, form |
| Footer with business info | Current site has contact info, social links, P.Iva, legal links | Low | Standard footer |

## Differentiators

Features that set the product apart from a generic e-commerce rebuild. These elevate the experience beyond what the current WooCommerce site offers.

### High-Value Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Visual product configurator with live preview** | Customers see their sandal being built in real-time as they pick colors, heel, jewelry — dramatically reduces uncertainty and increases conversion | Very High | This is THE differentiator. Current site uses static color swatches with no visual preview. A step-by-step configurator with visual feedback (even just color-block previews) would be transformative |
| **Step-by-step customization wizard** | Breaks the overwhelming 30+ color options into a guided flow: Step 1: Choose style → Step 2: Pick leather → Step 3: Choose colors → Step 4: Select heel → Step 5: Pick size. Reduces cognitive load | High | Current Noemi product page dumps ALL options at once (3 leather types × 3 braid zones × 30 colors = 270+ choices visible). A wizard makes this manageable |
| **"Made in Italy" trust signals throughout** | Material certifications (Cuoio Toscano, Swarovski), family story, workshop imagery build trust for international customers | Low | Badges, icons, and copy throughout the site. Certificate images in product pages |
| **WhatsApp integration for custom orders** | Italian customers heavily use WhatsApp. Current site links to wa.me/0810410442. A WhatsApp chat button for custom inquiries adds a personal touch | Low | WhatsApp Business API link or floating chat button |
| **Instagram feed / gallery** | Show real customer photos wearing the sandals. Current site links to @calzoleria_prevenzano Instagram | Med | Embed Instagram posts or create a curated gallery page |
| **Collection-based navigation** | Instead of generic category pages, treat Classica, Gioiello, Bambini as curated collection landing pages with hero images and mood | Med | Current site already shows collection cards on homepage. Elevate this with dedicated collection pages with editorial feel |

### Medium-Value Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Product comparison** | "Compare Noemi vs Giulia side by side" — helpful when all products are named after Italian women and users can't distinguish them | Med | Select 2-3 products, compare features/images/prices in a table |
| **"How it's made" content section** | Show the craftsmanship process: cutting leather, braiding, adding jewelry. Builds perceived value and justifies pricing | Low | Photo series or short video on Chi Siamo or a dedicated page |
| **Stock / availability indicators** | Since each sandal is handmade, showing "Disponibile" or lead times adds transparency | Low | Simple badge: "Disponibile" / "Tempo di lavorazione: 5-7 giorni" |
| **Share on WhatsApp / Facebook** | Current site has social sharing buttons on product pages. Keep and improve | Low | Pre-filled message with product name, link, and selected customization summary |
| **Quick view / modal product preview** | Current site has "Guarda velocemente" quick view. Reduces clicks for browsing | Med | Modal overlay showing product image, price, and key options without leaving listing page |
| **Newsletter signup with Mailchimp/Resend** | Collect emails for new collection launches. Artisanal fashion has seasonal drops | Low | Simple email capture in footer or exit-intent popup |

## Anti-Features

Features to explicitly NOT build. These add complexity without proportional value for this specific business.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Product reviews/ratings** | Deferred to v2 per PROJECT.md. Artisanal products sell on trust/craftsmanship, not volume reviews. 118 products = few reviews per product = looks empty. | Collect testimonials for Chi Siamo page. Add reviews in v2 when there's enough volume |
| **Blog / editorial content** | Explicitly out of scope per PROJECT.md. The family runs a workshop, not a content team. | Static "How it's made" section is sufficient. Blog can come later if they want it |
| **Multi-language (v1)** | Out of scope per PROJECT.md. Italian-only for v1. | Build i18n-ready (translatable strings) but only ship Italian. Add English in v2 |
| **3D product configurator** | Overkill for v1. Requires 3D models of every product, expensive to produce and maintain. 82 sandal models × multiple angles = massive asset creation | Use 2D color-block previews or static images per variant combination. 3D is a v3 ambition |
| **Loyalty / rewards program** | Deferred to v2 per PROJECT.md. Low purchase frequency (sandals are seasonal) means points accrue slowly. | Simple newsletter for retention. Loyalty in v2 if justified |
| **Mobile app** | Out of scope per PROJECT.md. Web-first approach. | Excellent responsive PWA-quality mobile web experience |
| **Marketplace / multi-vendor** | Single artisan shop, not a platform. | Single-seller e-commerce only |
| **Subscription products** | Sandals and leather goods are one-time purchases, not recurring | One-time purchases only |
| **Live chat widget** | Team is busy making sandals, not staffing a chat. WhatsApp is already their preferred channel | WhatsApp button + contact form. Add chat only if they request it |
| **AI-powered recommendations** | Overkill for 118 products. Users will browse the catalog naturally | "Prodotti correlati" (related products from same category) is sufficient |
| **Augmented reality try-on** | Technology not mature for sandals, massive asset investment | Clear product photos + size guide with PDF downloads |
| **Social login (Google, Facebook)** | Nice-to-have but adds complexity for small benefit with Italian customer base. Registration is simple enough | Email + password auth via Better Auth. Social login as v2 enhancement |
| **Inventory management with real-time stock** | Products are made-to-order/customized. Traditional "X in stock" doesn't apply to sandals. Shop products (borselli, cinture) have small batches | Simple "Disponibile / Su ordinazione" status per product. Detailed inventory tracking in v2 |
| **Discount code engine** | Current site doesn't appear to use discount codes. Artisanal brand doesn't discount heavily | Hardcode any needed promotions. Full discount engine in v2 if needed |

## Feature Dependencies

```
Product Data Model → Product Customization Configurator (needs schema)
Product Customization → Cart (cart must store customization choices)
Product Customization → Dynamic Pricing (heel adds €10)
Cart → Checkout (checkout processes cart)
Checkout → Stripe Integration (payment processing)
Checkout → Order Management (orders from checkout)
User Auth → Wishlist (needs user identity)
User Auth → Order History (needs user identity)
User Auth → Saved Addresses (needs user identity)
Admin Product CRUD → Product Customization Options (admin manages options)
Category System → Product Listing Pages (navigation depends on taxonomy)
Size Guide → Product Detail Page (link from size selector)
Stripe Webhooks → Order Status Updates (payment confirmation → status change)
```

### Critical Path (build order)

```
1. Database schema (products, categories, variants, options)
   → 2. Product catalog + category pages
   → 3. Product detail page with static options
   → 4. Sandal configurator (leather/color/heel/jewelry/size)
   → 5. Cart with customization line items
   → 6. Checkout + Stripe
   → 7. Order management + confirmation emails
   → 8. User accounts (auth, orders, addresses, wishlist)
   → 9. Admin dashboard (products, categories, orders)
   → 10. Brand pages (Chi Siamo, Guida Taglia, Contatti)
   → 11. Legal pages + GDPR compliance
```

## Product Customization Data Model (Detailed)

This is the most complex feature. Based on analysis of the existing site, here's what the data model must support:

### Product Types and Their Customization Options

**Classica Collection (€60-100):**
- Leather type per braid zone (Laminato / Liscio / Pitone Stampato) — 3 zones
- Color per zone — depends on leather type (Liscio: ~30 colors, Laminato: ~11, Pitone: 4)
- Heel selection (No tacco / Tacco 2.5cm +€10 / Tacco 5cm +€10)
- Size (32-42)
- Custom notes

**Gioiello Collection (€110-170):**
- Jewelry variant (product-specific: Viola, Verde, Red, Cristal, Black, etc.) — with image
- Leather type + color (depends on sub-type: Infradito, Cavigliera, Fasce, Strass)
- Heel selection (same options)
- Size (32-42)
- Custom notes

**Bambini Collection (€50):**
- Simpler: color selection + size (smaller range)
- Optional heel

**Shop Products (€20-50):**
- Simple variants (color for borselli, size for cinture)
- No customization

### Recommended Data Model Approach

Use a **flexible product options system** rather than hardcoding per-type:

```
ProductOptionGroup (e.g., "Leather Type - First Braid", "Heel", "Jewelry", "Size")
  → ProductOption (e.g., "Laminato", "Liscio", "Pitone Stampato")
    → ProductOptionValue (e.g., color swatches with images + conditional display)
      → Can have price modifier (e.g., +€10 for heel)
    → Conditional rules: "Show these colors when Liscio is selected"
```

This allows the admin to configure different option schemas per product type without code changes.

## MVP Recommendation

### Phase 1 — Core E-Commerce (MUST ship first)
1. Product catalog with categories (all 118 products browsable)
2. Product detail page with image gallery
3. **Sandal configurator** with step-by-step wizard (leather → color → heel → size)
4. Cart with customization line items
5. Checkout with Stripe (Italy + international shipping)
6. Order confirmation + email notifications
7. Basic admin: product CRUD, order management

### Phase 2 — User Experience
1. User accounts (auth, order history, addresses)
2. Wishlist
3. Guida alla taglia (size guide with PDFs)
4. Chi Siamo page
5. Contact page with two stores
6. Legal pages + GDPR

### Phase 3 — Polish & Differentiation
1. Visual configurator improvements (color-block preview)
2. WhatsApp integration
3. Instagram gallery
4. Collection landing pages
5. Newsletter signup
6. Quick view modal
7. Share on social with customization summary

### Defer to v2+
- Product reviews
- Multi-language (English)
- Loyalty program
- Discount codes engine
- Social login
- Advanced inventory tracking

## Complexity Hotspots

These features have outsized complexity and should be planned carefully:

1. **Sandal Configurator (VERY HIGH)** — The crown jewel and the hardest feature. 3 product types with different option schemas, conditional logic (leather type → color palette), multiple braid zones, price modifiers. Start with a flexible schema, not hardcoded options.

2. **Product Data Model (HIGH)** — Must handle 82 customizable sandals + 36 simple shop products. Different option schemas per product type. Color swatch images. Variant combinations that don't explode (don't create SKU for every possible combination).

3. **Stripe + International Shipping (HIGH)** — Stripe integration with EUR, webhook handling, shipping zones (Italy/EU/world), VAT handling for EU vs non-EU.

4. **Admin Product Management (HIGH)** — Non-technical users must be able to add new products with complex customization options. This UI is harder than the storefront.

5. **Data Migration (MED-HIGH)** — 118 products with images, categories, and option schemas must migrate from WooCommerce. Plan a migration script early.

## Sources

- **Direct analysis** of calzoleriaprevenzano.it (existing WooCommerce site) — HIGH confidence
  - Homepage: catalog structure, hero slider, featured products, collection cards
  - Product page (Noemi - Classica): 3 braid zones × 3 leather types × 30+ colors, heel options, size 32-42, custom notes
  - Product page (Margherita - Gioiello): jewelry variants with image swatches, heel options, size 32-42
  - Chi Siamo page: founding story 1984, team (Vincenzo/Nunzio/Francesca), certifications
  - Guida alla taglia: PDF downloads per size 33-42, video tutorial, measurement instructions
  - Category taxonomy: Sandali → Classica/Gioiello/Bambini → sub-types; Shop → Pelletteria/Accessori/Solette
- **PROJECT.md** — project requirements, constraints, decisions — HIGH confidence
- **site-generator-agents/02-site-types.md** — e-commerce site type definition with standard features — HIGH confidence
- **Training data** on artisanal e-commerce patterns — MEDIUM confidence (general knowledge, not source-specific)
