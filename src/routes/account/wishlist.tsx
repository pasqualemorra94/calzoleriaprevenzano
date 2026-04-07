import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Heart, Trash2, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { m } from "motion/react";

interface WishlistItem {
  id: string;
  productId: string;
  addedAt: string;
  product: {
    name: string;
    slug: string;
    price: number;
    compareAtPrice: number | null;
    image: { id: string; url: string; alt: string | null } | null;
  };
}

export const Route = createFileRoute("/account/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await fetch("/api/wishlist");
      const json = await res.json();
      if (json.ok) setItems(json.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    try {
      const res = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const json = await res.json();
      if (json.ok) {
        setItems(json.data);
        toast.success("Rimosso dalla wishlist");
        window.dispatchEvent(new Event("wishlist-updated"));
      }
    } catch { /* ignore */ }
    setRemovingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-[var(--color-text)]">
          Wishlist
        </h1>
        {items.length > 0 && (
          <span className="text-sm text-[var(--color-text-muted)]">
            {items.length} {items.length === 1 ? "articolo" : "articoli"}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] py-16 text-center">
          <Heart className="h-10 w-10 text-[var(--color-text-muted)] mb-4" />
          <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">La tua wishlist è vuota</h3>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-6">
            Salva i prodotti che ti piacciono per ritrovarli facilmente.
          </p>
          <Link
            to="/catalogo"
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
          >
            Esplora il catalogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden transition-colors hover:border-[var(--color-primary)]/20"
            >
              {/* Image */}
              <Link to="/prodotti/$slug" params={{ slug: item.product.slug }}>
                <div className="aspect-square overflow-hidden bg-[var(--color-muted)]">
                  {item.product.image ? (
                    <img
                      src={item.product.image.url}
                      alt={item.product.image.alt ?? item.product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-[var(--color-text-muted)]" />
                    </div>
                  )}
                </div>
              </Link>

              {/* Remove button */}
              <button
                onClick={() => handleRemove(item.productId)}
                disabled={removingId === item.productId}
                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[var(--color-text-muted)] shadow-sm transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                aria-label={`Rimuovi ${item.product.name} dalla wishlist`}
              >
                {removingId === item.productId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>

              {/* Info */}
              <div className="p-4">
                <Link
                  to="/prodotti/$slug"
                  params={{ slug: item.product.slug }}
                  className="text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors line-clamp-2"
                >
                  {item.product.name}
                </Link>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-semibold tabular-nums text-[var(--color-primary)]">
                    €{item.product.price.toFixed(2)}
                  </span>
                  {item.product.compareAtPrice && item.product.compareAtPrice > item.product.price && (
                    <span className="text-xs text-[var(--color-text-muted)] line-through tabular-nums">
                      €{item.product.compareAtPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </m.div>
  );
}
