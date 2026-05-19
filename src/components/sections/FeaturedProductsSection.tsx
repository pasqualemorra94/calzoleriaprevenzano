import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { StaggeredGrid, StaggeredItem } from "~/components/ui/StaggeredGrid";
import { SectionHeader } from "~/components/ui";
import { m, AnimatePresence } from "motion/react";
import { ArrowRight, ShoppingBag } from "lucide-react";

type ProductTab = "nuove" | "bestseller";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: { id: string; url: string; alt: string | null } | null;
  category: { id: string; name: string; slug: string } | null;
}

const TABS: { key: ProductTab; label: string; description: string }[] = [
  {
    key: "nuove",
    label: "Novità",
    description:
      "I modelli appena usciti dal laboratorio — le pelli nuove, i colori della stagione, le forme rielaborate.",
  },
  {
    key: "bestseller",
    label: "Bestseller",
    description:
      "I sandali più amati dai nostri clienti — quelli che tornano stagione dopo stagione.",
  },
];

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group relative">
      <Link
        to="/prodotti/$slug"
        params={{ slug: product.slug }}
        className="absolute inset-0 z-10 rounded-[var(--radius-lg)]"
        aria-label={`Vedi ${product.name}`}
      >
        <span className="sr-only">Vedi {product.name}</span>
      </Link>

      <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)] transition-shadow duration-300 group-hover:shadow-[0_8px_30px_rgba(139,94,60,0.12)]">
        {product.image ? (
          <img
            src={product.image.url}
            alt={product.image.alt ?? product.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
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

        <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="pointer-events-none inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-xs font-semibold tracking-wide text-white shadow-[0_4px_20px_rgba(139,94,60,0.3)]">
            <ShoppingBag className="h-4 w-4" />
            Vedi dettaglio
          </span>
        </div>

        <div className="absolute inset-0 bg-[var(--color-primary)]/0 transition-colors duration-300 group-hover:bg-[var(--color-primary)]/[0.03]" />
        <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/0 transition-all duration-300 group-hover:border-[var(--color-accent)]/25" />
      </div>

      <div className="mt-3 md:mt-5">
        {product.category && (
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            {product.category.name}
          </span>
        )}
        <h3 className="mt-1 text-sm font-medium leading-snug text-[var(--color-text)] transition-colors duration-200 group-hover:text-[var(--color-primary)] md:mt-1.5">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 md:mt-2 md:gap-2">
          <p className="text-sm font-semibold text-[var(--color-primary)]">
            €{product.price.toFixed(2)}
          </p>
          {product.compareAtPrice && (
            <p className="text-sm text-[var(--color-text-muted)] line-through">
              €{product.compareAtPrice.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export function FeaturedProductsSection() {
  const [activeTab, setActiveTab] = useState<ProductTab>("nuove");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async (tab: ProductTab) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("perPage", "8");
      params.set("page", "1");
      params.set("sort", tab === "nuove" ? "newest" : "name");
      if (tab === "nuove") params.set("category", "sandali");
      if (tab === "bestseller") params.set("featured", "true");

      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();
      if (json.ok) {
        const data = json.data as { items: Product[] };
        setProducts(data.items);
      }
    } catch {
      setProducts([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts(activeTab);
  }, [activeTab, fetchProducts]);

  const currentTabMeta = TABS.find((t) => t.key === activeTab);

  return (
    <ScrollAnimatedSection className="bg-[var(--color-surface)] py-[var(--section-padding-y-lg)]">
      <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
        {/* Section header */}
        <SectionHeader
          eyebrow="Catalogo"
          title="Novità e bestseller"
          className="mb-9 md:mb-16"
        />

        {/* Tabs */}
        <div className="mb-6 flex items-center justify-center gap-2 md:mb-10">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-[var(--radius-md)] px-5 py-2 text-sm font-medium transition-all duration-200 md:px-7 md:py-2.5 ${
                activeTab === tab.key
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "bg-[var(--color-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab description */}
        <AnimatePresence mode="wait">
          <m.p
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="mx-auto mb-7 max-w-2xl text-center text-lg leading-relaxed text-[var(--color-text-secondary)] md:mb-12"
          >
            {currentTabMeta?.description}
          </m.p>
        </AnimatePresence>

        {/* Product grid */}
        <AnimatePresence mode="wait">
          <m.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {loading ? (
              <>
                {/* Desktop skeleton */}
                <div className="hidden grid-cols-3 gap-7 md:grid lg:grid-cols-4 lg:gap-8">
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
                {/* Mobile skeleton */}
                <div className="-mx-[var(--page-padding-x)] flex gap-3 overflow-hidden px-[var(--page-padding-x)] md:hidden">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="shrink-0 animate-pulse"
                      style={{ width: "62vw", maxWidth: "240px" }}
                    >
                      <div className="aspect-[3/4] rounded-[var(--radius-lg)] bg-[var(--color-muted)]" />
                      <div className="mt-3 h-3 w-2/3 rounded bg-[var(--color-muted)]" />
                      <div className="mt-2 h-4 w-1/2 rounded bg-[var(--color-muted)]" />
                    </div>
                  ))}
                </div>
              </>
            ) : products.length > 0 ? (
              <>
                {/* Desktop: classic staggered grid */}
                <StaggeredGrid className="hidden grid-cols-3 gap-7 md:grid lg:grid-cols-4 lg:gap-8">
                  {products.map((product) => (
                    <StaggeredItem key={product.id}>
                      <ProductCard product={product} />
                    </StaggeredItem>
                  ))}
                </StaggeredGrid>

                {/* Mobile: horizontal scroll-snap rail */}
                <div
                  className="-mx-[var(--page-padding-x)] flex gap-3 overflow-x-auto overscroll-x-contain pb-3 scroll-smooth md:hidden"
                  style={{
                    scrollSnapType: "x mandatory",
                    paddingLeft: "var(--page-padding-x)",
                    paddingRight: "var(--page-padding-x)",
                    scrollbarWidth: "none",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <style>{`section .featured-rail::-webkit-scrollbar { display: none; }`}</style>
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="shrink-0"
                      style={{
                        width: "62vw",
                        maxWidth: "240px",
                        scrollSnapAlign: "start",
                      }}
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-16 text-center">
                <p className="text-[var(--color-text-muted)]">
                  Nessun prodotto disponibile al momento.
                </p>
              </div>
            )}
          </m.div>
        </AnimatePresence>

        {/* View all CTA */}
        <div className="mt-14 text-center">
          <Link
            to="/catalogo"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] transition-colors duration-200 hover:text-[var(--color-primary-dark)]"
          >
            Vedi tutti i prodotti
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </ScrollAnimatedSection>
  );
}
