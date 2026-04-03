import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { m } from "motion/react";
import { ShoppingBag, Heart } from "lucide-react";

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

export function CatalogProductCard({ product }: { product: ProductListItem }): ReactNode {
  return (
    <m.article className="group" whileHover={{ y: -4 }} transition={{ duration: 0.25, ease: "easeOut" }}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]">
        {product.image ? (
          <img src={product.image.url} alt={product.image.alt ?? product.name}
            className="h-full w-full object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-[1.05]"
            loading="lazy" width={400} height={533} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
            <ShoppingBag className="h-12 w-12" />
          </div>
        )}

        {product.compareAtPrice && (
          <span className="absolute left-3 top-3 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[var(--color-accent-foreground)]">Sconto</span>
        )}

        <div className="absolute inset-0 flex items-end justify-between p-4 opacity-0 transition-opacity duration-[var(--transition-base)] group-hover:opacity-100">
          <button type="button" aria-label="Aggiungi ai preferiti"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text)] shadow-md transition-colors hover:bg-[var(--color-primary)] hover:text-white">
            <Heart className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Aggiungi al carrello"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-md transition-colors hover:bg-[var(--color-primary-dark)]">
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>

        <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/0 transition-colors duration-[var(--transition-base)] group-hover:border-[var(--color-accent)]/30" />
      </div>

      <div className="mt-4">
        {product.category && (
          <span className="text-[11px] text-[var(--color-text-muted)]">{product.category.name}</span>
        )}
        <h3 className="mt-0.5 text-xs font-medium leading-snug text-[var(--color-text)]">
          <Link to="/prodotti/$slug" params={{ slug: product.slug }} className="hover:text-[var(--color-primary)]">{product.name}</Link>
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-xs font-medium text-[var(--color-primary)]">€{product.price.toFixed(2)}</p>
          {product.compareAtPrice && <p className="text-sm text-[var(--color-text-muted)] line-through">€{product.compareAtPrice.toFixed(2)}</p>}
        </div>
      </div>
    </m.article>
  );
}
