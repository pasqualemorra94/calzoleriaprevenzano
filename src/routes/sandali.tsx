import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useEffect, useCallback } from "react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { StaggeredGrid, StaggeredItem } from "~/components/ui/StaggeredGrid";
import { m } from "motion/react";
import { Search, X, ChevronLeft, ChevronRight, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { $getCatalogProducts, $getCategories } from "~/lib/product-functions";
import type { ProductListItem, CategoryItem } from "~/lib/product-functions";
import type { PaginatedData } from "~/lib/types/api";

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

// ─── Route ──────────────────────────────────────────────────────────

export const Route = createFileRoute("/sandali")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search.category === "string" ? search.category : undefined,
    query: typeof search.query === "string" ? search.query : undefined,
    page: typeof search.page === "string" ? search.page : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const [categories, productsData] = await Promise.all([
      $getCategories(),
      $getCatalogProducts({ data: {
        page: search.page ? Number(search.page) : 1,
        category: search.category ?? "sandali",
        query: search.query,
      } }),
    ]);

    // Extract sandali subcategories from the full category tree
    const sandaliCat = (categories as CategoryItem[]).find((c) => c.slug === "sandali");
    const subCategories: SubCategory[] = sandaliCat
      ? sandaliCat.children.map((ch) => ({
          id: ch.id,
          name: ch.name,
          slug: ch.slug,
          productCount: ch.productCount,
        }))
      : [];

    return { categories, productsData, subCategories };
  },
  component: SandaliPage,
});

// ─── Component ────────────────────────────────────────────────────────

function SandaliPage(): ReactNode {
  const { productsData: ssrData, subCategories: ssrSubs } = Route.useRouteContext();
  const routeSearch = useSearch({ from: "/sandali" });

  // Products — SSR initial, then client-side RPC on filter change
  const [products, setProducts] = useState<ProductListItem[]>(ssrData.items);
  const [total, setTotal] = useState(ssrData.total);
  const [totalPages, setTotalPages] = useState(ssrData.totalPages);
  const [page, setPage] = useState(ssrData.page);
  const [searchInput, setSearchInput] = useState(routeSearch.query ?? "");
  const [query, setQuery] = useState(routeSearch.query ?? "");
  const [activeCategory, setActiveCategory] = useState<string | undefined>(routeSearch.category ?? "sandali");
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await $getCatalogProducts({ data: {
        page,
        category: activeCategory ?? "sandali",
        query,
        sort: "newest",
      } });
      const result = data as PaginatedData<ProductListItem>;
      setProducts(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch { /* ignore — SSR data still shown */ }
    setLoading(false);
  }, [page, activeCategory, query]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); setQuery(searchInput); };
  const handleCategoryChange = (slug: string | undefined) => { setActiveCategory(slug); setPage(1); };

  return (
    <>
      {/* Page header */}
      <section className="bg-[var(--color-hero)] py-[var(--section-padding-y)] border-b border-[var(--stitch-color)]/20">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <m.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <nav className="mb-4 text-sm text-[var(--color-text-muted)]" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-[var(--color-primary)]">Home</Link>
              <ChevronRight className="mx-1 inline h-3.5 w-3.5" />
              <span className="text-[var(--color-text)]">Sandali Artigianali</span>
            </nav>
            <h1 className="font-display text-[var(--text-lg)] font-semibold tracking-tight md:text-[var(--text-xl)]">
              Sandali Artigianali
            </h1>
            <p className="mt-4 max-w-2xl text-[var(--text-lg)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
              La collezione completa — dal classico infradito al modello gioiello. Ogni sandalo è personalizzabile nei materiali e nei dettagli.
            </p>
          </m.div>
        </div>
      </section>

      {/* Filters + Products */}
      <ScrollAnimatedSection className="bg-[var(--color-background)] py-[var(--section-padding-y)]">
        <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          {/* Search + Filters bar */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search input */}
            <form onSubmit={handleSearch} className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Cerca sandali..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Cerca sandali"
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-9 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary)] focus:outline-none"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(""); setQuery(""); setPage(1); }}
                  aria-label="Cancella ricerca"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>

            {/* Category filters */}
            <div className="flex flex-wrap items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[var(--color-text-muted)]" />
              <button
                type="button"
                onClick={() => handleCategoryChange(undefined)}
                className={`rounded-[var(--radius-md)] px-4 py-2 text-xs font-medium transition-colors duration-[var(--transition-base)] ${
                  !activeCategory
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]/80"
                }`}
              >
                Tutti ({total})
              </button>
              {ssrSubs.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`rounded-[var(--radius-md)] px-4 py-2 text-xs font-medium transition-colors duration-[var(--transition-base)] ${
                    activeCategory === cat.slug
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]/80"
                  }`}
                >
                  {cat.name} ({cat.productCount})
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <p className="mb-6 text-sm text-[var(--color-text-muted)]">
            {total} {total === 1 ? "sandalo" : "sandali"}
            {query && ` per "${query}"`}
          </p>

          {/* Product grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] rounded-[var(--radius-lg)] bg-[var(--color-muted)]" />
                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-16 rounded bg-[var(--color-muted)]" />
                    <div className="h-4 w-full rounded bg-[var(--color-muted)]" />
                    <div className="h-4 w-20 rounded bg-[var(--color-muted)]" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <StaggeredGrid className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-8">
              {products.map((product) => (
                <StaggeredItem key={product.id}>
                  <SandaloProductCard product={product} />
                </StaggeredItem>
              ))}
            </StaggeredGrid>
          ) : (
            <div className="py-20 text-center">
              <p className="text-[var(--color-text-muted)]">
                Nessun sandalo trovato con questi criteri.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setQuery("");
                  setActiveCategory(undefined);
                  setPage(1);
                }}
                className="mt-4 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
              >
                Resetta filtri
              </button>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-1" aria-label="Paginazione">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Pagina precedente"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-[var(--color-primary)] text-white"
                      : "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                  }`}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Pagina successiva"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          )}
        </section>
      </ScrollAnimatedSection>
    </>
  );
}

// ─── SandaloProductCard (local component) ──────────────────────────

function SandaloProductCard({ product }: { product: ProductListItem }) {
  return (
    <m.article
      className="group"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]">
        {product.image ? (
          <img
            src={product.image.url}
            alt={product.image.alt ?? product.name}
            className="h-full w-full object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-[1.05]"
            loading="lazy"
            width={400}
            height={533}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
            <ShoppingBag className="h-12 w-12" />
          </div>
        )}

        {product.compareAtPrice && (
          <span className="absolute left-3 top-3 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[var(--color-accent-foreground)]">
            Sconto
          </span>
        )}

        <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/0 transition-colors duration-[var(--transition-base)] group-hover:border-[var(--color-accent)]/30" />
      </div>

      <div className="mt-4">
        {product.category && (
          <span className="text-xs font-medium tracking-wider text-[var(--color-text-muted)]">
            {product.category.name}
          </span>
        )}
        <h3 className="mt-1 text-sm font-medium leading-snug text-[var(--color-text)]">
          <Link to="/prodotti/$slug" params={{ slug: product.slug }} className="hover:text-[var(--color-primary)]">
            {product.name}
          </Link>
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-sm font-medium text-[var(--color-primary)]">
            €{product.price.toFixed(2)}
          </p>
          {product.compareAtPrice && (
            <p className="text-sm text-[var(--color-text-muted)] line-through">
              €{product.compareAtPrice.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </m.article>
  );
}
