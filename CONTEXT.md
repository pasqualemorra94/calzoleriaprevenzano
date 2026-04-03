# Calzoleria Prevenzano — Project Context

> Updated: 2026-04-03 | Agent: features-coding

## Tech Stack
- **Framework**: TanStack Start (React SSR)
- **DB**: PostgreSQL (Docker, port 5433)
- **ORM**: Prisma 6.19
- **Auth**: Better Auth
- **Styling**: Tailwind CSS + design tokens
- **i18n**: Not active
- **Build**: Vite

## Active Code
- `src/` — all active code (NOT `app/` — that's old/unused)
- `src/routes/` — TanStack file-based routing
- `src/components/` — React components
- `src/lib/` — server utils, types, DB client
- `prisma/schema.prisma` — database schema

## DB Connection
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calzoleriaprevenzano_dev
Admin: admin@calzoleriaprevenzano.it / Admin123!
```

## Key Models
- **Product** — 118 products, 92 with `variantConfig` (JSON)
- **Category** — 20 categories, 15 with `variantConfig`
- **VariantTemplate** — 18 templates (9 seed + 9 pattern-based)
- **User/Session/Account** — Better Auth

## Variant System
- Products have `variantConfig: Json` — defines groups of options
- Groups can have `dependsOn` for conditional visibility
- Categories have default `variantConfig` for auto-apply on new products
- Templates are reusable configs stored in `VariantTemplate` model
- Admin can merge multiple templates on a single product
- VariantBuilder component: collapsible groups, reorder, CRUD

## Product Categories with Templates
| Category | Template Slug | Groups |
|----------|--------------|--------|
| Sandali, Classici | sandali-4-pelli | 7 |
| Strass, Schiava | sandali-3-pelli | 7 |
| Gioiello, Cavigliera, Fasce, Aggiunta ciondolo, Con infradito Gioiello | gioiello-colore-diretto | 3 |
| Con infradito | tacco-taglia | 2 |
| Solette, Articoli per calzature | taglia-sola | 1 |
| Bambini, Infradito Bambini, No infradito Bambini | bambini-fondo-taglia | 2 |

## 26 Products Without Variants
Agende (4), Astucci (2), Borselli (6), Cinture (14) — all non-variant products

## WCPA Scraping Notes
- Original site uses WCPA plugin (AJAX-loaded forms for ~10 products)
- 81 products scraped from server HTML, 11 assigned from category templates
- `scripts/scrape-wcpa-variants.ts` — main parser
- `scripts/verify-all-wcpa.ts` — verified all 118 products
- `scripts/populate-variant-configs.ts` — converts WCPA → variantConfig
- `scripts/apply-variant-configs.ts` — applies to DB (ESM)
- 209 swatch images in `public/images/swatches/`

## Known Issues
- Zod/Better Auth warning: `z$1.email` — ignore (library issue)
- Scripts in `scripts/` use intentional `any` — not app code
- `app/` directory is OLD and UNUSED
