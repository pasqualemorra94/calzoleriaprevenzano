"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ShoppingBag } from "lucide-react";

interface QuickProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: { id: string; url: string; alt: string | null } | null;
  category: { id: string; name: string; slug: string } | null;
}

/**
 * Mobile-only horizontal product carousel.
 * Sits directly under the hero so the first prodotto-acquistabile
 * is reachable in half a swipe — conversion-friendly mobile shopping.
 *
 * Hidden on md+ (desktop has the full FeaturedProductsSection grid).
 */
export function MobileQuickShop(): ReactNode {
  const [products, setProducts] = useState<QuickProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/products?perPage=6&page=1&sort=newest");
        const json = await res.json();
        if (!cancelled && json.ok) {
          const data = json.data as { items: QuickProduct[] };
          setProducts(data.items);
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      className="relative bg-[var(--color-background)] py-9 md:hidden"
      aria-label="Sandali in evidenza"
    >
      {/* Header */}
      <div className="mb-4 flex items-end justify-between px-[var(--page-padding-x)]">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Catalogo
          </span>
          <h2 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight text-balance text-[var(--color-foreground)]">
            Sandali <span className="italic font-medium text-[var(--color-primary)]">in evidenza</span>
          </h2>
        </div>
        <Link
          to="/catalogo"
          className="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] transition-colors active:text-[var(--color-primary-dark)]"
        >
          Vedi tutto
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Horizontal scrollable rail */}
      <div
        className="flex gap-3 overflow-x-auto overscroll-x-contain pb-4 scroll-smooth"
        style={{
          scrollSnapType: "x mandatory",
          paddingLeft: "var(--page-padding-x)",
          paddingRight: "var(--page-padding-x)",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Hide webkit scrollbar */}
        <style>{`section[aria-label="Sandali in evidenza"] div::-webkit-scrollbar { display: none; }`}</style>

        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 animate-pulse"
                style={{ width: "62vw", maxWidth: "240px", scrollSnapAlign: "start" }}
              >
                <div className="aspect-[3/4] rounded-[var(--radius-lg)] bg-[var(--color-muted)]" />
                <div className="mt-3 h-3 w-2/3 rounded bg-[var(--color-muted)]" />
                <div className="mt-2 h-4 w-1/2 rounded bg-[var(--color-muted)]" />
              </div>
            ))
          : products.map((product) => (
              <article
                key={product.id}
                className="shrink-0"
                style={{ width: "62vw", maxWidth: "240px", scrollSnapAlign: "start" }}
              >
                <Link
                  to="/prodotti/$slug"
                  params={{ slug: product.slug }}
                  className="group block"
                  aria-label={`Vedi ${product.name}`}
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-muted)]">
                    {product.image ? (
                      <img
                        src={product.image.url}
                        alt={product.image.alt ?? product.name}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-active:scale-[1.04]"
                        loading="lazy"
                        width={300}
                        height={400}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
                        <ShoppingBag className="h-10 w-10" />
                      </div>
                    )}

                    {product.compareAtPrice && (
                      <span className="absolute left-2.5 top-2.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[var(--color-accent-foreground)]">
                        Sconto
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 px-0.5">
                    {product.category && (
                      <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                        {product.category.name}
                      </span>
                    )}
                    <h3 className="mt-1 truncate text-sm font-medium leading-snug text-[var(--color-foreground)]">
                      {product.name}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-1.5">
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
                </Link>
              </article>
            ))}

        {/* Trailing "see all" card */}
        {!loading && products.length > 0 && (
          <Link
            to="/catalogo"
            className="flex shrink-0 flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/30 px-4 transition-colors active:bg-[var(--color-muted)]"
            style={{
              width: "62vw",
              maxWidth: "240px",
              aspectRatio: "3 / 4",
              scrollSnapAlign: "start",
            }}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-primary)]">
              <ArrowRight className="h-5 w-5" />
            </span>
            <span className="font-display text-sm italic text-[var(--color-foreground)]">
              Esplora il catalogo
            </span>
            <span className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              Tutti i sandali
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}
