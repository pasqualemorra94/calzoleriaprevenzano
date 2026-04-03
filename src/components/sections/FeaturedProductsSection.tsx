import { useState } from "react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { StaggeredGrid, StaggeredItem } from "~/components/ui/StaggeredGrid";
import { m, AnimatePresence } from "motion/react";
import { ArrowRight, ShoppingBag } from "lucide-react";

type ProductTab = "nuove" | "bestseller";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
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

const PRODUCTS: Record<ProductTab, Product[]> = {
  nuove: [
    { id: "n1", name: "Gioiello Infradito Camoscio", price: 89, image: "/images/prod-placeholder.svg", category: "Collezione Gioiello" },
    { id: "n2", name: "Cavigliera Vitello Oro", price: 95, image: "/images/prod-placeholder.svg", category: "Collezione Gioiello" },
    { id: "n3", name: "Fascia Cuoio Naturale", price: 78, image: "/images/prod-placeholder.svg", category: "Collezione Classica" },
    { id: "n4", name: "Treccia Pelle Sabbia", price: 85, image: "/images/prod-placeholder.svg", category: "Collezione Classica" },
  ],
  bestseller: [
    { id: "b1", name: "Gioiello Infradito Nero", price: 85, image: "/images/prod-placeholder.svg", category: "Collezione Gioiello" },
    { id: "b2", name: "Schiava Vitello Beige", price: 75, image: "/images/prod-placeholder.svg", category: "Collezione Classica" },
    { id: "b3", name: "Cavigliera Camoscio Marrone", price: 92, image: "/images/prod-placeholder.svg", category: "Collezione Gioiello" },
    { id: "b4", name: "Infradito Classico Cuoio", price: 68, image: "/images/prod-placeholder.svg", category: "Collezione Classica" },
  ],
};

function ProductCard({ product }: { product: Product }) {
  return (
    <m.article
      className="group"
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          loading="lazy"
          width={400}
          height={533}
        />

        {/* Quick add overlay */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <a
            href={`/catalogo`}
            className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-xs font-semibold tracking-wide text-white shadow-[0_4px_20px_rgba(139,94,60,0.3)] transition-all hover:bg-[var(--color-primary-dark)]"
          >
            <ShoppingBag className="h-4 w-4" />
            Aggiungi al carrello
          </a>
        </div>

        {/* Hover border */}
        <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/0 transition-all duration-300 group-hover:border-[var(--color-accent)]/25" />
      </div>

      {/* Product info */}
      <div className="mt-5">
        <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
          {product.category}
        </span>
        <h3 className="mt-1.5 font-display text-[var(--text-base)] font-semibold leading-snug text-[var(--color-text)] transition-colors duration-200 group-hover:text-[var(--color-primary)]">
          <a href={`/catalogo`} className="block">{product.name}</a>
        </h3>
        <p className="mt-2 text-sm font-semibold text-[var(--color-primary)]">
          €{product.price.toFixed(2)}
        </p>
      </div>
    </m.article>
  );
}

export function FeaturedProductsSection() {
  const [activeTab, setActiveTab] = useState<ProductTab>("nuove");
  const currentProducts = PRODUCTS[activeTab];
  const currentTabMeta = TABS.find((t) => t.key === activeTab);

  return (
    <ScrollAnimatedSection className="bg-[var(--color-surface)] py-[var(--section-padding-y-lg)]">
      <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
        {/* Section header */}
        <div className="mb-14 text-center md:mb-16">
          <span className="mb-4 inline-block text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Catalogo
          </span>
          <h2 className="font-display text-[var(--text-4xl)] font-semibold tracking-tight">
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
            <StaggeredGrid className="grid grid-cols-2 gap-5 md:grid-cols-3 md:gap-7 lg:grid-cols-4 lg:gap-8">
              {currentProducts.map((product) => (
                <StaggeredItem key={product.id}>
                  <ProductCard product={product} />
                </StaggeredItem>
              ))}
            </StaggeredGrid>
          </m.div>
        </AnimatePresence>

        {/* View all CTA */}
        <div className="mt-14 text-center">
          <a
            href="/catalogo"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] transition-colors duration-200 hover:text-[var(--color-primary-dark)]"
          >
            Vedi tutti i prodotti
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </div>
      </section>
    </ScrollAnimatedSection>
  );
}