import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useEffect, useCallback } from "react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { StaggeredGrid, StaggeredItem } from "~/components/ui/StaggeredGrid";
import { m } from "motion/react";
import { Search, X, ChevronLeft, ChevronRight, ShoppingBag, Heart, SlidersHorizontal } from "lucide-react";

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

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Novità" },
  { value: "price_asc", label: "Prezzo crescente" },
  { value: "price_desc", label: "Prezzo decrescente" },
  { value: "name", label: "Nome A-Z" },
];

const PER_PAGE = 12;

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

export const Route = createFileRoute("/catalogo")({
  component: CatalogoPage,
});

function CatalogoPage(): ReactNode {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<SortOption>("newest");
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
                placeholder="Cerca prodotti..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Cerca prodotti"
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-9 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary)] focus:outline-none"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Cancella ricerca"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>

            {/* Category filters — hierarchical */}
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
                Tutte
              </button>
              {categories.map((cat) => (
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
              {/* Show subcategories when a parent is active */}
              {activeCategory && (() => {
                const parent = categories.find((c) => c.slug === activeCategory);
                if (parent && parent.children.length > 0) {
                  return parent.children.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => handleCategoryChange(child.slug)}
                      className={`rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium transition-colors duration-[var(--transition-base)] ${
                        activeCategory === child.slug
                          ? "bg-[var(--color-primary)] text-white border-transparent"
                          : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]/80"
                      }`}
                    >
                      {child.name} ({child.productCount})
                    </button>
                  ));
                }
                return null;
              })()}
            </div>
          </div>

          {/* Sort + Results count */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--color-text-muted)]">
              {total} {total === 1 ? "prodotto" : "prodotti"}
              {query && ` per "${query}"`}
            </p>
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

          {/* Content */}
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
        </section>
      </ScrollAnimatedSection>
    </>
  );
}

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
          <span className="absolute left-3 top-3 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent-foreground)]">
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
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            {product.category.name}
          </span>
        )}
        <h3 className="mt-1 font-display text-[var(--text-base)] font-semibold leading-snug text-[var(--color-text)]">
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
