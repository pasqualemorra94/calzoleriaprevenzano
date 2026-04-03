import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { StaggeredGrid, StaggeredItem } from "~/components/ui/StaggeredGrid";
import { m } from "motion/react";
import { Search, SlidersHorizontal, ShoppingBag, Heart, X } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  isNew?: boolean;
}

const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Gioiello Infradito Camoscio", price: 89, image: "/images/prod-placeholder.svg", category: "Gioiello", isNew: true },
  { id: "2", name: "Gioiello Infradito Nero", price: 85, image: "/images/prod-placeholder.svg", category: "Gioiello" },
  { id: "3", name: "Gioiello Cavigliera Vitello Oro", price: 95, image: "/images/prod-placeholder.svg", category: "Gioiello", isNew: true },
  { id: "4", name: "Gioiello Cavigliera Camoscio Marrone", price: 92, image: "/images/prod-placeholder.svg", category: "Gioiello" },
  { id: "5", name: "Classica Schiava Vitello Beige", price: 75, image: "/images/prod-placeholder.svg", category: "Classica" },
  { id: "6", name: "Classica Infradito Cuoio", price: 68, image: "/images/prod-placeholder.svg", category: "Classica" },
  { id: "7", name: "Classica Fascia Cuoio Naturale", price: 78, image: "/images/prod-placeholder.svg", category: "Classica", isNew: true },
  { id: "8", name: "Classica Treccia Pelle Sabbia", price: 85, image: "/images/prod-placeholder.svg", category: "Classica" },
];

export const Route = createFileRoute("/sandali")({
  component: SandaliPage,
});

function SandaliPage(): ReactNode {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredProducts = MOCK_PRODUCTS.filter((p) => {
    const matchesSearch = searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
            <span className="mb-3 inline-block text-xs font-medium uppercase tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
              Catalogo
            </span>
            <h1 className="font-display text-[var(--text-4xl)] font-semibold tracking-tight md:text-[var(--text-5xl)]">
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
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Cerca sandali..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Cerca prodotti"
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-9 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary)] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Cancella ricerca"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category filters */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[var(--color-text-muted)]" />
              {(["all", "Gioiello", "Classica"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-[var(--radius-md)] px-4 py-2 text-xs font-medium transition-colors duration-[var(--transition-base)] ${
                    activeCategory === cat
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]/80"
                  }`}
                >
                  {cat === "all" ? "Tutte" : `Collezione ${cat}`}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <p className="mb-6 text-sm text-[var(--color-text-muted)]">
            {filteredProducts.length} sandali
            {activeCategory !== "all" ? ` — Collezione ${activeCategory}` : ""}
            {searchQuery ? ` per "${searchQuery}"` : ""}
          </p>

          {/* Product grid */}
          {filteredProducts.length > 0 ? (
            <StaggeredGrid className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-8">
              {filteredProducts.map((product) => (
                <StaggeredItem key={product.id}>
                  <ProductCard product={product} />
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
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="mt-4 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
              >
                Resetta filtri
              </button>
            </div>
          )}
        </section>
      </ScrollAnimatedSection>
    </>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <m.article
      className="group"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-[1.05]"
          loading="lazy"
          width={400}
          height={533}
        />

        {/* New badge */}
        {product.isNew && (
          <span className="absolute left-3 top-3 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent-foreground)]">
            Nuovo
          </span>
        )}

        {/* Quick actions */}
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

        {/* 🧬 DNA: Stitch border on hover */}
        <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/0 transition-colors duration-[var(--transition-base)] group-hover:border-[var(--color-accent)]/30" />
      </div>

      <div className="mt-4">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          {product.category}
        </span>
        <h3 className="mt-1 font-display text-[var(--text-base)] font-semibold leading-snug text-[var(--color-text)]">
          <a href={`/sandali/${product.id}`} className="hover:text-[var(--color-primary)]">
            {product.name}
          </a>
        </h3>
        <p className="mt-2 text-sm font-medium text-[var(--color-primary)]">
          €{product.price.toFixed(2)}
        </p>
      </div>
    </m.article>
  );
}
