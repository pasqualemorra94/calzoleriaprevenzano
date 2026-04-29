import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useMemo } from "react";
import { m } from "motion/react";
import { ChevronRight } from "lucide-react";
import { VariantConfigSchema } from "~/lib/types/variant-config";
import { ProductGallery } from "~/components/product/ProductGallery";
import { VariantSelector } from "~/components/product/VariantSelector";
import type { ProductVariant, OptionGroup } from "~/components/product/VariantSelector";
import { RelatedProducts } from "~/components/product/RelatedProducts";
import type { ProductListItem } from "~/components/product/RelatedProducts";
import { $getProductBySlug, $getFeaturedProducts } from "~/lib/product-functions";
import type { ProductDetail } from "~/lib/product-functions";

// ── Helpers ──

function parseOptionGroups(variants: ProductVariant[]): OptionGroup[] {
  const groupMap = new Map<string, OptionGroup>();
  for (const v of variants) {
    const separator = v.name.includes(" - ") ? " - " : "/";
    const parts = v.name.split(separator);
    const groupType = parts.length > 1 ? parts[0].trim().toLowerCase() : "variante";
    const optionLabel = parts.length > 1 ? parts.slice(1).join(separator).trim() : v.name.trim();
    const displayLabel = groupType.charAt(0).toUpperCase() + groupType.slice(1);

    if (!groupMap.has(groupType)) {
      groupMap.set(groupType, { type: groupType, label: displayLabel, options: [] });
    }
    groupMap.get(groupType)!.options.push({
      id: v.id, label: optionLabel, color: v.color,
      priceModifier: v.price ? Number(v.price) : 0, stock: v.stock, imageUrl: null,
    });
  }
  return Array.from(groupMap.values());
}

// ── Route ──

export const Route = createFileRoute("/prodotti/$slug")({
  beforeLoad: async ({
    params,
  }): Promise<{ product: ProductDetail | null; relatedProducts: ProductListItem[] }> => {
    const [product, relatedProducts] = await Promise.all([
      $getProductBySlug({ data: { slug: params.slug } }) as Promise<ProductDetail | null>,
      $getFeaturedProducts({ data: { limit: 4 } }) as Promise<ProductListItem[]>,
    ]);
    return { product, relatedProducts };
  },
  component: ProdottoPage,
});

// ── Component ──

function ProdottoPage(): ReactNode {
  const { product: ssrProduct, relatedProducts: ssrRelated } = Route.useRouteContext();

  // If SSR returned null, product not found
  if (!ssrProduct) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-[var(--page-padding-x)]">
        <p className="mb-4 text-4xl font-display font-bold text-[var(--color-primary)]">!</p>
        <h1 className="mb-4 text-center text-xl font-display font-semibold text-[var(--color-text)]">Prodotto non trovato</h1>
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

  // Client-side interactive state only
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Map<string, string>>(() => {
    const initial = new Map<string, string>();
    const config = VariantConfigSchema.safeParse(ssrProduct.variantConfig);
    if (config.success && config.data.groups.length > 0) {
      for (const g of config.data.groups) {
        if (g.required && g.options.length > 0) initial.set(g.id, g.options[0].value);
      }
    } else if (ssrProduct.variants.length > 0) {
      const groups = parseOptionGroups(ssrProduct.variants);
      for (const g of groups) { if (g.options.length > 0) initial.set(g.type, g.options[0].id); }
    }
    return initial;
  });
  const [quantity, setQuantity] = useState(1);
  const [cartStatus, setCartStatus] = useState<"idle" | "loading" | "success">("idle");
  const [customerNote, setCustomerNote] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Use SSR data directly (no useState for server-loaded data)
  const product = ssrProduct satisfies ProductDetail;
  const relatedProducts = ssrRelated satisfies ProductListItem[];

  // Variant logic
  const parsedConfig = useMemo(() => {
    if (!product?.variantConfig) return null;
    const result = VariantConfigSchema.safeParse(product.variantConfig);
    return result.success ? result.data : null;
  }, [product?.variantConfig]);

  const optionGroups = useMemo(() => {
    if (!product) return [];
    if (parsedConfig) {
      return parsedConfig.groups.map((g) => ({
        type: g.id, label: g.label, dependsOn: g.dependsOn ?? undefined,
        options: g.options.map((o) => ({
          id: o.value, label: o.label, color: o.color ?? null,
          priceModifier: o.priceModifier ?? 0, stock: 999, imageUrl: o.imageUrl ?? null,
        })),
      }));
    }
    return parseOptionGroups(product.variants);
  }, [product, parsedConfig]);

  const visibleGroups = useMemo(() => {
    if (!parsedConfig) return optionGroups;
    return optionGroups.filter((group) => {
      if (!group.dependsOn) return true;
      const parentValue = selectedOptions.get(group.dependsOn.groupId);
      return parentValue === group.dependsOn.optionValue;
    });
  }, [optionGroups, selectedOptions, parsedConfig]);

  const allVisibleGroupsSelected = visibleGroups.every((g) => selectedOptions.has(g.type));

  const selectedVariantId = useMemo(() => {
    if (optionGroups.length === 0) return null;
    if (optionGroups.length === 1) return selectedOptions.get(optionGroups[0].type) ?? optionGroups[0].options[0]?.id ?? null;
    const match = product?.variants.find((v) => optionGroups.every((g) => selectedOptions.get(g.type) === v.id));
    return match?.id ?? null;
  }, [selectedOptions, optionGroups, product]);

  const selectedVariant = product?.variants.find((v) => v.id === selectedVariantId) ?? null;

  const priceBreakdown = useMemo(() => {
    const base = product?.price ?? 0;
    let optionsTotal = 0;
    for (const g of visibleGroups) {
      const selectedId = selectedOptions.get(g.type);
      if (selectedId) { const opt = g.options.find((o) => o.id === selectedId); if (opt) optionsTotal += opt.priceModifier; }
    }
    return { base, optionsTotal, total: base + optionsTotal };
  }, [product, visibleGroups, selectedOptions]);

  const effectiveStock = selectedVariant ? selectedVariant.stock : (product?.stock ?? 0);
  const allGroupsSelected = optionGroups.length === 0 || allVisibleGroupsSelected;
  const canAddToCart = product && (!product.variants.length || allGroupsSelected);

  const handleSelectOption = (groupType: string, optionId: string) => {
    setSelectedOptions((prev) => {
      const next = new Map(prev);
      next.set(groupType, optionId);
      if (parsedConfig) {
        for (const group of optionGroups) {
          if (group.dependsOn && group.dependsOn.groupId === groupType) {
            if (group.dependsOn.optionValue === optionId) {
              if (group.options.length > 0) next.set(group.type, group.options[0].id);
            } else { next.delete(group.type); }
          }
        }
      }
      return next;
    });
    if (product) {
      const variant = product.variants.find((v) => v.id === optionId);
      if (variant?.color && product.images.length > 0) {
        const colorMatch = product.images.findIndex((img) => img.alt?.toLowerCase().includes(variant.color!.toLowerCase()));
        if (colorMatch >= 0) setSelectedImageIndex(colorMatch);
      }
    }
  };

  const handleAddToCart = async () => {
    if (!product || !canAddToCart || effectiveStock === 0 || cartStatus === "loading") return;
    setCartStatus("loading");
    try {
      const body: Record<string, unknown> = { productId: product.id, variantId: selectedVariantId, quantity };
      if (parsedConfig) body.selectedOptions = Object.fromEntries(selectedOptions);
      const res = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (json.ok) { setCartStatus("success"); setTimeout(() => setCartStatus("idle"), 3000); window.dispatchEvent(new Event("cart-updated")); }
      else { setCartStatus("idle"); }
    } catch { setCartStatus("idle"); }
  };

  return (
    <>
      <div className="bg-[var(--color-surface)] py-4">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <nav className="text-sm text-[var(--color-text-muted)]" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-[var(--color-primary)]">Home</Link>
            <ChevronRight className="mx-1 inline h-3.5 w-3.5" />
            {product.category ? (
              <>
                <Link to="/catalogo" params={{}} className="hover:text-[var(--color-primary)]">{product.category.name}</Link>
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

      <section className="bg-[var(--color-background)] py-[var(--section-padding-y)]">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
            <ProductGallery
              images={product.images}
              selectedIndex={selectedImageIndex}
              onSelect={setSelectedImageIndex}
              productName={product.name}
            />
            <m.div className="flex flex-col" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}>
              {product.category && (
                <span className="mb-2 text-xs font-medium tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">{product.category.name}</span>
              )}
              <h1 className="font-display text-[var(--text-lg)] font-semibold tracking-tight md:text-[var(--text-xl)]">{product.name}</h1>

              <hr className="stitch-divider stitch-divider--left my-6" />

              <VariantSelector
                visibleGroups={visibleGroups}
                selectedOptions={selectedOptions}
                collapsedGroups={collapsedGroups}
                parsedConfig={parsedConfig}
                allVisibleGroupsSelected={allVisibleGroupsSelected}
                effectiveStock={effectiveStock}
                priceBreakdown={priceBreakdown}
                quantity={quantity}
                cartStatus={cartStatus}
                canAddToCart={!!canAddToCart}
                onSelectOption={handleSelectOption}
                onToggleCollapse={(gt) => setCollapsedGroups((prev) => {
                  const next = new Set(prev);
                  if (next.has(gt)) next.delete(gt); else next.add(gt);
                  return next;
                })}
                onSetQuantity={(q) => { setQuantity(q); return q; }}
                onAddToCart={handleAddToCart}
                customerNote={customerNote}
                onSetCustomerNote={setCustomerNote}
              />

              {product.materials && (
                <>
                  <hr className="stitch-divider stitch-divider--left my-6" />
                  <div>
                    <h2 className="mb-2 text-xs font-medium tracking-[var(--tracking-wider)] text-[var(--color-text-muted)]">Materiali</h2>
                    <p className="text-sm leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">{product.materials}</p>
                  </div>
                </>
              )}

              {product.description && (
                <>
                  <hr className="stitch-divider stitch-divider--left my-6" />
                  <div>
                    <h2 className="mb-2 text-xs font-medium tracking-[var(--tracking-wider)] text-[var(--color-text-muted)]">Descrizione</h2>
                    <p className="text-sm leading-[var(--leading-relaxed)] whitespace-pre-line text-[var(--color-text-secondary)]">{product.description}</p>
                  </div>
                </>
              )}
            </m.div>
          </div>
        </div>
      </section>

      <RelatedProducts products={relatedProducts} currentProductId={product.id} />
    </>
  );
}
