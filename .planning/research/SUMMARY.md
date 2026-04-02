# Project Research Summary

**Project:** Calzoleria Prevenzano — Artisanal Italian E-Commerce
**Domain:** Customizable artisanal sandals & leather goods e-commerce
**Researched:** 2026-04-02
**Confidence:** HIGH

## Executive Summary

Calzoleria Prevenzano is an artisanal Italian e-commerce replacement for an existing WooCommerce site selling custom handmade sandals and leather goods from Naples. The product has ~120 SKUs across three product types (Classica, Gioiello, Bambini sandals plus simple Shop products), with the crown jewel feature being a multi-axis sandal configurator where customers choose leather type, color per braid zone, heel height, and jewelry decorations. This is not a standard catalog e-commerce — it's a made-to-order customization platform disguised as a shop.

The recommended approach is a full-stack TanStack Start monolith with PostgreSQL, Better Auth, and Stripe Payments. The architecture uses a layered service pattern (routes → server functions → service layer → Prisma) with strict import boundaries. The single hardest technical challenge is the product customization data model — it must use independent `ProductOption` groups rather than combinatorial `ProductVariant` rows to avoid a schema explosion of ~47,000+ rows. Prices are always computed server-side from selected options, never trusted from the client. Stripe uses ephemeral `price_data` inline in Checkout Sessions rather than pre-created Price objects.

Key risks are: (1) TanStack Start is RC-stage — version pinning is mandatory from day one, (2) Italian IVA (22% VAT) must be displayed inclusively on all prices and configured correctly in Stripe, (3) WooCommerce data migration of 118 products with images, categories, and custom attributes requires a direct database query approach (not CSV export), and (4) GDPR cookie consent must never gate essential functionality (auth, cart, checkout). The phase ordering prioritizes getting the data model right first, then building the customization configurator as the core differentiator before moving to checkout and payments.

## Key Findings

### Recommended Stack

The stack is a modern TypeScript-first full-stack on TanStack Start (RC) with PostgreSQL 16, Prisma 7 ORM, Better Auth for authentication, Stripe for payments (EUR, SCA-compliant), Resend + React Email for transactional emails, shadcn/ui + Tailwind CSS v4 for the UI, and Sharp for server-side image processing. All prices stored as integer cents (IVA-inclusive).

**Core technologies:**
- **TanStack Start 1.167.x**: Full-stack React framework with file-based routing, SSR, and type-safe server functions — the project mandate
- **Prisma 7.6.x**: Type-safe ORM with `prisma.config.ts` — Better Auth has an official adapter with CLI schema generation
- **Better Auth 1.5.x**: Framework-agnostic auth with Prisma adapter, plugin ecosystem, role-based guards
- **Stripe 21.x**: Payments with PaymentIntents (EU SCA compliance), webhook-first confirmation, `price_data` for dynamic pricing
- **Tailwind CSS 4.2.x**: v4 uses CSS-first config (`@import "tailwindcss"`), no `tailwind.config.ts`
- **shadcn/ui**: Copy-paste accessible components on Radix UI — install via CLI, no lock-in

### Expected Features

**Must have (table stakes):**
- Product catalog with hierarchical categories (Sandali → Classica/Gioiello/Bambini; Shop → Pelletteria/Accessori)
- Product detail page with image gallery and sandal configurator (leather type, color swatches, heel, jewelry, size, custom notes)
- Dynamic price calculation (base + option surcharges, updated live)
- Shopping cart (guest + registered) with customization line items and guest→auth merge on login
- Stripe checkout with EUR support, international shipping zones, webhook confirmation
- Order confirmation page + email
- User accounts (order history, saved addresses, wishlist)
- Admin dashboard (product CRUD with customization config, order management, category management)
- Legal pages (privacy, cookie policy, terms), GDPR consent, P.Iva in footer
- Chi Siamo, Guida Taglie (size guide with PDFs + video), Contact page with two stores
- Mobile-responsive design (60%+ Italian e-commerce traffic is mobile)

**Should have (differentiators):**
- Step-by-step customization wizard (guided flow instead of overwhelming all options at once)
- Visual product configurator with live preview (color-block preview of sandal as options are selected)
- Collection-based navigation (curated landing pages for Classica, Gioiello, Bambini)
- "Made in Italy" trust signals (certifications, workshop imagery)
- WhatsApp integration for custom inquiries (already used by the business)

**Defer (v2+):**
- Product reviews/ratings
- Multi-language (English)
- Loyalty/rewards program
- Discount code engine
- Social login (Google, Facebook)
- 3D product configurator
- Blog/editorial content

### Architecture Approach

A full-stack TanStack Start monolith with a strict layered architecture: routes handle HTTP concerns, server functions provide type-safe RPC, services encapsulate business logic, and Prisma handles data access. No microservices — a single VPS deployment with nginx, pm2, and Docker PostgreSQL. Component boundaries follow a unidirectional flow: Route Pages → Section/Feature Components → UI Components (shadcn/ui). Server code (`.server.ts`) is never imported from client code.

**Major components:**
1. **Routing Layer** (`app/routes/`) — File-based routing with TanStack Router, route loaders for SSR data, `beforeLoad` guards for auth
2. **Service Layer** (`app/services/*.server.ts`) — Business logic: products, cart, orders, checkout, customization validation, wishlist
3. **Feature Composites** (`app/components/features/`) — Domain-specific component groups: customization/, cart/, checkout/, admin/
4. **Auth Layer** (`app/lib/auth.server.ts`) — Better Auth with session management, role guards (customer vs admin), guest session handling
5. **Integration Layer** — Stripe (payments + webhooks), Resend (emails), Sharp (image pipeline)

### Critical Pitfalls

1. **Product Variant Schema Explosion** — Model customizations as independent `ProductOption` groups, NOT combinatorial variant permutations. 82 sandals × options = ~47,000 variant rows if done wrong. Use option groups with price modifiers; compute total at order time.
2. **Stripe Dynamic Pricing** — Use `price_data` inline in Checkout Session creation. Never pre-create Stripe Price objects for custom products. Always recompute price server-side from product ID + option IDs.
3. **Italian IVA (VAT) Handling** — Store all prices as IVA-inclusive cents. Set `tax_behavior: "inclusive"` in Stripe. Display "IVA inclusa" near every price. 22% standard rate.
4. **TanStack Start RC Version Volatility** — Pin exact versions in `package.json` (never `latest` or `^`). Commit lockfile. Never upgrade mid-phase.
5. **WooCommerce Migration Data Loss** — Query the WordPress MySQL database directly (not CSV export). Download images, map category hierarchy, create 301 redirects for SEO.
6. **Cart State Desync** — Server-side cart only. Client optimistic updates via TanStack Query mutations. Price always recomputed server-side at checkout. No localStorage cart.
7. **GDPR Consent Gating Essential Features** — Auth, cart, and checkout must work with all consent declined. Only analytics/marketing is gated. Essential cookies are always active.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & Data Model
**Rationale:** Everything depends on a correct database schema and project scaffolding. The product option model is the single most important architectural decision — getting it wrong requires a full rewrite. Design tokens and layout primitives establish the visual language.
**Delivers:** Project scaffold, PostgreSQL via Docker, Prisma schema (with option groups, not variant explosion), root layout (Navbar + Footer shells), shadcn/ui setup, design tokens, seed data (admin user + categories).
**Addresses:** Product catalog schema, category hierarchy, basic routing.
**Avoids:** Pitfall 1 (variant schema explosion) — option groups from day one; Pitfall 3 (IVA) — cents convention from day one.

### Phase 2: Authentication & User Sessions
**Rationale:** Cart merge requires guest→auth session linking; checkout requires user identification; admin routes require role guards. Auth is a dependency for everything downstream.
**Delivers:** Better Auth setup, login/register/forgot-password routes, `beforeLoad` route guards (`requireUser`, `requireAdmin`), guest session management via cookies.
**Uses:** Better Auth + Prisma adapter, Zod validators.
**Implements:** Auth layer from architecture, protected route pattern.

### Phase 3: Product Catalog & Browsing
**Rationale:** Products are the foundation of every e-commerce feature. Customers must be able to browse before they can customize, add to cart, or checkout.
**Delivers:** Product listing page with filters/sort/pagination, category pages, product detail page with image gallery, search, product components (ProductCard, ProductGrid, ProductGallery, ProductFilters), SEO meta + JSON-LD.
**Uses:** Prisma `include` queries, TanStack Router loaders with prefetch, Sharp for image variants.
**Avoids:** Pitfall 8 (image optimization) — Sharp pipeline from the start.

### Phase 4: Sandal Configurator (Core Differentiator)
**Rationale:** THE hardest and most valuable feature. Must support 3 product types with different option schemas, conditional logic (leather type → color palette), multiple braid zones, and dynamic pricing. Start with flexible schema, not hardcoded options.
**Delivers:** CustomizationPicker orchestrator, TaccoSelector, PelleSelector, ColoreSelector, GioielloSelector, CustomizationSummary with live price computation, Zod validators for customization options, admin UI for managing option configs per product.
**Uses:** TanStack Form for wizard flow, Zod shared validators, Framer Motion for step transitions.
**Implements:** Customization service layer, feature composite component pattern.
**Avoids:** Pitfall 1 (schema explosion) — option groups validated; client-side price shown but never trusted.

### Phase 5: Shopping Cart
**Rationale:** Cart must exist before checkout. Must store customization choices per line item and support guest→auth merge. Server-side cart is non-negotiable for payment security.
**Delivers:** Cart service (add, remove, update, merge), CartDrawer slide-out, Cart page (`/carrello`), AddToCartButton, `useCart` hook with TanStack Query mutations + optimistic updates, guest cart merge on login.
**Avoids:** Pitfall 7 (cart state desync) — server-side cart with optimistic client updates.

### Phase 6: Checkout, Payments & Orders
**Rationale:** The revenue-generating path. Must be correct before anything else matters. Stripe integration with webhooks, IVA handling, and order confirmation.
**Delivers:** Stripe setup, checkout page, address form, Stripe Checkout Session creation with `price_data`, webhook handler (signature verification, idempotency), order confirmation page + email via Resend, admin order management.
**Uses:** Stripe SDK (server + client), Resend + React Email, Zod validators.
**Implements:** Webhook-first payment pattern, standardized API responses.
**Avoids:** Pitfall 2 (Stripe dynamic pricing) — `price_data` inline; Pitfall 3 (IVA) — `tax_behavior: "inclusive"`, server-computed totals.

### Phase 7: Content Pages & SEO
**Rationale:** Brand pages (Chi Siamo, Guida Taglie, Contatti) are independent of e-commerce flow and can be built once the layout and routing exist. Homepage ties everything together.
**Delivers:** Homepage (Hero, CategoryGrid, FeaturedProducts, ArtisanStory), Chi Siamo page, Contatti page with form + two stores, Guida Taglie page, legal pages (privacy, cookie policy, terms), cookie consent banner, dynamic sitemap.xml, robots.txt, social sharing + Open Graph.
**Uses:** TanStack Router route config for meta tags, JSON-LD structured data components.

### Phase 8: Account Features & Wishlist
**Rationale:** Enhances repeat purchase experience. Depends on auth (Phase 2) and products (Phase 3).
**Delivers:** Account dashboard, order history with detail view, saved addresses, wishlist page with heart icons on ProductCards, password reset flow.

### Phase 9: Admin Dashboard
**Rationale:** Admin CRUD doesn't block customer-facing features but needs products and orders to manage. Build after the storefront is functional.
**Delivers:** Admin layout with sidebar, product CRUD with image upload and customization config, category CRUD (hierarchical), order management (view, status updates), admin dashboard home (stats, recent orders).
**Uses:** shadcn/ui Table, Form, Dialog components, Sharp for image processing on upload.

### Phase 10: WooCommerce Migration & Launch Polish
**Rationale:** Migration is a one-time operation best done when the new site is feature-complete. Final polish ensures production readiness.
**Delivers:** Migration script (WordPress DB → Prisma), 301 redirect map, GDPR data export/delete endpoints, consent logging, performance audit (Lighthouse), accessibility audit, error pages (404, 500), loading skeletons, mobile responsiveness pass.
**Avoids:** Pitfall 6 (WooCommerce migration data loss) — direct DB query approach; Pitfall 5 (GDPR consent gating) — verify essential features work with all consent declined.

### Phase Ordering Rationale

- **Data model before everything** — the option group schema is the foundation that products, customization, cart, and checkout all depend on. Getting it wrong is unrecoverable.
- **Auth before cart/checkout** — cart merge requires guest→auth session linking; checkout requires user identification.
- **Products before customization** — customization extends the product model; you need basic products rendering first.
- **Configurator before cart** — the sandal configurator is what gets added to cart; cart must understand customization line items.
- **Cart before checkout** — checkout processes cart contents.
- **Admin last (but important)** — admin CRUD is important for content management but doesn't block the customer-facing purchase flow.
- **Migration last** — move data when the destination is fully functional and tested.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Sandal Configurator):** Complex conditional UI logic, multiple product types with different option schemas. The step-by-step wizard pattern for product customization needs detailed UX research.
- **Phase 6 (Checkout & Payments):** Stripe Checkout Session creation with dynamic `price_data`, webhook idempotency, Italian tax codes. Integration has many edge cases.
- **Phase 10 (Migration):** WordPress database schema is complex; product attributes and variation meta need direct DB query scripts. SEO redirect mapping requires old URL inventory.

Phases with standard patterns (skip deep research):
- **Phase 1 (Foundation):** Well-documented TanStack Start scaffolding, Prisma setup, Docker PostgreSQL.
- **Phase 2 (Auth):** Better Auth has clear docs and Prisma adapter with CLI schema generation.
- **Phase 3 (Catalog):** Standard e-commerce listing/filtering with well-known patterns.
- **Phase 5 (Cart):** Standard server-side cart with TanStack Query mutations — established pattern.
- **Phase 7 (Content):** Static pages with TanStack Router — straightforward.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified via `npm view` on 2026-04-02. TanStack Start RC but API stable. Prisma 7, Better Auth, Stripe all have current docs. |
| Features | HIGH | Direct analysis of existing WooCommerce site (calzoleriaprevenzano.it). 118 products analyzed, customization options catalogued per product type. |
| Architecture | HIGH | TanStack Start patterns from project module docs. Layered service architecture well-established. Directory structure and data flow mapped. |
| Pitfalls | HIGH | Domain-specific pitfalls verified against Stripe docs, Italian VAT law, GDPR regulation, and TanStack Start RC status. |

**Overall confidence:** HIGH

### Gaps to Address

- **TanStack Start RC stability:** The framework is pre-1.0. While the API is considered stable, there may be undocumented edge cases with SSR, server functions, or Vinxi build pipeline. Mitigate with version pinning and lockfile checkpoint after Phase 1.
- **Customization UX research:** The step-by-step wizard pattern for a 3-braid-zone sandal configurator is unusual. No direct reference implementation found. The UX flow (which options in which order, how to show conditional color palettes) needs design validation during Phase 4 planning.
- **WooCommerce custom fields mapping:** The exact structure of product attributes, variation meta, and custom fields in the existing WordPress database is unknown without direct DB access. The migration script must be built incrementally with live data verification.
- **International shipping rates:** Shipping zones (Italy/EU/world) and rate calculation need business input from Calzoleria Prevenzano. The technical implementation is straightforward once rates are defined.
- **Production deployment specifics:** nginx + pm2 configuration for TanStack Start/Vinxi is not extensively documented. May need custom server.ts configuration for production.

## Sources

### Primary (HIGH confidence)
- **TanStack Start docs** — https://tanstack.com/start/latest/docs/framework/react/overview (RC stage, API stable)
- **Better Auth docs** — https://www.better-auth.com/docs/introduction (v1.5, Prisma adapter with joins)
- **Prisma 7 docs** — https://prisma.io/docs/orm/overview/introduction (v7 with `prisma.config.ts`)
- **Stripe Node.js SDK** — https://www.npmjs.com/package/stripe (v21, PaymentIntents API, `price_data`)
- **Stripe Tax for Checkout** — https://docs.stripe.com/tax/checkout (automatic tax, `inclusive` pricing)
- **Resend SDK** — https://resend.com/docs/send-with-nodejs (v6, React Email integration)
- **React Email** — https://react.email/docs/introduction (v5)
- **Sharp** — https://sharp.pixelplumbing.com/ (v0.34, image processing)
- **Direct site analysis** — calzoleriaprevenzano.it (product pages, categories, customization options)
- **Project context** — `.planning/PROJECT.md` (requirements, constraints, decisions)
- **Project codebase** — `.planning/codebase/CONCERNS.md` (19 identified technical debt items)
- **Site generator modules** — `site-generator-agents/modules/` (framework, auth, payments, database, email, GDPR, SEO)

### Secondary (MEDIUM confidence)
- **TanStack Start framework module** — `site-generator-agents/modules/framework-tanstack.md` (project-specific patterns)
- **E-commerce site type definition** — `site-generator-agents/02-site-types.md` (standard e-commerce feature set)
- **Italian VAT regulation** — Decreto Legge 267/2000, EU Directive 2008/8/EC (IVA-inclusive display requirement)

### Tertiary (LOW confidence)
- **Artisanal e-commerce UX patterns** — General training data on customization wizard flows; no direct reference implementation for multi-zone sandal configurator

---
*Research completed: 2026-04-02*
*Ready for roadmap: yes*
