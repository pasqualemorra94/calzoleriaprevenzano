import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { StaggeredGrid, StaggeredItem } from "~/components/ui/StaggeredGrid";
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

      <div className="mt-5">
        {product.category && (
          <span className="text-[11px] font-medium tracking-[0.15em] text-[var(--color-text-muted)]">
            {product.category.name}
          </span>
        )}
        <h3 className="mt-1.5 text-sm font-medium leading-snug text-[var(--color-text)] transition-colors duration-200 group-hover:text-[var(--color-primary)]">
          {product.name}
        </h3>
        <div className="mt-2 flex items-center gap-2">
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
        <div className="mb-14 text-center md:mb-16">
          <span className="mb-4 inline-block text-xs font-medium tracking-[0.2em] text-[var(--color-text-muted)]">
            Catalogo
          </span>
          <h2 className="font-display text-[var(--text-lg)] font-semibold tracking-tight md:text-[var(--text-xl)]">
            Novità e bestseller
          </h2>
        </div>

        {/* Tabs */}
        <div className="mb-10 flex items-center justify-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-[var(--radius-md)] px-7 py-2.5 text-sm font-medium transition-all duration-200 ${
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
            className="mx-auto mb-12 max-w-2xl text-center text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]"
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
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 md:gap-7 lg:grid-cols-4 lg:gap-8">
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
              <StaggeredGrid className="grid grid-cols-2 gap-5 md:grid-cols-3 md:gap-7 lg:grid-cols-4 lg:gap-8">
                {products.map((product) => (
                  <StaggeredItem key={product.id}>
                    <ProductCard product={product} />
                  </StaggeredItem>
                ))}
              </StaggeredGrid>
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
