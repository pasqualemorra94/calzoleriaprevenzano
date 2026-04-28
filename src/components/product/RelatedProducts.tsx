import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  image: { id: string; url: string; alt: string | null } | null;
  category: { id: string; name: string; slug: string } | null;
}

interface RelatedProductsProps {
  products: ProductListItem[];
  currentProductId: string;
}

export function RelatedProducts({ products, currentProductId }: RelatedProductsProps): ReactNode {
  const filtered = products.filter((rp) => rp.id !== currentProductId).slice(0, 4);

  if (filtered.length === 0) return null;

  return (
    <ScrollAnimatedSection className="bg-[var(--color-surface)] py-[var(--section-padding-y)]">
      <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
        <div className="mb-10 text-center">
          <h2 className="text-xs font-medium tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
            Potrebbe piacerti anche
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-8">
          {filtered.map((product) => (
            <RelatedProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </ScrollAnimatedSection>
  );
}

function RelatedProductCard({ product }: { product: ProductListItem }): ReactNode {
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
          <img src={product.image.url} alt={product.image.alt ?? product.name}
            className="h-full w-full object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-[1.05]"
            loading="lazy" width={400} height={533} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
            <ShoppingBag className="h-12 w-12" />
          </div>
        )}
        {/* Hover reveal — "Vedi dettaglio" pill */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full justify-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-xs font-semibold tracking-wide text-white shadow-[0_4px_20px_rgba(139,94,60,0.3)]">
            <ShoppingBag className="h-4 w-4" />
            Vedi dettaglio
          </span>
        </div>

        <div className="absolute inset-0 bg-[var(--color-primary)]/0 transition-colors duration-300 group-hover:bg-[var(--color-primary)]/[0.03]" />
        <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/0 transition-colors duration-[var(--transition-base)] group-hover:border-[var(--color-accent)]/30" />
      </div>
      <div className="mt-4">
        {product.category && (
          <span className="text-xs font-medium tracking-wider text-[var(--color-text-muted)]">{product.category.name}</span>
        )}
        <h3 className="mt-1 text-sm font-medium leading-snug text-[var(--color-text)] transition-colors duration-200 group-hover:text-[var(--color-primary)]">
          {product.name}
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-sm font-medium text-[var(--color-primary)]">EUR {product.price.toFixed(2)}</p>
          {product.compareAtPrice && (
            <p className="text-sm text-[var(--color-text-muted)] line-through">EUR {product.compareAtPrice.toFixed(2)}</p>
          )}
        </div>
      </div>
    </article>
  );
}
