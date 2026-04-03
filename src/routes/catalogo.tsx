import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useEffect, useCallback } from "react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { StaggeredGrid, StaggeredItem } from "~/components/ui/StaggeredGrid";
import { m } from "motion/react";
import {
  Search, X, ChevronLeft, ChevronRight, ChevronDown,
  ShoppingBag, Heart, SlidersHorizontal, Filter, Tag,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────

interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  image: { id: string; url: string; alt: string | null } | null;
  category: { id: string; name: string; slug: string } | null;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

interface CategoryWithChildren {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  children: CategoryItem[];
}

type SortOption = "newest" | "price_asc" | "price_desc" | "name";

// ── Constants ──────────────────────────────────────────────

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Novità" },
  { value: "price_asc", label: "Prezzo crescente" },
  { value: "price_desc", label: "Prezzo decrescente" },
  { value: "name", label: "Nome A-Z" },
];

const PER_PAGE = 12;

// ── Helpers ────────────────────────────────────────────────

function buildUrl(params: {
  page: number;
  category?: string;
  query?: string;
  sort: SortOption;
}): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("perPage", String(PER_PAGE));
  sp.set("sort", params.sort);
  if (params.category) sp.set("category", params.category);
  if (params.query) sp.set("query", params.query);
  return `/api/products?${sp.toString()}`;
}

/** Check if a slug matches a parent or any of its children */
function isCategoryActive(
  slug: string,
  activeCategory: string | undefined,
  children: CategoryItem[],
): boolean {
  if (slug === activeCategory) return true;
  return children.some((child) => child.slug === activeCategory);
}

// ── Route ──────────────────────────────────────────────────

export const Route = createFileRoute("/catalogo")({
  component: CatalogoPage,
  validateSearch: (search: Record<string, string>): { category?: string; query?: string; page?: string; sort?: string } => {
    return {
      category: search.category,
      query: search.query,
      page: search.page,
      sort: search.sort,
    };
  },
});

// ── Page Component ─────────────────────────────────────────

function CatalogoPage(): ReactNode {
  const routeSearch = useSearch({ from: "/catalogo" });
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | undefined>(routeSearch.category);
  const [sort, setSort] = useState<SortOption>("newest");
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.ok) setCategories(json.data);
    } catch { /* ignore */ }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const url = buildUrl({ page, category: activeCategory, query, sort });
      const res = await fetch(url);
      const json = await res.json();
      if (json.ok) {
        const data = json.data as { items: ProductListItem[]; total: number; page: number; totalPages: number };
        setProducts(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, activeCategory, query, sort]);

  // Sync category from URL when navigating via megamenu
  useEffect(() => {
    if (routeSearch.category !== activeCategory) {
      setActiveCategory(routeSearch.category);
      setPage(1);
    }
  }, [routeSearch.category]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Close mobile filters when a filter is applied
  useEffect(() => {
    setMobileFiltersOpen(false);
  }, [activeCategory, query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setQuery("");
    setPage(1);
  };

  const handleCategoryChange = (slug: string | undefined) => {
    setActiveCategory(slug);
    setPage(1);
  };

  const handleSortChange = (value: SortOption) => {
    setSort(value);
    setPage(1);
  };

  return (
    <>
      {/* Page header */}
      <section className="bg-[var(--color-surface)] py-[var(--section-padding-y)]">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <m.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <nav className="mb-4 text-sm text-[var(--color-text-muted)]" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-[var(--color-primary)]">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-[var(--color-text)]">Catalogo</span>
            </nav>
            <h1 className="font-display text-[var(--text-lg)] font-semibold tracking-tight md:text-[var(--text-xl)]">
              Catalogo
            </h1>
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
            {/* ── Desktop Sidebar ──────────────────────────── */}
            <aside
              className="hidden w-64 shrink-0 lg:block"
              aria-label="Filtri catalogo"
            >
              <CatalogSidebar
                categories={categories}
                activeCategory={activeCategory}
                searchInput={searchInput}
                onCategoryChange={handleCategoryChange}
                onSearch={handleSearch}
                onClearSearch={handleClearSearch}
                onSearchInputChange={setSearchInput}
              />
            </aside>

            {/* ── Mobile Filters Toggle Button ─────────────── */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
              className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 lg:hidden"
              aria-expanded={mobileFiltersOpen}
              aria-controls="mobile-filters-panel"
              aria-label={mobileFiltersOpen ? "Chiudi filtri" : "Apri filtri"}
            >
              <span className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-white shadow-lg transition-shadow hover:shadow-xl">
                <Filter className="h-4 w-4" />
                Filtri
              </span>
            </button>

            {/* ── Mobile Filters Overlay ───────────────────── */}
            {mobileFiltersOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                onClick={() => setMobileFiltersOpen(false)}
                aria-hidden="true"
              />
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
              <CatalogSidebar
                categories={categories}
                activeCategory={activeCategory}
                searchInput={searchInput}
                onCategoryChange={handleCategoryChange}
                onSearch={handleSearch}
                onClearSearch={handleClearSearch}
                onSearchInputChange={setSearchInput}
              />
            </div>

            {/* ── Main Content ─────────────────────────────── */}
            <div className="min-w-0 flex-1">
              {/* Sort + Results count */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--color-text-muted)]">
                  {total} {total === 1 ? "prodotto" : "prodotti"}
                  {query && ` per "${query}"`}
                  {activeCategory && (() => {
                    const allCats = categories.flatMap((c) => [
                      { slug: c.slug, name: c.name },
                      ...c.children.map((ch) => ({ slug: ch.slug, name: ch.name })),
                    ]);
                    const found = allCats.find((c) => c.slug === activeCategory);
                    return found ? ` in "${found.name}"` : "";
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
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active filter pills */}
              {(activeCategory || query) && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-primary)]/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                    <SlidersHorizontal className="h-2.5 w-2.5" />
                    Filtri attivi
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
                    const allCats = categories.flatMap((c) => [
                      { slug: c.slug, name: c.name },
                      ...c.children.map((ch) => ({ slug: ch.slug, name: ch.name })),
                    ]);
                    const found = allCats.find((c) => c.slug === activeCategory);
                    if (!found) return null;
                    return (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
                        {found.name}
                        <button
                          type="button"
                          onClick={() => handleCategoryChange(undefined)}
                          aria-label={`Rimuovi filtro categoria ${found.name}`}
                          className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-[var(--color-primary)]/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => {
                      handleClearSearch();
                      handleCategoryChange(undefined);
                    }}
                    className="text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
                  >
                    Resetta tutto
                  </button>
                </div>
              )}

              {/* Product Grid — 3 columns on desktop */}
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
                  <p className="text-[var(--color-text-muted)]">
                    Nessun prodotto trovato con questi criteri.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      handleClearSearch();
                      handleCategoryChange(undefined);
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
            </div>
          </div>
        </section>
      </ScrollAnimatedSection>
    </>
  );
}

// ── Sidebar Component (shared desktop + mobile) ────────────

function CatalogSidebar({
  categories,
  activeCategory,
  searchInput,
  onCategoryChange,
  onSearch,
  onClearSearch,
  onSearchInputChange,
}: {
  categories: CategoryWithChildren[];
  activeCategory: string | undefined;
  searchInput: string;
  onCategoryChange: (slug: string | undefined) => void;
  onSearch: (e: React.FormEvent) => void;
  onClearSearch: () => void;
  onSearchInputChange: (value: string) => void;
}): ReactNode {
  return (
    <div className="space-y-8">
      {/* Search */}
      <div>
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-primary)]/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
          <Search className="h-3 w-3" />
          Cerca
        </span>
        <form onSubmit={onSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Cerca prodotti..."
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            aria-label="Cerca prodotti"
            className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-9 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary)] focus:outline-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={onClearSearch}
              aria-label="Cancella ricerca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* Category tree */}
      <nav aria-label="Categorie prodotti">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-primary)]/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
          <Tag className="h-3 w-3" />
          Categorie
        </span>
        <ul className="space-y-1" role="tree">
          {/* "All" option */}
          <li role="treeitem" aria-selected={!activeCategory}>
            <button
              type="button"
              onClick={() => onCategoryChange(undefined)}
              className={`flex w-full items-center rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors duration-[var(--transition-base)] ${
                !activeCategory
                  ? "bg-[var(--color-primary)]/10 font-medium text-[var(--color-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]/60 hover:text-[var(--color-text)]"
              }`}
            >
              Tutte le categorie
            </button>
          </li>

          {/* Category groups with expandable children */}
          {categories.map((cat) => {
            const hasChildren = cat.children.length > 0;
            const parentActive = isCategoryActive(cat.slug, activeCategory, cat.children);
            const expanded = parentActive && hasChildren;

            return (
              <li key={cat.id} role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => onCategoryChange(cat.slug)}
                    className={`flex min-w-0 flex-1 items-center rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors duration-[var(--transition-base)] ${
                      activeCategory === cat.slug
                        ? "bg-[var(--color-primary)]/10 font-medium text-[var(--color-primary)]"
                        : parentActive
                          ? "bg-[var(--color-primary)]/5 font-medium text-[var(--color-primary)]"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]/60 hover:text-[var(--color-text)]"
                    }`}
                  >
                    <span className="min-w-0 truncate">{cat.name}</span>
                    <span className="ml-2 shrink-0 text-xs text-[var(--color-text-muted)]">
                      {cat.productCount}
                    </span>
                  </button>
                  {hasChildren && (
                    <span className="ml-1 shrink-0 px-1">
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-[var(--color-text-muted)] transition-transform duration-200 ${
                          expanded ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </span>
                  )}
                </div>

                {/* Subcategories (expanded when parent is active) */}
                {hasChildren && expanded && (
                  <ul className="ml-4 mt-1 space-y-0.5 border-l border-[var(--color-border-light)] pl-3" role="group">
                    {/* "All [parent name]" sub-option */}
                    <li>
                      <button
                        type="button"
                        onClick={() => onCategoryChange(cat.slug)}
                        className={`flex w-full items-center rounded-[var(--radius-sm)] px-3 py-1.5 text-xs transition-colors duration-[var(--transition-base)] ${
                          activeCategory === cat.slug
                            ? "font-medium text-[var(--color-primary)]"
                            : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                        }`}
                      >
                        Tutti {cat.name}
                      </button>
                    </li>
                    {cat.children.map((child) => (
                      <li key={child.id}>
                        <button
                          type="button"
                          onClick={() => onCategoryChange(child.slug)}
                          className={`flex w-full items-center rounded-[var(--radius-sm)] px-3 py-1.5 text-xs transition-colors duration-[var(--transition-base)] ${
                            activeCategory === child.slug
                              ? "font-medium text-[var(--color-primary)]"
                              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                          }`}
                        >
                          <span className="min-w-0 truncate">{child.name}</span>
                          <span className="ml-auto shrink-0 text-[var(--color-text-muted)]">
                            {child.productCount}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

// ── Product Card ────────────────────────────────────────────

function CatalogProductCard({ product }: { product: ProductListItem }) {
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

        <div className="absolute inset-0 flex items-end justify-between p-4 opacity-0 transition-opacity duration-[var(--transition-base)] group-hover:opacity-100">
          <button
            type="button"
            aria-label="Aggiungi ai preferiti"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text)] shadow-md transition-colors hover:bg-[var(--color-primary)] hover:text-white"
          >
            <Heart className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Aggiungi al carrello"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-md transition-colors hover:bg-[var(--color-primary-dark)]"
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>

        <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/0 transition-colors duration-[var(--transition-base)] group-hover:border-[var(--color-accent)]/30" />
      </div>

      <div className="mt-4">
        {product.category && (
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {product.category.name}
          </span>
        )}
        <h3 className="mt-0.5 text-xs font-medium leading-snug text-[var(--color-text)]">
          <Link to="/prodotti/$slug" params={{ slug: product.slug }} className="hover:text-[var(--color-primary)]">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-xs font-medium text-[var(--color-primary)]">
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
