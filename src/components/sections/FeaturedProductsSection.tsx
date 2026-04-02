import { useState } from "react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { StaggeredGrid, StaggeredItem } from "~/components/ui/StaggeredGrid";
import { m, AnimatePresence } from "motion/react";
import { ArrowRight, ShoppingBag, Heart } from "lucide-react";

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
    { id: "n1", name: "Gioiello Infradito Camoscio", price: 89, image: "/images/prod-placeholder-1.webp", category: "Collezione Gioiello" },
    { id: "n2", name: "Cavigliera Vitello Oro", price: 95, image: "/images/prod-placeholder-2.webp", category: "Collezione Gioiello" },
    { id: "n3", name: "Fascia Cuoio Naturale", price: 78, image: "/images/prod-placeholder-3.webp", category: "Collezione Classica" },
    { id: "n4", name: "Treccia Pelle Sabbia", price: 85, image: "/images/prod-placeholder-4.webp", category: "Collezione Classica" },
  ],
  bestseller: [
    { id: "b1", name: "Gioiello Infradito Nero", price: 85, image: "/images/prod-placeholder-5.webp", category: "Collezione Gioiello" },
    { id: "b2", name: "Schiava Vitello Beige", price: 75, image: "/images/prod-placeholder-6.webp", category: "Collezione Classica" },
    { id: "b3", name: "Cavigliera Camoscio Marrone", price: 92, image: "/images/prod-placeholder-7.webp", category: "Collezione Gioiello" },
    { id: "b4", name: "Infradito Classico Cuoio", price: 68, image: "/images/prod-placeholder-8.webp", category: "Collezione Classica" },
  ],
};

function ProductCard({ product }: { product: Product }) {
  return (
    <m.div
      className="group"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]">
        {/* Product image with 🧬 DNA: gentle scale-reveal */}
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-[1.05]"
          loading="lazy"
          width={400}
          height={533}
        />

        {/* Quick action overlay on hover */}
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

      {/* Product info */}
      <div className="mt-4">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          {product.category}
        </span>
        <h3 className="mt-1 font-display text-[var(--text-base)] font-semibold leading-snug text-[var(--color-text)]">
          {product.name}
        </h3>
        <p className="mt-2 text-sm font-medium text-[var(--color-primary)]">
          €{product.price.toFixed(2)}
        </p>
      </div>
    </m.div>
  );
}

export function FeaturedProductsSection() {
  const [activeTab, setActiveTab] = useState<ProductTab>("nuove");
  const currentProducts = PRODUCTS[activeTab];
  const currentTabMeta = TABS.find((t) => t.key === activeTab);

  return (
    <ScrollAnimatedSection className="bg-[var(--color-background)] py-[var(--section-padding-y)]">
      <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
        {/* Section header */}
        <div className="mb-12 text-center md:mb-16">
          <span className="mb-3 inline-block text-xs font-medium uppercase tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
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
              className={`rounded-[var(--radius-md)] px-6 py-2.5 text-sm font-medium transition-colors duration-[var(--transition-base)] ${
                activeTab === tab.key
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]/80"
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

        {/* Product grid — 2 col mobile, 3 col tablet, 4 col desktop */}
        <AnimatePresence mode="wait">
          <m.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StaggeredGrid className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-8">
              {currentProducts.map((product) => (
                <StaggeredItem key={product.id}>
                  <ProductCard product={product} />
                </StaggeredItem>
              ))}
            </StaggeredGrid>
          </m.div>
        </AnimatePresence>

        {/* View all CTA */}
        <div className="mt-12 text-center">
          <a
            href="/sandali"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] transition-colors duration-[var(--transition-base)] hover:text-[var(--color-primary-dark)]"
          >
            Vedi tutti i prodotti
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </ScrollAnimatedSection>
  );
}
