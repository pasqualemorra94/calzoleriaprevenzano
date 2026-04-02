# Architecture Patterns

**Domain:** Artisanal Italian e-commerce (Calzoleria Prevenzano)
**Researched:** 2026-04-02
**Overall confidence:** HIGH

## Recommended Architecture

**Pattern:** Full-stack TanStack Start monolith with layered server architecture and file-based routing. No microservices — a single deployable unit with clear internal boundaries.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  BROWSER / CLIENT                                                              │
│                                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ TanStack      │  │ TanStack      │  │ React         │  │ Client Hooks     │   │
│  │ Router        │  │ Query         │  │ Components    │  │ (useCart, etc.)  │   │
│  │ (navigation)  │  │ (cache/state) │  │ (UI/pages)    │  │                  │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
│         │                 │                  │                    │              │
│         └────────────┬────┴──────────────────┴────────────────────┘              │
│                      │ RPC / Navigation                                        │
└──────────────────────┼───────────────────────────────────────────────────────────┘
                       │
┌──────────────────────┼───────────────────────────────────────────────────────────┐
│  TANSTACK START SERVER (SSR + API)                                              │
│                      │                                                          │
│  ┌───────────────────┴────────────────────────────────────────────────────────┐  │
│  │  ROUTING LAYER                                                            │  │
│  │  app/routes/                                                              │  │
│  │  ├── __root.tsx .............. Root layout (Navbar + Footer + Outlet)      │  │
│  │  ├── Page routes ............. UI pages with loaders (SSR data)            │  │
│  │  ├── _auth.*.tsx ............. Auth pages (login, register)                │  │
│  │  ├── account.*.tsx ........... Protected customer pages                     │  │
│  │  ├── admin.*.tsx ............. Protected admin dashboard                    │  │
│  │  └── api/ .................... JSON API endpoints + webhooks                │  │
│  └─────────────────────┬──────────────────────────────────────────────────────┘  │
│                        │ Route loaders call server functions                      │
│                        │ API routes call service layer                            │
│                        ▼                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────┐    │
│  │  SERVICE LAYER (server-only, .server.ts)                                │    │
│  │  app/services/                                                           │    │
│  │  ├── products.server.ts ...... Product catalog, filtering, search         │    │
│  │  ├── cart.server.ts ........... Cart CRUD, guest + auth                   │    │
│  │  ├── orders.server.ts ........ Order lifecycle, status transitions         │    │
│  │  ├── checkout.server.ts ...... Stripe Checkout Session creation            │    │
│  │  ├── customization.server.ts . Sandal configuration validation            │    │
│  │  ├── wishlist.server.ts ...... Wishlist CRUD                              │    │
│  │  └── contact.server.ts ....... Contact form handling + email              │    │
│  └─────────────────────┬──────────────────────────────────────────────────────┘  │
│                        │ All DB access goes through here                          │
│                        ▼                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────┐    │
│  │  DATA ACCESS LAYER                                                       │    │
│  │  ├── Prisma Client (singleton) ........ Type-safe DB queries              │    │
│  │  ├── prisma/schema.prisma .............. Data model definitions           │    │
│  │  └── prisma/seed.ts .................... Initial data + admin user        │    │
│  └──────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ┌──────────────────────────┐  ┌─────────────────────────────────────────────┐  │
│  │  AUTH LAYER              │  │  INTEGRATION LAYER                          │  │
│  │  Better Auth             │  │  ├── Stripe (payments + webhooks)           │  │
│  │  ├── Session management  │  │  ├── Resend (transactional emails)         │  │
│  │  ├── Email/password      │  │  └── Upload storage (product images)       │  │
│  │  ├── OAuth (opt.)        │  │                                              │  │
│  │  └── Role guards         │  │                                              │  │
│  └──────────────────────────┘  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  PostgreSQL 16                                                                  │
│  Products, Categories, Orders, Users, Sessions, Cart, Wishlists...             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Why This Architecture

**Monolith over microservices:** Calzoleria Prevenzano is a single-artisan shop with ~120 SKUs and modest traffic. A monolith eliminates network latency between services, simplifies deployment to a single VPS, and keeps the codebase maintainable for a small team. Microservices would add complexity (service discovery, distributed transactions) with zero benefit at this scale.

**TanStack Start over Next.js/Nuxt:** The project mandates TanStack Start. It provides file-based routing via `@tanstack/router-plugin/vite` (auto-generates `routeTree.gen.ts`), server functions via `createServerFn`, API routes via `createAPIFileRoute`, and SSR out of the box. This is the right tool — type-safe end-to-end, no need for a separate API layer since server functions run on the same process.

**Layered services over route-inline logic:** Every route delegates business logic to `app/services/*.server.ts`. Routes handle HTTP concerns (parsing, validation, response shaping); services handle business rules (pricing, inventory, customization constraints). This separation means routes stay under 150 LOC and business logic is testable in isolation.

---

## Component Boundaries

### Component Map

| Component | Responsibility | Communicates With | Files |
|-----------|---------------|-------------------|-------|
| **Router** | File-based routing, URL → page mapping, code splitting | Browser, Route Loaders | `app/routes/**` |
| **Route Pages** | Page-level UI, compose sections, define loaders | Router, Components, Server Functions | `app/routes/*.tsx` |
| **UI Components** | Atomic, reusable UI primitives (shadcn/ui) | Route Pages, Feature Composites | `app/components/ui/**` |
| **Layout Components** | Navbar, Footer, MobileMenu — persistent across pages | Root Route, Auth State | `app/components/layout/**` |
| **Section Components** | Homepage sections (Hero, CategoryGrid, FeaturedProducts) | Route Pages, Product Service | `app/components/sections/**` |
| **Feature Composites** | Domain-specific composites (CartDrawer, ProductCard, CustomizationPicker) | Route Pages, Client Hooks | `app/components/features/**` |
| **Server Functions** | Type-safe RPC: client → server with validation | Route Pages (client), Services (server) | `app/services/*.server.ts` |
| **Service Layer** | Business logic, authorization checks, DB queries | Server Functions, API Routes, Prisma | `app/services/*.server.ts` |
| **Auth Layer** | Session management, login/register, role guards | Route Loaders (beforeLoad), Services | `app/lib/auth.server.ts` |
| **Data Access** | Prisma client, schema, migrations, seed | Services | `app/lib/prisma.ts`, `prisma/schema.prisma` |
| **Stripe Integration** | Checkout sessions, webhook handling, refunds | Checkout Service, Webhook Route | `app/lib/stripe.server.ts` |
| **Email Service** | Transactional emails (order confirmations, contact) | Order Service, Contact Service | `app/lib/email.server.ts` |
| **API Routes** | JSON endpoints for AJAX/mutations, webhooks | Services, Stripe | `app/routes/api/**` |
| **Client Hooks** | Client-side state orchestration (cart sync, customization) | Feature Composites, Server Functions | `app/lib/hooks/**` |
| **Validators** | Zod schemas shared client ↔ server | Server Functions, API Routes, Forms | `app/lib/validators/**` |

### Communication Rules (Import Boundaries)

**Strict unidirectional flow.** A component may only import from layers below it, never above.

```
                    ┌─────────────────┐
                    │  Route Pages     │  Can import: components, hooks, validators, types
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────────┐
              ▼              ▼                   ▼
     ┌────────────┐  ┌──────────────┐  ┌────────────────┐
     │ Sections   │  │ Features     │  │ Layout          │
     │ Components │  │ Components   │  │ Components      │
     └─────┬──────┘  └──────┬───────┘  └────────────────┘
           │                │
           └───────┬────────┘
                   ▼
           ┌──────────────┐
           │  UI Components│  Can import: utils, types, constants ONLY
           │  (shadcn/ui) │
           └──────────────┘

    ── SERVER BOUNDARY (.server.ts) ──────────────────────────

     ┌────────────────┐       ┌──────────────────┐
     │ Server Functions│ ────▶ │ Service Layer     │ ────▶ Prisma
     │ (createServerFn)│       │ (*.server.ts)     │
     └────────────────┘       └──────────────────┘
                                       │
                              ┌────────┼────────┐
                              ▼        ▼        ▼
                           Stripe   Email    Auth
```

**Key rule:** No `.server.ts` file may be imported from any client-side code. The build enforces this — TanStack Start strips server-only code from client bundles. The gate: `grep -rn 'from.*\.server' app/components/` must return zero results.

---

## Data Flow

### 1. Product Browsing (Read Path)

```
User visits /prodotti
        │
        ▼
TanStack Router matches routes/prodotti.index.tsx
        │
        ▼
Route loader runs (server-side):
  const products = await getProducts({ category, sort, page })
        │                    │
        │                    ▼
        │            products.server.ts
        │                    │
        │                    ▼
        │            Prisma: product.findMany({ where, include, skip, take })
        │                    │
        │                    ▼
        │            PostgreSQL → returns products with variants, images, category
        │
        ▼
Loader data serialized → HTML (SSR) + dehydrated to client
        │
        ▼
React hydrates → ProductGrid renders ProductCards
        │
        ▼ (user clicks product)
        │
TanStack Router prefetches via <Link preload="intent">
        │
        ▼
routes/prodotti.$slug.tsx loader → getProduct(slug)
        │
        ▼
Full product detail with variants, images, customization options
```

### 2. Sandal Customization Flow

```
User on /prodotti/sandalo-classico-schiava
        │
        ▼
Product detail page shows CustomizationPicker
        │
        ▼
User selects: tacco=5cm, pelle=cuoio marrone, colore=naturale, gioiello=nessuno
        │
        ▼
Client hook: useCustomization() tracks local state
        │
        │  Each option change:
        │  - Updates preview image (if available)
        │  - Recalculates price (base + option surcharges)
        │  - Validates combination (server-side on submit)
        │
        ▼
User clicks "Aggiungi al carrello"
        │
        ▼
createServerFn("POST", addToCart) called with:
  { productId, variantId?, customization: { tacco, pelle, colore, gioiello } }
        │
        ▼
Server validates:
  1. customization.server.ts: validateConfiguration()
     - Are all required options selected?
     - Is this combination valid? (e.g., gioiello only with certain leather types)
  2. cart.server.ts: addToCart()
     - Create/update CartItem with customization JSON + computed price
     - If guest: cart tied to session/cookie ID
     - If auth: cart tied to userId
        │
        ▼
Returns updated cart → TanStack Query invalidates ["cart"] → CartDrawer updates
```

### 3. Checkout Flow (Write Path — Most Critical)

```
User on /carrello → clicks "Procedi al checkout"
        │
        ▼
User on /checkout (protected route — redirects to /login if guest)
        │
        ▼
Checkout form: AddressForm + order summary + payment
        │
        ▼
User submits → createServerFn("POST", createCheckoutSession)
        │
        ▼
checkout.server.ts:
  1. Validate cart (items exist, stock available, prices match)
  2. Compute total (subtotal + shipping + IVA)
  3. Create Order in DB (status: PENDING)
  4. Create Stripe Checkout Session:
     - line_items from cart items
     - metadata: { orderId, userId }
     - success_url: /checkout/success?session_id={CHECKOUT_SESSION_ID}
     - cancel_url: /checkout/cancel
  5. Return session.url
        │
        ▼
Client redirects to Stripe hosted checkout
        │
        ▼ (user completes payment)
        │
Stripe sends webhook → POST /api/webhooks/stripe
        │
        ▼
Webhook handler:
  1. Verify signature (STRIPE_WEBHOOK_SECRET)
  2. Check idempotency (StripeEvent table)
  3. Process checkout.session.completed:
     - Update Order status → PAID
     - Record stripeSessionId
     - Send order confirmation email via Resend
     - Decrement inventory
        │
        ▼
User redirected to /checkout/success
        │
        ▼
Success page: loader fetches order by session_id → shows confirmation
```

### 4. Cart Sync (Guest → Authenticated)

```
Guest user adds items to cart
  → Cart stored in DB with sessionId (from cookie)
  → CartDrawer shows count

Guest registers/logs in
  → Auth layer creates session
  → cart.server.ts: mergeGuestCart(sessionId, userId)
     - For each guest cart item:
       - Check if user cart has same product+customization
       - If yes: merge quantities
       - If no: transfer item to user cart
     - Delete guest cart
  → Redirect to merged cart or original destination
```

### 5. Admin Product Management

```
Admin visits /admin/prodotti (protected by requireAdmin)
        │
        ▼
Admin clicks "Nuovo prodotto"
        │
        ▼
ProductForm with:
  - Basic info (name, description, slug, price)
  - Category assignment (hierarchical select)
  - Variant management (size, color, leather type)
  - Customization options (tacco types, pelle colors, gioielli)
  - Image upload (multiple)
        │
        ▼
createServerFn("POST", createProduct) with Zod validation
        │
        ▼
products.server.ts:
  1. Validate slug uniqueness
  2. Create product with variants, customization options
  3. Handle image uploads
  4. Invalidate product cache
        │
        ▼
Redirect to /admin/prodotti with success toast
```

---

## Patterns to Follow

### Pattern 1: File-Based Routing with TanStack Start
**What:** Every file in `app/routes/` becomes a route. The router plugin auto-generates the route tree.
**When:** Always — this is how TanStack Start works.
**Key conventions:**
- `__root.tsx` — root layout (Navbar + Footer)
- `index.tsx` — home page
- `products.$slug.tsx` — dynamic parameter `$slug`
- `_auth.login.tsx` — pathless layout group (login at `/login`, not `/_auth/login`)
- `api/products.ts` — API route (returns `Response`, not JSX)

```typescript
// app/routes/prodotti.$slug.tsx
import { createFileRoute } from "@tanstack/react-router";
import { getProduct } from "~/services/products.server";

export const Route = createFileRoute("/prodotti/$slug")({
  loader: async ({ params }) => {
    const product = await getProduct(params.slug);
    return { product };
  },
  meta: ({ loaderData }) => ({
    title: loaderData?.product.name ?? "Prodotto",
    description: loaderData?.product.description,
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { product } = Route.useLoaderData();
  return <ProductDetail product={product} />;
}
```

### Pattern 2: Server Functions as Business Logic Entry Points
**What:** `createServerFn` creates type-safe RPC boundaries between client and server. All mutations and server-side data fetching go through server functions.
**When:** Any time client code needs to invoke server logic.

```typescript
// app/services/cart.server.ts
import { createServerFn } from "@tanstack/start";
import { z } from "zod";
import { prisma } from "~/lib/prisma";
import { requireUser } from "~/lib/auth.server";

const addToCartSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(10),
  customization: z.object({
    tacco: z.string(),
    pelle: z.string(),
    colore: z.string(),
    gioiello: z.string().optional(),
  }).optional(),
});

export const addToCart = createServerFn({ method: "POST" })
  .validator(addToCartSchema)
  .handler(async ({ data }) => {
    const cartItem = await prisma.cartItem.create({
      data: {
        cart: { connect: { id: data.cartId } },
        product: { connect: { id: data.productId } },
        quantity: data.quantity,
        customization: data.customization ?? undefined,
        unitPriceCents: data.priceCents,
      },
    });
    return cartItem;
  });
```

### Pattern 3: Protected Routes with beforeLoad
**What:** TanStack Router's `beforeLoad` hook runs before the route loads — perfect for auth redirects.
**When:** Any route requiring authentication or specific roles.

```typescript
// app/routes/account.tsx — Protected customer area
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/account")({
  beforeLoad: async ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AccountDashboard,
});

// app/routes/admin.tsx — Admin-only area
export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
    if (context.auth.user?.role !== "admin") {
      throw redirect({ to: "/" }); // or 403 page
    }
  },
  component: AdminDashboard,
});
```

### Pattern 4: Standardized API Responses
**What:** Consistent JSON envelope for all API endpoints.
**When:** Every `api/` route.

```typescript
// app/lib/api-response.ts
export const ok = <T>(data: T, status = 200) => Response.json(data, { status });
export const created = <T>(data: T) => Response.json(data, { status: 201 });
export const noContent = () => new Response(null, { status: 204 });
export const badRequest = (error: string) => Response.json({ error }, { status: 400 });
export const unauthorized = () => Response.json({ error: "Unauthorized" }, { status: 401 });
export const forbidden = () => Response.json({ error: "Forbidden" }, { status: 403 });
export const notFound = (resource = "Resource") => Response.json({ error: `${resource} not found` }, { status: 404 });
export const unprocessable = (errors: unknown) => Response.json({ error: errors }, { status: 422 });
export const serverError = () => Response.json({ error: "Internal server error" }, { status: 500 });
```

### Pattern 5: Zod Validators Shared Between Client and Server
**What:** Zod schemas in `app/lib/validators/` are imported by both form components (client) and server functions (server). Single source of truth for validation.
**When:** Every form submission, API input.

```typescript
// app/lib/validators/product.ts
import { z } from "zod";

export const customizationSchema = z.object({
  tacco: z.enum(["3cm", "5cm", "7cm", "piatto"]),
  pelle: z.enum(["cuoio-toscano", "vitello", "capretto"]),
  colore: z.enum(["naturale", "marrone", "nero", "rosso", "bianco"]),
  gioiello: z.enum(["nessuno", "strass", "perla", "pendaglio"]).optional(),
});

export const productFilterSchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(["prezzo-asc", "prezzo-desc", "nome", "novita"]).default("novita"),
  page: z.coerce.number().int().min(1).default(1),
});
```

### Pattern 6: Webhook-First Payment Confirmation
**What:** Never trust client-side payment confirmation. Only the Stripe webhook is the source of truth for order status.
**When:** All payment flows.

```typescript
// app/routes/api/webhooks/stripe.ts
import { createAPIFileRoute } from "@tanstack/start/api";
import { stripe } from "~/lib/stripe.server";
import { prisma } from "~/lib/prisma";
import { sendEmail } from "~/lib/email.server";
import { orderConfirmationTemplate } from "~/lib/email-templates.server";

export const APIRoute = createAPIFileRoute("/api/webhooks/stripe")({
  POST: async ({ request }) => {
    const payload = await request.text();
    const sig = request.headers.get("stripe-signature")!;

    const event = stripe.webhooks.constructEvent(
      payload, sig, process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Idempotency check
    const existing = await prisma.stripeEvent.findUnique({ where: { id: event.id } });
    if (existing) return Response.json({ received: true });

    await prisma.stripeEvent.create({
      data: { id: event.id, type: event.type, processedAt: new Date() },
    });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "PAID", paidAt: new Date(), stripeSessionId: session.id },
        });
        // Send confirmation email (fire-and-forget)
        await sendOrderConfirmation(orderId);
      }
    }

    return Response.json({ received: true });
  },
});
```

### Pattern 7: Feature Composites (Domain-Specific Component Groups)
**What:** Related UI components grouped by feature domain, not by technical role. Each feature directory has its own `index.ts` barrel export.
**When:** Any multi-component feature (cart, checkout, customization, admin product editor).

```
components/features/
├── cart/
│   ├── CartDrawer.tsx        # Slide-out drawer with cart items
│   ├── CartItem.tsx           # Single item row with quantity controls
│   ├── CartSummary.tsx        # Subtotal, shipping estimate, CTA
│   ├── AddToCartButton.tsx    # Product page CTA with loading state
│   └── index.ts
├── customization/
│   ├── CustomizationPicker.tsx  # Main orchestrator
│   ├── TaccoSelector.tsx        # Heel type radio group
│   ├── PelleSelector.tsx        # Leather type with swatches
│   ├── ColoreSelector.tsx       # Color picker with preview
│   ├── GioielloSelector.tsx     # Decoration selector
│   ├── CustomizationSummary.tsx # Price breakdown of selected options
│   └── index.ts
├── checkout/
│   ├── CheckoutForm.tsx          # Multi-step checkout
│   ├── AddressForm.tsx           # Shipping address
│   ├── OrderSummary.tsx          # Final review before payment
│   └── index.ts
└── admin/
    ├── ProductForm.tsx           # Create/edit product
    ├── VariantManager.tsx        # Manage product variants
    ├── CategoryTree.tsx          # Hierarchical category editor
    ├── OrderTable.tsx            # Order list with filters
    └── index.ts
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Inline Prisma Queries in Route Files
**What:** Writing `prisma.product.findMany()` directly in route loaders or API handlers.
**Why bad:** Routes become untestable, business logic leaks into HTTP layer, violates SRP. When you need to add caching, logging, or authorization checks, you must touch every route instead of one service function.
**Instead:** Always delegate to `app/services/*.server.ts`. Routes handle HTTP concerns; services handle business rules.

```typescript
// ❌ BAD
export const Route = createFileRoute("/api/products")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const products = await prisma.product.findMany({
      where: { category: url.searchParams.get("cat") },
    });
    return Response.json(products);
  },
});

// ✅ GOOD
export const Route = createFileRoute("/api/products")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const products = await getProducts({ category: url.searchParams.get("cat") });
    return ok(products);
  },
});
```

### Anti-Pattern 2: God Cart Component
**What:** A single `Cart.tsx` component that handles item display, quantity updates, removal, totals, and checkout navigation.
**Why bad:** At 300+ LOC it becomes unmaintainable. Business logic (price calculation) mixes with UI (remove button animation).
**Instead:** Split into feature composites: `CartDrawer`, `CartItem`, `CartSummary`, `AddToCartButton`. Use a `useCart` hook for state orchestration. Business logic stays in `cart.server.ts`.

### Anti-Pattern 3: Client-Side Price Calculation
**What:** Computing order totals on the client and sending them to Stripe.
**Why bad:** Users can manipulate client-side JavaScript. If prices are computed client-side, a malicious user could submit a €0 order.
**Instead:** Server always computes the price. Client sends only `{ productId, quantity, customization }`. The server looks up the product price, applies customization surcharges, computes IVA, and creates the Stripe session with the server-computed amount.

### Anti-Pattern 4: Storing Customization as Opaque JSON Blob
**What:** Saving `{ customization: JSON.stringify(options) }` without validation or structure.
**Why bad:** No type safety, no queryability (can't find "all orders with tacco=5cm"), no validation of valid option combinations.
**Instead:** Validate with Zod on the server. Store as a `Json` field in Prisma but with a typed TypeScript interface. Create a `CustomizationConfig` table for available options (so the admin can manage available heel types, leather types, etc. without code changes).

### Anti-Pattern 5: Separate Frontend and Backend Repositories
**What:** Splitting into `calzoleria-frontend` and `calzoleria-backend`.
**Why bad:** TanStack Start is a full-stack framework — server functions and API routes run in the same process as SSR. Splitting means you lose type safety across the boundary, need API versioning for your own app, and double deployment complexity.
**Instead:** Single monolith. The "API" is just `app/routes/api/` — internal JSON endpoints consumed by client-side mutations. Server functions handle the rest.

---

## Project Directory Structure

```
calzoleriaprevenzano/
├── app/
│   ├── routes/                          # File-based routing (auto-generated route tree)
│   │   ├── __root.tsx                   # Root layout: <html>, Navbar, Footer, CookieBanner
│   │   ├── index.tsx                    # / — Homepage (Hero, categories, featured, new arrivals)
│   │   ├── chi-siamo.tsx                # /chi-siamo — About page (history, team)
│   │   ├── contatti.tsx                 # /contatti — Contact page (form + two stores)
│   │   ├── guida-taglie.tsx             # /guida-taglie — Size guide with PDF + video
│   │   │
│   │   ├── prodotti.tsx                 # /prodotti — Products layout
│   │   ├── prodotti.index.tsx           # /prodotti — Product listing with filters
│   │   ├── prodotti.$slug.tsx           # /prodotti/:slug — Product detail + customization
│   │   │
│   │   ├── categoria.$slug.tsx          # /categoria/:slug — Category page
│   │   │
│   │   ├── carrello.tsx                 # /carrello — Shopping cart
│   │   │
│   │   ├── checkout.tsx                 # /checkout — Checkout (protected)
│   │   ├── checkout.success.tsx         # /checkout/success — Order confirmation
│   │   ├── checkout.cancel.tsx          # /checkout/cancel — Payment cancelled
│   │   │
│   │   ├── _auth.tsx                    # Auth layout (pathless, no URL segment)
│   │   ├── _auth.login.tsx              # /login
│   │   ├── _auth.register.tsx           # /register
│   │   ├── _auth.forgot-password.tsx    # /forgot-password
│   │   ├── _auth.reset-password.tsx     # /reset-password
│   │   │
│   │   ├── account.tsx                  # /account — Customer dashboard (protected)
│   │   ├── account.ordini.tsx           # /account/ordini — Order history
│   │   ├── account.ordini.$id.tsx       # /account/ordini/:id — Order detail
│   │   ├── account.indirizzi.tsx        # /account/indirizzi — Address management
│   │   ├── account.wishlist.tsx         # /account/wishlist
│   │   │
│   │   ├── admin.tsx                    # /admin — Admin dashboard (protected, admin role)
│   │   ├── admin.prodotti.tsx           # /admin/prodotti — Product CRUD
│   │   ├── admin.prodotti.nuovo.tsx     # /admin/prodotti/nuovo — Create product
│   │   ├── admin.prodotti.$id.modifica.tsx # /admin/prodotti/:id/modifica
│   │   ├── admin.categorie.tsx          # /admin/categorie — Category CRUD
│   │   ├── admin.ordini.tsx             # /admin/ordini — Order management
│   │   ├── admin.ordini.$id.tsx         # /admin/ordini/:id — Order detail
│   │   │
│   │   ├── privacy.tsx                  # /privacy — Privacy policy
│   │   ├── cookie-policy.tsx            # /cookie-policy — Cookie policy
│   │   ├── termini.tsx                  # /termini — Terms of service
│   │   │
│   │   ├── sitemap[.]xml.ts            # /sitemap.xml — Dynamic sitemap
│   │   ├── robots[.]txt.ts             # /robots.txt
│   │   │
│   │   └── api/                         # JSON API endpoints
│   │       ├── products.ts              # GET /api/products (with filters)
│   │       ├── products.$slug.ts        # GET /api/products/:slug
│   │       ├── cart.ts                  # GET/POST/PUT /api/cart
│   │       ├── cart.$itemId.ts          # DELETE /api/cart/:itemId
│   │       ├── wishlist.ts              # GET/POST /api/wishlist
│   │       ├── wishlist.$productId.ts   # DELETE /api/wishlist/:productId
│   │       ├── orders.ts                # GET/POST /api/orders
│   │       ├── orders.$id.ts            # GET /api/orders/:id
│   │       ├── checkout.ts              # POST /api/checkout (create Stripe session)
│   │       ├── contact.ts               # POST /api/contact
│   │       ├── cookie-consent.ts        # POST /api/cookie-consent
│   │       ├── data-export.ts           # GET /api/data-export (GDPR)
│   │       ├── data-delete.ts           # DELETE /api/data-delete (GDPR)
│   │       └── webhooks/
│   │           └── stripe.ts            # POST /api/webhooks/stripe
│   │
│   ├── services/                        # Server-only business logic
│   │   ├── products.server.ts           # Product catalog: CRUD, filtering, search
│   │   ├── cart.server.ts               # Cart: add, remove, update, merge guest→auth
│   │   ├── orders.server.ts             # Order: create, status transitions, history
│   │   ├── checkout.server.ts           # Checkout: Stripe session creation, validation
│   │   ├── customization.server.ts      # Customization: validate options, compute price
│   │   ├── wishlist.server.ts           # Wishlist: add, remove, list
│   │   ├── contact.server.ts            # Contact: save + email
│   │   └── search.server.ts             # Full-text search (if needed beyond Prisma)
│   │
│   ├── components/
│   │   ├── ui/                          # shadcn/ui primitives (auto-installed)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── sheet.tsx               # For CartDrawer
│   │   │   ├── badge.tsx
│   │   │   ├── table.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ... (others as needed)
│   │   │
│   │   ├── layout/                      # Persistent layout components
│   │   │   ├── Navbar.tsx               # Logo, nav links, cart icon, auth state
│   │   │   ├── MobileMenu.tsx           # Responsive hamburger menu
│   │   │   ├── Footer.tsx               # Links, social, store info, legal
│   │   │   ├── AnnouncementBar.tsx      # Optional: promo banner
│   │   │   └── index.ts
│   │   │
│   │   ├── sections/                    # Homepage sections
│   │   │   ├── Hero.tsx                 # Full-width hero with CTA
│   │   │   ├── CategoryGrid.tsx         # Category cards (Sandali, Pelletteria, Accessori)
│   │   │   ├── FeaturedProducts.tsx     # Curated product carousel
│   │   │   ├── NewArrivals.tsx          # Latest products
│   │   │   ├── ArtisanStory.tsx         # Brand story section (Vincenzo + Nunzio)
│   │   │   ├── MaterialsBanner.tsx      # Certified materials highlight
│   │   │   ├── StoresSection.tsx        # Two physical stores
│   │   │   ├── NewsletterSignup.tsx     # Email signup (v2)
│   │   │   └── index.ts
│   │   │
│   │   ├── features/                    # Domain-specific composite components
│   │   │   ├── product/
│   │   │   │   ├── ProductCard.tsx       # Card for grid: image, name, price
│   │   │   │   ├── ProductGrid.tsx       # Responsive grid with loading skeletons
│   │   │   │   ├── ProductGallery.tsx    # Image gallery with zoom
│   │   │   │   ├── ProductFilters.tsx    # Category, price range, sort sidebar
│   │   │   │   ├── ProductInfo.tsx       # Title, price, description, breadcrumbs
│   │   │   │   └── index.ts
│   │   │   ├── customization/
│   │   │   │   ├── CustomizationPicker.tsx  # Orchestrator for all options
│   │   │   │   ├── TaccoSelector.tsx        # Heel type: 3cm, 5cm, 7cm, piatto
│   │   │   │   ├── PelleSelector.tsx        # Leather type with visual swatches
│   │   │   │   ├── ColoreSelector.tsx       # Color picker with live preview
│   │   │   │   ├── GioielloSelector.tsx     # Decoration/jewelry selector
│   │   │   │   ├── CustomizationSummary.tsx # Config breakdown + price impact
│   │   │   │   └── index.ts
│   │   │   ├── cart/
│   │   │   │   ├── CartDrawer.tsx           # Slide-out sheet with full cart
│   │   │   │   ├── CartItem.tsx             # Single item row
│   │   │   │   ├── CartSummary.tsx          # Subtotal, shipping, total, CTA
│   │   │   │   ├── AddToCartButton.tsx      # Product page CTA
│   │   │   │   └── index.ts
│   │   │   ├── checkout/
│   │   │   │   ├── CheckoutForm.tsx         # Multi-step form orchestrator
│   │   │   │   ├── AddressForm.tsx          # Shipping address fields
│   │   │   │   ├── OrderReview.tsx          # Final summary before payment
│   │   │   │   └── index.ts
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx         # With GDPR consent checkboxes
│   │   │   │   └── index.ts
│   │   │   └── admin/
│   │   │       ├── ProductForm.tsx          # Create/edit product form
│   │   │       ├── VariantManager.tsx       # Manage product variants
│   │   │       ├── CustomizationConfig.tsx  # Manage customization options
│   │   │       ├── CategoryTree.tsx         # Hierarchical category editor
│   │   │       ├── OrderTable.tsx           # Order list with status filters
│   │   │       ├── OrderDetail.tsx          # Single order management
│   │   │       ├── ImageUploader.tsx        # Multi-image upload
│   │   │       └── index.ts
│   │   │
│   │   ├── legal/
│   │   │   ├── CookieBanner.tsx         # GDPR cookie consent
│   │   │   └── index.ts
│   │   │
│   │   └── seo/
│   │       ├── StructuredData.tsx       # JSON-LD injection
│   │       └── index.ts
│   │
│   ├── lib/
│   │   ├── auth.server.ts              # Better Auth instance + config
│   │   ├── prisma.ts                   # Prisma client singleton
│   │   ├── stripe.server.ts            # Stripe client instance
│   │   ├── email.server.ts             # Resend email service
│   │   ├── email-brand.server.ts       # Email brand config (from design tokens)
│   │   ├── email-templates.server.ts   # HTML email templates
│   │   ├── api-response.ts             # Standardized response helpers
│   │   ├── logger.server.ts            # Structured JSON logging
│   │   ├── cache.server.ts             # In-memory LRU cache for product queries
│   │   ├── utils.ts                    # cn(), formatCurrency(), formatDate()
│   │   │
│   │   ├── constants/
│   │   │   ├── app.ts                  # Pagination, cart limits, upload sizes
│   │   │   └── feature-flags.ts        # FF_ flags from env
│   │   │
│   │   ├── validators/                 # Zod schemas (shared client ↔ server)
│   │   │   ├── product.ts              # Product CRUD, filters
│   │   │   ├── cart.ts                 # Cart operations
│   │   │   ├── order.ts                # Order validation
│   │   │   ├── checkout.ts             # Checkout session creation
│   │   │   ├── auth.ts                 # Login, register, password reset
│   │   │   ├── contact.ts              # Contact form
│   │   │   └── customization.ts        # Customization option validation
│   │   │
│   │   ├── types/
│   │   │   ├── api.ts                  # ApiResponse<T>, PaginatedResponse<T>
│   │   │   ├── models.ts               # Domain models (Product, Order, Cart)
│   │   │   └── customization.ts        # Customization option types
│   │   │
│   │   └── hooks/
│   │       ├── useCart.ts              # Cart state management + mutations
│   │       └── useCustomization.ts     # Customization state + price computation
│   │
│   ├── providers/
│   │   └── QueryProvider.tsx           # TanStack Query provider setup
│   │
│   └── styles/
│       ├── app.css                     # Tailwind import + custom properties
│       └── design-tokens.css           # Brand colors, fonts, spacing
│
├── prisma/
│   ├── schema.prisma                   # Full data model
│   ├── seed.ts                         # Admin user + categories + sample products
│   └── migrations/                     # Auto-generated migrations
│
├── public/
│   ├── images/                         # Static images (hero, logo, about)
│   ├── uploads/                        # User-uploaded product images (or S3 later)
│   ├── fonts/                          # Self-hosted fonts (artisan typography)
│   ├── guida-taglie.pdf                # Size guide PDF
│   └── favicon.ico
│
├── server.ts                           # Production server (Hono + security headers)
├── vite.config.ts                      # TanStack Router plugin + React
├── tsconfig.json
├── biome.json                          # Linter + formatter
├── docker-compose.dev.yml              # PostgreSQL 16 Alpine
├── .env                                # Local dev secrets
├── .env.example                        # Template for collaborators
├── package.json
└── README.md
```

---

## Suggested Build Order

The build order follows a strict dependency chain. Each phase depends on the previous one being complete.

```
Phase 1: FOUNDATION (no dependencies)
├── Project scaffolding (TanStack Start + Vite + TypeScript)
├── Docker + PostgreSQL setup (docker-compose.dev.yml)
├── Prisma schema (all models) + initial migration
├── Prisma client singleton (app/lib/prisma.ts)
├── Basic design tokens (app/styles/design-tokens.css)
├── Root layout (__root.tsx with Navbar + Footer shells)
├── Tailwind + shadcn/ui setup (app/components/ui/*)
├── Standardized responses (app/lib/api-response.ts)
├── Utilities (app/lib/utils.ts, constants, types)
└── Seed script (admin user + categories)

Phase 2: AUTH + USER MANAGEMENT (depends on Phase 1)
├── Better Auth setup (app/lib/auth.server.ts)
├── Auth routes (login, register, forgot/reset password)
├── Auth form components (LoginForm, RegisterForm with GDPR)
├── Route protection (beforeLoad guards, requireUser, requireAdmin)
├── Account pages (dashboard, orders, addresses)
└── Guest session management (for cart)

Phase 3: PRODUCT CATALOG (depends on Phase 1)
├── Product service (products.server.ts: CRUD, filtering)
├── Product listing page with filters (/prodotti)
├── Category page (/categoria/:slug)
├── Product detail page (/prodotti/:slug)
├── Product components (ProductCard, ProductGrid, ProductGallery, ProductFilters)
├── Category hierarchy (Sandali → Classica/Gioiello/Bambini, Shop → Pelletteria/Accessori)
├── Image handling (gallery, zoom, responsive)
└── SEO meta tags + JSON-LD structured data per product

Phase 4: PRODUCT CUSTOMIZATION (depends on Phase 3)
├── Customization models + migration (CustomizationOption, ProductCustomization)
├── Customization service (validation, price computation)
├── CustomizationPicker component + sub-selectors
├── Customization validators (Zod)
├── Price computation (base price + option surcharges)
├── Admin: Customization config management
└── Product detail page integration

Phase 5: CART (depends on Phase 2 + 3)
├── Cart service (cart.server.ts: add, remove, update, merge)
├── CartItem model + migration
├── Cart API routes (CRUD)
├── CartDrawer component (slide-out sheet)
├── Cart page (/carrello)
├── Cart summary with shipping estimate
├── AddToCartButton component
├── Guest cart → authenticated cart merge on login
└── useCart hook (client-side state + mutations)

Phase 6: CHECKOUT + PAYMENTS (depends on Phase 5)
├── Stripe setup (app/lib/stripe.server.ts)
├── Checkout service (session creation, cart validation)
├── Order model + migration
├── Checkout page (/checkout, protected)
├── Address form component
├── Stripe Checkout Session creation (server-side)
├── Webhook handler (signature verification, idempotency)
├── Order confirmation page (/checkout/success)
├── Email service setup (app/lib/email.server.ts with Resend)
├── Order confirmation email template
└── Admin: Order management page

Phase 7: CONTENT PAGES + SEO (depends on Phase 1)
├── Homepage (Hero, CategoryGrid, FeaturedProducts, ArtisanStory)
├── Chi Siamo page (history, team, photos)
├── Contatti page (form + two stores info)
├── Guida Taglie page (PDF download + video embed)
├── Legal pages (privacy, cookie-policy, termini)
├── Cookie consent banner (GDPR)
├── Dynamic sitemap.xml
├── robots.txt
└── Social sharing + Open Graph meta

Phase 8: WISHLIST + ACCOUNT FEATURES (depends on Phase 2)
├── Wishlist model + migration
├── Wishlist service (add, remove, list)
├── Wishlist page (/account/wishlist)
├── Wishlist heart icon on ProductCard
└── Address management (/account/indirizzi)

Phase 9: ADMIN DASHBOARD (depends on Phase 3 + 6)
├── Admin layout with sidebar navigation
├── Product CRUD (create, edit, delete, image upload)
├── Category CRUD (hierarchical)
├── Order management (view, status updates, refund)
├── Variant management (per product)
├── Inventory tracking (stock levels)
└── Admin dashboard home (stats, recent orders)

Phase 10: GDPR + EMAILS + POLISH (depends on all prior)
├── GDPR data export endpoint
├── GDPR data deletion endpoint
├── GDPR consent logging
├── Contact form → email (save to DB + notify admin)
├── Welcome email on registration
├── Order status update emails (shipped, etc.)
├── Error pages (404, 500)
├── Loading states + skeletons
├── Mobile responsiveness pass
├── Performance optimization (image lazy loading, code splitting)
└── Accessibility audit
```

### Build Order Rationale

1. **Foundation first** — everything depends on DB, routing, and UI primitives being in place.
2. **Auth before cart/checkout** — cart merge requires guest→auth session linking; checkout requires user identification.
3. **Products before customization** — customization extends the product model; you need basic products working first.
4. **Cart before checkout** — checkout processes cart contents; cart must be functional.
5. **Checkout before admin orders** — admin order management is meaningless until orders exist.
6. **Content pages are independent** — they can be built in parallel with core e-commerce after Phase 1.
7. **Admin last (but parallel)** — admin CRUD doesn't block customer-facing features, but needs products and orders to manage.

---

## Scalability Considerations

| Concern | At 100 users/day | At 1K users/day | At 10K users/day |
|---------|------------------|-----------------|------------------|
| **Database** | Single PostgreSQL instance (Docker) | Managed PostgreSQL (Supabase/Railway) | Read replica + connection pooling (PgBouncer) |
| **Product images** | Local filesystem `public/uploads/` | Cloudflare R2 or Supabase Storage | CDN-backed object storage with image transforms |
| **Search** | Prisma `findMany` with `contains` | PostgreSQL full-text search (`@@ to_tsquery`) | Dedicated search (Meilisearch or Typesense) |
| **Caching** | In-memory LRU for product catalog | LRU + HTTP cache headers on static pages | Redis for sessions + product cache + CDN |
| **Email** | Resend free tier (100/day) | Resend paid plan | Queue-based email (BullMQ + Resend) |
| **Sessions** | DB-backed sessions | DB sessions + session compression | Redis sessions for sub-ms lookups |
| **Deployment** | Single VPS (nginx + pm2) | VPS with auto-scaling | Container orchestration (Coolify/Fly.io) |
| **Cart** | DB-backed per session | DB + client-side optimistic | DB + Redis for hot cart data |

**For Calzoleria Prevenzano's scale (~120 SKUs, artisan production):** The 100 users/day column is the right target. An Italian artisanal shoemaker with two physical stores will not have Amazon-scale traffic. Optimize for developer experience and maintainability, not horizontal scaling.

---

## Data Model (Key Entities)

```
AuthUser (Better Auth) ──1:N── AuthSession
     │
     ├──1:N── Order ──1:N── OrderItem ──N:1── Product
     │
     ├──1:N── Address
     │
     ├──1:N── WishlistItem ──N:1── Product
     │
     └──1:1── Cart ──1:N── CartItem ──N:1── Product
                                        │
                                        └── customization (Json)

Category ──1:N── Category (self-referencing parent/children)
     │
     └──1:N── Product ──1:N── ProductVariant
                     │            │
                     │            └── size, color, stock
                     │
                     ├──1:N── ProductImage
                     │
                     └──1:N── ProductCustomization
                                  │
                                  └── optionType, optionValue, priceModifier

ContactSubmission (form submissions)
ConsentLog (GDPR)
DataRequest (GDPR)
StripeEvent (idempotency)
```

### Key Design Decisions in Data Model

1. **Customization as JSON on CartItem, not as separate rows** — Each sandal configuration is unique to that cart item. Storing as validated JSON (with a Zod type) keeps queries simple while preserving structure.

2. **CustomizationConfig as admin-managed lookup table** — Available heel types, leather types, colors, and decorations are stored in `ProductCustomization` rows linked to products. This lets the admin add "nuovo tipo di tacco" without code changes.

3. **Category self-referencing for hierarchy** — `parentCategoryId` enables `Sandali → Classica → Con infradito` three-level depth. Prisma recursive CTEs for tree queries.

4. **Guest cart via session cookie** — Guests get a `cartSessionId` cookie. On login, `mergeGuestCart()` runs. No localStorage cart (lost on browser clear, no multi-tab sync, no server-side stock validation).

5. **Soft delete on Products and Orders** — `deletedAt` column + Prisma middleware. Never hard-delete products (breaks historical orders) or orders (legal/tax requirement in Italy).

---

## Cross-Cutting Concerns

### Authentication Context Flow

```
__root.tsx defines router context:
  interface RouterContext {
    auth: {
      isAuthenticated: boolean;
      user: { id: string; email: string; name: string | null; role: string } | null;
    };
  }

Auth state resolved server-side on every request:
  1. Check session cookie
  2. Validate against Better Auth
  3. Populate context.auth

Route guards use beforeLoad:
  - Protected routes: check context.auth.isAuthenticated
  - Admin routes: check context.auth.user.role === "admin"
  - Guest-only routes (login/register): redirect to /account if already authed
```

### GDPR Compliance Points

| Where | What |
|-------|------|
| Registration | Privacy policy consent checkbox (required), marketing consent (optional), age 16+ confirmation |
| Cookie banner | Granular consent: necessary (always), analytics, marketing |
| Data export | GET /api/data-export — download all user data as JSON |
| Data deletion | DELETE /api/data-delete — anonymize orders, delete user record |
| Contact form | Save to DB first (never lose leads), then send email |
| Cookie consent | POST /api/cookie-consent — log to ConsentLog table |

### SEO Strategy

| Page | Structured Data | Meta Strategy |
|------|----------------|---------------|
| Homepage | Organization, LocalBusiness | Brand keywords + store info |
| Product listing | ItemList | Category-specific titles |
| Product detail | Product (price, availability, images) | Product name + material + artisanal |
| Category | CollectionPage | Category name + product count |
| Chi Siamo | Organization (expanded) | Brand story keywords |

### Error Handling Strategy

```
Route-level errors:
  - 404: Custom NotFound component at route level
  - 403: Redirect to / (or show "access denied")
  - Loader errors: errorComponent at route level

API errors:
  - Always return standardized JSON: { error: string } with proper status code
  - Never expose stack traces or internal details
  - Log server-side with structured logger

Client-side errors:
  - React ErrorBoundary wrapping critical sections
  - Toast notifications for mutation failures (cart, checkout)
  - Graceful degradation (product grid shows skeleton on error)
```

---

## Sources

- TanStack Start framework module (`site-generator-agents/modules/framework-tanstack.md`) — HIGH confidence, project-specific
- Authentication module (`site-generator-agents/modules/authentication.md`) — HIGH confidence, references `secure-auth-sdk` (adapted for Better Auth)
- Payments module (`site-generator-agents/modules/payments.md`) — HIGH confidence, Stripe integration patterns
- Database schema module (`site-generator-agents/modules/database-schema.md`) — HIGH confidence, Prisma + PostgreSQL patterns
- Enterprise segmentation module (`site-generator-agents/modules/enterprise-segmentation.md`) — HIGH confidence, layer architecture rules
- Email module (`site-generator-agents/modules/email.md`) — HIGH confidence, Resend integration
- GDPR compliance module (`site-generator-agents/modules/gdpr-compliance.md`) — HIGH confidence, consent + data rights
- SEO module (`site-generator-agents/modules/seo.md`) — HIGH confidence, structured data + sitemap
- E-commerce site type definition (`site-generator-agents/02-site-types.md`) — HIGH confidence, page/route inventory
- Project context (`.planning/PROJECT.md`) — HIGH confidence, business requirements
- Existing codebase architecture (`.planning/codebase/ARCHITECTURE.md`) — HIGH confidence, site-generator pipeline structure

---

*Architecture research: 2026-04-02*
