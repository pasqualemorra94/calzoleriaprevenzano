import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useEffect, useCallback } from "react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { m } from "motion/react";
import { ShoppingBag, Minus, Plus, Check, ChevronRight, Loader2 } from "lucide-react";

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
}

interface ProductVariant {
  id: string;
  name: string;
  color: string | null;
  size: string | null;
  price: number | null;
  stock: number;
  sku: string | null;
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  stock: number;
  weight: number | null;
  materials: string | null;
  category: { id: string; name: string; slug: string } | null;
  images: ProductImage[];
  variants: ProductVariant[];
}

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

export const Route = createFileRoute("/prodotti/$slug")({
  component: ProdottoPage,
});

function ProdottoPage(): ReactNode {
  const { slug } = Route.useParams();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cartStatus, setCartStatus] = useState<"idle" | "loading" | "success">("idle");

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(`/api/products/${slug}`);
      const json = await res.json();
      if (json.ok) {
        setProduct(json.data);
        if (json.data.variants.length === 1) {
          setSelectedVariantId(json.data.variants[0].id);
        }
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    }
    setLoading(false);
  }, [slug]);

  const [relatedProducts, setRelatedProducts] = useState<ProductListItem[]>([]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    async function fetchRelated() {
      try {
        const res = await fetch("/api/products?featured=true&perPage=4");
        const json = await res.json();
        if (json.ok) setRelatedProducts(json.data.items);
      } catch { /* ignore */ }
    }
    fetchRelated();
  }, []);

  const selectedVariant = product?.variants.find((v) => v.id === selectedVariantId) ?? null;
  const effectivePrice = selectedVariant?.price ?? product?.price ?? 0;
  const effectiveStock = selectedVariant ? selectedVariant.stock : (product?.stock ?? 0);

  const stockStatus = effectiveStock === 0
    ? { label: "Esaurito", color: "text-[var(--color-destructive)]" }
    : effectiveStock <= 3
      ? { label: `Ultimi ${effectiveStock} pezzi`, color: "text-amber-600" }
      : { label: "Disponibile", color: "text-green-600" };

  const canAddToCart = product && !product.variants.length || selectedVariantId !== null;

  const handleAddToCart = async () => {
    if (!product || !canAddToCart || effectiveStock === 0 || cartStatus === "loading") return;
    setCartStatus("loading");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, variantId: selectedVariantId, quantity }),
      });
      const json = await res.json();
      if (json.ok) {
        setCartStatus("success");
        setTimeout(() => setCartStatus("idle"), 3000);
      } else {
        setCartStatus("idle");
      }
    } catch {
      setCartStatus("idle");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-[var(--section-padding-y)]">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="animate-pulse">
            <div className="aspect-square rounded-[var(--radius-lg)] bg-[var(--color-muted)]" />
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 rounded bg-[var(--color-muted)]" />
            <div className="h-8 w-3/4 rounded bg-[var(--color-muted)]" />
            <div className="h-6 w-24 rounded bg-[var(--color-muted)]" />
            <div className="h-20 w-full rounded bg-[var(--color-muted)]" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-[var(--page-padding-x)]">
        <p className="mb-4 text-7xl font-display font-bold text-[var(--color-primary)]">!</p>
        <h1 className="mb-4 text-center text-2xl font-display font-semibold text-[var(--color-text)] md:text-3xl">
          Prodotto non trovato
        </h1>
        <p className="mb-8 max-w-md text-center leading-relaxed text-[var(--color-text-secondary)]">
          Il prodotto che stai cercando non esiste o è stato rimosso.
        </p>
        <Link
          to="/catalogo"
          className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
        >
          Vai al catalogo
        </Link>
      </div>
    );
  }

  const sizes = [...new Set(product.variants.filter((v) => v.size).map((v) => v.size!))];
  const colorsForSize = sizes.length > 0 && selectedVariant
    ? product.variants.filter((v) => v.size === selectedVariant.size)
    : product.variants;

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-[var(--color-surface)] py-4">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <nav className="text-sm text-[var(--color-text-muted)]" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-[var(--color-primary)]">Home</Link>
            <ChevronRight className="mx-1 inline h-3.5 w-3.5" />
            {product.category ? (
              <>
                <Link to="/catalogo" params={{}} className="hover:text-[var(--color-primary)]">
                  {product.category.name}
                </Link>
                <ChevronRight className="mx-1 inline h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <Link to="/catalogo" params={{}} className="hover:text-[var(--color-primary)]">Catalogo</Link>
                <ChevronRight className="mx-1 inline h-3.5 w-3.5" />
              </>
            )}
            <span className="text-[var(--color-text)]">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product detail */}
      <section className="bg-[var(--color-background)] py-[var(--section-padding-y)]">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Images */}
            <m.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Main image */}
              <div className="relative aspect-square overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]">
                {product.images.length > 0 ? (
                  <img
                    src={product.images[selectedImageIndex].url}
                    alt={product.images[selectedImageIndex].alt ?? product.name}
                    className="h-full w-full object-cover"
                    width={product.images[selectedImageIndex].width ?? 800}
                    height={product.images[selectedImageIndex].height ?? 800}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
                    <ShoppingBag className="h-16 w-16" />
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto">
                  {product.images.map((img, i) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedImageIndex(i)}
                      className={`h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] border-2 transition-colors ${
                        i === selectedImageIndex
                          ? "border-[var(--color-primary)]"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.alt ?? `${product.name} ${i + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </m.div>

            {/* Product info */}
            <m.div
              className="flex flex-col"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            >
              {product.category && (
                <span className="mb-2 text-xs font-medium uppercase tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
                  {product.category.name}
                </span>
              )}

              <h1 className="font-display text-[var(--text-3xl)] font-semibold tracking-tight md:text-[var(--text-4xl)]">
                {product.name}
              </h1>

              {/* Price */}
              <div className="mt-4 flex items-center gap-3">
                <p className="text-[var(--text-2xl)] font-semibold text-[var(--color-primary)]">
                  €{effectivePrice.toFixed(2)}
                </p>
                {product.compareAtPrice && (
                  <p className="text-lg text-[var(--color-text-muted)] line-through">
                    €{product.compareAtPrice.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Stock */}
              <p className={`mt-3 text-sm font-medium ${stockStatus.color}`}>
                {stockStatus.label}
              </p>

              {product.shortDescription && (
                <p className="mt-4 leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
                  {product.shortDescription}
                </p>
              )}

              <hr className="stitch-divider stitch-divider--left my-6" />

              {/* Variant selector */}
              {product.variants.length > 0 && (
                <div className="space-y-4">
                  {sizes.length > 0 && (
                    <div>
                      <span className="mb-2 block text-sm font-medium text-[var(--color-text)]">Taglia</span>
                      <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              const firstForSize = product.variants.find((v) => v.size === size);
                              if (firstForSize) setSelectedVariantId(firstForSize.id);
                            }}
                            className={`flex h-10 items-center justify-center rounded-[var(--radius-md)] border px-4 text-sm font-medium transition-colors ${
                              selectedVariant?.size === size
                                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                                : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)]"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                      {sizes.length > 0 ? "Colore" : "Variante"}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {colorsForSize.map((variant) => (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => setSelectedVariantId(variant.id)}
                          className={`flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm transition-colors ${
                            selectedVariantId === variant.id
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-text)]"
                              : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]"
                          }`}
                        >
                          <span
                            className="inline-block h-4 w-4 rounded-full border border-[var(--color-border)]"
                            style={{ backgroundColor: variant.color ?? "#999" }}
                          />
                          {variant.color && <span>{variant.color}</span>}
                          {variant.size && !sizes.length && <span>{variant.size}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity + Add to cart */}
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center rounded-[var(--radius-md)] border border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="flex h-10 w-10 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-40"
                    aria-label="Diminuisci quantità"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="flex h-10 w-12 items-center justify-center text-sm font-medium text-[var(--color-text)]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    disabled={quantity >= 10}
                    className="flex h-10 w-10 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-40"
                    aria-label="Aumenta quantità"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!canAddToCart || effectiveStock === 0 || cartStatus === "loading"}
                  onClick={handleAddToCart}
                  className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] px-8 text-sm font-medium transition-colors duration-[var(--transition-base)] disabled:cursor-not-allowed disabled:opacity-60 ${
                    cartStatus === "success"
                      ? "bg-green-600 text-white"
                      : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                  }`}
                >
                  {cartStatus === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {cartStatus === "success" ? (
                    <>
                      <Check className="h-4 w-4" />
                      Aggiunto al carrello
                    </>
                  ) : effectiveStock === 0 ? (
                    "Esaurito"
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" />
                      Aggiungi al carrello
                    </>
                  )}
                </button>
              </div>

              {/* Materials */}
              {product.materials && (
                <>
                  <hr className="stitch-divider stitch-divider--left my-6" />
                  <div>
                    <h2 className="mb-2 font-display text-[var(--text-lg)] font-semibold">Materiali</h2>
                    <p className="text-sm leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
                      {product.materials}
                    </p>
                  </div>
                </>
              )}

              {/* Description */}
              {product.description && (
                <>
                  <hr className="stitch-divider stitch-divider--left my-6" />
                  <div>
                    <h2 className="mb-2 font-display text-[var(--text-lg)] font-semibold">Descrizione</h2>
                    <p className="text-sm leading-[var(--leading-relaxed)] whitespace-pre-line text-[var(--color-text-secondary)]">
                      {product.description}
                    </p>
                  </div>
                </>
              )}
            </m.div>
          </div>
        </div>
      </section>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <ScrollAnimatedSection className="bg-[var(--color-surface)] py-[var(--section-padding-y)]">
          <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
            <div className="mb-10 text-center">
              <span className="mb-3 inline-block text-xs font-medium uppercase tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
                Potrebbe piacerti anche
              </span>
              <h2 className="font-display text-[var(--text-3xl)] font-semibold tracking-tight">
                Prodotti correlati
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-8">
              {relatedProducts
                .filter((rp) => rp.id !== product.id)
                .slice(0, 4)
                .map((rp) => (
                  <RelatedProductCard key={rp.id} product={rp} />
                ))}
            </div>
          </section>
        </ScrollAnimatedSection>
      )}
    </>
  );
}

function RelatedProductCard({ product }: { product: ProductListItem }) {
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
        <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/0 transition-colors duration-[var(--transition-base)] group-hover:border-[var(--color-accent)]/30" />
      </div>
      <div className="mt-4">
        {product.category && (
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            {product.category.name}
          </span>
        )}
        <h3 className="mt-1 font-display text-[var(--text-base)] font-semibold leading-snug text-[var(--color-text)]">
          <a href={`/prodotti/${product.slug}`} className="hover:text-[var(--color-primary)]">
            {product.name}
          </a>
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
