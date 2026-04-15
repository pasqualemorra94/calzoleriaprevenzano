import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useEffect, useCallback } from "react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { StaggeredGrid, StaggeredItem } from "~/components/ui/StaggeredGrid";
import { m } from "motion/react";
import { X, SlidersHorizontal, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { CatalogSidebar } from "~/components/catalog/CatalogSidebar";
import { CatalogProductCard } from "~/components/catalog/CatalogProductCard";
import type { ProductListItem } from "~/components/catalog";
import { $getCatalogProducts, $getCategories } from "~/lib/product-functions";
import type { PaginatedData } from "~/lib/types/api";

type SortOption = "newest" | "price_asc" | "price_desc" | "name";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Novità" },
  { value: "price_asc", label: "Prezzo crescente" },
  { value: "price_desc", label: "Prezzo decrescente" },
  { value: "name", label: "Nome A-Z" },
];

// ─── Route ──────────────────────────────────────────────────────────

export const Route = createFileRoute("/catalogo")({
  validateSearch: (search: Record<string, string>): {
    category?: string;
    query?: string;
    page?: string;
    sort?: string;
  } => ({
    category: search.category,
    query: search.query,
    page: search.page,
    sort: search.sort,
  }),
  beforeLoad: async ({ search }: { search: Record<string, string> }) => {
    const [categories, productsData] = await Promise.all([
      $getCategories(),
      $getCatalogProducts({ data: {
        page: search.page ? Number(search.page) : 1,
        category: search.category,
        query: search.query,
        sort: search.sort,
      } }),
    ]);
    return { categories, productsData };
  },
  component: CatalogoPage,
});

// ─── Component ─────────────────────────────────────────────────────

function CatalogoPage(): ReactNode {
  const { categories, productsData: ssrData } = Route.useRouteContext();
  const routeSearch = useSearch({ from: "/catalogo" });

  // Server-loaded categories (never change client-side)
  const [categoriesState] = useState(categories);

  // Products — start from SSR data, update client-side on filter change
  const [products, setProducts] = useState<ProductListItem[]>(ssrData.items);
  const [total, setTotal] = useState(ssrData.total);
  const [totalPages, setTotalPages] = useState(ssrData.totalPages);
  const [page, setPage] = useState(ssrData.page);
  const [query, setQuery] = useState(routeSearch.query ?? "");
  const [searchInput, setSearchInput] = useState(routeSearch.query ?? "");
  const [activeCategory, setActiveCategory] = useState<string | undefined>(routeSearch.category);
  const [sort, setSort] = useState<SortOption>((routeSearch.sort as SortOption) ?? "newest");
  const [loading, setLoading] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Fetch products client-side when filters change (after initial SSR)
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await $getCatalogProducts({ data: {
        page,
        category: activeCategory,
        query,
        sort,
      } });
      const result = data as PaginatedData<ProductListItem>;
      setProducts(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch { /* ignore — SSR data still shown */ }
    setLoading(false);
  }, [page, activeCategory, query, sort]);

  // Sync URL search params with state
  useEffect(() => { if (routeSearch.category !== activeCategory) { setActiveCategory(routeSearch.category); setPage(1); } }, [routeSearch.category]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { setMobileFiltersOpen(false); }, [activeCategory, query]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); setQuery(searchInput); };
  const handleClearSearch = () => { setSearchInput(""); setQuery(""); setPage(1); };
  const handleCategoryChange = (slug: string | undefined) => { setActiveCategory(slug); setPage(1); };
  const handleSortChange = (value: SortOption) => { setSort(value); setPage(1); };

  const sidebarProps = {
    categories: categoriesState,
    activeCategory,
    searchInput,
    onCategoryChange: handleCategoryChange,
    onSearch: handleSearch,
    onClearSearch: handleClearSearch,
    onSearchInputChange: setSearchInput,
  };

  const resolveCategoryName = (slug: string | undefined): string | null => {
    if (!slug) return null;
    const allCats = categoriesState.flatMap((c) => [
      { slug: c.slug, name: c.name },
      ...c.children.map((ch) => ({ slug: ch.slug, name: ch.name })),
    ]);
    return allCats.find((c) => c.slug === slug)?.name ?? null;
  };

  return (
    <>
      {/* Page header */}
      <section className="bg-[var(--color-hero)] py-[var(--section-padding-y)] border-b border-[var(--stitch-color)]/20">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <m.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
            <nav className="mb-4 text-sm text-[var(--color-text-muted)]" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-[var(--color-primary)]">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-[var(--color-text)]">Catalogo</span>
            </nav>
            <h1 className="font-display text-[var(--text-lg)] font-semibold tracking-tight md:text-[var(--text-xl)]">Catalogo</h1>
            <p className="mt-4 max-w-2xl text-[var(--text-lg)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
              Scopri la nostra collezione completa di sandali artigianali fatti a mano a Napoli.
            </p>
          </m.div>
        </div>
      </section>

      {/* Filters Sidebar + Products Grid */}
      <ScrollAnimatedSection className="bg-[var(--color-background)] py-[var(--section-padding-y)]">
        <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden w-64 shrink-0 lg:block" aria-label="Filtri catalogo">
              <CatalogSidebar {...sidebarProps} />
            </aside>

            {/* Mobile Filters Toggle */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
              className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 lg:hidden"
              aria-expanded={mobileFiltersOpen}
              aria-controls="mobile-filters-panel"
              aria-label={mobileFiltersOpen ? "Chiudi filtri" : "Apri filtri"}
            >
              <span className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-white shadow-lg transition-shadow hover:shadow-xl">
                <Filter className="h-4 w-4" /> Filtri
              </span>
            </button>

            {/* Mobile Filters Overlay */}
            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileFiltersOpen(false)} aria-hidden="true" />
            )}
            <div
              id="mobile-filters-panel"
              className={`fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto bg-[var(--color-surface)] p-6 shadow-xl transition-transform duration-300 lg:hidden ${
                mobileFiltersOpen ? "translate-x-0" : "-translate-x-full"
              }`}
              role="dialog"
              aria-modal="true"
              aria-label="Filtri catalogo"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Filtri</h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Chiudi filtri"
                  className="rounded-[var(--radius-md)] p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-text)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <CatalogSidebar {...sidebarProps} />
            </div>

            {/* Main Content */}
            <div className="min-w-0 flex-1">
              {/* Sort + Results count */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--color-text-muted)]">
                  {total} {total === 1 ? "prodotto" : "prodotti"}
                  {query && ` per "${query}"`}
                  {activeCategory && (() => {
                    const n = resolveCategoryName(activeCategory);
                    return n ? ` in "${n}"` : "";
                  })()}
                </p>
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="h-4 w-4 text-[var(--color-text-muted)] lg:hidden" />
                  <select
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    aria-label="Ordina per"
                    className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] transition-colors focus:border-[var(--color-primary)] focus:outline-none"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active filter pills */}
              {(activeCategory || query) && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-primary)]/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                    <SlidersHorizontal className="h-2.5 w-2.5" /> Filtri attivi
                  </span>
                  {query && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
                      &ldquo;{query}&rdquo;
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        aria-label={`Rimuovi filtro ricerca "${query}"`}
                        className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-[var(--color-primary)]/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {activeCategory && (() => {
                    const name = resolveCategoryName(activeCategory);
                    if (!name) return null;
                    return (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
                        {name}
                        <button
                          type="button"
                          onClick={() => handleCategoryChange(undefined)}
                          aria-label={`Rimuovi filtro categoria ${name}`}
                          className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-[var(--color-primary)]/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => { handleClearSearch(); handleCategoryChange(undefined); }}
                    className="text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
                  >
                    Resetta tutto
                  </button>
                </div>
              )}

              {/* Product Grid */}
              {loading ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
                  {Array.from({ length: 6 }).map((_, i) => (
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
                <StaggeredGrid className="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
                  {products.map((product) => (
                    <StaggeredItem key={product.id}>
                      <CatalogProductCard product={product} />
                    </StaggeredItem>
                  ))}
                </StaggeredGrid>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-[var(--color-text-muted)]">Nessun prodotto trovato con questi criteri.</p>
                  <button
                    type="button"
                    onClick={() => { handleClearSearch(); handleCategoryChange(undefined); }}
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
            </div>
          </div>
        </section>
      </ScrollAnimatedSection>
    </>
  );
}
